export module Components {
  // =============== \\
  // PAGE COMPONENTS \\
  // =============== \\
  
  export interface PageComponent {
    // Represents any page component that has a 
    // visual element to display on the page.
  }
  
  export interface MultipleChoice extends PageComponent {
    text: string,
    choices: Choice[],
    multiselect: boolean,
  }
  
  export interface Choice {
    text: string,
    link: string, // The pageID this option links to if selected (not valid if parent has multiselect enabled)
    valueID: string, // Unique identifier e.g. "option_A", will store boolean representing if selected
  }
  
  export interface TextInput extends PageComponent {
    text: string,
    type: string, // Type of input to accept, e.g. "numeric", "default"
    units?: string, // If provided, displayed next to the TextInput, e.g. "cm"
    valueID: string, // Must be unique, used for identifying the value inputted
    defaultValue?: any, // Type depends on type property
  }
  
  export interface Button extends PageComponent {
    text?: string, // Defaults to "skip"
    hint?: string, // Displayed above button detailing when/why to skip
    link: string, // The pageID this button skips to if pressed
  }
  
  export interface Counter extends PageComponent {
    title: string,
    hint?: string,
    timeLimit: number, // Given in seconds
    offerManualInput: boolean,
  }
  
  export interface Modal extends PageComponent {
    pageID: string, // Must be unique
    // To link to a modal via it's pageID, a component must specify that ID and the modal must be on the same page
    title: string,
    content: string[], // Each string is displayed as a separate paragraph
    buttons: Button[], // Navigation used to exit the modal
    showCloseButton: boolean, // Whether to display a button that closes the modal, returning the the current (parent) page
  }
  
  export interface Page {
    pageID: string, // Must be unique
    title: string,
    content: PageComponent[],
  }
  
  // ============== \\
  // LOGIC HANDLING \\
  // ============== \\
  
  export interface LogicComponent {
    // Only one of these should exist per page, used to do conditional
    // logic based on some value input on the page.
  }
  
  export interface ComparisonLogic extends LogicComponent {
    type: string, // Valid types include ">", "<", ">=", "<=", "="
    valueID: string,
    threshold: number,
    satisfiedLink: string, // The pageIDs to link to given whether value satisfies the threshold given the comparison type
    notSatisfiedLink: string,
  }
  
  export interface SelectionLogic extends LogicComponent {
    type: string, // Valid types include "all_selected", "at_least_one", "exactly_one", "none_selected"
    valueIDs: string[],
    satisfiedLink: string, // The pageIDs to link to given whether value satisfies the boolean condition
    notSatisfiedLink: string,
  }
}
