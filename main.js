/// <reference path="jquery-3.5.1.js" />
"use strict";

$(() => {
    let allCoins = [];
    const favorites = getFromLocalStorage("favorites"); // get all favorites

    $(document).ready(async function () {
        try {
            loadSpinner($("main"));
            allCoins = await getDataAsync("https://api.coingecko.com/api/v3/coins/list/");
            allCoins = allCoins.splice(100, 100); // get only 100 coins
            draw(allCoins, $("#coinContainer")); // draw cards
        }   
        catch (err) {
            alert(err.message);
        }
    });

    function draw(data, mainDiv) { // function that checks whether the data is an object or an array and draws accordingly
        $(".spinner-border").css("display", "none"); // clear spinner
        if(!data || typeof mainDiv !== 'object') return;  // validation

        if(!Array.isArray(data)) { // check if data is object
            if(typeof data !== 'object') return; // if data is not object exit (validation)
            return drawCard(data, mainDiv); // if data is object draw card
        } 
        data.forEach(coin => { // if the data is an array run on it and draw all the cards
            drawCard(coin, mainDiv);
        });
    }

    function drawCard(coin, mainDiv) {
        const newCard = $("<div></div>").addClass(["card", "card-design"]).attr("id", coin.id); // add id per card
        const cardBody = $("<div></div>").addClass("card-body");
        // toggle
        const isFavorite = favorites.find(itr => itr.id === coin.id); // find all favorites with id
        const checkBox = $("<input/>").attr("type", "checkbox").addClass("toggle-button")
            .attr("checked", isFavorite ? true : false) // if it's a favorite coin his toggle will be on
            .on("click", function() {
                const index = allCoins.findIndex((index) => index.id === coin.id); // Find the index of the card to add him
                if(this.checked) { 
                    if(favorites.length >= 5) {
                        loadCards($("#favoritesDiv"), favorites); // draw only favorites in modal
                        $("#myModal").css("display", "block"); // load modal
                        $("#closeModal").on("click", function() {
                            $("#myModal").fadeOut(1000);
                            $("#favoritesDiv").html("");
                            loadCards($("#coinContainer"), allCoins); // update toggles after change
                        });
                        this.checked = false;
                        return;
                    }
                    favorites.push(allCoins[index]); // push card to array
                }
                else {
                    const cardRemoved = favorites.findIndex((index) => index.id === coin.id);
                    favorites.splice(cardRemoved, 1); // if user turn off the toggle - delete him from array
                }
                setToLocalStorage("favorites", favorites); // update local storage after delete/add
            }); 
            
        const cardTitle = $("<h5></h5>").addClass("card-title").html(coin.symbol);
        const cardText = $("<p></p>").addClass("card-text").html(coin.name);

        const moreInfoDiv = $("<div></div>").attr("id", `moreInfo-${coin.id}`).addClass("collapse"); // create more info div and give him id
        const moreInfoButton = $("<button></button>")
            .addClass(["btn btn-dark", "more-info-button"])
            .html("More Info")
            .on("click", moreInfo);

        cardBody.append(cardTitle, cardText, moreInfoButton, checkBox, moreInfoDiv);
        newCard.append(cardBody);
        mainDiv.append(newCard);
    }

    async function moreInfo(event) {
        try { 
            const getId = $(event.target).parent().parent().attr("id"); // finding the id by using in event.target.parent
            const cardBody = $(event.target).parent(); // finding the div by using in event.target.parent
            const moreInfoDiv = cardBody.find(`#moreInfo-${getId}`); // finding the more info div

            moreInfoDiv.html(""); // clear more info div
            $(".spinner-border").remove(); // delete spinner to avoid duplicates

            // my collapse
            if(moreInfoDiv.css("display") === "block") {
                moreInfoDiv.css("display", "none"); // if the user clicks a second time the div are clearing
            }
            else { // The first click will show the user a spinner until the information is entered
                $(".spinner-border").css("display", "block");  
                loadSpinner($(cardBody));
                moreInfoDiv.css("display", "block");
                moreInfoDetails(await handleData(getId), getId); // check if passed 2 minutes
            }
        }
        catch (err) {
            alert(err.message);
        }
    }

    async function handleData(coinId) {
        //check if coin is in the session Storage.
        const coinFromStorage = JSON.parse(sessionStorage.getItem(coinId) || null);
        if(!coinFromStorage) return await getCoinData(coinId); // if there is no coin in the storage it means that this is the CLIENT's first click
        const { coinDetails, clickedAt } = coinFromStorage; // extricate the details and time from object
        const now = new Date().getTime();
        if(now > (clickedAt +120000)) return await getCoinData(coinId); // if two minutes have elapsed make another call to the API
        return coinDetails; // if not 2 minutes have passed I send coin details as a parameter to a function that draws the information without calling the API
    }

    async function getCoinData(coinId) { // function that brings the data from the API
        const coinDetails = await getDataAsync(`https://api.coingecko.com/api/v3/coins/${coinId}`);
        const clickedAt = new Date().getTime();
        const data = { coinDetails, clickedAt }; // create an object that contains the information and the time the user clicked the button
        sessionStorage.setItem(coinId, JSON.stringify(data)); // save in session storage and stringify the data and time
        return coinDetails; // return coin details as parameter to draw the data
    }

    function moreInfoDetails(coinDetails, cardId) {
        if(!coinDetails || !cardId) return; // validation
        // creating more info div
        $(".spinner-border").css("display", "none"); // clear spinner
        const moreInfoDiv = $(`#moreInfo-${cardId}`);
        const coinImage = $("<img/>").attr("src", coinDetails.image.thumb);
        const coinPrice = $("<p></p>")
            .html( `USD: ${coinDetails.market_data.current_price.usd} $<br>
                    EUR: ${coinDetails.market_data.current_price.eur} €<br>
                    ILS: ${coinDetails.market_data.current_price.ils} ₪`);

        moreInfoDiv.append(coinImage, coinPrice);
    }

    $("#searchInput").on("change", function() { 
        const searchValue = $(this).val();
        const searchResult = allCoins.find(coin => searchValue === coin.symbol); // get the result with find
        $("#coinContainer").html("");

        if(!searchValue) {
            $("#about").css("display", "block");
            draw(allCoins, $("#coinContainer"));
            return;
        } 

        if(!searchResult) {
            const noResultsDiv = $("<div></div>").text("No Results !").addClass("noResults");
            $("#coinContainer").append(noResultsDiv);
        }
        else {
            $("#coinContainer").html("");
            draw(searchResult, $("#coinContainer"));   
        }
        $("#about").css("display", "none");
        $("#coinContainer")[0].scrollIntoView(); // automatic scroll to card / no results
    });

    function loadCards(currentDiv, coinsArray) { // A function whose her role is to draw all the cards after a specific operation
        $(currentDiv).html("");
        draw(coinsArray, currentDiv);
    }

    function loadSpinner(div) { // create spinner div
        const spinnerDiv = $("<div></div>").addClass("spinner-border").attr("role", "status");
        div.append(spinnerDiv);
    }
    // all scrolls
    $("#showAbout").on("click", () => $("#about").css("display", "block"));

    $("#showAllCoins").on("click", () => $("#coinContainer")[0].scrollIntoView());

    $("#scrollTop").on("click", () => $("header")[0].scrollIntoView());
});
