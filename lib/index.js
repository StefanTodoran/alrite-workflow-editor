"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
window.addEventListener("load", init);
var body = null;
var selectedCard = null;
function init() {
    body = document.querySelector("body");
    const dummyData = [
        {
            pageID: "page_1",
            title: "abc",
            content: [],
        },
        {
            pageID: "page_2",
            title: "long long name",
            content: [],
        },
        {
            pageID: "page_3",
            title: "Page 3",
            content: [],
        },
        {
            pageID: "page_4",
            title: "Page 4",
            content: [],
        },
        {
            pageID: "page_5",
            title: "Page 5",
            content: [],
        },
        {
            pageID: "page_6",
            title: "Page 6",
            content: [],
        },
        {
            pageID: "page_7",
            title: "Page 7",
            content: [],
        },
    ];
    for (let i = 0; i < dummyData.length; i++) {
        const page = dummyData[i];
        addPageCard(page.pageID, page.title);
    }
    updatePageCardMoveButtons();
    document.getElementById("add-page-button").addEventListener("click", addNewPage);
}
let newPageIndex = 0;
function addNewPage() {
    const page = {
        pageID: `new_page_${newPageIndex}`,
        title: "Blank Page",
        content: [],
    };
    addPageCard(page.pageID, page.title);
    updatePageCardMoveButtons();
    newPageIndex++;
    window.scrollTo({
        left: body.scrollWidth,
        behavior: "smooth",
    });
}
function addPageCard(id, title) {
    const addButton = document.getElementById("add-page-button");
    const template = document.getElementById("template-card");
    const copy = template.cloneNode(true);
    body.insertBefore(copy, addButton);
    const card = document.querySelectorAll(".page-card.hidden")[1];
    card.querySelector("h1").textContent = title;
    card.querySelector("h2").textContent = id;
    card.classList.remove("hidden");
    card.id = id;
    const editCard = card.querySelector(".edit-button");
    editCard.addEventListener("click", () => {
        selectedCard = selectedCard === card.id ? null : card.id;
        updateSelectedCard();
    });
    const moveLeft = card.querySelector(".move-left-button");
    moveLeft.addEventListener("click", () => {
        body.insertBefore(card, card.previousSibling);
        updatePageCardMoveButtons();
    });
    const moveRight = card.querySelector(".move-right-button");
    moveRight.addEventListener("click", () => {
        body.insertBefore(card, card.nextSibling.nextSibling);
        updatePageCardMoveButtons();
    });
}
function updatePageCardMoveButtons() {
    const cards = document.querySelectorAll(".page-card:not(.hidden)");
    cards.forEach((card, index) => {
        const moveLeft = card.querySelector(".move-left-button");
        const moveRight = card.querySelector(".move-right-button");
        if (index === 0) {
            moveLeft.classList.add("disabled");
        }
        else {
            moveLeft.classList.remove("disabled");
        }
        if (index === cards.length - 1) {
            moveRight.classList.add("disabled");
        }
        else {
            moveRight.classList.remove("disabled");
        }
    });
}
function extractPageCard(card) {
    return {
        pageID: card.id,
        title: card.querySelector("h1").textContent,
        content: []
    };
}
function updateSelectedCard() {
    const newSelected = document.getElementById(selectedCard);
    const allCards = document.querySelectorAll(".page-card");
    allCards.forEach(card => card.classList.remove("selected"));
    if (newSelected)
        newSelected.classList.add("selected");
}
//# sourceMappingURL=index.js.map