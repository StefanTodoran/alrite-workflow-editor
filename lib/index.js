window.addEventListener("load", init);
var selectedPage = null;
function init() {
    console.log("INIT");
    const dummyData = [
        {
            pageID: "page_1",
            title: "Page 1",
            content: [],
        },
        {
            pageID: "page_2",
            title: "Page 2",
            content: [],
        },
        {
            pageID: "page_3",
            title: "Page 3",
            content: [],
        },
        {
            pageID: "page_4",
            title: "Page 4",
            content: [],
        },
        {
            pageID: "page_5",
            title: "Page 5",
            content: [],
        },
        {
            pageID: "page_6",
            title: "Page 6",
            content: [],
        },
        {
            pageID: "page_7",
            title: "Page 7",
            content: [],
        },
    ];
    for (let i = 0; i < dummyData.length; i++) {
        const page = dummyData[i];
        addPageCard(page.pageID, page.title);
    }
}
function addPageCard(id, title) {
    const lastPosition = document.getElementById("last-position");
    const template = document.getElementById("template-card");
    const copy = template.cloneNode(true);
    document.querySelector("body").insertBefore(copy, lastPosition);
    const card = document.querySelectorAll(".page-card.hidden")[1];
    card.querySelector("h1").textContent = title;
    card.classList.remove("hidden");
    card.id = id;
}
function extractPageCard(card) {
    return {
        pageID: card.id,
        title: card.querySelector("h1").textContent,
        content: []
    };
}
//# sourceMappingURL=index.js.map