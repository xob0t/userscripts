// ==UserScript==
// @name         MM cart tools
// @namespace    http://tampermonkey.net/
// @version      2023-12-20
// @description  try to take over the world!
// @author       xob0t
// @match        https://megamarket.ru/multicart/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=megamarket.ru
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function() {

	'use strict';

	var container = null;
	var copyButton = null;
	var readButton = null;

	function addButtonContainer() {
		if (window.location.href === 'https://megamarket.ru/multicart/') {
			if (!container) {
				// Create a container div for button, input field, and submit button
				container = document.createElement('div');
				container.id = 'cartToolsContainer'; // Set an ID for easy identification

				container.style.position = 'fixed';
				container.style.top = '20px';
				container.style.right = '20px';
				container.style.zIndex = '9999';
				container.style.display = 'flex';
				container.style.justifyContent = 'space-between';
				container.style.alignItems = 'center';

				readButton = document.createElement('button');
				readButton.textContent = 'Read Clipboard';
				readButton.style.padding = '10px';
				readButton.style.backgroundColor = 'orange';
				readButton.style.color = 'white';
				readButton.style.border = 'none';
				readButton.style.borderRadius = '5px';
				readButton.style.marginRight = '10px';

				// Create a button element for copying stringified array of currentItems
				copyButton = document.createElement('button');
				copyButton.textContent = 'Copy Cart';
				copyButton.style.padding = '10px';
				copyButton.style.backgroundColor = 'green';
				copyButton.style.color = 'white';
				copyButton.style.border = 'none';
				copyButton.style.borderRadius = '5px';
				copyButton.style.marginRight = '10px';

				// Append copyButton and submitButton to the container
				container.appendChild(copyButton);
				container.appendChild(readButton);

				// Append container to the body
				document.body.appendChild(container);

				// Add click event listener to the copyButton
				copyButton.addEventListener('click', handleCopy);
				readButton.addEventListener('click', readClipboard);
			}
		} else {
			removeButtonContainer();
		}
	}

	function removeButtonContainer() {
		var existingContainer = document.getElementById('cartToolsContainer');
		if (existingContainer) {
			existingContainer.parentNode.removeChild(existingContainer);
			container = null;
		}
	}

	// Initial check and addition of buttons
	addButtonContainer();

	// Monitor changes in the page using MutationObserver
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			addButtonContainer(); // Recheck and manage buttons on any changes in the page content
		});
	});

	// Configuration of the observer: observe changes in the body element and its subtree
	var observerConfig = {
		childList: true,
		subtree: true
	};
	observer.observe(document.body, observerConfig);

	function addToCart(newCartData) {
		var dataLayerCart = dataLayer.find(item => item.cart);
		var cartId = null; // Initialize cartId as null

		var currentItems = []; // Initialize currentItems as an empty array

		if (dataLayerCart && dataLayerCart.cart && dataLayerCart.cart.lineItems && dataLayerCart.cart.lineItems.length > 0) {
			cartId = dataLayerCart.cart.lineItems[0].cartId;
		}

		addToCartRequest(newCartData.extractedItems, cartId, newCartData.extractedCartInfo.type, newCartData.extractedCartInfo.locationId, newCartData.extractedCartInfo.clientAddress);
		location.reload();
	}

	function readClipboard() {
		navigator.clipboard.readText()
			.then(text => {
				const trimmedText = text.trim();
				if (trimmedText !== '') {
					try {
						const jsonObject = JSON.parse(trimmedText);
						console.log(jsonObject)
						addToCart(jsonObject)
					} catch (error) {
						alert('Clipboard content is not valid JSON.');
					}
				} else {
					alert('Clipboard is empty.');
				}
			})
			.catch(err => {
				console.error('Failed to read clipboard contents: ', err);
			});
	}
	// Function to handle button click to copy stringified array of currentItems
	function handleCopy() {
		var dataLayerCart = dataLayer.find(item => item.cart);
		if (dataLayerCart) {
			var cartId = dataLayerCart.cart.lineItems[0].cartId;
			getCartData(cartId)
				.then(cart => {
					var currentItems = extractItemsAndCartInfo(cart);
					console.log(currentItems);
					var currentItemsStringified = JSON.stringify(currentItems);

					GM.setClipboard(currentItemsStringified);
					//copyToClipboard(currentItemsStringified);
					copyButton.textContent = 'Copied!'; // Change button text when copied
					copyButton.style.backgroundColor = 'orange';
					setTimeout(function() {
						copyButton.textContent = 'Copy Cart'; // Revert button text after a brief delay
						copyButton.style.backgroundColor = 'green';
					}, 3000); // Change button text back after 3 seconds
				})
				.catch(error => {
					alert("Error occurred while fetching cart data:", error);
				});
		} else {
			console.log('Cart JSON not found in the dataLayer array.');
		}
	}


	function extractItemsAndCartInfo(data) {
		const extractedItems = data.itemGroups.map(item => {
			return {
				offer: {
					id: null,
					merchantId: item.merchant.id ? parseInt(item.merchant.id) : null
				},
				goods: {
					goodsId: item.goods.goodsId
				},
				quantity: item.quantity,
				isBpg20: false,
				discounts: []
			};
		});

		const extractedCartInfo = {
			type: data.type,
			locationId: data.locationId,
			clientAddress: data.clientAddress,
		};

		return {
			extractedItems,
			extractedCartInfo
		};
	}

	function addToCartRequest(items, cartId, cartType, locationId, clientAddress) {
		fetch("https://megamarket.ru/api/mobile/v2/cartService/offers/add", {
				"body": JSON.stringify({
					"identification": {
						"id": cartId
					},
					"items": items,
					"cartType": cartType,
					"clientAddress": clientAddress,
					"locationId": locationId
				}),
				"method": "POST",
				"mode": "cors",
				"credentials": "include"
			})
			.then(response => response.json())
			.then(data => {
				console.log("Cart Data:", data);
			})
			.catch(error => {
				console.error('Error:', error);
			});
	}

	function getAllCarts() {
		return fetch("https://megamarket.ru/api/mobile/v2/cartService/cart/search", {
				method: "POST",
				mode: "cors",
				credentials: "include",
				headers: {
					"Content-Type": "application/json"
				},
				body: ""
			})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok.');
				}
				return response.json();
			})
			.catch(error => {
				console.error('Error:', error);
				throw error;
			});
	}

	function getCartData(cartId) {
		return fetch("https://megamarket.ru/api/mobile/v2/cartService/cart/get", {
				method: "POST",
				mode: "cors",
				credentials: "include",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					"identification": {
						"id": cartId
					},
					"isCartStateValidationRequired": true,
					"isSelectedItemGroupsOnly": false,
					"loyaltyCalculationRequired": true,
					"isSkipPersonalDiscounts": true
				})
			})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok.');
				}
				return response.json();
			})
			.catch(error => {
				console.error('Error:', error);
				throw error;
			});
	}


})();
