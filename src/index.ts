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
      title: "abc",
      content: [],
    },
    <Components.Page>{
      pageID: "page_2",
      title: "long long name",
      content: [],
    },
    <Components.Page>{
      pageID: "page_3",
      title: "Page 3",
      content: [],
    },
    <Components.Page>{
      pageID: "page_4",
      title: "Page 4",
      content: [],
    },
    <Components.Page>{
      pageID: "page_5",
      title: "Page 5",
      content: [],
    },
    <Components.Page>{
      pageID: "page_6",
      title: "Page 6",
      content: [],
    },
    <Components.Page>{
      pageID: "page_7",
      title: "Page 7",
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
  const copy = template.cloneNode(true);
  body.insertBefore(copy, addButton);

  // Only this new card and the template will be hidden.
  const card: Element = document.querySelectorAll(".page-card.hidden")[1];
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
  moveLeft.addEventListener("click", () => {
    body.insertBefore(card, card.previousSibling);
    updatePageCardMoveButtons();
  });

  const moveRight = card.querySelector(".move-right-button");
  moveRight.addEventListener("click", () => {
    body.insertBefore(card, card.nextSibling.nextSibling);
    updatePageCardMoveButtons();
  });
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

// Give a reference to a DOM element (specifically a page card),
// creates a Page component for exporting purposes.
function extractPageCard(card: HTMLElement) {
  return <Components.Page>{
    pageID: card.id,
    title: card.querySelector("h1").textContent,
    content: [] // TODO
  };
}

// When a card is selected to edit, run this function
// to update the css styles accordingly.
function updateSelectedCard() {
  const newSelected = document.getElementById(selectedCard);
  const allCards = document.querySelectorAll(".page-card");

  allCards.forEach(card => card.classList.remove("selected"));
  if (newSelected) newSelected.classList.add("selected");
}