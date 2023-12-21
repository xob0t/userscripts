// ==UserScript==
// @name         MM cart tools
// @namespace    http://tampermonkey.net/
// @version      2023-12-21
// @description  copy and paste cart items
// @author       xob0t
// @match        https://megamarket.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=megamarket.ru
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function() {
	'use strict';

	const createDeleteButton = () => {
		const button = document.createElement('button');
		button.setAttribute('type', 'button');
		button.classList.add('btn', 'btn-block', 'btn-checkout', 'btn-delete'); // Adding classes
		button.textContent = 'Удалить корзину'; // Text for the button
		button.style.backgroundColor = "brown";

		// Adding event listener to the created button
		button.addEventListener('click', () => {
			handleDeleteCartButtonClick(button);
		});

		return button;
	};

	const handleDeleteCartButtonClick = async (button) => {
		const parentCart = button.closest('.multicart-item.cart.multicart__item');
		let removeButtons = parentCart.querySelectorAll('.good__remove');

		while (removeButtons.length > 0) {
			for (const removeButton of removeButtons) {
				await new Promise(resolve => {
					setTimeout(() => {
						removeButton.click(); // Trigger click on each element with class "good__remove"
						resolve();
					}, 100); // Adjust the delay time as needed (in milliseconds)
				});
			}
			removeButtons = parentCart.querySelectorAll('.good__remove'); // Update the NodeList
		}

		console.log('Delete Cart button clicked until no elements left');
		// Additional logic to perform after deleting items
	};
	// Function to add the "Delete Cart" button to the specified element
	const addDeleteButtonToElement = element => {
		const summary = element.querySelector('.cart-summary-redesign__inner');
		if (summary) {
			const checkoutButton = summary.querySelector('button.btn.btn-block.btn-checkout');
			if (checkoutButton) {
				const deleteButton = createDeleteButton();
				summary.insertBefore(deleteButton, checkoutButton.nextSibling);
			}
		}
	};


	const addNewFieldAfterTitle = () => {
		const multicartTitle = document.querySelector('.multicart__title');
		if (multicartTitle) {
			const textField = document.createElement('input');
			textField.type = 'text';
			textField.placeholder = 'Вставить';
			textField.style.cssText = 'padding: 8px; margin-right: 10px; flex: 1;';
			textField.addEventListener('keydown', event => {
				if (event.key === 'Enter') {
					handleTextFieldSubmit(textField);
				}
			});

			// Inserting the new field element after the multicart__title element
			multicartTitle.parentNode.insertBefore(textField, multicartTitle.nextSibling);
		}
	};

	const handleTextFieldSubmit = (textField) => {
		const trimmedText = textField.value.trim();
		if (trimmedText !== '') {
			try {
				const newCartData = JSON.parse(trimmedText);
				addToCartRequest(newCartData.extractedItems, newCartData.extractedCartInfo.type, newCartData.extractedCartInfo.locationId);
			} catch (error) {
				console.error('Error parsing JSON:', error);
				alert('Entered text is not valid JSON.');
			}
		}
	};

	const addToCartRequest = (items, cartType, locationId) => {
		const url = "https://megamarket.ru/api/mobile/v2/cartService/offers/add";
		const requestBody = {
			"identification": {
				"id": null
			},
			"items": items,
			"cartType": cartType,
			"clientAddress": {
				"address": "foo",
				"addressId": "bar",
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
			.then(response => {
				if (!response.ok) {
					throw new Error("Network response was not ok");
				}
				return response.json();
			})
			.then(responseData => {
				console.log("Cart Data:", responseData);
				location.reload();
			})
			.catch(error => {
				console.error("Error:", error.message);
			});
	};

	const createCopyButton = (text, bgColor) => {
		const button = document.createElement('button');
		button.setAttribute('type', 'button');
		button.classList.add('btn', 'btn-block', 'btn-checkout'); // Adding classes

		const spanElement = document.createElement('span');
		spanElement.textContent = text; // Text for the button

		button.appendChild(spanElement); // Appending the span element to the button

		// Applying styles
		button.style.backgroundColor = bgColor;

		// Adding event listener to the created button
		button.addEventListener('click', async () => {
			await handleCopyButtonClick(button);
		});

		return button;
	};

	// Function to handle the button's click event
	const handleCopyButtonClick = async (button) => {
		const cartItem = button.closest('.multicart-item.cart.multicart__item');
		const parent = cartItem.parentElement;
		const position = Array.from(parent.children).indexOf(cartItem);

		try {
			const responseData = await getAllCarts();
			if (responseData && responseData.elements && responseData.elements.length > position) {
				const cartId = responseData.elements[position].identification.id;
				let cartData = await getCartData(cartId);
				cartData = extractItemsAndCartInfo(cartData);
				const cartDataStringified = JSON.stringify(cartData);
				await GM_setClipboard(cartDataStringified);
				handleCopyButtonAnimation(button);
				console.log('Button clicked for item:', cartItem, 'Cart Content:', cartData);
			} else {
				console.log('Cart content not found for position:', position);
			}
		} catch (error) {
			console.error('Error fetching cart content:', error);
		}
	};

	const handleCopyButtonAnimation = (button) => {
		const initialButtonText = button.textContent;
		const initialButtonColor = button.style.backgroundColor
		button.textContent = 'Скопировано!';
		button.style.backgroundColor = 'orange';
		setTimeout(() => {
			button.textContent = initialButtonText;
			button.style.backgroundColor = initialButtonColor
		}, 2000);
	};

	// Function to add buttons to the specified element
	const addButtonToElement = element => {
		const summary = element.querySelector('.cart-summary-redesign__inner');
		if (summary) {
			const checkoutButton = summary.querySelector('button.btn.btn-block.btn-checkout');
			if (checkoutButton) {
				const button = createCopyButton('Копировать корзину', 'green', () => {
					// Add functionality for the click handler here
					// For example, you can copy content or perform any action related to the specific item
					console.log('Button clicked for item:', element);
				});
				summary.insertBefore(button, checkoutButton.nextSibling);
			}
		}
	};



	function handleNewElements(mutationsList, observer) {
		for (const mutation of mutationsList) {
			if (mutation.type === 'childList') {
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const newElements = node.querySelectorAll('.multicart-item.cart.multicart__item');
						if (newElements.length > 0) {
							console.log('New .multicart-item.cart.multicart__item element(s) found:', newElements);
							newElements.forEach(element => {
								addButtonToElement(element);
								addDeleteButtonToElement(element);
							});
							addNewFieldAfterTitle()
						}
					}
				});
			}
		}
	}

	const extractItemsAndCartInfo = (data) => {
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
		};

		return {
			extractedItems,
			extractedCartInfo
		};
	};

	const getCartData = (cartId) => {
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
	};

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

	// Creating a MutationObserver instance
	const observer = new MutationObserver(handleNewElements);

	// Configuration of the observer
	const observerConfig = {
		childList: true, // Listen for changes in the child elements
		subtree: true, // Include all descendants of the target node
	};

	// Start observing the body for changes
	observer.observe(document.body, observerConfig);
})();
