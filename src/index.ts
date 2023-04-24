import { Components } from "./components";

window.addEventListener("load", init);
var body: HTMLElement = null; // Just a nice shorthand to have
var selectedCard: string = null; // The currently selected page card
var darkMode: boolean = false;
var componentID = 0; // Used to ensure unique component ids in the HTML

var templates: { [key: string]: string } = {
  // Page Components
  "TextInput": "template-text-input-component",
  "Button": "template-button-component",
  "MediaItem": "template-media-item-component",
  "MultipleChoice": "template-multiple-choice-component",

  // Logic Components
  "Comparison": "template-comparison-component",
}

/**
 * Initialization function that should handle anything that needs to occur on page load.
 */
function init() {
  body = document.querySelector("body");

  const dummyData = [
    <Components.Page>{
      pageID: "page_1",
      title: "First Page",
      content: [],
    },
    <Components.Page>{
      pageID: "page_2",
      title: "Second Page",
      content: [],
    },
    <Components.Page>{
      pageID: "page_3",
      title: "Final Page",
      content: [],
    },
  ];

  for (let i = 0; i < dummyData.length; i++) {
    const page: Components.Page = dummyData[i];
    addPageCard(page.pageID, page.title);
  }

  updatePageCardMoveButtons();
  document.getElementById("add-page-button").addEventListener("click", addNewPage);
  document.getElementById("export-button").addEventListener("click", exportWorkflow);

  // Handling dark mode
  darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.getElementById("light-mode-button").addEventListener("click", toggleDarkMode);
  document.getElementById("dark-mode-button").addEventListener("click", toggleDarkMode);
  updateDarkMode();
}

let newPageIndex = 0;
function addNewPage() {
  const page = <Components.Page>{
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

// Creates and adds a page card to the DOM, before the add button.
// Populates it with the id and title and adds event listeners.
function addPageCard(id: string, title: string) {
  const card = getTemplateCopy("template-page-card");
  card.id = id;

  card.querySelector("h1").textContent = title;
  card.querySelector("h2").textContent = id;

  // Only selected cards can have their components edited.
  createButtonClickEvent(card, ".page-card-header", function () {
    selectedCard = selectedCard === card.id ? null : card.id;
    updateSelectedCard();
  });

  // We wish to avoid newlines in page titles, and we also
  // select the card for convenience. Also we don't want click through.
  card.querySelector("h1").addEventListener("keydown", (evt) => {
    if (evt.key === "Enter") {
      (document.activeElement as HTMLElement).blur();
      selectedCard = card.id;
      updateSelectedCard();
      evt.preventDefault();
    }
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
      addComponentToCard(typeInput.value, card, newComponent, componentID);

      addComponent.classList.remove("disabled");
      componentID++;
    });

    addComponent.classList.add("disabled"); // No new components until the current one is created.
    card.insertBefore(newComponent, addComponent);
  });

  const addButton = document.getElementById("add-page-button");
  body.insertBefore(card, addButton);
}

