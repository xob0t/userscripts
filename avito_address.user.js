// ==UserScript==
// @name         avito add address
// @namespace    https://github.com/xob0t/userscripts
// @version      0.5.2
// @description  встраивает адреса в поисковую выдачу
// @author       xob0t
// @match        https://www.avito.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=avito.ru
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// ==/UserScript==

const offersRootSelectorValue = "bx.catalog.container";
const offersRootSelector = `[elementtiming="${offersRootSelectorValue}"]`;
const offersSelector = '[data-marker="item"]';
const catalogKeyString = "@avito";
let sessionCookies = "";
const logPrefix = "[aaa]";

function deleteSession() {
  localStorage.removeItem("sessionCookies");
  sessionCookies = "";
  console.log(`${logPrefix} Session cookies deleted from localStorage`);
  alert("Cookies скрипта удалены");
}

// Register the menu command to delete the session
GM_registerMenuCommand("Удалить Cookies скрипта", deleteSession);

// Function to load session from localStorage or create a new one if it doesn't exist
async function loadOrCreateSession() {
  sessionCookies = localStorage.getItem("sessionCookies"); // Try to load from localStorage

  if (sessionCookies) {
    console.log(`${logPrefix} Loaded session cookies from localStorage`);
    // console.log(`${logPrefix} Loaded session cookies from localStorage:`, sessionCookies);
  } else {
    console.log(`${logPrefix} No session cookies found in localStorage. Creating a new session...`);
    await simulateNewSession(); // Create a new session
    localStorage.setItem(`sessionCookies`, sessionCookies); // Save to localStorage
    console.log(`${logPrefix} New session cookies saved to localStorage`);
    // console.log(`${logPrefix} New session cookies saved to localStorage:`, sessionCookies);
  }
}

// Function to simulate a new session by making an HTTP request
function simulateNewSession() {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "GET",
      url: "https://www.avito.ru/",
      anonymous: true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      onload: function (response) {
        // Parse the response headers to extract cookies
        const setCookieHeaders = response.responseHeaders.split(/\r?\n/).filter((header) => header.toLowerCase().startsWith("set-cookie:"));

        if (setCookieHeaders.length > 0) {
          // console.log(`${logPrefix} Found Set-Cookie headers:`, setCookieHeaders);

          // Extract and clean cookie values
          sessionCookies = setCookieHeaders
            .map((header) => {
              const cookie = header.match(/set-cookie:\s*(.+?)(;|$)/i)[1]; // Extract the cookie value before the first semicolon
              // console.log(`${logPrefix} Extracted cookie:`, cookie);
              return cookie;
            })
            .join("; ");

          // console.log(`${logPrefix} Session cookies set:`, sessionCookies);
        } else {
          console.log(`${logPrefix} No Set-Cookie headers found.`);
        }
        resolve();
      },
      onerror: function (error) {
        console.error(`${logPrefix} Request failed:`, error);
        reject(error);
      },
    });
  });
}

// Function to make requests with the current session cookies
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: options.method || "GET",
      url: url,
      anonymous: true,
      headers: {
        ...options.headers,
        Cookie: sessionCookies,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Referer: "https://www.avito.ru/", // Match the referrer
        Origin: "https://www.avito.ru", // Ensure origin matches
        "Content-Type": "application/json", // Set appropriate content type
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      data: options.body,
      onload: function (response) {
        console.log(`${logPrefix} Request to:`, url);
        // console.log(`${logPrefix} Response Headers:`, response.responseHeaders);

        // Parse Set-Cookie headers and update session cookies
        const setCookieHeaders = response.responseHeaders.split(/\r?\n/).filter((header) => header.toLowerCase().startsWith("set-cookie:"));

        if (setCookieHeaders.length > 0) {
          // console.log(`${logPrefix} Found additional Set-Cookie headers:`, setCookieHeaders);

          const newCookies = setCookieHeaders
            .map((header) => {
              const cookie = header.match(/set-cookie:\s*(.+?)(;|$)/i)[1];
              // console.log(`${logPrefix} Extracted additional cookie:`, cookie);
              return cookie;
            })
            .join("; ");

          sessionCookies = `${newCookies}; ${sessionCookies}`; // Update session cookies
          localStorage.setItem("sessionCookies", sessionCookies); // Save updated cookies to localStorage
          // console.log(`${logPrefix} Updated session cookies:`, sessionCookies);
        } else {
          console.log(`${logPrefix} No additional Set-Cookie headers found.`);
        }
        resolve(response);
      },
      onerror: function (error) {
        console.error(`${logPrefix} Request failed:`, error);
        reject(error);
      },
    });
  });
}

async function addToFavorites(ids) {
  return makeRequest("https://www.avito.ru/web/1/favorites/items/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids: ids }),
  });
}

async function deleteFromFavorites(ids) {
  return makeRequest("https://www.avito.ru/web/1/favorites/items/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids: ids }),
  });
}

