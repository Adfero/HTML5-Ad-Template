var adDiv;

function initEB() {
    if (!EB.isInitialized()) {
        EB.addEventListener(EBG.EventName.EB_INITIALIZED, startAd);
    } else {
        startAd();
    }
}

function startAd() {
    adDiv = document.getElementById("ad");

    addEventListeners();
}

function addEventListeners() {
    document.getElementById("clickthrough-button").addEventListener("click", clickthrough);
}

function clickthrough() {
    EB.clickthrough();
}

window.addEventListener("load", initEB);
