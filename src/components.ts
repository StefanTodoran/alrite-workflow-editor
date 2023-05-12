export module Components {

  export interface Component { }

  export interface Page {
    pageID: string, // Must be unique, used for page linking
    title: string,
    content: Component[],

    // By default each page has two buttons, "Next" and "Prev". While "Prev" always returns to the page which
    // linked to this page, the page "Next" sends to may depend on logic in the page. If no logic is triggered,
    // defaultLink is the destination. However, LogicComponents trigger when "Next" is pressed and can override
    // this defaultLink. If there are multiple LogicComponents, tiebreaking if multiple are satisfied is done
    // based on order (highest on page has highest precedence). 
    defaultLink: string, 

    isDiagnosisPage: boolean,
  }

  // =============== \\
  // PAGE COMPONENTS \\
  // =============== \\

  export interface PageComponent extends Component {
    // Represents any page component that has a 
    // visual element to display on the page.
  }

  export interface Paragraph extends PageComponent {
    text: string,
  }

  export interface MediaItem extends PageComponent {
    fileName: string, // The file name of the image or video to display
    label?: string, // Optional text to display underneath the image or video
  }

  export interface MultipleChoice extends PageComponent {
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
    // Unique id for the input value for this page component
    valueID: string,

    // Text indicating what should be input
    label: string,

    // Type of input to accept, e.g. "numeric", "alphanumeric", "default", "any"
    // Default means alphabetical character input only, no numbers
    type: string,

    units?: string, // If provided, displayed next to the TextInput, e.g. "cm" (optional)
    defaultValue?: any, // The type of this depends on type property (optional)
  }

  export interface Button extends PageComponent {
    // The button's display text, defaults to "Next"
    text?: string,

    hint?: string, // Displayed above button detailing, when/why to skip (optional)
    link: string, // The pageID this button skips to if pressed
  }

  export interface Counter extends PageComponent {
    // Unique id for the input value for this page component
    valueID: string,

    title: string,
    hint?: string,
    timeLimit: number, // Given in seconds
    offerManualInput: boolean,
  }

  // ============== \\
  // LOGIC HANDLING \\
  // ============== \\

  export interface LogicComponent extends Component {
    // Used to do conditional logic based 
    // on some value input on the page.
  }

  export interface ComparisonLogic extends LogicComponent {
    type: string, // Valid types include ">", "<", ">=", "<=", "="
    targetValueID: string, // Value which is compared to the threshold
    threshold: number,
    satisfiedLink: string, // The pageID to link to given whether value satisfies the threshold given the comparison type
  }

  export interface SelectionLogic extends LogicComponent {
    type: string, // Valid types include "all_selected", "at_least_one", "exactly_one", "none_selected"
    targetValueID: string,
    satisfiedLink: string, // The pageID to link to given when the value satisfies the selection type
  }
}
