// ==UserScript==
// @name         MM cart tools optimized
// @namespace    http://tampermonkey.net/
// @version      2023-12-20
// @description  copy and paste cart items
// @author       xob0t
// @match        https://megamarket.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=megamarket.ru
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let container = null;
    let copyButton = null;
    let textField = null;

    const addButtonContainer = () => {
        if (window.location.href.startsWith('https://megamarket.ru/multicart')) {
            if (!container) {
                container = document.createElement('div');
                container.id = 'cartToolsContainer';
                container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; justify-content: space-between; align-items: center;';

                textField = document.createElement('input');
                textField.type = 'text';
                textField.placeholder = 'Вставить';
                textField.style.cssText = 'padding: 8px; margin-right: 10px; flex: 1;';

                copyButton = createCopyButton('Копировать', 'green', handleCopy);

                container.appendChild(textField);
                container.appendChild(copyButton);

                document.body.appendChild(container);

                copyButton.addEventListener('click', handleCopy);
                textField.addEventListener('keydown', event => {
                    if (event.key === 'Enter') {
                        handleTextFieldSubmit();
                    }
                });
            }
        } else {
            removeButtonContainer();
        }
    };

    const createCopyButton = (text, bgColor, clickHandler) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `padding: 10px; background-color: ${bgColor}; color: white; border: none; border-radius: 5px; margin-right: 10px;`;
        button.addEventListener('click', clickHandler);
        return button;
    };

    const removeButtonContainer = () => {
        const existingContainer = document.getElementById('cartToolsContainer');
        if (existingContainer) {
            existingContainer.remove();
            container = null;
        }
    };

    const handleCopy = async () => {
        const dataLayerCart = dataLayer.find(item => item.cart);
        if (dataLayerCart) {
            const cartId = dataLayerCart.cart.lineItems[0]?.cartId;
            try {
                const cart = await getCartData(cartId);
                const currentItems = extractItemsAndCartInfo(cart);
                const currentItemsStringified = JSON.stringify(currentItems);
                await GM_setClipboard(currentItemsStringified);
                handleCopyButtonAnimation();
            } catch (error) {
                console.error("Error occurred while fetching cart data:", error);
                alert("Error occurred while fetching cart data.");
            }
        } else {
            console.log('Cart JSON not found in the dataLayer array.');
        }
    };

    const handleTextFieldSubmit = () => {
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

    const handleCopyButtonAnimation = () => {
        const initialButtonText = copyButton.textContent;
        copyButton.textContent = 'Скопировано!';
        copyButton.style.backgroundColor = 'orange';
        setTimeout(() => {
            copyButton.textContent = initialButtonText;
            copyButton.style.backgroundColor = 'green';
        }, 2000);
    };

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

    // Initial check and addition of buttons
    addButtonContainer();

    // Monitor changes in the page using MutationObserver
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            addButtonContainer(); // Recheck and manage buttons on any changes in the page content
        });
    });

    // Configuration of the observer: observe changes in the body element and its subtree
    const observerConfig = {
        childList: true,
        subtree: true
    };
    observer.observe(document.body, observerConfig);
})();
