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
            title: "First Page",
            content: [],
        },
        {
            pageID: "page_2",
            title: "Second Page",
            content: [],
        },
        {
            pageID: "page_3",
            title: "Final Page",
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
    const card = template.cloneNode(true);
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
    const moveRight = card.querySelector(".move-right-button");
    moveLeft.addEventListener("click", () => {
        body.insertBefore(card, card.previousSibling);
        updatePageCardMoveButtons();
    });
    moveRight.addEventListener("click", () => {
        body.insertBefore(card, card.nextSibling.nextSibling);
        updatePageCardMoveButtons();
    });
    const deleteCard = card.querySelector(".delete-button");
    deleteCard.addEventListener("click", () => {
        if (window.confirm(`Are you sure you want to delete "${card.id}"?`)) {
            body.removeChild(card);
        }
    });
    const addComponent = card.querySelector(".add-component-button");
    addComponent.addEventListener("click", () => {
        const newComponent = document.getElementById("template-new-component").cloneNode(true);
        newComponent.removeAttribute('id');
        newComponent.classList.remove("hidden");
        newComponent.querySelector(".create-component").addEventListener("click", () => {
            const typeInput = newComponent.querySelector(".component-type");
            addComponentToCard(typeInput.value, card, newComponent);
        });
        card.insertBefore(newComponent, addComponent);
    });
    body.insertBefore(card, addButton);
}
function addComponentToCard(type, card, creator) {
    let template;
    switch (type) {
        case "TextInput":
            template = document.getElementById("template-text-input-component");
            break;
        case "Button":
            template = document.getElementById("template-button-component");
            break;
        case "Comparison":
            template = document.getElementById("template-comparison-component");
            break;
        default:
            return;
    }
    const component = template.cloneNode(true);
    component.classList.remove("hidden");
    card.insertBefore(component, creator);
    card.removeChild(creator);
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
function updateSelectedCard() {
    const newSelected = document.getElementById(selectedCard);
    const allCards = document.querySelectorAll(".page-card");
    allCards.forEach(card => card.classList.remove("selected"));
    if (newSelected)
        newSelected.classList.add("selected");
}
function extractPageCard(card) {
    return {
        pageID: card.id,
        title: card.querySelector("h1").textContent,
        content: []
    };
}
//# sourceMappingURL=index.js.map