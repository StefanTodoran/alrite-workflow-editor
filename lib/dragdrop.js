function allowDrop(evt) {
  evt.preventDefault();
}

function drag(evt) { // Called on drag start
  evt.dataTransfer.setData("component", evt.target.parentNode.id);
}

function drop(evt, target, before) {
  evt.preventDefault();
  const id = evt.dataTransfer.getData("component");
  const component = document.getElementById(id);

  // The component we want to move the dragged component above
  const targetComponent = evt.target.closest(target);
  const pageCard = targetComponent.parentNode;

  // Update the id (in case we were dragged to a new page)
  // We increment the global componentID to be certain we don't have duplicate ids
  const parts = component.id.split(".");
  component.id = `${pageCard.id}.${parts[1]}.${createUniqueID(5)}`;

  if (before) {
    pageCard.insertBefore(component, targetComponent);
  } else {
    pageCard.insertBefore(component, targetComponent.nextSibling);
  }
}

function dropBefore(evt) {
  drop(evt, ".card.component-card", true);
}

function dropAfter(evt) {
  drop(evt, ".card.settings-card", false);
}

function createUniqueID(length) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }

  return result;
}