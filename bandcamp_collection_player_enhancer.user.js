// ==UserScript==
// @name         Bandcamp Collection Player Enhancer
// @namespace    https://github.com/xob0t/userscripts
// @version      2024-05-19
// @description  Listen to full wishlisted albums instead of single tracks in BC's collection player, restore volume on reload
// @author       xob0t
// @match        *://bandcamp.com/*
// @licence      MIT
// ==/UserScript==
(function () {
  "use strict";
  const tralbumDetailsCache = {};
  const findParentWithAttribute = (element, attributeName) => {
    let currentElement = element;
    while (currentElement) {
      if (currentElement.hasAttribute(attributeName)) {
        return currentElement;
      }
      currentElement = currentElement.parentElement;
    }
    return null;
  };

  const isInWishlist = (combinedAttribute) => {
    return collectionPlayer.tracklists.wishlist.hasOwnProperty(combinedAttribute);
  };

  const click = (event) => {
    // Dispatch a new click event
    const newClickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      detail: 2,
    });
    event.target.dispatchEvent(newClickEvent);
  };

  const fetchTralbumDetails = async (bandId, tralbumId, tralbumType) => {
    const response = await fetch("https://bandcamp.com/api/mobile/25/tralbum_details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        band_id: bandId,
        tralbum_id: tralbumId,
        tralbum_type: tralbumType,
      }),
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Error: ${response.status}`);
    }
  };
  const makeNewTracklist = (apiData) => {
    const newTracklist = [];
    apiData.tracks.forEach((track) => {
      // Check if track has a streaming_url
      if (track.streaming_url) {
        const newTrack = {
          tralbumType: apiData.type,
          tralbumId: apiData.id,
          tralbumKey: `${apiData.type}${apiData.id}`,
          bandId: apiData.band.band_id,
          trackData: {
            file: track.streaming_url,
            title: track.title,
            duration: track.duration,
            artist: track.band_name,
            track_number: track.track_num,
            id: track.track_id,
          },
          artURL: `https://f4.bcbits.com/img/a${apiData.art_id}_16.jpg`,
          title: apiData.title,
          artist: apiData.tralbum_artist,
          trackNumber: track.track_num,
          trackTitle: track.title,
          showCollect: true,
          showGift: false,
          tralbumUrl: null,
          tralbumBuyUrl: apiData.bandcamp_url,
          tralbumGiftUrl: `${apiData.bandcamp_url}?action=gift`,
          showFeaturedTrack: track.track_id === apiData.featured_track_id,
        };
        newTracklist.push(newTrack);
      }
    });
    return newTracklist;
  };

  const restoreVolumeOnReload = () => {
    const volSlider = document.querySelector(".vol-slider");
    volSlider.style.width = "120px";
    const restoredVol = localStorage.getItem("volume");
    if (restoredVol) collectionPlayer.player2.volume(parseFloat(restoredVol));

    window.onbeforeunload = function () {
      localStorage.setItem("volume", collectionPlayer.player2.volume());
    };
  };

  const modifyTracklistData = async (event) => {
    const parentWithAttribute = findParentWithAttribute(event.target, "data-tralbumid");
    if (event.detail === 1 && parentWithAttribute) {
      //parsing track data
      const tralbumType = parentWithAttribute.getAttribute("data-tralbumtype");
      const tralbumId = parentWithAttribute.getAttribute("data-tralbumid");
      const bandId = parentWithAttribute.getAttribute("data-bandid");
      const wishlistKey = `${tralbumType}${tralbumId}`;

      if (isInWishlist(wishlistKey)) {
        //if album is wishlisted, get full tracklist from the api
        event.stopImmediatePropagation();
        try {
          let apiData;
          if (tralbumDetailsCache.hasOwnProperty(wishlistKey)) {
            //use cache
            apiData = tralbumDetailsCache[wishlistKey];
          } else {
            //make api request
            apiData = await fetchTralbumDetails(bandId, tralbumId, tralbumType);
            //save data to cache
            tralbumDetailsCache[wishlistKey] = apiData;
          }
          //construct new tracklist
          const newTracklist = makeNewTracklist(apiData);
          //replace the OG trackilst the modified one
          collectionPlayer.tracklists.wishlist[wishlistKey] = newTracklist;
        } catch (error) {
          console.error("Error fetching tralbum details:", error);
        }
        //cick to start default behavior
        click(event);
      }
    }
  };

  restoreVolumeOnReload();

  document.addEventListener("click", modifyTracklistData, true);
})();
