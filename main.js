/*
 * ✅ Use the Coinlore API (Coins)
 *    https://www.coinlore.com/cryptocurrency-data-api
 *
 *    Get 10 coins per "page"
 */

const IFRAME_EVENT_TYPE = 'get-height';
const IFRAME_MESSAGE_TYPE = 'height';
const MESSAGE_ORIGIN = "http://localhost:8000"

window.addEventListener('message', function(event) {
    console.log('ran at all',event, event.origin === MESSAGE_ORIGIN, event.data.type === IFRAME_EVENT_TYPE )
    // Check if the message is from the parent page and is a request for the height of the document
    if (event.origin === MESSAGE_ORIGIN && event.data.type === IFRAME_EVENT_TYPE) {
        console.log('in the if')
      // Measure the height of the document
      const height = document.documentElement.scrollHeight;
      // Send the height measurement back to the parent page
      const message = {
        type: IFRAME_MESSAGE_TYPE,
        value: height
      };
      parent.postMessage(message, MESSAGE_ORIGIN);
    }
  });

const loadCoinData = url => {
  return fetch(url)
    .then(res => res.json())
    .then(data => data)
    .catch(err => {
      const h3 = document.createElement("h3");
      h3.textContent = "Error: Internet connection is faulty";
      document.querySelector("main").appendChild(h3);
    });
};

// begin data fetching early
const baseUrl = `https://api.coinlore.com/api/tickers/`;
let initialData = loadCoinData(baseUrl).then(({ data }) => data);

const prefetchAndAppend = start => {
  let currUrl = baseUrl + `?start=${start}&limit=100`;
  return loadCoinData(currUrl)
    .then(({ data }) => data)
    .then(data => {
      initialData.then(oldData => {
        return (initialData = new Promise(resolve =>
          resolve(oldData.concat(data))
        ));
      });
    });
};

const constructCoinRows = (name, symbol, price_usd, tsupply, labels) => {
  const dataArray = zip(
    [name, symbol, `$ ${price_usd}`, `${tsupply} ${symbol}`],
    labels
  );
  const tr = document.createElement("tr");
  const tds = dataArray.map(each => {
    const td = document.createElement("td");
    td.setAttribute("data-label", each[1].textContent);
    td.textContent = each[0];
    return td;
  });
  tds.forEach(data => {
    tr.appendChild(data);
  });
  return tr;
};

const processCoinData = (data, start, limit, labels) => {
  const rowsArrayPromise = data.then(data => {
    const rowsArray = data
      .slice(start, limit)
      .map(({ name, symbol, price_usd, tsupply }) =>
        constructCoinRows(name, symbol, price_usd, tsupply, labels)
      );
    return rowsArray;
  });
  return rowsArrayPromise;
};

const fillTableBody = (rows, tbody) => {
  tbody.innerHTML = "<h3 class='center'> loading ... </h3>";
  rows.then(rows => {
    tbody.innerHTML = null;
    rows.forEach(each => {
      tbody.appendChild(each);
    });
  });
};

// UTILITY
const zip = (...args) => {
  const eachArrayItem = args.map(each => Array.from(each));
  return eachArrayItem[0].map((_, i) => {
    return eachArrayItem.map(array => array[i]);
  });
};

const main = () => {
  // LOCAL VARIABLES
  let start = 0;
  let limit = 10;

  const tbody = document.querySelector("tbody");
  const prev = document.querySelector("#previous");
  const next = document.querySelector("#next");
  const labels = document.querySelectorAll("thead tr th");

  const handleNext = () => {
    start += 10;
    limit += 10;
    initialData.then(data => {
      if (data.length - 40 == start) {
        prefetchAndAppend(data.length);
      }
      const promiseData = new Promise(res => res(data));
      fillTableBody(processCoinData(promiseData, start, limit, labels), tbody);
      prev.classList.replace("hide", "show");
    });
  };

  const handlePrev = ({ currentTarget }) => {
    if (start == 10) currentTarget.classList.replace("show", "hide");
    if (next.classList.contains("hide")) next.classList.replace("hide", "show");
    start -= 10;
    limit -= 10;
    fillTableBody(processCoinData(initialData, start, limit, labels), tbody);
  };

  fillTableBody(processCoinData(initialData, start, limit, labels), tbody);

  // EVENT HANDLERS
  next.addEventListener("click", handleNext);
  prev.addEventListener("click", handlePrev);
};

document.addEventListener("DOMContentLoaded", main());
