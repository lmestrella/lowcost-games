const searchField = document.querySelector(`input.main__search-field`);
const searchButton = document.querySelector(`button.main__search-button`);
const searchResultSection = document.querySelector(`.main__result-section`);
const loaderAnimation = document.createElement("DIV");

const getGameData = async (strKeyword) => {
    const endpoint = new URL(`https://www.cheapshark.com/api/1.0/games?title=${strKeyword}&limit=12`);
    const response = await fetch(endpoint);

    if (response.status === 404) {
        alert("Error 404: Game not found.");
        return;
    }

    return response.json();
}

const createGameResultCard = (game) => {
    const { cheapest, external, thumb } = game;
    const gameCardHTML = `
        <div class="game-card">
            <div class="game-card__thumbnail">
                <img src="${thumb}" alt="">
            </div>
            <div class="game-card__title">
                <a href="#" class="game-card__link">${external}</a>
            </div>
            <span class="game-card__price">${cheapest}</span>
        </div>
    `;
    const gameCardComponent = $(gameCardHTML)[0];

    searchResultSection.appendChild(gameCardComponent);
}

const loadSearchResults = async (strKeyword) => {
    removeAllChildNodes(searchResultSection);
    loaderAnimation.setAttribute("class", "loader");
    searchResultSection.appendChild(loaderAnimation);

    const gameData = await getGameData(strKeyword);

    if (gameData.length) {
        for (const game of gameData) {
            createGameResultCard(game);
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