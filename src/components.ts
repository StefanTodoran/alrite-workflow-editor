export module Components {
  // =============== \\
  // PAGE COMPONENTS \\
  // =============== \\
  
  export interface PageComponent {
    // Represents any page component that has a 
    // visual element to display on the page.
  }

  export interface MediaItem extends PageComponent {
    component: "MediaItem",

    fileName: string, // The file name of the image or video to display
    label?: string, // Optional text to display underneatht the image or video
  }
  
  export interface MultipleChoice extends PageComponent {
    component: "MultipleChoice",
    
    // Unique id for the input value for this page component
    valueID: string, 

    // A text label, generally a question prompt
    label: string,

    // A set of choices or answers for the question
    choices: Choice[],

    // Whether the user can select multiple options
    multiselect: boolean,
  }
  
  export interface Choice {
    // The text this choice displays, e.g. "Option A"
    text: string,
    
    // The value associated with selecting this choice (can be same or different to text)
    // You might want this to be different if some logic is done based on this choice
    value: any,
    
    // Page id that this choice should link to if selected (not valid if parent has multiselect)
    link?: string, 
  }
  
  export interface TextInput extends PageComponent {
    component: "TextInput",
    
    // Unique id for the input value for this page component
    valueID: string, 

    // Text indicating what should be input
    label: string,

    // Type of input to accept, e.g. "numeric", "alphanumeric", "default", "any"
    // Default means alphabetical character input only, no numbers.
    type: string, 
    
    units?: string, // If provided, displayed next to the TextInput, e.g. "cm" (optional)
    defaultValue?: any, // The type of this depends on type property (optional)
  }
  
  export interface Button extends PageComponent {
    component: "Button",
    
    // The button's display text, defaults to "Next"
    text?: string,

    hint?: string, // Displayed above button detailing, when/why to skip (optional)
    link: string, // The pageID this button skips to if pressed
  }
  
  export interface Counter extends PageComponent {
    component: "Counter",
    
    // Unique id for the input value for this page component
    valueID: string, 

    title: string,
    hint?: string,
    timeLimit: number, // Given in seconds
    offerManualInput: boolean,
  }
  
  export interface Modal extends PageComponent {
    component: "Modal",
    
    pageID: string, 
    // Must be unique, used for link properties on other components
    // To link to a modal via it's pageID, a component must specify that ID and the modal must be on the same page
    
    title: string,
    content: string[], // Each string is displayed as a separate paragraph
    buttons: Button[], // Navigation used to exit the modal
    showCloseButton: boolean, // Whether to display a button that closes the modal, returning the the current (parent) page
  }
  
  export interface Page {
    pageID: string, // Must be unique, used for page linking
    title: string,
    content: PageComponent[],
    conditionalLinks: LogicComponent[],
  }
  
  // ============== \\
  // LOGIC HANDLING \\
  // ============== \\
  
  export interface LogicComponent {
    // Used to do conditional logic based 
    // on some value input on the page.
  }
  
  export interface ComparisonLogic extends LogicComponent {
    component: "Comparison",

    type: string, // Valid types include ">", "<", ">=", "<=", "="
    valueID: string, // Value which is compared to the threshold
    threshold: any,
    satisfiedLink: string, // The pageID to link to given whether value satisfies the threshold given the comparison type
    notSatisfiedLink: string, // The pageID to link to given whether value satisfies the threshold given the comparison type
  }
  
  export interface SelectionLogic extends LogicComponent {
    component: "Selection",
    
    type: string, // Valid types include "all_selected", "at_least_one", "exactly_one", "none_selected"
    valueIDs: string[],
    satisfiedLink: string, // The pageID to link to given when the value satisfies the selection type
    notSatisfiedLink: string, // The pageID to link to otherwise
  }
}
