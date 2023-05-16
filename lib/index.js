define("components", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.documentation = void 0;
    exports.documentation = {
        "Page": {
            "defaultLink": 'By default each page has two buttons, "Next" and "Prev". The page "Next" sends to may depend on logic in the page. If no logic is triggered, defaultLink is the destination.<br><br>However, LogicComponents trigger when "Next" is pressed and can override this defaultLink. If there are multiple LogicComponents, tiebreaking if multiple are satisfied is done based on order (highest on page has highest precedence).',
            "isDiagnosisPage": "After all data has been collected, there is a special page displaying all the collected information and diagnoses. There should be only one page that is the diagnosis page. This page has no components.",
        },
        "Paragraph": {
            "text": "The paragraph text content."
        },
        "MediaItem": {
            "fileName": "The file name of the image or video to display.<br>This will have to be uploaded to the workflow via the admin page.",
            "label": "Optional text to display underneath the image or video."
        },
        "MultipleChoice": {
            "label": "Text prompt indicating what the nurse should input.",
            "valueID": "Unique id for the input value for this page component. This will also be the name of the corresponding column in the patient database.",
            "multiselect": "If true, multiple choice can be selected, so the choices will be checkboxes. Otherwise, only one option may be selected, so the choices will be radio buttons.",
        },
        "Choice": {
            "text": "The text this choice displays, indicating when to select.",
            "value": "The value associated with selecting this choice (can be the same or different to text). You might want this to be different if some logic is done based on this choice.",
            "link": "The pageID that should this choice should link to if selected. Not valid if the multiple choice component has multiselect enabled.",
        },
        "TextInput": {
            "label": "Text prompt indicating what the nurse should input.",
            "type": 'Type of input to accept, e.g. "numeric", "alphanumeric", "text", "any".<br><br>Default is the same as text and means alphabetical character input only, no numbers. Any means no restrictions.',
            "valueID": "Unique id for the input value for this page component. This will also be the name of the corresponding column in the patient database.",
            "units": 'If provided, displayed next to the TextInput, e.g. "cm".',
            "defaultValue": "Default value to the text input should start off with. The type of this depends on type property.",
        },
        "Button": {
            "text": 'Text displayed inside the button, should indicate what happens on press.<br>E.g. "Next Page", "Skip", "Previous", etc.',
            "hint": "Displayed above the button, should describe in more detail when/why to press.",
            "link": "The pageID of the page this button will open on press.",
        },
        "Counter": {
            "title": "Text prompt displayed above the counter, indicating what is being counted.",
            "hint": "Optional supplement to the title indicating in more detail what should be input, displayed underneath the title.",
            "timeLimit": "Duration over which the counting should take place, given in seconds.",
            "valueID": "Unique id for the input value for this page component. This will also be the name of the corresponding column in the patient database.",
            "offerManualInput": "Whether or not the nurse should be able to bypass the counting process and simply type in a value.",
        },
        "Comparison": {
            "type": `The type of comparison to be done. The left side of the operation will be the target value, and the right will be the threshold. For example:<br><br>If type is ">" threshold is 40 and targetValueID is "value_01", then the comparison would be: is value_01's value > 40?`,
            "threshold": "Threshold the target value will be compared to.",
            "targetValueID": "Unique id for some input value in another component on this page. This value will be checked against the threshold.",
            "satisfiedLink": 'On pressing the "Next" button, if the target value satisfies the threshold, the page that should be navigated to.',
        },
        "Selection": {
            "type": 'The type of comparison to be done. Valid types include:<br>"all_selected", "at_least_one", "exactly_one", "none_selected"',
            "targetValueID": "Unique id for some input value in another component on this page. This value will be checked against the threshold.",
            "satisfiedLink": 'On pressing the "Next" button, if the target value satisfies the selection type, the page that should be navigated to.',
        },
        "Validation": {
            "type": `The type of comparison to be done. The left side of the operation will be the target value, and the right will be the threshold. For example:<br><br>If type is ">" threshold is 40 and targetValueID is "value_01", then the comparison would be: is value_01's value > 40?`,
            "threshold": "Threshold the target value will be compared to.",
            "targetValueID": "Unique id for some input value in another component on this page. This value will be checked against the threshold.",
        },
    };
});
define("index", ["require", "exports", "components"], function (require, exports, components_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    window.addEventListener("load", init);
    var body = null;
    var selectedCard = null;
    var darkMode = false;
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
        body = document.querySelector("body");
        document.getElementById("add-page-button").addEventListener("click", addNewPage);
        document.getElementById("export-button").addEventListener("click", function () { postWorkflow(false); });
        document.getElementById("validate-button").addEventListener("click", function () { postWorkflow(true); });
        document.getElementById("toggle-menu-button").addEventListener("click", toggleUtilMenu);
        document.getElementById("rename-button").addEventListener("click", promptWorkflowName);
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
            const xPosition = newSelected.getBoundingClientRect().left + window.scrollX;
            const windowHeight = window.innerWidth || document.documentElement.clientWidth;
            window.scrollTo({ left: xPosition - (windowHeight / 3), behavior: 'smooth' });
        }
    }
    function toggleUtilMenu() {
        document.getElementById("utility-section").classList.toggle("minimized");
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
            content += `${components_1.documentation[componentType][propType]}`;
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
            const title = target?.querySelector("h1").textContent;
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
        let name = promptWorkflowName();
        if (name == null || name == "") {
            return;
        }
        name = name.replace(/ /g, "_");
        fetchWorkflow(name);
    }
    function fetchWorkflow(name, version) {
        let target = "/alrite/apis/workflows/" + name + "/";
        if (version) {
            target += version + "/";
        }
        console.log("Attempting to get from:", target);
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
        updateAllDropDowns();
    }
    function postWorkflow(onlyValidate) {
        let name = getDisplayName();
        if (!onlyValidate && !name) {
            name = prompt("Please enter the name to export the workflow as: (case sensitive)");
            if (name == null || name == "") {
                return;
            }
        }
        name = name.replace(/ /g, "_");
        name = name.replace(/'/g, "");
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
        const endpoint = onlyValidate ? "validation" : "workflows/" + workflow.name;
        console.log("Attempting to post to:", "/alrite/apis/" + endpoint + "/");
        fetch("/alrite/apis/" + endpoint + "/", {
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
        const invalid = document.querySelectorAll(".validation-invalid");
        invalid.forEach(elem => elem.classList.remove("validation-invalid"));
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
                const input = getPropInput(prop) || prop.querySelector(".slider-button");
                const propName = getPropName(input);
                if (validation[propName]) {
                    markPropInvalid(input, validation[propName]);
                    components[i].classList.add("validation-invalid");
                }
            });
        }
    }
    function promptWorkflowName() {
        let name = prompt("Please enter a name for the diagnosis workflow: (case sensitive)");
        name = name?.replace(/ /g, "_");
        name = name?.replace(/'/g, "");
        if (name)
            updateDisplayName(name);
        return name;
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
    function getComponentInfo(component) {
        return {
            parentPageID: component.id.split(".")[0],
            type: component.id.split(".")[1],
        };
    }
});
