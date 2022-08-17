
// ==UserScript==
// @name         Vk ads hide
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  x
// @author       me
// @match        https://vk.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=vk.com
// @grant        none
// ==/UserScript==

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  }
  
  const waitInterval = setInterval(async () => {
  
  try {
      let wall_marked_as_ads = getElementByXpath("//div[not(@hidden)][@data-post-id][.//div[@class='wall_marked_as_ads']]")
      wall_marked_as_ads.style.display = "none";
      wall_marked_as_ads.setAttribute('hidden', 'hidden');
      console.log('реклама спрятана');
      } catch(e) {};
  try {
      let ad_post = getElementByXpath("//div[not(@hidden)][@data-ad-block-uid]");
      ad_post.style.display = "none";
      ad_post.setAttribute('hidden', 'hidden');
      console.log('реклама спрятана');
      } catch(e) {};
      }, 100);
