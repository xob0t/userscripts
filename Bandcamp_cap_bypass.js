// ==UserScript==
// @name         Bandcamp play cap bypass
// @namespace    xb0t
// @version      2023.04.09
// @description  prevents annoying "The time has come.." popup
// @author       xb0t
// @match        https://*.bandcamp.com/album/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log("BC play cap bypass enabled");
    setTimeout(() => {
    for (let i=0; i<gplaylist._playlist.length; i++){
            gplaylist._playlist[i].is_capped = false;
    };
    TralbumData.play_cap_data.streaming_limits_enabled = false;
    }, 100);
})();
