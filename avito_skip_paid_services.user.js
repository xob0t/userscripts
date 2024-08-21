// ==UserScript==
// @name         Avito Пропуск Предложения Платных Услуг
// @namespace    https://github.com/xob0t/userscripts
// @version      0.1
// @description  Пропуск предложения платных услуг после создания/редактирования объявлений
// @author       xob0t
// @match        https://www.avito.ru/performance/*?vasFrom=item_add
// @match        https://www.avito.ru/performance/*?vasFrom=item_edit_pay_service
// @icon         https://www.google.com/s2/favicons?sz=64&domain=avito.ru
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Check if the current URL matches one of the specified patterns
    const currentUrl = window.location.href;

    // Extract the ID from the URL (assumes it's the first number after /performance/)
    const match = currentUrl.match(/\/performance\/(\d+)\?/);

    if (match && match[1]) {
        const id = match[1];
        // Redirect to the desired URL
        window.location.href = `https://www.avito.ru/items/edit/${id}/result`;
    }
})();
