import { Components, documentation } from "./components";

window.addEventListener("load", init);

var body: HTMLElement = null; // Just a nice shorthand to have
var selectedCard: string = null; // The currently selected page card
var darkMode: boolean = false;
var componentID = 0; // Used to ensure unique component ids in the HTML

var templates: { [key: string]: string } = {
  // Page Components
  "TextInput": "template-text-input-component",
  "MultipleChoice": "template-multiple-choice-component",
  "MediaItem": "template-media-item-component",
  "Paragraph": "template-paragraph-component",
  "Button": "template-button-component",
  "Counter": "template-counter-component",

  // Logic Components
  "Comparison": "template-comparison-component",
  "Selection": "template-selection-component",
}

/**
 * Initialization function that should handle anything that needs to occur on page load.
 */
function init() {
  body = document.querySelector("body");

  document.getElementById("add-page-button").addEventListener("click", addNewPage);

  document.getElementById("export-button").addEventListener("click", function () { postWorkflow(false) });
  document.getElementById("validate-button").addEventListener("click", function () { postWorkflow(true) });

  document.getElementById("import-button").addEventListener("click", promptAndFetchWorkflow);
  document.getElementById("file-import-button").addEventListener("click", triggerFileImport);
  document.getElementById("importer").addEventListener("input", prepareReader);

  // Handling dark mode
  darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.getElementById("light-mode-button").addEventListener("click", toggleDarkMode);
  document.getElementById("dark-mode-button").addEventListener("click", toggleDarkMode);
  updateDarkMode();

  addEventListener("mousemove", updateTooltip);

  // Adds a confirmation prompt if the user attempts to
  // close the tab or go back, so changes aren't lost.
  window.onbeforeunload = () => { return true; };

  populatePageOnStartup();
}

// let newPageIndex = 1;
function addNewPage() {
  const page = <Components.Page>{
    // pageID: `page_${newPageIndex}`,
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

/**
 * Creates and adds a page card to the DOM, before the add button.
 * Populates it with the id and title and adds event listeners.
 * 
 * REQUIRED:
 * @param id A unique string page identifier is required.
 * @param title The name of the page, this does not need to be unique.
 * 
 * OPTIONAL:
 * @param defaultLink Sets the page defaultLink prop dropdown to this value.
 * @param isDiagnosisPage Sets the page isDiagnosisPage slider button to this value.
 * @param overrideIDs Sets the page defaultLink prop dropdown to have these 
 * options (should be page IDs).
 * @param components An array of components created via createComponent() to pre 
 * add to the page component. Used when importing workflows.
 */
function addPageCard(id: string, title: string, isDiagnosisPage?: boolean, defaultLink?: string, overrideIDs?: string[], components?: HTMLElement[]) {
  const card = getTemplateCopy("template-page-card");
  card.id = id;

  const titleElement = card.querySelector("h1");
  titleElement.textContent = title;
  card.querySelector("h2").textContent = id;

  // We wish to avoid new lines in page titles, and we also
  // select the card for convenience. Also we don't want click through.
  titleElement.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter") {
      (document.activeElement as HTMLElement).blur();
      selectedCard = card.id;
      updateSelectedCard();
      evt.preventDefault();
    }
  });

  // TODO: Add event listener for titleElement updating dropdowns
  // if the name is changed!
  titleElement.addEventListener("input", () => {
    updateAllDropDowns();
  });

  // We don't want to allow the pasting of anything other than
  // plain text, and we wish to remove new line characters.
  titleElement.addEventListener("paste", (evt) => {
    let text = evt.clipboardData.getData('text/plain');
    text = text.replace(/(\n|\r)/g, "");
    titleElement.innerText = text;
    evt.preventDefault();
  });

  if (defaultLink && overrideIDs) {
    const defaultLinkSelect = card.querySelector(".prop-defaultLink") as HTMLSelectElement;
    updateDropDown(defaultLinkSelect, overrideIDs, defaultLink);
  }

  if (isDiagnosisPage) {
    const diagnosisSlider = card.querySelector(".prop-isDiagnosisPage");
    diagnosisSlider.classList.add("active");
    card.classList.add("diagnosis-page");
  }

  // Only selected cards can have their components edited.
  createButtonClickEvent(card, ".page-card-header", function () {
    selectedCard = selectedCard === card.id ? null : card.id;
    updateSelectedCard();
  });

  // These buttons are used to rearrange page cards, the order has no 
  // semantic meaning since intra-page navigation is done via links,
  // but this is useful for convenience of editing.
  createButtonClickEvent(card, ".move-left-button", function (evt) {
    body.insertBefore(card, card.previousSibling);
    updatePageCardMoveButtons();
    evt.stopPropagation(); // Otherwise, click goes through to parent (the card header)
  });
  createButtonClickEvent(card, ".move-right-button", function (evt) {
    body.insertBefore(card, card.nextSibling.nextSibling);
    updatePageCardMoveButtons();
    evt.stopPropagation();
  });

  // Prompts the user to double check they want to delete, then deletes.
  createButtonClickEvent(card, ".delete-button", function (evt) {
    if (window.confirm(`Are you sure you want to delete "${card.id}"?`)) {
      body.removeChild(card);
      updateAllDropDowns();
      updatePageCardMoveButtons();
    }
    evt.stopPropagation();
  });

  // This button creates a new component card. When the user selects what type of
  // component they want, that card is replaced by an empty card for that specific
  // component type. We also increment the ID to ensure unique HTML IDs for each component.
  const addComponent = card.querySelector(".add-component-button");
  addComponent.addEventListener("click", function () {
    const newComponent = getTemplateCopy("template-new-component");

    createButtonClickEvent(newComponent, ".create-component", function () {
      const typeInput = <HTMLInputElement>newComponent.querySelector(".component-type");
      addEmptyComponentToCard(typeInput.value, card, newComponent, componentID);

      addComponent.classList.remove("disabled");
      componentID++;
    });

    addComponent.classList.add("disabled"); // No new components until the current one is created.
    card.insertBefore(newComponent, addComponent);

    const yPosition = newComponent.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: yPosition, behavior: "smooth" });
  });

  // We do this before adding the components to not
  // double up on event listeners.
  createGotoButtonListeners(card);
  createSliderButtonListeners(card);

  if (components) {
    components.forEach(component => card.insertBefore(component, addComponent));
  }

  const addButton = document.getElementById("add-page-button");
  body.insertBefore(card, addButton);

  // To ensure the same index is never used twice.
  // newPageIndex++;
}

