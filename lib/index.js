"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
window.addEventListener("load", init);
const baseUrl = "http://127.0.0.1:8000";
var body = null;
var selectedCard = null;
var darkMode = false;
var componentID = 0;
var templates = {
    "TextInput": "template-text-input-component",
    "MultipleChoice": "template-multiple-choice-component",
    "MediaItem": "template-media-item-component",
    "Button": "template-button-component",
    "Counter": "template-counter-component",
    "Comparison": "template-comparison-component",
    "Selection": "template-selection-component",
};
function init() {
    body = document.querySelector("body");
    document.getElementById("add-page-button").addEventListener("click", addNewPage);
    document.getElementById("export-button").addEventListener("click", exportWorkflow);
    document.getElementById("import-button").addEventListener("click", promptAndFetchWorkflow);
    document.getElementById("file-import-button").addEventListener("click", triggerFileImport);
    document.getElementById("importer").addEventListener("input", prepareReader);
    darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.getElementById("light-mode-button").addEventListener("click", toggleDarkMode);
    document.getElementById("dark-mode-button").addEventListener("click", toggleDarkMode);
    updateDarkMode();
    addEventListener("mousemove", updateTooltip);
    window.onbeforeunload = () => { return true; };
    populatePageOnStartup();
}
let newPageIndex = 1;
function addNewPage() {
    const page = {
        pageID: `page_${newPageIndex}`,
        title: "Blank Page",
        content: [],
    };
    addPageCard(page.pageID, page.title);
    updatePageCardMoveButtons();
    updateAllDropDowns();
    window.scrollTo({
        left: body.scrollWidth,
        behavior: "smooth",
    });
}
function addPageCard(id, title, isDiagnosisPage, defaultLink, overrideIDs, components) {
    const card = getTemplateCopy("template-page-card");
    card.id = id;
    const titleElement = card.querySelector("h1");
    titleElement.textContent = title;
    card.querySelector("h2").textContent = id;
    titleElement.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter") {
            document.activeElement.blur();
            selectedCard = card.id;
            updateSelectedCard();
            evt.preventDefault();
        }
    });
    titleElement.addEventListener("paste", (evt) => {
        let text = evt.clipboardData.getData('text/plain');
        text = text.replace(/(\n|\r)/g, "");
        titleElement.innerText = text;
        evt.preventDefault();
    });
    if (defaultLink && overrideIDs) {
        const defaultLinkSelect = card.querySelector(".prop-defaultLink");
        updateDropDown(defaultLinkSelect, overrideIDs, defaultLink);
    }
    if (isDiagnosisPage) {
        const diagnosisSlider = card.querySelector(".prop-isDiagnosisPage");
        diagnosisSlider.classList.add("active");
        card.classList.add("diagnosis-page");
    }
    createButtonClickEvent(card, ".page-card-header", function () {
        selectedCard = selectedCard === card.id ? null : card.id;
        updateSelectedCard();
        if (selectedCard) {
            const xPosition = card.getBoundingClientRect().left + window.scrollX;
            const windowHeight = window.innerWidth || document.documentElement.clientWidth;
            window.scrollTo({ left: xPosition - (windowHeight / 3), behavior: 'smooth' });
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
            addEmptyComponentToCard(typeInput.value, card, newComponent, componentID);
            addComponent.classList.remove("disabled");
            componentID++;
        });
        addComponent.classList.add("disabled");
        card.insertBefore(newComponent, addComponent);
        const yPosition = newComponent.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: yPosition, behavior: "smooth" });
    });
    createGotoButtonListeners(card);
    createSliderButtonListeners(card);
    if (components) {
        components.forEach(component => card.insertBefore(component, addComponent));
    }
    const addButton = document.getElementById("add-page-button");
    body.insertBefore(card, addButton);
    newPageIndex++;
}
function addEmptyComponentToCard(type, card, creator, id) {
    const component = createComponent(type, card.id, id);
    card.insertBefore(component, creator);
    card.removeChild(creator);
    const yPosition = component.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: yPosition, behavior: "smooth" });
}
function createComponent(type, cardID, id, props, overrideIDs) {
    const component = getTemplateCopy(templates[type]);
    component.id = `${cardID}.${type}.${id}`;
    createButtonClickEvent(component, ".delete-component-button", function () {
        if (window.confirm(`Are you sure you want to delete this "${type}" component?`)) {
            component.remove();
        }
    });
    const addButton = component.querySelector(".add-subcomponent-button");
    const pageIDs = overrideIDs || getAllPageIDs();
    if (addButton) {
        addButton.addEventListener("click", () => {
            const choice = createChoiceSubComponent(pageIDs);
            component.querySelector(".card-subcomponents").insertBefore(choice, addButton);
            const yPosition = choice.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: yPosition, behavior: "smooth" });
        });
    }
    updateContainedDropDowns(component, pageIDs);
    createGotoButtonListeners(component);
    createSliderButtonListeners(component);
    if (props) {
        populateComponentFields(component, props, pageIDs);
    }
    return component;
}
function createChoiceSubComponent(pageIDs) {
    const choice = getTemplateCopy("template-choice-component");
    createButtonClickEvent(choice, ".delete-component-button", function () {
        choice.remove();
    });
    updateContainedDropDowns(choice, pageIDs);
    createGotoButtonListeners(choice);
    return choice;
}
function populateComponentFields(component, props, pageIDs) {
    const fields = component.querySelector(".component-card-fields");
    for (const [key, value] of Object.entries(props)) {
        if (key === "choices") {
            const subComponentsContainer = component.querySelector(".card-subcomponents");
            const addButton = component.querySelector(".add-subcomponent-button");
            value.forEach((choice) => {
                const subcomponent = createChoiceSubComponent(pageIDs);
                populateComponentFields(subcomponent, choice, pageIDs);
                subComponentsContainer.insertBefore(subcomponent, addButton);
            });
        }
        else {
            const prop = fields.querySelector(`.prop-${key}`);
            prop.value = value;
        }
    }
}
function updatePageCardMoveButtons() {
    const cards = getAllPageCards();
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
function updateTooltip(evt) {
    const tooltip = document.getElementById("tooltip");
    const hovered = this.document.querySelectorAll(":hover");
    const current = hovered[hovered.length - 1];
    let content = undefined;
    if (current.closest("svg.info-button")) {
        const text = current.closest("svg.info-button").parentNode.querySelector(".tooltip-text");
        content = text === null || text === void 0 ? void 0 : text.innerHTML;
    }
    else if (current.closest("svg.util-button")) {
        content = current.closest("svg.util-button").style.getPropertyValue('--label');
    }
    if (content) {
        tooltip.innerHTML = content;
        tooltip.classList.add("active");
    }
    else {
        tooltip.classList.remove("active");
    }
    const x = evt.clientX, y = evt.clientY;
    const bounds = tooltip.getBoundingClientRect();
    tooltip.style.top = Math.min(window.innerHeight - bounds.height, y + 15) + 'px';
    tooltip.style.left = Math.min(window.innerWidth - bounds.width - 20, x + 10) + 'px';
    if (y + bounds.height + 30 > window.innerHeight) {
        tooltip.style.top = y - 30 - bounds.height + 'px';
    }
}
function getAllPageCards() {
    return document.querySelectorAll(".page-card:not(.hidden)");
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
    const IDs = [];
    const pages = getAllPageCards();
    pages.forEach(page => { IDs.push(page.id); });
    return IDs;
}
function createSliderButtonListeners(container) {
    const sliders = container.querySelectorAll(".slider-button");
    if (sliders) {
        sliders.forEach(button => {
            button.addEventListener("click", function () {
                button.classList.toggle("active");
                if (button.classList.contains("prop-multiselect")) {
                    button.closest(".card.component-card").classList.toggle("multiselect");
                }
                if (button.classList.contains("prop-isDiagnosisPage")) {
                    button.closest(".page-card").classList.toggle("diagnosis-page");
                }
            });
        });
    }
}
function createGotoButtonListeners(container) {
    const buttons = container.querySelectorAll(".goto-button");
    if (buttons) {
        buttons.forEach(button => {
            button.addEventListener("click", function () {
                const target = button.previousElementSibling.value;
                selectedCard = target;
                updateSelectedCard();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }
}
function updateAllDropDowns() {
    const dropdowns = document.querySelectorAll(".drop-down.link-selector");
    const IDs = getAllPageIDs();
    dropdowns.forEach(dropdown => updateDropDown(dropdown, IDs));
}
function updateContainedDropDowns(container, IDs) {
    const dropdowns = container.querySelectorAll(".drop-down.link-selector");
    if (dropdowns) {
        dropdowns.forEach(dropdown => {
            updateDropDown(dropdown, IDs);
        });
    }
}
function updateDropDown(dropdown, values, value) {
    const previous = value || dropdown.value;
    dropdown.innerHTML = "";
    for (let i = 0; i < values.length; i++) {
        const option = document.createElement("option");
        const target = document.getElementById(values[i]);
        const title = target === null || target === void 0 ? void 0 : target.querySelector("h1").textContent;
        option.value = values[i];
        option.innerHTML = `${title} (${values[i]})`;
        dropdown.appendChild(option);
    }
    if (previous) {
        dropdown.value = previous;
    }
}
function allowDrop(evt) {
    evt.preventDefault();
}
function drag(evt) {
    evt.dataTransfer.setData("component", evt.target.parentNode.id);
}
function drop(evt, target, before) {
    evt.preventDefault();
    const id = evt.dataTransfer.getData("component");
    const component = document.getElementById(id);
    const targetComponent = evt.target.closest(target);
    const pageCard = targetComponent.parentNode;
    const parts = component.id.split(".");
    component.id = `${pageCard.id}.${parts[1]}.${componentID++}`;
    if (before) {
        pageCard.insertBefore(component, targetComponent);
    }
    else {
        pageCard.insertBefore(component, targetComponent.nextSibling);
    }
}
function dropBefore(evt) {
    drop(evt, ".card.component-card", true);
}
function dropAfter(evt) {
    drop(evt, ".card.settings-card", false);
}
function populatePageOnStartup() {
    const urlParams = new URLSearchParams(window.location.search);
    const blankFlow = urlParams.get("blank");
    const workflowName = urlParams.get("workflow");
    const versionNumber = urlParams.get("version");
    if (blankFlow) {
        return;
    }
    if (workflowName) {
        fetchWorkflow(workflowName, versionNumber);
    }
    else {
        const dummyWorkflow = {
            name: "New Workflow",
            pages: [
                {
                    pageID: "page_1",
                    title: "First Page",
                    defaultLink: "page_2",
                    content: [],
                },
                {
                    pageID: "page_2",
                    title: "Second Page",
                    defaultLink: "page_3",
                    content: [],
                },
                {
                    pageID: "page_3",
                    title: "Diagnosis Page",
                    isDiagnosisPage: true,
                    content: [],
                },
            ]
        };
        importWorkflow(dummyWorkflow);
    }
}
function triggerFileImport() {
    const importer = document.getElementById("importer");
    importer.value = null;
    importer.click();
}
function prepareReader() {
    const importer = document.getElementById("importer");
    const reader = new FileReader();
    reader.onload = getJSON;
    reader.readAsText(importer.files[0]);
}
function getJSON(event) {
    let json;
    if (typeof event.target.result === "string") {
        json = JSON.parse(event.target.result);
    }
    else {
        json = String.fromCharCode.apply(null, new Uint8Array(event.target.result));
    }
    importWorkflow(json);
}
function promptAndFetchWorkflow() {
    const name = prompt("Please enter the name of the workflow to import: (case sensitive)");
    if (name == null || name == "") {
        return;
    }
    fetchWorkflow(name);
}
function fetchWorkflow(name, version) {
    console.log("Attempting to get from:", baseUrl);
    let target = baseUrl + "/alrite/apis/workflows/" + name + "/";
    if (version) {
        target += version + "/";
    }
    fetch(target, {
        method: "GET",
        headers: {
            "Accept": "application/json",
        },
    })
        .then(res => res.json())
        .then(res => importWorkflow(res));
}
function importWorkflow(json) {
    const pages = json.pages;
    if (!pages || !json.name) {
        return;
    }
    updateDisplayName(json.name);
    const old = getAllPageCards();
    old.forEach(card => card.remove());
    const IDs = [];
    pages.forEach((page) => {
        IDs.push(page.pageID);
    });
    pages.forEach((page) => {
        const components = [];
        for (let i = 0; i < page.content.length; i++) {
            const props = page.content[i];
            const type = props.component;
            delete props.component;
            const component = createComponent(type, page.pageID, i, page.content[i], IDs);
            components.push(component);
        }
        addPageCard(page.pageID, page.title, page.isDiagnosisPage, page.defaultLink, IDs, components);
    });
    updateAllDropDowns();
}
function exportWorkflow() {
    const name = prompt("Please enter the name to export the workflow as: (case sensitive)");
    if (name == null || name == "") {
        return;
    }
    const cards = getAllPageCards();
    const workflow = {
        name: name,
        pages: [],
    };
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const data = extractPageCard(card);
        workflow.pages.push(data);
    }
    console.log("Final workflow:\n", workflow);
    console.log("Attempting to post to:", baseUrl);
    fetch(baseUrl + "/alrite/apis/workflows/" + workflow.name + "/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(workflow)
    })
        .then(res => res.json())
        .then(json => handleValidation(json));
    updateDisplayName(name);
}
function handleValidation(response) {
    for (let i = 0; i < response.pages.length; i++) {
        const page = response.pages[i];
        displayValidationData(page);
    }
}
function displayValidationData(page) {
    const card = document.getElementById(page.pageID);
    const settings = card.querySelector(".settings-card-fields");
    if (page.defaultLink) {
        const defaultLink = settings.querySelector(".prop-defaultLink");
        markPropInvalid(defaultLink, page.defaultLink);
        card.querySelector(".settings-card").classList.add("validation-invalid");
    }
    const components = card.querySelectorAll(".card.component-card");
    for (let i = 0; i < components.length; i++) {
        const validation = page.content[i];
        const props = components[i].querySelector(".component-card-fields").querySelectorAll(".prop-input");
        props.forEach(prop => {
            const input = prop.querySelector("input") || prop.querySelector("select") || prop.querySelector(".slider-button");
            const propName = getPropName(input);
            if (validation[propName]) {
                markPropInvalid(input, validation[propName]);
                components[i].classList.add("validation-invalid");
            }
        });
    }
}
function extractPageCard(card) {
    const page = {
        pageID: card.id,
        title: card.querySelector("h1").textContent,
        content: [],
    };
    const settings = card.querySelector(".settings-card-fields");
    const defaultLink = settings.querySelector(".prop-defaultLink");
    page.defaultLink = defaultLink.value;
    const isDiagnosisPage = settings.querySelector(".prop-isDiagnosisPage");
    page.isDiagnosisPage = isDiagnosisPage.classList.contains("active");
    if (!page.isDiagnosisPage) {
        const components = card.querySelectorAll(".card.component-card");
        components.forEach(component => {
            const props = component.querySelector(".component-card-fields").querySelectorAll(".prop-input");
            const type = component.id.split(".")[1];
            const values = extractProps(props);
            const subcomponents = component.querySelectorAll(".sub-card.component-card");
            const choices = [];
            subcomponents.forEach(subcomponent => {
                const subprops = subcomponent.querySelectorAll(".prop-input");
                const subvalues = extractProps(subprops);
                choices.push(subvalues);
            });
            if (choices.length) {
                values["choices"] = choices;
            }
            page.content.push(createObjectFromProps(type, values));
        });
    }
    return page;
}
function extractProps(props) {
    const values = {};
    props.forEach(prop => {
        const input = prop.querySelector("input") || prop.querySelector("select");
        if (input) {
            const propName = getPropName(input);
            values[propName] = input.value;
        }
        else {
            const slider = prop.querySelector(".slider-button");
            const propName = getPropName(slider);
            values[propName] = slider.classList.contains("active");
        }
    });
    return values;
}
function createObjectFromProps(type, values) {
    const component = {};
    for (const [key, value] of Object.entries(values)) {
        if (value !== undefined && value !== "")
            component[key] = value;
    }
    component.component = type;
    return component;
}
function getPropName(propInput) {
    return propInput.classList[0].slice(5);
}
function markPropInvalid(propInput, errorMessage) {
    propInput.parentElement.classList.add("validation-invalid");
    propInput.parentElement.style.setProperty('--error-message', `'${errorMessage}'`);
}
function updateDisplayName(workflowName) {
    document.getElementById("utility-section").style.setProperty("--workflow-name", `'${workflowName}'`);
}
//# sourceMappingURL=index.js.map