// ==UserScript==
// @name         test
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  \
// @author       
// @match        https://www.reddit.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==



let padgeURL = window.location.href;
console.log("url", padgeURL);