// Given a card, a component type, and the reference to the "new component" card
// which triggered this function call, creates a new empty component card of the
// specified type, then replaces the "new component" card with the empty component card.
function addComponentToCard(type: string, card: HTMLElement, creator: HTMLElement, id: number) {
  const component = getTemplateCopy(templates[type]);
  component.id = `${card.id}.${type}.${id}`;

  createButtonClickEvent(component, ".delete-component-button", function () {
    if (window.confirm(`Are you sure you want to delete this "${type}" component?`)) {
      component.remove(); // We don't use card.removeChild() because the card parent can change!
    }
  });

  const addButton = component.querySelector(".add-subcomponent-button");
  if (addButton) {
    addButton.addEventListener("click", () => {
      const choice = getTemplateCopy("template-choice-component");
      createButtonClickEvent(choice, ".delete-component-button", function () {
        choice.remove();
      });

      const choiceDropdown = choice.querySelector(".drop-down.link-selector") as HTMLSelectElement;
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

  const dropdowns = component.querySelectorAll(".drop-down.link-selector") as NodeListOf<HTMLSelectElement>;
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
  const dropdowns = document.querySelectorAll(".drop-down.link-selector") as NodeListOf<HTMLSelectElement>;
  const ids = getAllPageIDs();

  dropdowns.forEach(dropdown => updateDropDown(dropdown, ids));
}

// Updates the event listeners for ever page card, ensure the first page card 
// does not have move left enabled, nor the last card have more right enabled.
function updatePageCardMoveButtons() {
  const cards = document.querySelectorAll(".page-card:not(.hidden)");

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

// ================ \\
// HELPER FUNCTIONS \\
// ================ \\

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
  const ids: string[] = [];
  const pages = document.querySelectorAll(".page-card:not(.hidden)");
  pages.forEach(page => { ids.push(page.id); });
  return ids;
}

function updateDropDown(dropdown: HTMLSelectElement, values: string[]) {
  const previous = dropdown.value; // If this is not "", we want the value to persist

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

function createGotoButtonListeners(buttons: NodeListOf<Element>) {
  buttons.forEach(button => {
    button.addEventListener("click", function () {
      const target = (button.previousElementSibling as HTMLSelectElement).value;
      selectedCard = target;
      updateSelectedCard();
    });
  });
}

// ======================= \\
// DRAG AND DROP FUNCTIONS \\
// ======================= \\

function allowDrop(evt: any) {
  evt.preventDefault();
}

function drag(evt: any) { // Called on drag start
  evt.dataTransfer.setData("component", evt.target.id);
}

function drop(evt: any) {
  evt.preventDefault();
  const id = evt.dataTransfer.getData("component");
  const component = document.getElementById(id);

  // The component we want to move the dragged component above
  const targetComponent = evt.target.closest(".card.component-card");
  const pageCard = targetComponent.parentNode;

  // Update the id (in case we were dragged to a new page)
  // We increment the global componentID to be certain we don't have duplicate ids
  const parts = component.id.split(".");
  component.id = `${pageCard.id}.${parts[1]}.${componentID++}`;

  pageCard.insertBefore(component, targetComponent);
}

// ==================== \\
// EXTRACTION FUNCTIONS \\
// ==================== \\

function exportWorkflow() {
  const cards = document.querySelectorAll(".page-card:not(.hidden)") as NodeListOf<HTMLElement>;
  console.log("Starting workflow export...");

  const workflow: { pages: Components.Page[] } = { pages: [] };
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const data = extractPageCard(card);
    workflow.pages.push(data);
  }

  console.log("Final workflow:\n", workflow);
}

// Give a reference to a DOM element (specifically a page card),
// creates a Page component for exporting purposes.
function extractPageCard(card: HTMLElement): Components.Page {
  console.log("Gathering page data", card.id);
  const page = <Components.Page>{
    pageID: card.id,
    title: card.querySelector("h1").textContent,
    content: [],
  };

  // All page and logic components have card and component-card
  // class, subcomponents have sub-card and component-card class.
  const components = card.querySelectorAll(".card.component-card");

  components.forEach(component => {
    // We want only this component's props, not those of subcomponents
    const props = component.querySelector(".component-card-fields").querySelectorAll(".prop-input");

    // The id is of the format 'pageID.type.number'
    const type = component.id.split(".")[1];
    const values: { [key: string]: any } = {};

    props.forEach(prop => {
      const input = prop.querySelector("input") || prop.querySelector("select");
      const propName = input.classList[0].slice(5);
      values[propName] = input.value;
    });

    page.content.push(createObjectFromProps(type, values));
  });

  return page;
}

function createObjectFromProps(type: string, values: { [key: string]: any }) {
  const component: { [key: string]: any } = {};

  for (const [key, value] of Object.entries(values)) {
    if (value) component[key] = value;
  }

  component.component = type;
  return component;
}