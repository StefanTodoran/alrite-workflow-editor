import { documentation } from "./components.js";
window.addEventListener("load", init);
var selectedCard = null;
var darkMode = false;
var menuOpen = false;
var componentID = 0;
var templates = {
    "TextInput": "template-text-input-component",
    "MultipleChoice": "template-multiple-choice-component",
    "MediaItem": "template-media-item-component",
    "Paragraph": "template-paragraph-component",
    "Button": "template-button-component",
    "Counter": "template-counter-component",
    "Comparison": "template-comparison-component",
    "Selection": "template-selection-component",
    "Validation": "template-validation-component",
};
function init() {
    handleMenuPreference();
    handleDarkModePreference();
    setTimeout(() => document.body.classList.add("do-transition"), 10);
    addButtonOnClick("add-page-button", addNewPage);
    addButtonOnClick("toggle-menu-button", toggleUtilMenu);
    addButtonOnClick("export-button", () => { postWorkflow(false, "Uploading Workflow..."); });
    addButtonOnClick("validate-button", () => { postWorkflow(true); });
    addButtonOnClick("file-import-button", triggerFileImport);
    document.getElementById("importer").addEventListener("input", prepareReader);
    addButtonOnClick("file-download-button", downloadToFile);
    addButtonOnClick("light-mode-button", toggleDarkMode);
    addButtonOnClick("dark-mode-button", toggleDarkMode);
    addButtonOnClick("go-back-button", () => { window.location.href = ".."; });
    setTimeout(() => {
        window.onbeforeunload = () => { return true; };
    }, 5000);
    addEventListener("mousemove", updateTooltip);
    populatePageOnStartup();
    initializeModal();
}
function addNewPage() {
    const page = {
        pageID: createUniqueID(5),
        title: "Blank Page",
        content: [],
    };
    addPageCard(page.pageID, page.title);
    updatePageCardMoveButtons();
    updateAllDropDowns();
    window.scrollTo({
        left: document.body.scrollWidth,
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
    titleElement.addEventListener("input", () => {
        updateAllDropDowns();
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
    });
    createButtonClickEvent(card, ".move-left-button", function (evt) {
        document.body.insertBefore(card, card.previousSibling);
        updatePageCardMoveButtons();
        evt.stopPropagation();
    });
    createButtonClickEvent(card, ".move-right-button", function (evt) {
        document.body.insertBefore(card, card.nextSibling.nextSibling);
        updatePageCardMoveButtons();
        evt.stopPropagation();
    });
    createButtonClickEvent(card, ".delete-button", function (evt) {
        if (window.confirm(`Are you sure you want to delete "${card.id}"?`)) {
            document.body.removeChild(card);
            updatePageCardMoveButtons();
            updateAllDropDowns();
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
    document.body.insertBefore(card, addButton);
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
    const comparisonPreview = component.querySelector(".comparison-logic-preview");
    if (comparisonPreview) {
        const typeInput = component.querySelector(".prop-type");
        const targetValueIDInput = component.querySelector(".prop-targetValueID");
        const thresholdInput = component.querySelector(".prop-threshold");
        typeInput.addEventListener("input", () => { updateComparisonPreview(component); });
        thresholdInput.addEventListener("input", () => { updateComparisonPreview(component); });
        targetValueIDInput.addEventListener("input", () => { updateComparisonPreview(component); });
    }
    updateContainedDropDowns(component, pageIDs);
    createGotoButtonListeners(component);
    createSliderButtonListeners(component);
    if (props) {
        populateComponentFields(component, props, pageIDs);
        updateComparisonPreview(component);
    }
    return component;
}
function createChoiceSubComponent(pageIDs) {
    const choice = getTemplateCopy("template-choice-component");
    choice.id = `.Choice.${componentID}`;
    componentID++;
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
        else if (key === "multiselect") {
            const prop = fields.querySelector(`.prop-${key}`);
            if (value) {
                prop.classList.add("active");
                component.classList.add("multiselect");
            }
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
    if (newSelected) {
        scrollToCard(newSelected);
    }
}
function scrollToCard(card) {
    const xPosition = card.getBoundingClientRect().left + window.scrollX;
    const windowHeight = window.innerWidth || document.documentElement.clientWidth;
    window.scrollTo({ top: 0, left: xPosition - (windowHeight / 3), behavior: 'smooth' });
}
function updateTooltip(evt) {
    const tooltip = document.getElementById("tooltip");
    const hovered = this.document.querySelectorAll(":hover");
    const current = hovered[hovered.length - 1];
    let content = undefined;
    const infoButton = current.closest(".info-button");
    if (infoButton) {
        const propType = getPropName(infoButton.nextElementSibling);
        let componentType;
        if (current.closest(".component-card")) {
            componentType = getComponentInfo(current.closest(".component-card")).type;
        }
        if (current.closest(".settings-card")) {
            componentType = "Page";
        }
        content = `<p class="tooltip">(${propType})</p>`;
        content += `${documentation[componentType][propType]}`;
    }
    const utilButton = current.closest(".util-button");
    if (utilButton)
        content = utilButton.style.getPropertyValue('--label');
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
function displayInfoMessage(text) {
    document.getElementById("info-container").classList.add("active");
    document.getElementById("info-message").innerText = text;
}
function hideInfoMessage(seconds) {
    seconds = isNaN(seconds) ? 0.75 : Math.max(seconds, 0.75);
    setTimeout(() => {
        document.getElementById("info-container").classList.remove("active");
    }, seconds * 1000);
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
function addButtonOnClick(id, func) {
    document.getElementById(id).addEventListener("click", func);
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
                if (target !== "null") {
                    selectedCard = target;
                    updateSelectedCard();
                }
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
    if (dropdown.classList.contains("optional")) {
        const option = document.createElement("option");
        option.value = null;
        option.innerHTML = "none";
        dropdown.appendChild(option);
    }
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
function updateComparisonPreview(component) {
    const comparisonPreview = component.querySelector(".comparison-logic-preview");
    if (comparisonPreview) {
        const typeInput = component.querySelector(".prop-type");
        const targetValueIDInput = component.querySelector(".prop-targetValueID");
        const thresholdInput = component.querySelector(".prop-threshold");
        if (typeInput.value && targetValueIDInput.value && thresholdInput.value) {
            comparisonPreview.innerText = typeInput.value;
            comparisonPreview.style.setProperty("--targetValueID", `'${targetValueIDInput.value}'`);
            comparisonPreview.style.setProperty("--threshold", `'${thresholdInput.value}'`);
            comparisonPreview.classList.add("active");
        }
        else {
            comparisonPreview.classList.remove("active");
        }
    }
}
function highlightDraggablePage(card) {
    const highlighted = document.querySelectorAll(".allow-drop");
    highlighted.forEach((page) => {
        page.classList.remove("allow-drop");
    });
    card === null || card === void 0 ? void 0 : card.classList.add("allow-drop");
}
function highlightDraggableComponent(card, before) {
    const highlighted = [...document.querySelectorAll(".allow-drop-before"), ...document.querySelectorAll(".allow-drop-after")];
    highlighted.forEach((page) => {
        page.classList.remove("allow-drop-before");
        page.classList.remove("allow-drop-after");
    });
    card === null || card === void 0 ? void 0 : card.classList.add(before ? "allow-drop-before" : "allow-drop-after");
}
function createUniqueID(length) {
    let result = "id_";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
function handleMenuPreference() {
    if (getCookieValue("menuOpen") === "true") {
        toggleUtilMenu();
    }
}
function handleDarkModePreference() {
    if (getCookieValue("darkMode") === "true") {
        darkMode = true;
    }
    else if (getCookieValue("darkMode") === "false") {
        darkMode = false;
    }
    else {
        darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    updateDarkMode();
}
function getCookieValue(key) {
    var _a;
    const value = (_a = document.cookie
        .split("; ")
        .find((row) => row.startsWith(key + "="))) === null || _a === void 0 ? void 0 : _a.split("=")[1];
    return value;
}
function setCookieValue(key, value, age) {
    age = age || 31536000;
    const cookie = `${key}=${value}; max-age=${age}; SameSite=None; path=/; Secure`;
    document.cookie = cookie;
}
function toggleDarkMode() {
    darkMode = !darkMode;
    setCookieValue("darkMode", darkMode);
    updateDarkMode();
}
function toggleUtilMenu() {
    menuOpen = !menuOpen;
    setCookieValue("menuOpen", menuOpen);
    document.getElementById("utility-section").classList.toggle("minimized");
}
function updateDarkMode() {
    if (darkMode) {
        document.body.classList.add("darkMode");
        document.getElementById("light-mode-button").classList.add("hidden");
        document.getElementById("dark-mode-button").classList.remove("hidden");
    }
    else {
        document.body.classList.remove("darkMode");
        document.getElementById("dark-mode-button").classList.add("hidden");
        document.getElementById("light-mode-button").classList.remove("hidden");
    }
}
const modal = document.getElementById("modal");
var modalSeqNum = 0;
function initializeModal() {
    addButtonOnClick("modal-cancel-button", () => {
        modal.dispatchEvent(new Event("cancel"));
        modal.close();
        modalSeqNum++;
    });
    addButtonOnClick("modal-confirm-button", () => {
        modal.dispatchEvent(new Event("confirm"));
        modal.close();
        modalSeqNum++;
    });
    modal.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter") {
            modal.dispatchEvent(new Event("confirm"));
            modal.close();
            modalSeqNum++;
        }
    });
    addButtonOnClick("import-button", handleServerImport);
    addButtonOnClick("rename-button", promptWorkflowName);
}
function openModal(modalMode) {
    modal.showModal();
    switch (modalMode) {
        case "server_import":
            modal.querySelector("h1").textContent = "Server Import";
            modal.querySelector("h2").textContent = "Select Workflow";
            modal.querySelector("input").classList.add("hidden");
            modal.querySelector("select").classList.remove("hidden");
            break;
        case "rename_workflow":
            modal.querySelector("h1").textContent = "Name Workflow";
            modal.querySelector("h2").textContent = "Enter Name";
            modal.querySelector("input").classList.remove("hidden");
            modal.querySelector("select").classList.add("hidden");
            break;
    }
}
function handleServerImport() {
    openModal("server_import");
    populateModalOptions();
    const curSeqNum = modalSeqNum;
    modal.addEventListener("confirm", () => {
        if (curSeqNum === modalSeqNum) {
            const select = modal.querySelector("select");
            const name = select.value;
            history.pushState("", "", `/editor/?workflow=${name}`);
            fetchWorkflow(name);
        }
    }, { once: true });
}
async function populateModalOptions() {
    const select = modal.querySelector("select");
    select.innerHTML = "";
    const workflows = await fetchAllWorkflowNames();
    workflows.forEach((workflow) => {
        const option = document.createElement("option");
        option.value = workflow.workflow_id;
        option.innerHTML = workflow.workflow_id.replace(/_/g, " ");
        select.appendChild(option);
    });
}
function promptWorkflowName() {
    openModal("rename_workflow");
    const curSeqNum = modalSeqNum;
    return new Promise(function (resolve) {
        modal.addEventListener("confirm", () => {
            if (curSeqNum === modalSeqNum) {
                let name = modal.querySelector("input").value;
                name = getCleanWorkflowName(name);
                if (name)
                    updateDisplayName(name);
                resolve(name);
            }
        }, { once: true });
        modal.addEventListener("cancel", () => {
            if (curSeqNum === modalSeqNum)
                resolve(null);
        }, { once: true });
    });
}
export function allowComponentDrop(evt) {
    if (evt.target.closest(".page-card").classList.contains("diagnosis-page"))
        return;
    if (!evt.dataTransfer.getData("component"))
        return;
    const settings = evt.target.closest(".settings-card");
    const highlight = evt.target.closest(".card.component-card") || settings;
    const starty = evt.dataTransfer.getData("starty");
    highlightDraggableComponent(highlight, (evt.clientY - starty < 0 && !settings));
    evt.preventDefault();
}
export function allowPageDrop(evt) {
    if (evt.dataTransfer.getData("page")) {
        highlightDraggablePage(evt.target.closest(".page-card"));
        evt.preventDefault();
    }
}
export function dragComponent(evt) {
    evt.dataTransfer.setData("starty", evt.clientY);
    evt.dataTransfer.setData("component", evt.target.parentNode.id);
}
export function dragPage(evt) {
    evt.dataTransfer.setData("startx", evt.clientX + window.scrollX);
    evt.dataTransfer.setData("page", evt.target.closest(".page-card").id);
    selectedCard = null;
    updateSelectedCard();
}
export function dropComponent(evt) {
    const id = evt.dataTransfer.getData("component");
    if (!id) {
        return;
    }
    const component = document.getElementById(id);
    const targetComponent = evt.target.closest(".card.component-card") || evt.target.closest(".card.settings-card");
    const pageCard = targetComponent.parentNode;
    const parts = component.id.split(".");
    component.id = `${pageCard.id}.${parts[1]}.${componentID++}`;
    const starty = evt.dataTransfer.getData("starty");
    if (evt.clientY - starty < 0 && !evt.target.closest(".card.settings-card")) {
        pageCard.insertBefore(component, targetComponent);
    }
    else {
        pageCard.insertBefore(component, targetComponent.nextSibling);
    }
    highlightDraggableComponent(null);
    evt.preventDefault();
}
export function dropPage(evt) {
    const id = evt.dataTransfer.getData("page");
    if (!id) {
        return;
    }
    const page = document.getElementById(id);
    const target = evt.target.closest(".page-card");
    const startx = evt.dataTransfer.getData("startx");
    const currx = evt.clientX + window.scrollX;
    if (currx - startx < 0) {
        document.body.insertBefore(page, target);
    }
    else {
        document.body.insertBefore(page, target.nextSibling);
    }
    highlightDraggablePage(null);
    evt.preventDefault();
}
export function onDragEnd() {
    highlightDraggableComponent(null);
    highlightDraggablePage(null);
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
                    defaultLink: "diag_page",
                    content: [],
                },
                {
                    pageID: "diag_page",
                    title: "Diagnosis Page",
                    isDiagnosisPage: true,
                    content: [],
                },
            ]
        };
        importWorkflow(dummyWorkflow, true);
    }
}
async function downloadToFile() {
    const workflow = await extractWorkflowData(true);
    if (!workflow)
        return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workflow));
    const downloader = document.getElementById("downloader");
    downloader.setAttribute("href", dataStr);
    downloader.setAttribute("download", `${workflow.name}.json`);
    downloader.click();
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
    try {
        if (typeof event.target.result === "string") {
            json = JSON.parse(event.target.result);
        }
        else {
            json = String.fromCharCode.apply(null, new Uint8Array(event.target.result));
        }
    }
    catch (_a) {
        displayInfoMessage("Import Failed: Check File Type");
        hideInfoMessage();
    }
    importWorkflow(json);
}
async function fetchAllWorkflowNames() {
    let target = "/apis/workflows/";
    const res = await fetch(target, {
        method: "GET",
        headers: {
            "Accept": "application/json",
        },
    });
    const json = await res.json();
    return json;
}
function fetchWorkflow(name, version) {
    let target = "/apis/workflows/" + name + "/";
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
function importWorkflow(json, dummy) {
    const pages = json.pages;
    if (!pages || (!dummy && !json.name)) {
        displayInfoMessage("Import Failed");
        hideInfoMessage();
        return;
    }
    if (json.name)
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
    updatePageCardMoveButtons();
    updateAllDropDowns();
}
async function postWorkflow(onlyValidate, infoMessage) {
    const workflow = await extractWorkflowData(!onlyValidate);
    if (!workflow) {
        displayInfoMessage("Upload Failed: No Name");
        hideInfoMessage();
        return;
    }
    if (!onlyValidate)
        history.pushState("", "", `/editor/?workflow=${workflow.name}`);
    const csrftoken = getCookieValue("csrftoken");
    const endpoint = onlyValidate ? "validation" : "workflows/" + workflow.name;
    infoMessage && displayInfoMessage(infoMessage);
    fetch("/apis/" + endpoint + "/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify(workflow)
    })
        .then(async (res) => {
        let data = await res.json();
        if (typeof data === "string")
            data = JSON.parse(data);
        handleValidation(data, res.status);
    });
    updateDisplayName(workflow.name);
    hideInfoMessage();
}
function handleValidation(response, status) {
    const invalid = document.querySelectorAll(".validation-invalid");
    invalid.forEach(elem => elem.classList.remove("validation-invalid"));
    if (status === 200) {
        displayInfoMessage("No Errors Found!");
        hideInfoMessage();
    }
    else {
        displayInfoMessage(response.status || "Check Errors And Try Again");
        hideInfoMessage();
    }
    if (status === 400) {
        for (let i = 0; i < response.pages.length; i++) {
            const page = response.pages[i];
            displayPageValidationData(page);
        }
        if (response.firstInvalidPage) {
            const firstInvalid = document.getElementById(response.firstInvalidPage);
            scrollToCard(firstInvalid);
        }
    }
}
function displayPageValidationData(page) {
    var _a;
    const card = document.getElementById(page.pageID);
    const settings = card.querySelector(".settings-card-fields");
    if (page.pageError) {
        const pageError = card.querySelector(".page-error-container");
        pageError.textContent = page.pageError;
        pageError.classList.add("validation-invalid");
        card.querySelector(".settings-card").classList.add("validation-invalid");
    }
    if (page.defaultLink) {
        const defaultLink = settings.querySelector(".prop-defaultLink");
        markPropInvalid(defaultLink, page.defaultLink);
        card.querySelector(".settings-card").classList.add("validation-invalid");
    }
    const components = card.querySelectorAll(".card.component-card");
    for (let i = 0; i < components.length; i++) {
        const validation = page.content[i];
        if (!validation)
            continue;
        displayComponentValidationData(components[i], validation);
        const choices = (_a = components[i].querySelector(".card-subcomponents")) === null || _a === void 0 ? void 0 : _a.querySelectorAll(".sub-card");
        let choiceIndex = 0;
        choices && choices.forEach(choice => {
            const choiceValidation = validation["choices"][choiceIndex];
            displayComponentValidationData(choice, choiceValidation);
            choiceIndex++;
        });
    }
}
function displayComponentValidationData(component, validation) {
    const props = component.querySelector(".component-card-fields").querySelectorAll(".prop-input");
    props.forEach(prop => {
        const input = getPropInput(prop) || prop.querySelector(".slider-button");
        const propName = getPropName(input);
        if (validation[propName]) {
            markPropInvalid(input, validation[propName]);
            component.classList.add("validation-invalid");
        }
    });
}
async function extractWorkflowData(needsName) {
    let name = getDisplayName();
    if (needsName && !name)
        name = await promptWorkflowName();
    name = getCleanWorkflowName(name);
    if (needsName && !name)
        return null;
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
    return workflow;
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
            const type = getComponentInfo(component).type;
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
        const input = getPropInput(prop);
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
function getPropInput(prop) {
    return prop.querySelector("input") || prop.querySelector("select") || prop.querySelector("textarea");
}
function getPropName(propInput) {
    return propInput.classList[0].slice(5);
}
function markPropInvalid(propInput, errorMessage) {
    propInput.parentElement.classList.add("validation-invalid");
    propInput.parentElement.style.setProperty('--error-message', `'${errorMessage}'`);
}
function updateDisplayName(workflowName) {
    document.getElementById("utility-section").style.setProperty("--workflow-name", `'${workflowName.replace(/_/g, " ")}'`);
}
function getDisplayName() {
    return document.getElementById("utility-section").style.getPropertyValue("--workflow-name");
}
function getCleanWorkflowName(name) {
    name = name === null || name === void 0 ? void 0 : name.replace(/ /g, "_");
    name = name === null || name === void 0 ? void 0 : name.replace(/'/g, "");
    name = name === null || name === void 0 ? void 0 : name.replace(/\W/g, "");
    return name;
}
function getComponentInfo(component) {
    return {
        parentPageID: component.id.split(".")[0],
        type: component.id.split(".")[1],
    };
}