// Given a card, a component type, and the reference to the "new component" card
// which triggered this function call, creates a new empty component card of the
// specified type, then replaces the "new component" card with the empty component card.
function addEmptyComponentToCard(type: string, card: HTMLElement, creator: HTMLElement, id: number) {
  const component = createComponent(type, card.id, id);

  card.insertBefore(component, creator);
  card.removeChild(creator);

  const yPosition = component.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: yPosition, behavior: "smooth" });
}

/**
 * REQUIRED:
 * @param type The component type, name should match a component specified in components.ts
 * @param cardID The component's unique ID contains the parent card ID to ensure it is unique.
 * @param id A unique component number is also required.
 * 
 * OPTIONAL:
 * @param props A dictionary of key, value pairs to pre-fill the props of the component with.
 * @param overrideIDs Goto buttons in a component needs to know all existing page IDs in order to 
 * populate their corresponding <select> element. This can be an issue if the component is being built
 * before all pages have been built. This parameter can be used to get around this issue, by supplying
 * all page IDs in advance.
 */
function createComponent(type: string, cardID: string, id: number, props?: { [key: string]: any }, overrideIDs?: string[]) {
  const component = getTemplateCopy(templates[type]);
  component.id = `${cardID}.${type}.${id}`;

  createButtonClickEvent(component, ".delete-component-button", function () {
    if (window.confirm(`Are you sure you want to delete this "${type}" component?`)) {
      component.remove(); // We don't use card.removeChild() because the card parent can change!
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

function createChoiceSubComponent(pageIDs: string[]) {
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

/**
 * REQUIRED:
 * @param component Target component whose properties should be updated.
 * @param props A dictionary of prop names to values.
 * @param pageIDs Some component props need to know all pageIDs.
 */
function populateComponentFields(component: HTMLElement, props: { [key: string]: any }, pageIDs: string[]) {
  const fields = component.querySelector(".component-card-fields");

  for (const [key, value] of Object.entries(props)) {
    if (key === "choices") {
      const subComponentsContainer = component.querySelector(".card-subcomponents");
      const addButton = component.querySelector(".add-subcomponent-button");

      value.forEach((choice: any) => {
        const subcomponent = createChoiceSubComponent(pageIDs);
        populateComponentFields(subcomponent, choice, pageIDs);
        subComponentsContainer.insertBefore(subcomponent, addButton);
      });
    } else if (key === "multiselect") {
      const prop = fields.querySelector(`.prop-${key}`);

      if (value) {
        prop.classList.add("active");
        component.classList.add("multiselect");
      }
    } else {
      const prop = fields.querySelector(`.prop-${key}`) as (HTMLInputElement | HTMLSelectElement);
      prop.value = value;
    }
  }
}

// Updates the event listeners for ever page card, ensure the first page card 
// does not have move left enabled, nor the last card have more right enabled.
function updatePageCardMoveButtons() {
  const cards = getAllPageCards();

  cards.forEach((card, index) => {
    const moveLeft = card.querySelector(".move-left-button");
    const moveRight = card.querySelector(".move-right-button");

    if (index === 0) {
      moveLeft.classList.add("disabled");
    } else {
      moveLeft.classList.remove("disabled");
    }

    if (index === cards.length - 1) {
      moveRight.classList.add("disabled");
    } else {
      moveRight.classList.remove("disabled");
    }
  });
}

// When a card is selected to edit, run this function
// to update the css styles accordingly.
function updateSelectedCard() {
  const newSelected = document.getElementById(selectedCard);
  const allCards = document.querySelectorAll(".page-card");

  allCards.forEach(card => card.classList.remove("selected"));
  if (newSelected) newSelected.classList.add("selected");

  if (newSelected) {
    const xPosition = newSelected.getBoundingClientRect().left + window.scrollX;
    const windowHeight = window.innerWidth || document.documentElement.clientWidth;

    window.scrollTo({ left: xPosition - (windowHeight / 3), behavior: 'smooth' });
  }
}

function toggleDarkMode() {
  darkMode = !darkMode;
  updateDarkMode();
}

// This function updates the body's class. This affects page background, and since 
// the body class also sets css variables contianing colors which all other components
// use, it updates the entire page's styles. This function also swaps the buttons.
function updateDarkMode() {
  if (darkMode) {
    body.classList.add("darkMode");
    document.getElementById("light-mode-button").classList.add("hidden");
    document.getElementById("dark-mode-button").classList.remove("hidden");
  } else {
    body.classList.remove("darkMode");
    document.getElementById("dark-mode-button").classList.add("hidden");
    document.getElementById("light-mode-button").classList.remove("hidden");
  }
}

function updateTooltip(evt: MouseEvent) {
  const tooltip = document.getElementById("tooltip");
  const hovered = this.document.querySelectorAll(":hover");
  const current = hovered[hovered.length - 1];

  let content = undefined;
  if (current.closest(".component-card") && current.closest(".info-button")) {
    // If we are in a component card and hovering its info button, we can easily
    // get the component and property types, and look in the documentation.

    const componentType = getComponentInfo(current.closest(".component-card")).type;
    const propType = getPropName(current.closest(".info-button").nextElementSibling);
    content = `[${propType}] ${documentation[componentType][propType]}`;
  }

  // If the documentation search didn't get anything, use the tooltip class
  // in the HTML as a fallback.
  if (!content && current.closest(".info-button")) {
    const text = current.closest(".info-button").parentNode.querySelector(".tooltip-text");
    content = text?.innerHTML;
  } else if (current.closest(".util-button")) {
    // Otherwise we check if we are hovering a util button, these store
    // their tooltip data in their style.
    content = current.closest(".util-button").style.getPropertyValue('--label');
  }

  if (content) {
    tooltip.innerHTML = content;
    tooltip.classList.add("active");
  } else {
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

// ======================= \\
// EDITOR HELPER FUNCTIONS \\
// ======================= \\

function getAllPageCards() {
  return document.querySelectorAll(".page-card:not(.hidden)");
}

function getTemplateCopy(id: string) {
  const template = document.getElementById(id);
  const clone = template.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.classList.remove("hidden");

  return clone;
}

function createButtonClickEvent(container: HTMLElement, query: string, func: (evt: Event) => any) {
  const button = container.querySelector(query) as HTMLElement;
  button.addEventListener("click", func);
}

function getAllPageIDs() {
  const IDs: string[] = [];
  const pages = getAllPageCards();
  pages.forEach(page => { IDs.push(page.id); });
  return IDs;
}

function createSliderButtonListeners(container: HTMLElement) {
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

function createGotoButtonListeners(container: HTMLElement) {
  const buttons = container.querySelectorAll(".goto-button");
  if (buttons) {
    buttons.forEach(button => {
      button.addEventListener("click", function () {
        const target = (button.previousElementSibling as HTMLSelectElement).value;

        // It is null as a string because dropdown values are always
        // strings, unfortunately.
        if (target !== "null") {
          selectedCard = target;
          updateSelectedCard();
        }
      });
    });
  }
}

// Used to update dropdowns when a new page is added or
// an existing page is removed.
function updateAllDropDowns() {
  const dropdowns = document.querySelectorAll(".drop-down.link-selector") as NodeListOf<HTMLSelectElement>;
  const IDs = getAllPageIDs();

  dropdowns.forEach(dropdown => updateDropDown(dropdown, IDs));
}

// Used to initialize dropdowns in a new component.
function updateContainedDropDowns(container: HTMLElement, IDs: string[]) {
  const dropdowns = container.querySelectorAll(".drop-down.link-selector") as NodeListOf<HTMLSelectElement>;
  if (dropdowns) {
    dropdowns.forEach(dropdown => {
      updateDropDown(dropdown, IDs);
    });
  }
}

function updateDropDown(dropdown: HTMLSelectElement, values: string[], value?: string) {
  // If this is not "", we want the value to persist
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

function createUniqueID(length: number) {
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

// ======================= \\
// DRAG AND DROP FUNCTIONS \\
// ======================= \\

// For some reason after changing the TS compiler options,
// these functions don't get detected anymore...

function allowDrop(evt: any) {
  evt.preventDefault();
}

function drag(evt: any) { // Called on drag start
  evt.dataTransfer.setData("component", evt.target.parentNode.id);
}

function drop(evt: any, target: string, before: boolean) {
  evt.preventDefault();
  const id = evt.dataTransfer.getData("component");
  const component = document.getElementById(id);

  // The component we want to move the dragged component above
  const targetComponent = evt.target.closest(target);
  const pageCard = targetComponent.parentNode;

  // Update the id (in case we were dragged to a new page)
  // We increment the global componentID to be certain we don't have duplicate ids
  const parts = component.id.split(".");
  component.id = `${pageCard.id}.${parts[1]}.${componentID++}`;

  if (before) {
    pageCard.insertBefore(component, targetComponent);
  } else {
    pageCard.insertBefore(component, targetComponent.nextSibling);
  }
}

function dropBefore(evt: any) {
  drop(evt, ".card.component-card", true);
}

function dropAfter(evt: any) {
  drop(evt, ".card.settings-card", false);
}

// ========================= \\
// IMPORT / EXPORT FUNCTIONS \\
// ========================= \\

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
  } else {
    const dummyWorkflow = {
      name: "New Workflow",
      pages: [
        <Components.Page>{
          pageID: "page_1",
          title: "First Page",
          defaultLink: "page_2",
          content: [],
        },
        <Components.Page>{
          pageID: "page_2",
          title: "Second Page",
          defaultLink: "page_3",
          content: [],
        },
        <Components.Page>{
          pageID: "diag_page",
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
  const importer = document.getElementById("importer") as HTMLInputElement;
  importer.value = null;
  importer.click();
}

function prepareReader() {
  const importer = document.getElementById("importer") as HTMLInputElement;
  const reader = new FileReader();

  reader.onload = getJSON;
  reader.readAsText(importer.files[0]);
}

function getJSON(this: FileReader, event: ProgressEvent<FileReader>) {
  let json;
  if (typeof event.target.result === "string") {
    json = JSON.parse(event.target.result);
  } else {
    json = String.fromCharCode.apply(null, new Uint8Array(event.target.result));
  }

  importWorkflow(json);
}

function promptAndFetchWorkflow() {
  let name = prompt("Please enter the name of the workflow to import: (case sensitive)");
  if (name == null || name == "") {
    return;
  }
  name = name.replace(/ /g, "_");

  // This prompts if you'd like to leave the page...
  // window.location.assign("?workflow=" + name);

  fetchWorkflow(name);
}

function fetchWorkflow(name: string, version?: string) {
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

function importWorkflow(json: any) {
  const pages = json.pages;
  if (!pages || !json.name) {
    return; // TODO: notify user of invalid upload.
  }

  updateDisplayName(json.name);

  const old = getAllPageCards();
  old.forEach(card => card.remove());

  const IDs: string[] = [];
  pages.forEach((page: any) => {
    IDs.push(page.pageID);
  });

  pages.forEach((page: any) => {
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

function postWorkflow(onlyValidate: boolean) {
  let name = getDisplayName();
  if (!onlyValidate) {
    name = prompt("Please enter the name to export the workflow as: (case sensitive)");
    if (name == null || name == "") {
      return;
    }
  }
  name = name.replace(/ /g, "_");
  name = name.replace(/'/g, "");

  const cards = getAllPageCards() as NodeListOf<HTMLElement>;
  const workflow: { name: string, pages: Components.Page[] } = {
    name: name,
    pages: [],
  };

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const data = extractPageCard(card);
    workflow.pages.push(data);
  }

  console.log("Final workflow:\n", workflow);
  
  // TODO: Verify if workflow posted successfully,
  // and add an override warnings option.
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

function handleValidation(response: any) {
  for (let i = 0; i < response.pages.length; i++) {
    const page = response.pages[i] as Components.Page;
    displayValidationData(page);
  }
}

function displayValidationData(page: Components.Page) {
  const card = document.getElementById(page.pageID);
  const settings = card.querySelector(".settings-card-fields");

  if (page.defaultLink) {
    const defaultLink = settings.querySelector(".prop-defaultLink");
    markPropInvalid(defaultLink, page.defaultLink);
    card.querySelector(".settings-card").classList.add("validation-invalid");
  }

  // All page and logic components have card and component-card
  // class, subcomponents have sub-card and component-card class.
  const components = card.querySelectorAll(".card.component-card");
  for (let i = 0; i < components.length; i++) {
    const validation = page.content[i] as { [key: string]: any };
    const props = components[i].querySelector(".component-card-fields").querySelectorAll(".prop-input");

    props.forEach(prop => {
      const input = getPropInput(prop) || prop.querySelector(".slider-button");
      const propName = getPropName(input);

      if (validation[propName]) {
        markPropInvalid(input, validation[propName]);
        components[i].classList.add("validation-invalid");
      }
    })
  }
}

// ======================= \\
// IMPORT / EXPORT HELPERS \\
// ======================= \\

// Give a reference to a DOM element (specifically a page card),
// creates a Page component for exporting purposes.
function extractPageCard(card: HTMLElement): Components.Page {
  const page = <Components.Page>{
    pageID: card.id,
    title: card.querySelector("h1").textContent,
    content: [],
  };

  const settings = card.querySelector(".settings-card-fields");

  const defaultLink = settings.querySelector(".prop-defaultLink") as HTMLSelectElement;
  page.defaultLink = defaultLink.value;

  const isDiagnosisPage = settings.querySelector(".prop-isDiagnosisPage") as HTMLSelectElement;
  page.isDiagnosisPage = isDiagnosisPage.classList.contains("active");

  if (!page.isDiagnosisPage) {
    // The diagnosis page should not have any custom content. This is
    // a hard-coded page in the app and any modifications to it should
    // be done by contacting the developers.

    // All page and logic components have card and component-card
    // class, subcomponents have sub-card and component-card class.
    const components = card.querySelectorAll(".card.component-card");

    components.forEach(component => {
      // We want only this component's props, not those of subcomponents.
      const props = component.querySelector(".component-card-fields").querySelectorAll(".prop-input");

      const type = getComponentInfo(component).type;
      const values = extractProps(props);

      // This entire portion for subcomponents is exclusively to
      // deal with multiple choice components and their nested choices.
      const subcomponents = component.querySelectorAll(".sub-card.component-card");
      const choices: { [key: string]: any; }[] = [];

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

function extractProps(props: NodeListOf<Element>) {
  const values: { [key: string]: any } = {};

  props.forEach(prop => {
    const input = getPropInput(prop);

    if (input) {
      const propName = getPropName(input);
      values[propName] = input.value;
    } else {
      // We have a slider button, it's value is extracted differently
      const slider = prop.querySelector(".slider-button");
      const propName = getPropName(slider);

      values[propName] = slider.classList.contains("active");
    }
  });

  return values;
}

function createObjectFromProps(type: string, values: { [key: string]: any }) {
  const component: { [key: string]: any } = {};

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") component[key] = value;
  }

  component.component = type;
  return component;
}

function getPropInput(prop: Element) {
  return prop.querySelector("input") || prop.querySelector("select") || prop.querySelector("textarea");
}

function getPropName(propInput: Element) {
  return propInput.classList[0].slice(5);
}

function markPropInvalid(propInput: Element, errorMessage: string) {
  propInput.parentElement.classList.add("validation-invalid");
  propInput.parentElement.style.setProperty('--error-message', `'${errorMessage}'`);
}

function updateDisplayName(workflowName: string) {
  document.getElementById("utility-section").style.setProperty("--workflow-name", `'${workflowName.replace(/_/g, " ")}'`);
}

function getDisplayName() {
  return document.getElementById("utility-section").style.getPropertyValue("--workflow-name");
}

function getComponentInfo(component: Element) {
  // The id is of the format 'pageID.type.number'.
  return {
    parentPageID: component.id.split(".")[0],
    type: component.id.split(".")[1],
  };
}