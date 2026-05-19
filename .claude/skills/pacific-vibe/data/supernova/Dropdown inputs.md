# Dropdown inputs

Dropdown components are a special type of text input. They streamline decision-making by presenting choices in a compact, easily navigable format. Dropdowns are commonly used in forms, filters, and settings, where users need to select a single option or multiple options from a dataset. We currently support 3 dropdown components: input-dropdown, input-autocomplete, and input-dropdown-small.

## Accessibility

Accessibility labels are crucial for ensuring dropdowns are usable by individuals relying on screen readers.

Keyboard:
- Tab: Enter text field, move to next actionable element
- Enter: Submit or select element
- Esc: Cancel or clear

## Usage

Dropdowns simplify decision-making by presenting predefined options in a compact, interactive format. The input-dropdown and input-dropdown-small components are ideal for smaller lists, while input-autocomplete are great for efficiency when filtering large datasets. By reducing cognitive load and guiding users to valid selections, these components streamline form inputs, searches, and data filtering.

**When to use:** Limited, predefined options: When users need to select from a small to medium-sized list of predefined, mutually exclusive options (e.g., country selection, account types).
Space efficiency: When space is limited, and listing all options would clutter the interface.
Rare changes: For inputs that are infrequently changed but need a clear default value (e.g., setting preferences like time zones).
Logical ordering: When options are ordered logically or hierarchically, such as alphabetical, numerical, or categorized groupings.
Single selection: When the task requires users to make one and only one selection.

**Don't use when:** Few options (2–3 Choices): Use radios or toggles instead, as they allow users to view and select options with fewer clicks.
Frequent changes: If users need to interact with the field often, consider alternatives like autocomplete, segmented controls, or editable text inputs.
Unfamiliar or long lists: Dropdowns can be cumbersome for large or unfamiliar datasets. Use searchable or grouped lists, or an autocomplete dropdown for better usability.
Contextual actions: If the selection triggers immediate actions, consider alternative components like buttons, menus, or inline interactions.
Accessibility concerns: Dropdowns can be challenging for screen readers and keyboard users if not properly implemented. For critical inputs, ensure high accessibility or consider simpler alternatives.
Overloading options: Avoid dropdowns for very long lists (e.g., 50+ items) without providing search or filtering to help users find options quickly.
Considerations

Some things to keep in mind when using dropdowns in your designs.

Selection-based dropdowns
input-dropdown and input-dropdown-small only
Do’s
Use for clear, predefined options: Employ dropdowns when users need to select from a concise, predefined list of mutually exclusive options.
Keep options manageable: Limit the number of options to avoid overwhelming users (ideally no more than 10–15). For longer lists, consider grouping or categorizing items.
Provide a default atate: Include a clear default value, such as "Select an option" or a pre-selected value placeholder, to guide users.
Order logically: Arrange options alphabetically, numerically, or in a logical hierarchy to make them easy to scan.
Use a clear label: Always pair the dropdown with a visible or programmatically associated label to clarify its purpose.
Provide visual feedback: Highlight the dropdown when it’s focused or open (stroke color and weight change).
Keep it compact: Use dropdowns to save space when displaying all options at once isn’t practical.
Don’ts
Don’t use for fewer than three options: For two or three options, use radio buttons or toggle switches, which are quicker and more intuitive.
Avoid long lists without search: Do not present very long lists without grouping or adding search functionality, as they become hard to navigate.
Don’t use dropdowns for freeform input: Avoid using dropdowns if users need to type their own values or make complex selections.
Avoid defaulting to the first option for required inputs: Using the first option as a default can lead to errors. Use a placeholder like "Select an option" instead.
Don’t overuse dropdowns: Avoid using dropdowns when other components (e.g., segmented controls, checkboxes) would result in faster and more straightforward interactions.
Don’t make dropdowns too small: Ensure the dropdown and its tap target are large enough for easy interaction, especially on mobile devices.
Don’t open dropdowns on hover (desktop): Avoid opening dropdowns on hover, as it can lead to accidental interactions. Use a click or tap to activate.
Autocomplete
input-autocomplete only
Do’s
Enable Real-Time Suggestions: Dynamically update the dropdown with relevant suggestions as users type, ensuring results are responsive and contextually accurate.
Prioritize Relevant Results: Display the most likely or frequently selected options at the top to reduce effort for users.
Highlight Matches: Use bolding or underlining to emphasize the matching parts of suggestions based on the user’s query.
Provide a Loading Indicator: For queries requiring asynchronous data fetching, display a spinner or loading text to indicate progress.
Support Keyboard Navigation: Ensure users can navigate suggestions with arrow keys and select them using Enter or Tab.
Include a "No Results" State: Provide feedback when no matches are found (e.g., “No results found”), and optionally suggest alternative actions.
Allow Freeform Input (if Applicable): If freeform entries are valid, ensure users can submit queries that are not part of the predefined list.
Limit the Number of Suggestions: Display a manageable number of suggestions (e.g., 5–10) to avoid overwhelming users, with an option to load more if necessary.
Make Suggestions Scrollable: If the suggestion list exceeds the visible area, enable scrolling rather than displaying an overly long list.
Optimize for Mobile: Ensure touch-friendly tap targets and consider expanding the dropdown to full-screen modal views on small devices.
Provide Context in Suggestions: Include additional details in each suggestion to clarify options, such as icons, secondary text, or categories.
Don’ts
Don’t overload suggestions: Avoid displaying excessively long lists or irrelevant results, as this creates cognitive load and confusion.
Avoid delays in updating suggestions: Ensure minimal lag between typing and the display of updated suggestions to maintain a smooth experience.
Don’t use ambiguous placeholders: Avoid placeholder text like “Search…” without clarifying what users can search for (e.g., “Search by name or email”).
Don’t dismiss suggestions prematurely: Ensure suggestions remain visible while the user types or navigates through the list until explicitly dismissed or completed.
Don’t force freeform inputs: If the input must match predefined values, clearly indicate this and prevent invalid submissions.
Don’t block progress: Avoid requiring users to select from suggestions if freeform entries are acceptable.
Don’t allow the input to overflow or truncate: Ensure the input field and dropdown scale appropriately for long queries or suggestions without cutting off critical information.
Avoid closing the dropdown on every keystroke: Keep the dropdown open and update dynamically, rather than causing disruptive open/close behavior.
Don’t forget empty states: Always provide clear feedback for states like no results or errors, rather than leaving the dropdown blank.
