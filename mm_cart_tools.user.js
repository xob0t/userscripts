// ==UserScript==
// @name         MM cart tools
// @namespace    http://tampermonkey.net/
// @version      2023-12-20
// @description  copy and paste cart items
// @author       xob0t
// @match        https://megamarket.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=megamarket.ru
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function() {
	'use strict';

	var container = null;
	var copyButton = null;
	var textField = null; // New text field element

	function addButtonContainer() {
		if (window.location.href.startsWith('https://megamarket.ru/multicart')) {
			if (!container) {
				// Create a container div for buttons, input field, and submit button
				container = document.createElement('div');
				container.id = 'cartToolsContainer'; // Set an ID for easy identification

				container.style.position = 'fixed';
				container.style.top = '20px';
				container.style.right = '20px';
				container.style.zIndex = '9999';
				container.style.display = 'flex';
				container.style.justifyContent = 'space-between';
				container.style.alignItems = 'center';

				textField = document.createElement('input'); // Create a text field
				textField.type = 'text'; // Set the input type to text
				textField.placeholder = 'Enter JSON data'; // Placeholder text for the field
				textField.style.padding = '8px';
				textField.style.marginRight = '10px';
				textField.style.flex = '1'; // Let it expand within the container

				copyButton = createCopyButton('Copy Cart', 'green', handleCopy);

				// Append textField and both buttons to the container
				container.appendChild(textField);
				container.appendChild(copyButton);

				// Append container to the body
				document.body.appendChild(container);

				// Add click event listener to the copyButton
				copyButton.addEventListener('click', handleCopy);


				// Add submit event listener to the textField
				textField.addEventListener('keydown', function(event) {
					if (event.key === 'Enter') {
						handleTextFieldSubmit();
					}
				});
			}
		} else {
			removeButtonContainer();
		}
	}

	function createCopyButton(text, bgColor, clickHandler) {
		var button = document.createElement('button');
		button.textContent = text;
		button.style.padding = '10px';
		button.style.backgroundColor = bgColor;
		button.style.color = 'white';
		button.style.border = 'none';
		button.style.borderRadius = '5px';
		button.style.marginRight = '10px';
		button.addEventListener('click', clickHandler); // Assign the clickHandler function
		return button;
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

	function handleTextFieldSubmit() {
		const trimmedText = textField.value.trim();
		if (trimmedText !== '') {
			try {
				const jsonObject = JSON.parse(trimmedText);
				addToCart(jsonObject);
			} catch (error) {
				console.error('Error parsing JSON:', error);
				alert('Entered text is not valid JSON.');
			}
		}
	}


	function addToCart(newCartData) {
		var dataLayerCart = dataLayer.find(item => item.cart);
		var cartId = null; // Initialize cartId as null

		if (dataLayerCart && dataLayerCart.cart && dataLayerCart.cart.lineItems && dataLayerCart.cart.lineItems.length > 0) {
			cartId = dataLayerCart.cart.lineItems[0].cartId;
		}
		addToCartRequest(newCartData.extractedItems, cartId, newCartData.extractedCartInfo.type, newCartData.extractedCartInfo.locationId);
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
			//addressId: data.clientAddress.addressId,
		};

		return {
			extractedItems,
			extractedCartInfo
		};
	}



	function addToCartRequest(items, cartId, cartType, locationId) {
		var url = "https://megamarket.ru/api/mobile/v2/cartService/offers/add";
		var requestBody = {
			"identification": {
				"id": cartId
			},
			"items": items,
			"cartType": cartType,
			"clientAddress": {
				"address": "address",
				"addressId": "addressId",
				"geo": {
					"lat": "0",
					"lon": "0"
				}
			},

			"locationId": locationId
		};

		fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				credentials: "include",
				body: JSON.stringify(requestBody)
			})
			.then(function(response) {
				if (!response.ok) {
					throw new Error("Network response was not ok");
				}
				return response.json();
			})
			.then(function(responseData) {
				console.log("Cart Data:", responseData);
				// Reload the page upon successful request
				location.reload();
			})
			.catch(function(error) {
				console.error("Error:", error.message);
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
				body: null
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
				headers: {
					"Content-Type": "application/json"
				},
				credentials: "include",
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
				console.error('Error getCartData:', error);
				throw error;
			});
	}


})();
