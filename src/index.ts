import { Components } from "./components";

window.addEventListener("load", init);
var body: HTMLElement = null;
var selectedCard: string = null;

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

  // Edit card toggles where this card is selected.
  // Only selected cards can have their components edited.
  const editCard = card.querySelector(".edit-button");
  editCard.addEventListener("click", () => {
    selectedCard = selectedCard === card.id ? null : card.id;
    updateSelectedCard();
  });

  // These buttons are used to rearrange page cards, the order has no 
  // semantic meaning since intra-page navigation is done via links,
  // but this is useful for convenience of editing.
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

  // Prompts the user to double check they want to delete, then deletes.
  const deleteCard = card.querySelector(".delete-button");
  deleteCard.addEventListener("click", () => {
    if (window.confirm(`Are you sure you want to delete "${card.id}"?`)) {
      body.removeChild(card);
    }
  });

  // This button creates a new component card. When the user selects
  // what type of component they want, that card is replaced by an empty
  // card for that specific component type.
  const addComponent = card.querySelector(".add-component-button");
  addComponent.addEventListener("click", () => {
    const newComponent = document.getElementById("template-new-component").cloneNode(true) as HTMLElement;
    newComponent.removeAttribute('id');
    newComponent.classList.remove("hidden");

    newComponent.querySelector(".create-component").addEventListener("click", () => {
      const typeInput = <HTMLInputElement>newComponent.querySelector(".component-type")
      addComponentToCard(typeInput.value, card, newComponent);
    });

    card.insertBefore(newComponent, addComponent);
  });

  body.insertBefore(card, addButton);
}

// Given a card, a component type, and the reference to the "new component" card
// which triggered this function call, creates a new empty component card of the
// specified type, then replaces the "new component" card with the empty component card.
function addComponentToCard(type: string, card: HTMLElement, creator: HTMLElement) {
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

  const component = template.cloneNode(true) as HTMLElement;
  component.classList.remove("hidden");
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

// ==================== \\
// EXTRACTION FUNCTIONS \\
// ==================== \\

// Give a reference to a DOM element (specifically a page card),
// creates a Page component for exporting purposes.
function extractPageCard(card: HTMLElement) {
  return <Components.Page>{
    pageID: card.id,
    title: card.querySelector("h1").textContent,
    content: [] // TODO
  };
}