async function getFavoritesPage() {
  return makeRequest("https://www.avito.ru/web/1/favorites/items/list?order=added_at__asc&limit=500", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function getCatalogData(initCatalogData) {
  const catalogItems = initCatalogData.data.catalog.items;
  const extraItems = initCatalogData.data.catalog.extraBlockItems;
  let allItems = catalogItems.concat(extraItems);
  allItems = allItems.filter((item) => item.hasOwnProperty("categoryId"));
  return allItems;
}

function parseInitialData(initialDataContent) {
  try {
    initialDataContent = decodeURIComponent(initialDataContent);

    // Find the start and end indexes of __initialData__ JSON
    const startIndex = initialDataContent.indexOf('window.__initialData__ = "') + 'window.__initialData__ = "'.length;
    const endIndex = initialDataContent.indexOf('";\nwindow.__mfe__');

    // Extract the JSON string
    const jsonString = initialDataContent.substring(startIndex, endIndex);

    // Parse the JSON string into a JavaScript object
    const initialData = JSON.parse(jsonString);
    return initialData;
  } catch (error) {
    console.error(`${logPrefix} Ошибка парсинга __initialData__:`, error);
  }
  return null;
}

async function processSearchPage() {
  const offerIds = catalogData.map((obj) => obj.id);
  for (const offerId of offerIds) {
    const currentOfferData = favData.items.find((item) => item.id === Number(offerId));
    const addressStr = currentOfferData.address;
    insertAddress(offerId, addressStr);
  }
}

function insertAddress(offerId, addressStr) {
  const offerElement = document.getElementById(`i${offerId}`);
  if (offerElement.querySelector(".custom-address")) return;
  const addressCustom = document.createElement("p");
  const classes = [
    "styles-module-root-YczkZ",
    "styles-module-size_s-xb_uK",
    "styles-module-size_s_compensated-QmHFs",
    "styles-module-size_s-_z7mI",
    "stylesMarningNormal-module-root-S7NIr",
    "stylesMarningNormal-module-paragraph-s-Yhr2e",
    "styles-module-noAccent-LowZ8",
    "styles-module-root_top-p0_50",
    "styles-module-margin-top_0-Mk_hC",
  ];

  addressCustom.classList.add("custom-address");
  addressCustom.classList.add(...classes);
  addressCustom.textContent = addressStr;
  insertTargetElement = offerElement.querySelector("[class*=geo-root]");
  insertTargetElement?.style?.removeProperty("--module-max-lines-size");
  insertTargetElement.append(addressCustom);
}

function waitForNodeContent(node, string) {
  // ждем когда текст нода загрузится в dom полностью
  // в цикле проверяем, если ли в тексте `string`, пока не найдем
  return new Promise((resolve) => {
    const checkInterval = 100;
    const intervalId = setInterval(() => {
      if (node.textContent.includes(string)) {
        clearInterval(intervalId);
        resolve(node.textContent);
      }
    }, checkInterval);
  });
}

function getCatalogDataFromInit(initialData) {
  const catalogKeyString = "@avito";
  const avitoKey = Object.keys(initialData).find((key) => key.startsWith(catalogKeyString));

  if (avitoKey) {
    const catalogItems = initialData[avitoKey].data.catalog.items;
    const extraItems = initialData[avitoKey].data.catalog.extraBlockItems;
    let allItems = catalogItems.concat(extraItems);
    allItems = allItems.filter((item) => item.hasOwnProperty("categoryId"));
    return allItems;
  } else {
    console.error(`${logPrefix} ключ ${catalogKeyString} не найден`);
  }
}

async function main() {
  const target = document;

  // Create an observer instance
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "childList") {
        // Log the added nodes
        mutation.addedNodes.forEach(async function (node) {
          if (node instanceof Element && node?.getAttribute("elementtiming") === offersRootSelectorValue) {
            console.log(`${logPrefix} offersRootSelector обновлен`);
            if (!catalogData) return;
            processSearchPage();
          }
          if (node?.classList?.toString().includes("styles-singlePageWrapper")) {
            console.log(`${logPrefix} singlePageWrapper обновлен`);
            if (!catalogData) return;
            processSearchPage();
          }
          if (node instanceof HTMLScriptElement && node?.textContent?.includes("abCentral") && !node?.textContent?.startsWith("window[")) {
            const initCatalogDataContent = await waitForNodeContent(node, "searchCore");
            if (initCatalogDataContent.startsWith("window.__initialData__")) {
              initialData = parseInitialData(initCatalogDataContent);
              catalogData = getCatalogDataFromInit(initialData);
            } else {
              const initCatalogData = JSON.parse(initCatalogDataContent);
              catalogData = getCatalogData(initCatalogData);
            }
            console.log(`${logPrefix} catalogData найден`, catalogData);
            const offerIds = catalogData.map((obj) => obj.id);
            console.log(`${logPrefix} added to fav`, await addToFavorites(offerIds));
            favData = await getFavoritesPage();
            favData = JSON.parse(favData.responseText);
            console.log(`${logPrefix} favData`, favData);
            processSearchPage();
            deleteFromFavorites(offerIds);
          }
        });
      }
    });
  });

  // Configuration of the observer:
  const config = { attributes: false, childList: true, subtree: true };

  // Start observing the target node for configured mutations
  observer.observe(target, config);
}

let catalogData;
let favData;

loadOrCreateSession();
main();
