import { Components } from "./components";

window.addEventListener("load", init);
var selectedPage = null;

/**
 * Initialization function that should handle anything that needs to occur on page load.
 */
function init() {
  console.log("INIT");

  const dummyData = [
    <Components.Page>{
      pageID: "page_1",
      title: "Page 1",
      content: [],
    },
    <Components.Page>{
      pageID: "page_2",
      title: "Page 2",
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
}

function addPageCard(id: string, title: string) {
  const lastPosition: HTMLElement = document.getElementById("last-position");
  const template: HTMLElement = document.getElementById("template-card");
  const copy: Node = template.cloneNode(true);
  document.querySelector("body").insertBefore(copy, lastPosition);

  // Only this new card and the template will be hidden.
  const card: Element = document.querySelectorAll(".page-card.hidden")[1];
  card.querySelector("h1").textContent = title;
  card.classList.remove("hidden");
  card.id = id;
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