# Usage Overview

It is recommended to use either Chrome or Firefox. While the editor may work with other browsers, only Chrome and Firefox are extensively tested. It is also recommended that you keep this guide document open during the workflow editing process.

## Using the Editor

The basic page setup lays out pages horizontally with their respective components underneath them. Press the plus button on the right hand side to add new pages. Click on a page's header card to edit its properties, or to add, modify, or delete its components. You can also click on a page's name to modify it.

In the bottom right you can find the utility buttons. Hover over these to see their labels. Using these buttons one can import a workflow from a `.json` file or from the server, one can upload their workflow to the server, and the editor's theme can also be changed.

Page order is irrelevant and has no effect on the workflow, it is merely for user convenience. Component order does matter, and components can be reordered by drag and drop. They can also be moved to different pages.

## Branching Logic

Each page automatically will have a "Next" and "Prev" button. The "Prev" button will always return to the previous page. The "Next" button has more complex behavior and is used to create branching logic within a workflow. By default, the "Next" button goes to the page specified by the `defaultLink` property.

There are two ways that the `defaultLink` property can be overwritten: by `MultipleChoice` components and by any type of `LogicComponent`. More information can be found in these components respective sections below, however the general gist is as follows:

`MultipleChoice` can overwritten `defaultLink` if they do not have `multiselect` enabled. Such a `MultipleChoice` component will have a `link` property on each of it's `Choice`s. The `link` of the `Choice` which is selected will overwritten the `defaultLink` of the page when the "Next" button is pressed.

The other way that `defaultLink` can be overwritten is if a `LogicComponent` is triggered. The conditions specified in each of a page's `LogicComponent`s are checked when the "Next" button is pressed. If a `LogicComponent`'s condition is found to be satisfied, then it's `satisfiedLink` will overwrite the page's `defaultLink`.

If *multiple* `LogicComponent`s have their conditions satisfied, the highest LogicComponent on the page will take highest precedence.

## About ValueIDs

This section is *very important* so please read it carefully. ValueIDs are what make this whole thing work. For any component which takes data, whether that be a `TextInput`, `MultipleChoice` or something else, the component must have a `valueID` property. This serves several functions.

A component's `valueID` corresponds to the column of the database where that component's data will go. This means a few things. Firstly, it means that the component's `valueID` should clearly indicate what it is storing. For example a `TextInput` used by the nurses to record a child's age might be called `child_age`. The second implication of this is that `valueID`s should almost *never* be changed! If you are editing a workflow and a piece of data is being collected somewhere on some page with a certain `valueID`, make *absolutely* sure that if you modify the workflow such that the data in quesiton is being collected somewhere else it is still being collected under the same `valueID`. **Failure to do this will result in the creation of a new column in the database, meaning there will now be multiple columns each storing pieces of the same data.** This is extremely undesirable.

To help try and ensure this does not happen, workflow validation will compare your workflow's `valueID`s to the existing database columns, and give you a warning if any would create a new column. When submitting again, you must indicate to override these warnings if you genuinely intend to create a new database column (such as if you are adding some new piece of data to be collected which was not being collected before). Make sure you are absolutely sure that you wish to create new database columns if you are overriding these warnings.

A component's `valueID` is also used to make branching logic work. Specifically, each `LogicComponent` has a `targetValueID`, which is the `valueID` it will look at. This does not need to be a `valueID` on that page, so information from previous pages can affect branching on the current page.

# Component Specifications

`Page`

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

## Page Components

`MediaItem` (PageComponent)

    fileName: string, // The file name of the image or video to display
    label?: string, // Optional text to display underneath the image or video

    MultipleChoice (PageComponent)
    // Unique id for the input value for this page component
    valueID: string,

    // A text label, generally a question prompt
    label: string,

    // A set of choices or answers for the question
    choices: Choice[],

    // Whether the user can select multiple options
    multiselect: boolean,

`Choice` (SubComponent)

    The text this choice displays, e.g. "Option A"
    text: string,

    // The value associated with selecting this choice (can be same or different to text)
    // You might want this to be different if some logic is done based on this choice
    value: any,

    // Page id that this choice should link to if selected (not valid if parent has multiselect)
    link?: string,

`TextInput` (PageComponent)

    // Unique id for the input value for this page component
    valueID: string,

    // Text indicating what should be input
    label: string,

    // Type of input to accept, e.g. "numeric", "alphanumeric", "default", "any"
    // Default means alphabetical character input only, no numbers
    type: string,

    units?: string, // If provided, displayed next to the TextInput, e.g. "cm" (optional)
    defaultValue?: any, // The type of this depends on type property (optional)

`Button` (PageComponent)

    // The button's display text, defaults to "Next"
    text?: string,

    hint?: string, // Displayed above button detailing, when/why to skip (optional)
    link: string, // The pageID this button skips to if pressed

`Counter` (PageComponent)

    // Unique id for the input value for this page component
    valueID: string,

    title: string,
    hint?: string,
    timeLimit: number, // Given in seconds
    offerManualInput: boolean,

`Modal` (PageComponent)

    pageID: string,
    // Must be unique, used for link properties on other components
    // To link to a modal via it's pageID, a component must specify that ID and the modal must be on the same page

    title: string,
    content: string[], // Each string is displayed as a separate paragraph
    buttons: Button[], // Navigation used to exit the modal
    showCloseButton: boolean, // Whether to display a button that closes the modal, returning the the current (parent) page

## Logic Components

`ComparisonLogic` (LogicComponent)

    type: string, // Valid types include ">", "<", ">=", "<=", "="
    targetValueID: string, // Value which is compared to the threshold
    threshold: any,
    satisfiedLink: string, // The pageID to link to given whether value satisfies the threshold given the comparison type
    
`SelectionLogic` (LogicComponent)

    type: string, // Valid types include "all_selected", "at_least_one", "exactly_one", "none_selected"
    targetValueID: string[],
    satisfiedLink: string, // The pageID to link to given when the value satisfies the selection type

# Making Changes

Run `tsc npx -w` to tell the TypeScript compiler to watch for changes. Then, open index.html in the browser. Any changes you make the the HTML, CSS or TypeScript should be updated on refresh.

If working with the server, run `python -m http.server 8080` to serve the editor at http://localhost:8080/. Otherwise, you may encounter cors issues when exporting if opening the file directly in your browser.