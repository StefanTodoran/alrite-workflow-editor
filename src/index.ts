import { Components, documentation } from "./components.js";

window.addEventListener("load", init);

var selectedCard: string = null; // The currently selected page card
var darkMode: boolean = false;
var menuOpen: boolean = false;
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
  "Validation": "template-validation-component",
}

/**
 * Initialization function that should handle anything that needs to occur on page load.
 * Sets event listeners for the util menu, handles cookie preferences, populates the editor,
 * and misc other.
 */
function init() {
  handleMenuPreference();
  handleDarkModePreference();
  setTimeout(() => document.body.classList.add("do-transition"), 10);
  // We wait to give the body transition styles so that the styles
  // don't flash dark or light theme before stored preferences kick in.

  // ================= \\
  // Util menu buttons \\
  addButtonOnClick("add-page-button", addNewPage);
  addButtonOnClick("toggle-menu-button", toggleUtilMenu);

  addButtonOnClick("export-button", () => { postWorkflow(false, "Uploading Workflow...") });
  addButtonOnClick("validate-button", () => { postWorkflow(true) });

  addButtonOnClick("file-import-button", triggerFileImport);
  document.getElementById("importer").addEventListener("input", prepareReader);
  addButtonOnClick("file-download-button", downloadToFile);

  addButtonOnClick("light-mode-button", toggleDarkMode);
  addButtonOnClick("dark-mode-button", toggleDarkMode);
  // End util menu buttons \\
  // ==================== \\

  addButtonOnClick("go-back-button", () => { window.location.href = ".." });

  setTimeout(() => {
    // Adds a confirmation prompt if the user attempts to
    // close the tab or go back, so changes aren't lost.
    window.onbeforeunload = () => { return true; };
  }, 5000);

  addEventListener("mousemove", updateTooltip);
  populatePageOnStartup();
  initializeModal();
}

