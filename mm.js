// ==UserScript==
// @name         Megamarket Price Calculator
// @namespace    http://tampermonkey.net/
// @version      0.5.5
// @description  Calculate prices with subtracted bonuses, and sort elements on the page
// @author       xb0t
// @match        https://megamarket.ru/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const sortingEnabled = true;
    const priceColor = 'green';

    function processProductGrids(productGrids) {
        productGrids.forEach(grid => {

            const items = grid.querySelectorAll('.catalog-item:not(.processed)');
            let newElementsAdded = false;

            items.forEach(item => {
                if (item.className.includes('processed')) {
                    return;
                }

                const priceElement = item.querySelector('.item-price span');
                const bonusElement = item.querySelector('.money-bonus_loyalty .bonus-amount');

                if (priceElement && bonusElement) {
                    const price = parseInt(extractDigitsFromString(priceElement.textContent.trim()), 10);
                    const bonus = parseInt(extractDigitsFromString(bonusElement.textContent.trim()), 10);
                    let result = price - bonus;

                    // Update or set dataset attribute on the item
                    item.dataset.resultedAmount = result;

                    result = insertSpaceBeforeLastThree(result);

                    // Create a new element to display the resulted amount
                    const newPriceElement = document.createElement('div');
                    newPriceElement.classList.add('item-money');

                    const priceElementChild = document.createElement('div');
                    priceElementChild.classList.add('item-price');

                    const amountElement = document.createElement('span');
                    amountElement.textContent = `${result} ₽`;
                    amountElement.style.setProperty('color', priceColor, 'important');

                    // Append elements to each other
                    priceElementChild.appendChild(amountElement);
                    newPriceElement.appendChild(priceElementChild);

                    // Insert the new elements into the item
                    const pricesContainer = item.querySelector('.inner.catalog-item__prices-container');
                    pricesContainer.insertBefore(newPriceElement, pricesContainer.children[1]);

                    console.log('grid item price calculated');
                    newElementsAdded = true;
                } else if (priceElement) {
                    const price = parseInt(extractDigitsFromString(priceElement.textContent.trim()), 10);
                    item.dataset.resultedAmount = price;
                }
                item.classList.add('processed');
            });

            if (newElementsAdded && sortingEnabled) {
                const sortedItems = Array.from(items).sort((a, b) => {
                    const priceA = parseInt(a.dataset.resultedAmount || '0', 10);
                    const priceB = parseInt(b.dataset.resultedAmount || '0', 10);
                    return priceA - priceB;
                });

                // Clear the container before appending sorted items
                while (grid.firstChild) {
                    grid.removeChild(grid.firstChild);
                }

                sortedItems.forEach(item => {
                    grid.appendChild(item);
                });
                console.log('item grid sorted');
            }
        });
    }

    function processProductStrips(productStripList) {
        let newElementsAdded = false;
        productStripList.forEach(productStrip => {
            const productList = productStrip.querySelectorAll('.product-list-items__col');
            productList.forEach(product => {
                if (product.className.includes('processed')) {
                    return
                }
                const priceElement = product.querySelector('.amount');
                const bonusElement = product.querySelector('.bonus-amount');

                if (priceElement && bonusElement) {
                    const price = parseInt(extractDigitsFromString(priceElement.textContent.trim()), 10);
                    const bonus = parseInt(extractDigitsFromString(bonusElement.textContent.trim()), 10);

                    let result = price - bonus;

                    // Update or set dataset attribute on the product item
                    product.dataset.resultedAmount = result;

                    result = insertSpaceBeforeLastThree(result)

                    const newResultElement = document.createElement('div');
                    newResultElement.classList.add('product-list-item-price__money', 'new');

                    const newResultSpan = document.createElement('div');
                    newResultSpan.classList.add('amount');
                    newResultSpan.textContent = `${result} ₽`;
                    newResultSpan.style.color = priceColor;

                    newResultElement.appendChild(newResultSpan);

                    // Find the insertion point and insert the new element
                    const productPriceContainer = product.querySelector('.product-list-item-price');
                    productPriceContainer.insertBefore(newResultElement, productPriceContainer.firstChild);

                    console.log('product strip price calculated');
                } else if (priceElement) {
                    const price = parseInt(extractDigitsFromString(priceElement.textContent.trim()), 10);
                    product.dataset.resultedAmount = price;
                }
                product.classList.add('processed');
                newElementsAdded = true;
            });
            if (newElementsAdded && sortingEnabled) {
                const sortedProducts = Array.from(productList);

                sortedProducts.sort((a, b) => {
                    const priceA = parseInt(a.dataset.resultedAmount || 0, 10);
                    const priceB = parseInt(b.dataset.resultedAmount || 0, 10);
                    return priceA - priceB;
                });

                // Clear the product strip before appending sorted offers
                while (productStrip.firstChild) {
                    productStrip.removeChild(productStrip.firstChild);
                }

                sortedProducts.forEach(offer => {
                    productStrip.appendChild(offer);
                });
                console.log('product strip sorted');
            }
        });

    }

    function processProductOffers(productOffersTableList) {
        let newElementsAdded = false;
        productOffersTableList.forEach(table => {
            const productOffersList = table.querySelectorAll('.product-offer');
            if (productOffersList.length > 0) {
                productOffersList.forEach(offer => {
                    if (offer.className.includes('processed')) {
                        return
                    }
                    const priceElement = offer.querySelector('.product-offer-price__amount');
                    const bonusElement = offer.querySelector('.bonus-amount');

                    if (priceElement && bonusElement) {

                        const price = parseInt(extractDigitsFromString(priceElement.textContent.trim()), 10);
                        const bonus = parseInt(extractDigitsFromString(bonusElement.textContent.trim()), 10);

                        let result = price - bonus;

                        offer.dataset.resultedAmount = result;
                        result = insertSpaceBeforeLastThree(result)
                        // Create the new elements
                        const newResultElement = document.createElement('div');
                        newResultElement.classList.add('product-offer-price'); // Adjust this class accordingly

                        const newResultSpan = document.createElement('span');
                        newResultSpan.classList.add('product-offer-price__amount');
                        newResultSpan.textContent = `${result} ₽`;

                        // Append the span to the div
                        newResultElement.appendChild(newResultSpan);
                        newResultElement.style.color = priceColor;

                        // Get the parent of the price element and insert the new elements before it
                        offer.insertBefore(newResultElement, priceElement.parentElement);

                        console.log('offer price calculated');


                    } else if (priceElement) {
                        const price = parseInt(extractDigitsFromString(priceElement.textContent.trim()), 10);
                        offer.dataset.resultedAmount = price;
                    }
                    offer.classList.add('processed');
                    newElementsAdded = true;
                });
                if (newElementsAdded && sortingEnabled) {
                    const sortedOffers = Array.from(table.querySelectorAll('.product-offer'));

                    sortedOffers.sort((a, b) => {
                        const priceA = parseInt(a.dataset.resultedAmount || '0', 10);
                        const priceB = parseInt(b.dataset.resultedAmount || '0', 10);
                        return priceA - priceB;
                    });

                    sortedOffers.forEach(offer => {
                        table.appendChild(offer);
                    });
                    console.log('offers sorted');
                }
            }
        });

    }

    function processSaleBocks(saleBlocks) {
        saleBlocks.forEach(block => {
            if (block.className.includes('processed')) {
                return
            }
            const priceElement = block.querySelector('[itemprop="price"]');
            const bonusElement = block.querySelector('.bonus-amount');
            if (priceElement && bonusElement) {
                const price = parseInt(extractDigitsFromString(priceElement.getAttribute('content').trim()), 10);
                const bonus = parseInt(extractDigitsFromString(bonusElement.textContent.trim()), 10);
                let result = price - bonus;
                result = insertSpaceBeforeLastThree(result)
                // Create the new elements
                const newResultElement = document.createElement('div');
                newResultElement.classList.add('sales-block-offer-price', 'sales-block-offer-price_active');
                const newResultElement1 = document.createElement('div');
                newResultElement1.classList.add('sales-block-offer-price__container-price');
                const newResultElement2 = document.createElement('span');
                newResultElement2.classList.add('sales-block-offer-price__price-final');
                newResultElement2.textContent = `${result} ₽`;
                newResultElement2.style.color = priceColor;


                // Append
                newResultElement1.appendChild(newResultElement2);
                newResultElement.appendChild(newResultElement1);


                // Get the parent of the price element and insert the new elements before it
                block.insertBefore(newResultElement, block.firstChild);

                console.log('block price calculated');
                block.classList.add('processed');
            }

        });
    }

    function insertSpaceBeforeLastThree(input) {
        // Convert input to a string
        let str = String(input);

        // Check if the string has at least three characters
        if (str.length > 3) {
            // Insert space before the last three characters
            str = str.slice(0, -3) + " " + str.slice(-3);
        }

        return str;
    }

    function extractDigitsFromString(str) {
        return str.replace(/\D/g, '');
    }

    function calculatePricesAndSort() {
        const productOffersTableList = document.querySelectorAll('.product-offers');
        const productStripList = document.querySelectorAll('.product-list-items.product-list-items');
        const productGrids = document.querySelectorAll('[class*="catalog-listing__items"]');
        const saleBlocks = document.querySelectorAll('.pdp-sales-block');
        // console.log(saleBlocks)
        // console.log(productOffersTableList)
        // console.log(productStripList)
        // console.log(productGrids)

        if (saleBlocks.length > 0) {
            processSaleBocks(saleBlocks)
        }

        if (productOffersTableList.length > 0) {
            processProductOffers(productOffersTableList)
        }
        if (productStripList.length > 0) {
            processProductStrips(productStripList)
        }

        if (productGrids.length > 0) {
            processProductGrids(productGrids)
        }
    }

    function observeDOMChanges() {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    calculatePricesAndSort();
                    break;
                }
            }
        });

        const observeTargets = [
            ...document.querySelectorAll('.product-offers, .product-list-items.product-list-items, [class*="catalog-listing__items"], .pdp-sales-block'),
        ];

        observeTargets.forEach((target) => {
            observer.observe(target, {
                childList: true,
                subtree: true
            });
        });
    }

    // Initially calculate prices
    calculatePricesAndSort();

    // Start observing DOM changes
    observeDOMChanges();

    //setInterval(calculatePricesAndSort, 2000);

})();