import { Components } from "./components";

window.addEventListener("load", init);
var body: HTMLElement = null; // Just a nice shorthand to have
var selectedCard: string = null; // The currently selected page card
var darkMode: boolean = false;
var componentID = 0; // Used to ensure unique component ids in the HTML

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

  // selectedCard = null;
  // updateSelectedCard();

  newPageIndex++;
  window.scrollTo({
    left: body.scrollWidth,
    behavior: "smooth",
  });
}

// Creates and adds a page card to the DOM, before the add button.
// Populates it with the id and title and adds event listeners.
function addPageCard(id: string, title: string) {
  const addButton = document.getElementById("add-page-button");
  const template = document.getElementById("template-card");
  const card = template.cloneNode(true) as HTMLElement;

  card.querySelector("h1").textContent = title;
  card.querySelector("h2").textContent = id;
  card.classList.remove("hidden");
  card.id = id;

  // Only selected cards can have their components edited.
  card.querySelector(".page-card-header").addEventListener("click", function () {
    selectedCard = selectedCard === card.id ? null : card.id;
    updateSelectedCard();
  });

  // These buttons are used to rearrange page cards, the order has no 
  // semantic meaning since intra-page navigation is done via links,
  // but this is useful for convenience of editing.
  const moveLeft = card.querySelector(".move-left-button");
  const moveRight = card.querySelector(".move-right-button");
  moveLeft.addEventListener("click", function (evt) {
    body.insertBefore(card, card.previousSibling);
    updatePageCardMoveButtons();
    evt.stopPropagation(); // Otherwise, click goes through to parent (the card header)
  });
  moveRight.addEventListener("click", function (evt) {
    body.insertBefore(card, card.nextSibling.nextSibling);
    updatePageCardMoveButtons();
    evt.stopPropagation();
  });

  // Prompts the user to double check they want to delete, then deletes.
  const deleteCard = card.querySelector(".delete-button");
  deleteCard.addEventListener("click", function (evt) {
    if (window.confirm(`Are you sure you want to delete "${card.id}"?`)) {
      body.removeChild(card);
    }
    evt.stopPropagation();
  });

  // This button creates a new component card. When the user selects what type of
  // component they want, that card is replaced by an empty card for that specific
  // component type. We also increment the ID to ensure unique HTML IDs for each component.
  const addComponent = card.querySelector(".add-component-button");
  addComponent.addEventListener("click", () => {
    const newComponent = document.getElementById("template-new-component").cloneNode(true) as HTMLElement;
    newComponent.removeAttribute('id');
    newComponent.classList.remove("hidden");

    newComponent.querySelector(".create-component").addEventListener("click", () => {
      const typeInput = <HTMLInputElement>newComponent.querySelector(".component-type");
      addComponentToCard(typeInput.value, card, newComponent, componentID);

      addComponent.classList.remove("disabled");
      componentID++;
    });

    addComponent.classList.add("disabled");
    card.insertBefore(newComponent, addComponent);
  });

  card.querySelector("h1").addEventListener("keydown", (evt) => {
    if (evt.key === "Enter") {
      (document.activeElement as HTMLElement).blur();
      evt.preventDefault();
    }
  });

  body.insertBefore(card, addButton);
}

// Given a card, a component type, and the reference to the "new component" card
// which triggered this function call, creates a new empty component card of the
// specified type, then replaces the "new component" card with the empty component card.
function addComponentToCard(type: string, card: HTMLElement, creator: HTMLElement, id: number) {
  const templates: { [key: string]: string } = {
    // Page Components
    "TextInput": "template-text-input-component",
    "Button": "template-button-component",
    "MediaItem": "template-media-item-component",

    // Logic Components
    "Comparison": "template-comparison-component",
  }

  const template = document.getElementById(templates[type]);
  const component = template.cloneNode(true) as HTMLElement;
  component.classList.remove("hidden");
  component.id = `${card.id}.${type}.${id}`;

  component.querySelector(".delete-component-button").addEventListener("click", () => {
    if (window.confirm(`Are you sure you want to delete this "${type}" component?`)) {
      component.remove(); // We don't use card.removeChild() because the card parent can change!
    }
  });

  card.insertBefore(component, creator);
  card.removeChild(creator)
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
  // const cards = document.querySelectorAll(".page-card");

  // for (let i = 0; i < cards.length; i++) {
  //   //
  // }
}

// Give a reference to a DOM element (specifically a page card),
// creates a Page component for exporting purposes.
function extractPageCard(card: HTMLElement) {
  return <Components.Page>{
    pageID: card.id,
    title: card.querySelector("h1").textContent,
    content: [] // TODO
  };
}