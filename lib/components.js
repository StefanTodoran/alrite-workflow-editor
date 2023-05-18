export let documentation = {
    "Page": {
        "defaultLink": 'By default each page has two buttons, "Next" and "Prev". The page "Next" sends to may depend on logic in the page. If no logic is triggered, defaultLink is the destination.<br><br>However, LogicComponents trigger when "Next" is pressed and can override this defaultLink. If there are multiple LogicComponents, tiebreaking if multiple are satisfied is done based on order (highest on page has highest precedence).',
        "isDiagnosisPage": "After all data has been collected, there is a special page displaying all the collected information and diagnoses. There should be only one page that is the diagnosis page. This page has no components.",
    },
    "Paragraph": {
        "text": "The paragraph text content."
    },
    "MediaItem": {
        "fileName": "The file name of the image or video to display.<br>This will have to be uploaded to the workflow via the admin page.",
        "label": "Optional text to display underneath the image or video."
    },
    "MultipleChoice": {
        "label": "Text prompt indicating what the nurse should input.",
        "valueID": "Unique id for the input value for this page component. This will also be the name of the corresponding column in the patient database.",
        "multiselect": "If true, multiple choice can be selected, so the choices will be checkboxes. Otherwise, only one option may be selected, so the choices will be radio buttons.",
    },
    "Choice": {
        "text": "The text this choice displays, indicating when to select.",
        "value": "The value associated with selecting this choice (can be the same or different to text). You might want this to be different if some logic is done based on this choice.",
        "link": "The pageID that should this choice should link to if selected. Not valid if the multiple choice component has multiselect enabled.",
    },
    "TextInput": {
        "label": "Text prompt indicating what the nurse should input.",
        "type": 'Type of input to accept, e.g. "numeric", "alphanumeric", "text", "any".<br><br>Default is the same as text and means alphabetical character input only, no numbers. Any means no restrictions.',
        "valueID": "Unique id for the input value for this page component. This will also be the name of the corresponding column in the patient database.",
        "units": 'If provided, displayed next to the TextInput, e.g. "cm".',
        "defaultValue": "Default value to the text input should start off with. The type of this depends on type property.",
    },
    "Button": {
        "text": 'Text displayed inside the button, should indicate what happens on press.<br>E.g. "Next Page", "Skip", "Previous", etc.',
        "hint": "Displayed above the button, should describe in more detail when/why to press.",
        "link": "The pageID of the page this button will open on press.",
    },
    "Counter": {
        "title": "Text prompt displayed above the counter, indicating what is being counted.",
        "hint": "Optional supplement to the title indicating in more detail what should be input, displayed underneath the title.",
        "timeLimit": "Duration over which the counting should take place, given in seconds.",
        "valueID": "Unique id for the input value for this page component. This will also be the name of the corresponding column in the patient database.",
        "offerManualInput": "Whether or not the nurse should be able to bypass the counting process and simply type in a value.",
    },
    "Comparison": {
        "type": `The type of comparison to be done. The left side of the operation will be the target value, and the right will be the threshold. For example:<br><br>If type is ">" threshold is 40 and targetValueID is "value_01", then the comparison would be: is value_01's value > 40?`,
        "threshold": "Threshold the target value will be compared to.",
        "targetValueID": "Unique id for some input value in another component on this page. This value will be checked against the threshold.",
        "satisfiedLink": 'On pressing the "Next" button, if the target value satisfies the threshold, the page that should be navigated to.',
    },
    "Selection": {
        "type": 'The type of comparison to be done. Valid types include:<br>"all_selected", "at_least_one", "exactly_one", "none_selected"',
        "targetValueID": "Unique id for some input value in another component on this page. This value will be checked against the threshold.",
        "satisfiedLink": 'On pressing the "Next" button, if the target value satisfies the selection type, the page that should be navigated to.',
    },
    "Validation": {
        "type": `The type of comparison to be done. The left side of the operation will be the target value, and the right will be the threshold. For example:<br><br>If type is ">" threshold is 40 and targetValueID is "value_01", then the comparison would be: is value_01's value > 40?`,
        "threshold": "Threshold the target value will be compared to.",
        "targetValueID": "Unique id for some input value in another component on this page. This value will be checked against the threshold.",
    },
};
