export module Components {
  // =============== \\
  // PAGE COMPONENTS \\
  // =============== \\
  
  export interface PageComponent {
    // Represents any page component that has a 
    // visual element to display on the page.
  }
  
  export interface MultipleChoice extends PageComponent {
    valueID: string, //Unique id for the value of this page component
    text: string,
    choices: Choice[],
    multiselect: boolean,
  }
  
  export interface Choice {
    valueID: string, //Unique id for the value of this page component
    text: string,
    value: any,
    //link: string, // The pageID this option links to if selected (not valid if parent has multiselect enabled)
  }
  
  export interface TextInput extends PageComponent {
    valueID: string, //Unique id for the value of this page component
    text: string,
    type: string, // Type of input to accept, e.g. "numeric", "default"
    units?: string, // If provided, displayed next to the TextInput, e.g. "cm"
    defaultValue?: any, // Type depends on type property
  }
  
  export interface Button extends PageComponent {
    text?: string, // Defaults to "skip"
    hint?: string, // Displayed above button detailing when/why to skip
    link: string, // The pageID this button skips to if pressed
  }
  
  export interface Counter extends PageComponent {
    valueID: string, //Unique id for the value of this page component
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
    conditionalLinks: LogicComponent[],
    defaultLink: string,
  }
  
  // ============== \\
  // LOGIC HANDLING \\
  // ============== \\
  
  export interface LogicComponent {
    // Used to do conditional
    // logic based on some value input on the page.
  }
  
  export interface ComparisonLogic extends LogicComponent {
    type: string, // Valid types include ">", "<", ">=", "<=", "="
    valueID: string,
    threshold: any,
    satisfiedLink: string, // The pageID to link to given whether value satisfies the threshold given the comparison type
  }
  
  export interface SelectionLogic extends LogicComponent {
    type: string, // Valid types include "all_selected", "at_least_one", "exactly_one", "none_selected"
    valueIDs: string[],
    satisfiedLink: string, // The pageID to link to given whether value satisfies the threshold given the comparison type
  }
}
