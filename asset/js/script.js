const searchField = document.querySelector(`input.main__search-field`);
const searchButton = document.querySelector(`button.main__search-button`);
const searchResultSection = document.querySelector(`.main__result-section`);
const loaderAnimation = document.createElement("DIV");

const getGames = async (strKeyword) => {
    const endpoint = new URL(`https://www.cheapshark.com/api/1.0/games?title=${strKeyword}&limit=12`);
    const response = await fetch(endpoint);

    if (response.status === 404) {
        alert("Error 404: Game not found.");
        return;
    }

    return response.json();
}

const getGameDeals = async (gameId) => {
    const endpoint = new URL(`https://www.cheapshark.com/api/1.0/games?id=${gameId}`);
    const response = await fetch(endpoint);

    if (response.status === 404) {
        alert("No game deal(s) available.");
        return;
    }

    return response.json();
}

const getGameInfo = async (gameId) => {
    const endpoint = new URL(`https://www.cheapshark.com/api/1.0/games?id=${gameId}`)
    const response = await fetch(endpoint);

    if (response.status === 404) {
        alert("No game data available.")
        return;
    }

    return response.json();
}

const getMultipleGamesInfoAndDeals = async (gameIds) => {
    const endpoint = new URL(`https://www.cheapshark.com/api/1.0/games?ids=${gameIds.toString()}`);
    const response = await fetch(endpoint);

    if (response.status === 404) {
        alert("Error 404.");
        return;
    }

    return response.json();
}

const getActiveStores = async () => {
    const endpoint = new URL(`https://www.cheapshark.com/api/1.0/stores`);
    const response = await fetch(endpoint);

    if (response.status === 404) {
        alert("Error 404.");
        return;
    }

    return await response.json();
}

const getDealInfo = async (dealId) => {
    const endpoint = new URL(`https://www.cheapshark.com/api/1.0/deals?id=${dealId}`);
    const response = await fetch(endpoint);

    if (response.status === 404) {
        alert("Error 404.");
        return;
    }

    return response.json();
}

const listAvailableDeals = async (deals) => {
    const activeStores = await getActiveStores();
    let dealsList = [];
    let availableDealsListHTML = "";

    for (const deal of deals) {
        const dealInfo = await getDealInfo(deal.dealID);
        const storeInfo = activeStores.find(activeStore => {
            return (
                activeStore.storeID === dealInfo.gameInfo.storeID &&
                activeStore.isActive
            );
        });

        dealInfo.storeInfo = storeInfo;
        dealsList.push(dealInfo);
    }

    for (const { gameInfo, storeInfo } of dealsList) {
        const isNotOnSale = gameInfo.retailPrice === gameInfo.salePrice;
        const availableDealHTML = `
            <li class="deals__item">
                <span class="deals__item-store">
                    <img class="deals__item-store--icon" src="https://www.cheapshark.com${storeInfo.images.icon}">
                    <a href="#" class="deals__item-store--link">${storeInfo.storeName}</a>
                </span>
                <div class="deals__item-price">
                    <span class="deals__item-price--retail ${isNotOnSale ? "hidden" : ""}">${gameInfo.retailPrice}</span>
                    <span class="deals__item-price--sale" ${isNotOnSale ? "style='color: green'": ""}>${gameInfo.salePrice}</span>
                </div>
            </li>
        `;

        availableDealsListHTML += availableDealHTML;
    }

    return availableDealsListHTML;
};

const loadDealsDataToModal = async (gameId) => {
    showDealsModal();
    
    const { info, deals } = await getGameDeals(gameId);
    const hasAvailableDeals = deals.length > 0;
    const modalComponent = document.querySelector(`.modal`);
    const modalContent = modalComponent.querySelector(`.modal__content`);
    const modalContentInnerHTML = `
        <div>
            <h2 class="modal__title">${info.title}</h2>
            <div class="deals">
                <span style="display:${hasAvailableDeals ? "none;" : "inline;"}">
                    No available game deal(s) found.
                </span>
                <ul class="deals__list" style="display:${hasAvailableDeals ? "flex;" : "none;"}">${await listAvailableDeals(deals)}</ul>
            </div>
            <div class="modal__button">
                <button class="modal__button--close">Close</button>
            </div>
        </div>
    `;

    modalContent.removeChild(loaderAnimation);
    modalContent.appendChild($(modalContentInnerHTML)[0]);

    const modalCloseBtn = modalComponent.querySelector(`.modal__button--close`);

    modalCloseBtn.addEventListener("click", (e) => {
        document.body.removeChild(modalComponent);
    });
}

const showDealsModal = () => {
    const modalHTML = `
        <div class="modal">
            <div class="modal__background"></div>
            <div class="modal__content"></div>
        </div>
    `;
    const modalComponent = $(modalHTML)[0];
    const modalContent = modalComponent.querySelector(`.modal__content`);

    modalContent.appendChild(loaderAnimation);
    document.body.appendChild(modalComponent);
}

const createGameResultCard = ({ gameID, cheapest, external, thumb }, originalPrice) => {
    const isNotOnSale = originalPrice === cheapest;
    const gameCardHTML = `
        <div class="game" data-game-id="${gameID}">
            <div class="game__thumbnail" style="background-image: url(${thumb})">
                <img src="${thumb}" alt="${external} thumbnail">
            </div>
            <div class="game__title">
                <a href="#" class="game__link">${external}</a>
            </div>
            <div class="game__price">
                <span class="game__price--original ${isNotOnSale ? "hidden" : ""}">${originalPrice}</span>
                <span class="game__price--cheapest" ${isNotOnSale ? "style='color: green'": ""}>${cheapest}</span>
            </div>
        </div>
    `;

    const gameCardComponent = $(gameCardHTML)[0];
    const gameLink = gameCardComponent.querySelector(`a.game__link`);

    gameLink.addEventListener("click", ({ target }) => loadDealsDataToModal(target.parentElement.parentElement.dataset.gameId));
    searchResultSection.appendChild(gameCardComponent);
}

const loadSearchResults = async (strKeyword) => {
    removeAllChildNodes(searchResultSection);
    loaderAnimation.setAttribute("class", "loader");
    searchResultSection.appendChild(loaderAnimation);

    const gameData = await getGames(strKeyword);

    if (gameData.length) {
        const gameIds = gameData.map((game) => game.gameID);
        const gameResultsInfo = await getMultipleGamesInfoAndDeals(gameIds);

        for (const game of gameData) {
            const originalPrice = gameResultsInfo[game.gameID]?.deals[0]?.retailPrice;

            createGameResultCard(game, originalPrice);
        }
    }

    searchResultSection.removeChild(loaderAnimation);
}

const removeAllChildNodes = (parent) => {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

window.addEventListener("load", (event) => {
    searchField.focus();
});

searchButton.addEventListener("click", (event) => {
    if (!searchField.value) {
        return;
    }

    loadSearchResults(searchField.value);
});

searchField.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
        if (!searchField.value) {
            return;
        }

        loadSearchResults(searchField.value);
    }
});