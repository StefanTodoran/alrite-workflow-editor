"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
window.addEventListener("load", init);
var body = null;
var selectedCard = null;
var darkMode = false;
var componentID = 0;
var templates = {
    "TextInput": "template-text-input-component",
    "Button": "template-button-component",
    "MediaItem": "template-media-item-component",
    "MultipleChoice": "template-multiple-choice-component",
    "Comparison": "template-comparison-component",
};
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
    document.getElementById("export-button").addEventListener("click", exportWorkflow);
    darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.getElementById("light-mode-button").addEventListener("click", toggleDarkMode);
    document.getElementById("dark-mode-button").addEventListener("click", toggleDarkMode);
    updateDarkMode();
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
    updateAllDropDowns();
    newPageIndex++;
    window.scrollTo({
        left: body.scrollWidth,
        behavior: "smooth",
    });
}
function addPageCard(id, title) {
    const card = getTemplateCopy("template-page-card");
    card.id = id;
    card.querySelector("h1").textContent = title;
    card.querySelector("h2").textContent = id;
    createButtonClickEvent(card, ".page-card-header", function () {
        selectedCard = selectedCard === card.id ? null : card.id;
        updateSelectedCard();
    });
    card.querySelector("h1").addEventListener("keydown", (evt) => {
        if (evt.key === "Enter") {
            document.activeElement.blur();
            selectedCard = card.id;
            updateSelectedCard();
            evt.preventDefault();
        }
    });
    createButtonClickEvent(card, ".move-left-button", function (evt) {
        body.insertBefore(card, card.previousSibling);
        updatePageCardMoveButtons();
        evt.stopPropagation();
    });
    createButtonClickEvent(card, ".move-right-button", function (evt) {
        body.insertBefore(card, card.nextSibling.nextSibling);
        updatePageCardMoveButtons();
        evt.stopPropagation();
    });
    createButtonClickEvent(card, ".delete-button", function (evt) {
        if (window.confirm(`Are you sure you want to delete "${card.id}"?`)) {
            body.removeChild(card);
            updateAllDropDowns();
            updatePageCardMoveButtons();
        }
        evt.stopPropagation();
    });
    const addComponent = card.querySelector(".add-component-button");
    addComponent.addEventListener("click", function () {
        const newComponent = getTemplateCopy("template-new-component");
        createButtonClickEvent(newComponent, ".create-component", function () {
            const typeInput = newComponent.querySelector(".component-type");
            addComponentToCard(typeInput.value, card, newComponent, componentID);
            addComponent.classList.remove("disabled");
            componentID++;
        });
        addComponent.classList.add("disabled");
        card.insertBefore(newComponent, addComponent);
    });
    const addButton = document.getElementById("add-page-button");
    body.insertBefore(card, addButton);
}
function addComponentToCard(type, card, creator, id) {
    const component = getTemplateCopy(templates[type]);
    component.id = `${card.id}.${type}.${id}`;
    createButtonClickEvent(component, ".delete-component-button", function () {
        if (window.confirm(`Are you sure you want to delete this "${type}" component?`)) {
            component.remove();
        }
    });
    const addButton = component.querySelector(".add-subcomponent-button");
    if (addButton) {
        addButton.addEventListener("click", () => {
            const choice = getTemplateCopy("template-choice-component");
            createButtonClickEvent(choice, ".delete-component-button", function () {
                choice.remove();
            });
            const choiceDropdown = choice.querySelector(".drop-down.link-selector");
            if (choiceDropdown) {
                const ids = getAllPageIDs();
                updateDropDown(choiceDropdown, ids);
            }
            const choiceGotos = choice.querySelectorAll(".goto-button");
            if (choiceGotos) {
                createGotoButtonListeners(choiceGotos);
            }
            component.querySelector(".card-subcomponents").insertBefore(choice, addButton);
        });
    }
    const dropdowns = component.querySelectorAll(".drop-down.link-selector");
    if (dropdowns) {
        dropdowns.forEach(dropdown => {
            const ids = getAllPageIDs();
            updateDropDown(dropdown, ids);
        });
    }
    const gotos = component.querySelectorAll(".goto-button");
    if (gotos) {
        createGotoButtonListeners(gotos);
    }
    card.insertBefore(component, creator);
    card.removeChild(creator);
}
function updateAllDropDowns() {
    const dropdowns = document.querySelectorAll(".drop-down.link-selector");
    const ids = getAllPageIDs();
    dropdowns.forEach(dropdown => updateDropDown(dropdown, ids));
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
function toggleDarkMode() {
    darkMode = !darkMode;
    updateDarkMode();
}
function updateDarkMode() {
    if (darkMode) {
        body.classList.add("darkMode");
        document.getElementById("light-mode-button").classList.add("hidden");
        document.getElementById("dark-mode-button").classList.remove("hidden");
    }
    else {
        body.classList.remove("darkMode");
        document.getElementById("dark-mode-button").classList.add("hidden");
        document.getElementById("light-mode-button").classList.remove("hidden");
    }
}
function getTemplateCopy(id) {
    const template = document.getElementById(id);
    const clone = template.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.remove("hidden");
    return clone;
}
function createButtonClickEvent(container, query, func) {
    const button = container.querySelector(query);
    button.addEventListener("click", func);
}
function getAllPageIDs() {
    const ids = [];
    const pages = document.querySelectorAll(".page-card:not(.hidden)");
    pages.forEach(page => { ids.push(page.id); });
    return ids;
}
function updateDropDown(dropdown, values) {
    const previous = dropdown.value;
    dropdown.innerHTML = "";
    for (let i = 0; i < values.length; i++) {
        const option = document.createElement("option");
        option.value = values[i];
        option.innerHTML = values[i];
        dropdown.appendChild(option);
    }
    if (previous) {
        dropdown.value = previous;
    }
}
function createGotoButtonListeners(buttons) {
    buttons.forEach(button => {
        button.addEventListener("click", function () {
            const target = button.previousElementSibling.value;
            selectedCard = target;
            updateSelectedCard();
        });
    });
}
function allowDrop(evt) {
    evt.preventDefault();
}
function drag(evt) {
    evt.dataTransfer.setData("component", evt.target.id);
}
function drop(evt) {
    evt.preventDefault();
    const id = evt.dataTransfer.getData("component");
    const component = document.getElementById(id);
    const targetComponent = evt.target.closest(".card.component-card");
    const pageCard = targetComponent.parentNode;
    const parts = component.id.split(".");
    component.id = `${pageCard.id}.${parts[1]}.${componentID++}`;
    pageCard.insertBefore(component, targetComponent);
}
function exportWorkflow() {
    const cards = document.querySelectorAll(".page-card");
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const components = card.querySelectorAll(".component-card");
    }
}
function extractPageCard(card) {
    return {
        pageID: card.id,
        title: card.querySelector("h1").textContent,
        content: []
    };
}
//# sourceMappingURL=index.js.map