// Adds a blank page with a unique identifier and 
// no content, then scrolls the page to it.
function addNewPage() {
  const page = <Components.Page>{
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
    document.body.insertBefore(card, card.previousSibling);
    updatePageCardMoveButtons();
    evt.stopPropagation(); // Otherwise, click goes through to parent (the card header)
  });
  createButtonClickEvent(card, ".move-right-button", function (evt) {
    document.body.insertBefore(card, card.nextSibling.nextSibling);
    updatePageCardMoveButtons();
    evt.stopPropagation();
  });

  // Prompts the user to double check they want to delete, then deletes.
  createButtonClickEvent(card, ".delete-button", function (evt) {
    if (window.confirm(`Are you sure you want to delete "${card.id}"?`)) {
      document.body.removeChild(card);
      updatePageCardMoveButtons();
      updateAllDropDowns();
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
  document.body.insertBefore(card, addButton);
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

  const comparisonPreview = component.querySelector(".comparison-logic-preview") as HTMLElement;
  if (comparisonPreview) {
    const typeInput = component.querySelector(".prop-type") as HTMLInputElement;
    const targetValueIDInput = component.querySelector(".prop-targetValueID") as HTMLInputElement;
    const thresholdInput = component.querySelector(".prop-threshold") as HTMLInputElement;

    typeInput.addEventListener("input", () => { updateComparisonPreview(component) });
    thresholdInput.addEventListener("input", () => { updateComparisonPreview(component) });
    targetValueIDInput.addEventListener("input", () => { updateComparisonPreview(component) });
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
    scrollToCard(newSelected);
  }
}

function scrollToCard(card: Element) {
  const xPosition = card.getBoundingClientRect().left + window.scrollX;
  const windowHeight = window.innerWidth || document.documentElement.clientWidth;

  window.scrollTo({ top: 0, left: xPosition - (windowHeight / 3), behavior: 'smooth' });
}

function updateTooltip(evt: MouseEvent) {
  const tooltip = document.getElementById("tooltip");
  const hovered = this.document.querySelectorAll(":hover");
  const current = hovered[hovered.length - 1];
  let content = undefined;

  const infoButton = current.closest(".info-button");
  if (infoButton) {
    const propType = getPropName(infoButton.nextElementSibling);
    let componentType;

    if (current.closest(".component-card")) {
      // If we are in a component card we can easily get the component types with this helper.
      componentType = getComponentInfo(current.closest(".component-card")).type;
    }

    if (current.closest(".settings-card")) {
      // If we are in the settings card we just want the documentation for page.
      componentType = "Page";
    }

    content = `<p class="tooltip">(${propType})</p>`;
    content += `${documentation[componentType][propType]}`;
  }

  // Otherwise we check if we are hovering a util button, these store
  // their tooltip data in their style.
  const utilButton = current.closest(".util-button");
  if (utilButton) content = utilButton.style.getPropertyValue('--label');

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

function displayInfoMessage(text: string) {
  document.getElementById("info-container").classList.add("active");
  document.getElementById("info-message").innerText = text;
}

function hideInfoMessage(seconds?: number) {
  seconds = isNaN(seconds) ? 0.75 : Math.max(seconds, 0.75);
  setTimeout(() => {
    document.getElementById("info-container").classList.remove("active");
  }, seconds * 1000);
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

// Used for giving a button identified via class inside 
// some card component a click event listener.
function createButtonClickEvent(container: HTMLElement, query: string, func: (evt: Event) => any) {
  const button = container.querySelector(query) as HTMLElement;
  button.addEventListener("click", func);
}

// Used to give util buttons identified 
// via id a click event listener.
function addButtonOnClick(id: string, func: (evt: Event) => any) {
  document.getElementById(id).addEventListener("click", func);
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

function updateComparisonPreview(component: HTMLElement) {
  const comparisonPreview = component.querySelector(".comparison-logic-preview") as HTMLElement;

  if (comparisonPreview) {
    const typeInput = component.querySelector(".prop-type") as HTMLInputElement;
    const targetValueIDInput = component.querySelector(".prop-targetValueID") as HTMLInputElement;
    const thresholdInput = component.querySelector(".prop-threshold") as HTMLInputElement;

    if (typeInput.value && targetValueIDInput.value && thresholdInput.value) {
      comparisonPreview.innerText = typeInput.value;
      comparisonPreview.style.setProperty("--targetValueID", `'${targetValueIDInput.value}'`);
      comparisonPreview.style.setProperty("--threshold", `'${thresholdInput.value}'`);

      comparisonPreview.classList.add("active");
    } else {
      comparisonPreview.classList.remove("active");
    }
  }
}

function highlightDraggablePage(card: HTMLElement) {
  const highlighted = document.querySelectorAll(".allow-drop");
  highlighted.forEach((page) => {
    page.classList.remove("allow-drop");
  });

  card?.classList.add("allow-drop");
}

function highlightDraggableComponent(card: HTMLElement, before?: boolean) {
  const highlighted = [...document.querySelectorAll(".allow-drop-before"), ...document.querySelectorAll(".allow-drop-after")];
  highlighted.forEach((page) => {
    page.classList.remove("allow-drop-before");
    page.classList.remove("allow-drop-after");
  });

  card?.classList.add(before ? "allow-drop-before" : "allow-drop-after");
}

function createUniqueID(length: number) {
  const existing = getAllPageIDs();
  let ID;
  
  do { // The odds of collision are very low, but not zero
    ID = createRandomID(length);
  } while (existing.includes(ID));

  return ID;
}

// Don't use this, use createUniqueID
function createRandomID(length: number) {
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

// ========================= \\
// STORED COOKIE PREFERENCES \\
// ========================= \\

function handleMenuPreference() {
  if (getCookieValue("menuOpen") === "true") {
    toggleUtilMenu();
  }
}

function handleDarkModePreference() {
  if (getCookieValue("darkMode") === "true") {
    darkMode = true;
  } else if (getCookieValue("darkMode") === "false") {
    darkMode = false;
  } else {
    // If the user has no stored preference, check their system settings.
    darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  updateDarkMode();
}

function getCookieValue(key: string) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(key + "="))
    ?.split("=")[1];
  return value;
}

function setCookieValue(key: string, value: any, age?: number) {
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

// This function updates the body's class. This affects page background, and since 
// the body class also sets css variables contianing colors which all other components
// use, it updates the entire page's styles. This function also swaps the theme buttons.
function updateDarkMode() {
  if (darkMode) {
    document.body.classList.add("darkMode");
    document.getElementById("light-mode-button").classList.add("hidden");
    document.getElementById("dark-mode-button").classList.remove("hidden");
  } else {
    document.body.classList.remove("darkMode");
    document.getElementById("dark-mode-button").classList.add("hidden");
    document.getElementById("light-mode-button").classList.remove("hidden");
  }
}

// ====================== \\
// MODAL HELPER FUNCTIONS \\
// ====================== \\

const modal = document.getElementById("modal") as HTMLDialogElement;
var modalSeqNum = 0; // Used to ignore old event listeners

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

function openModal(modalMode: ("server_import" | "rename_workflow")) {
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
      const select = modal.querySelector("select") as HTMLSelectElement;
      const name = select.value;
  
      // We don't need an event dispatch here because there is nothing
      // which will await a server import mode modal.
      history.pushState("", "", `/editor/?workflow=${name}`);
      fetchWorkflow(name);
    }
  }, { once: true });
}

async function populateModalOptions() {
  const select = modal.querySelector("select") as HTMLSelectElement;
  select.innerHTML = "";

  const workflows = await fetchAllWorkflowNames();
  workflows.forEach((workflow: { workflow_id: string }) => {
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
        
        if (name) updateDisplayName(name);
        resolve(name);
      }
    }, { once: true });

    modal.addEventListener("cancel", () => {
      if (curSeqNum === modalSeqNum) resolve(null);
    }, { once: true });
  });
}

