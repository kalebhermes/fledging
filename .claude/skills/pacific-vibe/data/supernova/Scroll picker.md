# Scroll picker

The scrollPicker component is used to display one or more scrollable lists of values from which users can choose. They provide an interactive and compact way for users to select specific items like dates, times, or other finite sets of options.

## Accessibility

Accessibility labels are crucial for ensuring scroll pickers are usable by individuals relying on screen readers.
The text field's accessibility label should clearly state the purpose of the input (for example, deliver date) and should match the placeholder text when the field is empty.
In case a selection has not been made
In case a selection has already been made
When the scroll picker is active, each list in the scrollPicker should have an accessible label describing its purpose (e.g., “Month”, “Day”, “Year”, “Hours”, “Minutes”).

If a selection has been made, focus should first land on the currently selected value in each list.
If no selection has been made, focus should first land on the default position (today’s date or first value in the list, depending on configuration).
Each list should allow sequential focus navigation for users to move through “Month,” “Day,” and “Year” columns if applicable.
Column Reading Behavior
While navigating within a column:
Each list item in the column should be focusable as users scroll using Up/Down arrow keys.
The screen reader should announce:
The column label context (e.g., “Month:”) to orient the user.
The value (e.g., “February”).
The position in the list if appropriate (e.g., “3 of 12”).
For example, a Date scrollPicker (MM/DD/YYYY):
“Month: February, 2 of 12”
“Day: 15, 15 of 31”
“Year: 2025, 26 of 50”

Keyboard:
- Enter / Space / Down: Opens the scrollPicker
- Enter / Space: Confirms the selection and closes the scrollPicker
- Escape: Closes the scrollPicker without saving changes
- Tab: Moves between columns (e.g., Month → Day → Year) and action buttons
- Home / End: Jumps to the first or last value in the list

## Usage

Scroll pickers are great for enabling users to select a single value from a finite list in a clean, touch-friendly way without requiring manual text input. They can enhance the user experience by providing a fast and structured method while reducing input errors while keeping the interface lightweight. However, scroll pickers must be implemented thoughtfully to avoid usability issues and should only be used when they are the most efficient input method for the user’s task.

**When to use:** Selecting day, month, or year in a form where keyboard input would be cumbersome
Selecting dates in a precise, structured format
Selecting times without typing
Choosing single, finite values from an ordered list

**Don't use when:** Multi-select tasks: Scroll pickers are for single-value selections only and are not suited for selecting multiple items or ranges
Complex or critical text input: Avoid using scroll pickers for inputs requiring detailed user input, as they can slow users down compared to direct typing.
Non-structured data: Do not use scroll pickers for data that lacks clear ordering or logical grouping.
Don’t use for complex input logic: If a selection requires dependent logic (e.g., filtering another list on selection), consider whether a scroll picker is the right component.
Considerations

When choosing between date selection inputs, use this guide to select the right component:

Component

Use Case

datePicker

Use when the user needs to see surrounding days for context.

Use when the user is selecting a date range.

scrollPicker

Use for most other date selection scenarios.

Ideal when the user is selecting a date far in the past or future.

keypad

Use when the user is copying or entering a known date format (e.g., date of birth, credit card expiration).

**Do:**
- Use for defined lists
- Keep text to one line
- Use for lists with four or more options

**Don't:**
- Don't use for long, unordered lists
- Don't have long text that overflows
- Don’t use for lists with less than four options
