// ==UserScript==
// @name         avito insert address
// @namespace    https://github.com/xob0t/userscripts
// @version      0.1
// @description  встраивает адреса в выдачу поиска там, где это возможно
// @author       xob0t
// @match        https://www.avito.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=avito.ru
// @grant        none
// @run-at       document-body
// ==/UserScript==

const offersRootSelector = ".index-root-KVurS";
const offersContainerSelector = ".items-items-kAJAg";
const offersSelector = '[data-marker="item"]';
const catalogKeyString = "@avito";

function getCatalogData(initialData) {
  const avitoKey = Object.keys(initialData).find((key) => key.startsWith(catalogKeyString));

  if (avitoKey) {
    const catalogItems = initialData[avitoKey].data.catalog.items;
    return catalogItems.filter((item) => item.hasOwnProperty("categoryId"));
  } else {
    console.error(`Catalog Key ${catalogKeyString} not found`);
  }
}

function parseInitialData() {
  const scripts = document.querySelectorAll("script");
  const targetScript = Array.from(scripts).find((script) => script.textContent.includes("window.__initialData__"));

  try {
    const scriptContent = decodeURIComponent(targetScript.innerHTML);

    // Find the start and end indexes of __initialData__ JSON
    const startIndex = scriptContent.indexOf('window.__initialData__ = "') + 'window.__initialData__ = "'.length;
    const endIndex = scriptContent.indexOf('";\nwindow.__mfe__');

    // Extract the JSON string
    const jsonString = scriptContent.substring(startIndex, endIndex);

    // Parse the JSON string into a JavaScript object
    const initialData = JSON.parse(jsonString);
    return initialData;
  } catch (error) {
    console.error(`Error parsing script:`, error);
  }
  return null;
}

function processSearchPage() {
  const offerElements = document.querySelectorAll(offersSelector);
  for (const offerElement of offerElements) {
    const offerId = offerElement.getAttribute("data-item-id");
    const currentOfferData = catalogData.find((item) => item.id === Number(offerId));
    // console.log(currentOfferData)
    const addressStr = currentOfferData?.coords?.address_user;
    insertAddress(offerElement, addressStr);
  }
}

function insertAddress(offerElement, addressStr) {
  const addressDiv = document.createElement("div");
  addressDiv.classList.add("custom-address");
  addressDiv.textContent = addressStr;
  insertTargetElement = offerElement.querySelector(".geo-root-zPwRk");
  insertTargetElement.parentNode.append(addressDiv);
}

const initialData = parseInitialData();
const catalogData = getCatalogData(initialData);

processSearchPage();

// Select the target node
const target = document.body;

// Create an observer instance
const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.type === "childList") {
      // Log the added nodes
      mutation.addedNodes.forEach(function (node) {
        if (node?.classList?.toString().includes("singlePageWrapper")) {
          processSearchPage();
        }
      });
    }
  });
});

// Configuration of the observer:
const config = { attributes: false, childList: true, subtree: true };

// Start observing the target node for configured mutations
observer.observe(target, config);
