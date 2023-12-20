// ==UserScript==
// @name         MM cart tools
// @namespace    http://tampermonkey.net/
// @version      2023-12-20
// @description  try to take over the world!
// @author       xob0t
// @match        https://megamarket.ru/multicart/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=megamarket.ru
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {

    'use strict';

    // Create a container div for button, input field, and submit button
    var container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '20px'; // Adjust distance from bottom as needed
    container.style.left = '20px'; // Adjust distance from left as needed
    container.style.zIndex = '9999'; // Ensure it's above other elements
    container.style.display = 'flex'; // Use flexbox for alignment

    // Create an input field for user input
    var inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = 'Enter new items'; // Placeholder text
    inputField.style.height = '30px'; // Set input field height
    inputField.style.marginRight = '10px'; // Adjust margin as needed

    // Create a submit button for user input
    var submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.style.padding = '10px'; // Adjust padding as needed
    submitButton.style.backgroundColor = 'blue'; // Adjust color as needed
    submitButton.style.color = 'white'; // Adjust text color as needed
    submitButton.style.border = 'none'; // Remove border if not needed
    submitButton.style.borderRadius = '5px'; // Adjust border radius as needed

    // Append input field and submit button to the container
    container.appendChild(inputField);
    container.appendChild(submitButton);

    // Create a button element for copying stringified array of currentItems
    var copyButton = document.createElement('button');
    copyButton.textContent = 'Copy currentItems';
    copyButton.style.padding = '10px'; // Adjust padding as needed
    copyButton.style.backgroundColor = 'green'; // Adjust color as needed
    copyButton.style.color = 'white'; // Adjust text color as needed
    copyButton.style.border = 'none'; // Remove border if not needed
    copyButton.style.borderRadius = '5px'; // Adjust border radius as needed
    copyButton.style.marginRight = '10px'; // Adjust margin as needed

    // Append copyButton to the container
    container.appendChild(copyButton);

    // Append container to the body
    document.body.appendChild(container);

    // Function to handle button click to copy stringified array of currentItems
    function handleCopy() {
        var dataLayerCart = dataLayer.find(item => item.cart);
        if (dataLayerCart) {
            var cartId = dataLayerCart.cart.lineItems[0].cartId;
            getCartData(cartId)
                .then(cart => {
                    var currentItems = extractItemsAndCartInfo(cart);
                    var currentItemsStringified = JSON.stringify(currentItems);
                    copyToClipboard(currentItemsStringified);
                    copyButton.textContent = 'Copied!'; // Change button text when copied
                    setTimeout(function() {
                        copyButton.textContent = 'Copy currentItems'; // Revert button text after a brief delay
                    }, 1500); // Change button text back after 1.5 seconds
                })
                .catch(error => {
                    console.error("Error occurred while fetching cart data:", error);
                });
        } else {
            console.log('Cart JSON not found in the dataLayer array. Retrying...');
            setTimeout(checkForCart, 1000); // Check again after 1 second
        }
    }

    // Function to handle user input and addToCart if needed
    function handleSubmit() {
        var enteredText = inputField.value.trim();
        if (enteredText !== '') {
            var newCartData;
            try {
                newCartData = JSON.parse(enteredText);
            } catch (error) {
                console.error('Invalid input. Please enter a valid JSON.');
                return;
            }

            var dataLayerCart = dataLayer.find(item => item.cart);
            var cartId = null; // Initialize cartId as null

            var currentItems = []; // Initialize currentItems as an empty array

            if (dataLayerCart && dataLayerCart.cart && dataLayerCart.cart.lineItems && dataLayerCart.cart.lineItems.length > 0) {
                cartId = dataLayerCart.cart.lineItems[0].cartId;
            }

            if (cartId) {
                getCartData(cartId)
                    .then(cart => {
                    currentItems = extractItemsAndCartInfo(cart) || []; // Set currentItems to an empty array if null
                    debugger
                    if (!allItemsInCurrentItems(currentItems, newCartData.extractedItems)) {
                        addToCart(newCartData.extractedItems, cartId, newCartData.extractedCartInfo.type, newCartData.extractedCartInfo.locationId);
                        location.reload();
                    } else {
                        console.log('All items from newItems are already in currentItems.');
                    }
                })
                    .catch(error => {
                    console.error("Error occurred while fetching cart data:", error);
                });
            } else {
                console.log('Cart ID not found or invalid. Proceeding without cartId.');
                debugger
                addToCart(newCartData.extractedItems, cartId, newCartData.extractedCartInfo.type, newCartData.extractedCartInfo.locationId, newCartData.extractedCartInfo.clientAddress);

                //location.reload();
                // Perform an action here if cartId is not available
                // For example, you might want to handle adding items to the cart without a cartId
            }
        } else {
            console.log('Please enter valid data.');
        }
    }

    // Add click event listener to the copyButton
    copyButton.addEventListener('click', handleCopy);

    // Add click event listener to the submitButton
    submitButton.addEventListener('click', handleSubmit);


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
    function addToCart(items, cartId,cartType, locationId, clientAddress) {
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

        // Function to copy text to clipboard
    function copyToClipboard(text) {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
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

    function allItemsInCurrentItems(arr1, arr2) {
        const arr1Str = arr1.map(item => JSON.stringify(item));
        const arr2Str = arr2.map(item => JSON.stringify(item));

        return arr2Str.every(item => arr1Str.includes(item));
    }

    function addNewItems() {
        const dataLayerCart = dataLayer.find(item => item.cart);
        if (dataLayerCart) {
            let cartId = dataLayerCart.cart.lineItems[0].cartId;
            getCartData(cartId)
                .then(cart => {
                console.log(cart.itemGroups); // Access cart data here
                let currentItems = extractItems(cart.itemGroups);
                let newItems = extractItems(data);

                if (allItemsInCurrentItems(currentItems, newItems)){
                    return
                }
                else{
                    addToCart(newItems, cartId);
                    location.reload();
                }

            })
                .catch(error => {
                console.error("Error occurred while fetching cart data:", error);
            });
        } else {
            console.log('Cart JSON not found in the dataLayer array. Retrying...');
            setTimeout(checkForCart, 1000); // Check again after 1 second
        }
    }

    function checkForCart() {
        printCartInfo();
    }

    checkForCart(); // Start checking for cart initially


})();