// ======================= \\
// DRAG AND DROP FUNCTIONS \\
// ======================= \\

// For some reason after changing the TS compiler options,
// these functions don't get detected anymore...
// It has something to do with dojo.

export function allowComponentDrop(evt: any) {
  if (evt.target.closest(".page-card").classList.contains("diagnosis-page")) return;
  if (!evt.dataTransfer.getData("component")) return;

  const settings = evt.target.closest(".settings-card");
  const highlight = evt.target.closest(".card.component-card") || settings;
  const starty = evt.dataTransfer.getData("starty");

  highlightDraggableComponent(highlight, (evt.clientY - starty < 0 && !settings));
  evt.preventDefault();
}

export function allowPageDrop(evt: any) {
  if (evt.dataTransfer.getData("page")) {
    highlightDraggablePage(evt.target.closest(".page-card"));
    evt.preventDefault();
  }
}

export function dragComponent(evt: any) { // called on drag start
  evt.dataTransfer.setData("starty", evt.clientY);
  evt.dataTransfer.setData("component", evt.target.parentNode.id);
}

export function dragPage(evt: any) { // called on drag start
  evt.dataTransfer.setData("startx", evt.clientX + window.scrollX);
  evt.dataTransfer.setData("page", evt.target.closest(".page-card").id);

  selectedCard = null;
  updateSelectedCard();
}

export function dropComponent(evt: any) {
  const id = evt.dataTransfer.getData("component");
  if (!id) {
    return;
  }

  const component = document.getElementById(id);

  // The component we want to move the dragged component above
  const targetComponent = evt.target.closest(".card.component-card") || evt.target.closest(".card.settings-card");
  const pageCard = targetComponent.parentNode;

  // Update the id (in case we were dragged to a new page)
  // We increment the global componentID to be certain we don't have duplicate ids
  const parts = component.id.split(".");
  component.id = `${pageCard.id}.${parts[1]}.${componentID++}`;

  const starty = evt.dataTransfer.getData("starty");
  if (evt.clientY - starty < 0 && !evt.target.closest(".card.settings-card")) {
    // We want to insert before if the component was dragged up, unless
    // it is being dropped on the settings card.
    pageCard.insertBefore(component, targetComponent);
  } else {
    pageCard.insertBefore(component, targetComponent.nextSibling); // insert after
  }

  highlightDraggableComponent(null);
  evt.preventDefault();
}

export function dropPage(evt: any) {
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
  } else {
    document.body.insertBefore(page, target.nextSibling); // insert after
  }

  highlightDraggablePage(null);
  evt.preventDefault();
}

export function onDragEnd() {
  highlightDraggableComponent(null);
  highlightDraggablePage(null);
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
          defaultLink: "diag_page",
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

    importWorkflow(dummyWorkflow, true);
  }
}

async function saveToLocalStorage() {
  const workflow = await extractWorkflowData(true);
  if (!workflow) return;

  localStorage.setItem(workflow.name, JSON.stringify(workflow));
}

async function downloadToFile() {
  const workflow = await extractWorkflowData(true);
  if (!workflow) return;

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workflow));
  const downloader = document.getElementById("downloader");
  downloader.setAttribute("href", dataStr);
  downloader.setAttribute("download", `${workflow.name}.json`);
  downloader.click();
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

  try {
    if (typeof event.target.result === "string") {
      json = JSON.parse(event.target.result);
    } else {
      json = String.fromCharCode.apply(null, new Uint8Array(event.target.result));
    }
  } catch {
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

function fetchWorkflow(name: string, version?: string) {
  let target = "/apis/workflows/" + name + "/";
  if (version) {
    target += version + "/";
  }

  // displayInfoMessage("Importing Workflow...");
  fetch(target, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  })
    .then(res => res.json())
    .then(res => importWorkflow(res));
  // hideInfoMessage();
}

/**
 * Populates the page based on the given workflow object.
 * Assumes the object the be valid, besides the minor check that it
 * has a name and pages.
 * @param json The target workflow object
 * @param dummy Whether this is a dummy workflow, which does not need a name
 * @returns 
 */
function importWorkflow(json: any, dummy?: true) {
  const pages = json.pages;
  if (!pages || (!dummy && !json.name)) { // If we don't have a name, a dummy workflow is still valid
    displayInfoMessage("Import Failed");
    hideInfoMessage();
    return;
  }

  if (json.name) updateDisplayName(json.name);

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

  updatePageCardMoveButtons();
  updateAllDropDowns();
}

async function postWorkflow(onlyValidate: boolean, infoMessage?: string) {
  const workflow = await extractWorkflowData(!onlyValidate);
  if (!workflow) {
    displayInfoMessage("Upload Failed: No Name");
    hideInfoMessage();
    return;
  }

  if (!onlyValidate) history.pushState("", "", `/editor/?workflow=${workflow.name}`);
  const csrftoken = getCookieValue("csrftoken");

  // TODO: Verify if workflow posted successfully,
  // and add an override warnings option.
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
      if (typeof data === "string") data = JSON.parse(data);

      handleValidation(data, res.status);
    });

  updateDisplayName(workflow.name);
  hideInfoMessage();
}

function handleValidation(response: any, status: number) {
  // Clear any existing validation data first
  const invalid = document.querySelectorAll(".validation-invalid");
  invalid.forEach(elem => elem.classList.remove("validation-invalid"));
  
  if (status === 200) {
    displayInfoMessage("Success! No Errors Found!");
    hideInfoMessage();
  } else {
    displayInfoMessage(response.status || "Check Errors And Try Again");
    hideInfoMessage();
  }

  console.log(response);
  if (status === 400) {
    for (let i = 0; i < response.pages.length; i++) {
      const page = response.pages[i] as Components.ValidatedPage;
      displayPageValidationData(page);
    }

    if (response.firstInvalidPage) {
      const firstInvalid = document.getElementById(response.firstInvalidPage);
      scrollToCard(firstInvalid);
    }
  }
}

/**
 * Given a validation artifact for a page, visualizes errors for
 * the page's props and for all of its components.
 * @param page The validation artifact for the page, where
 * the value for a prop is either null or a string error description.
 */
function displayPageValidationData(page: Components.ValidatedPage) {
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

  // All page and logic components have card and component-card
  // class, subcomponents have sub-card and component-card class.
  const components = card.querySelectorAll(".card.component-card");
  for (let i = 0; i < components.length; i++) {
    const validation = page.content[i] as { [key: string]: any };
    if (!validation) continue; // We have no validation data for this component...
    
    displayComponentValidationData(components[i], validation);

    const choices = components[i].querySelector(".card-subcomponents")?.querySelectorAll(".sub-card");
    let choiceIndex = 0;

    choices && choices.forEach(choice => {
      const choiceValidation = validation["choices"][choiceIndex];
      displayComponentValidationData(choice, choiceValidation);
      choiceIndex++;
    });
  }
}

function displayComponentValidationData(component: Element, validation: { [key: string]: any }, ) {
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

// ======================= \\
// IMPORT / EXPORT HELPERS \\
// ======================= \\

async function extractWorkflowData(needsName: boolean) {
  let name = getDisplayName();
  if (needsName && !name) name = await promptWorkflowName() as string;
  name = getCleanWorkflowName(name);
  if (needsName && !name) return null;

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

  return workflow;
}

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

function getCleanWorkflowName(name: string) {
  name = name?.replace(/ /g, "_");
  name = name?.replace(/'/g, "");
  name = name?.replace(/\W/g, "");
  return name;
}

function getComponentInfo(component: Element) {
  // The id is of the format 'pageID.type.number'.
  return {
    parentPageID: component.id.split(".")[0],
    type: component.id.split(".")[1],
  };
}