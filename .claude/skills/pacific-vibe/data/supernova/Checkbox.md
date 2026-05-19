# Checkbox

Checkboxes are designed for multiple choices, not for mutually exclusive options. Each checkbox operates independently, so selecting one doesn't affect any other selections. This means you can check as many boxes as you need without impacting your previous choices.

## Accessibility

The accessibility label for a checkbox is generally the same as the label.
Error state
When a checkbox is in an error state, the screen reader should announce the error message immediately after the checkbox label.
Example: "Agree to terms, checkbox, not selected, error: This field is required."

Since the disabled state is non-actionable, it should be skipped in the tab order.

The screen reader should navigate the page in a logical, hierarchical order and focus on the checkbox component, including its label and any associated error state, as a single, cohesive unit. This ensures that all relevant information is conveyed together at once.
Checkbox list
When navigating a checkbox list, ensure that the focus initially lands on the selected checkbox, and allow users to move through the options using the up and down arrow keys.

Keyboard:
- Tab: Moves to the next element in a group
- Space or Enter: Toggles a focused checkbox between selected and not selected

## Usage

**When to use:** Use checkboxes to allow users to select any number of options from a list or accept terms and conditions.
Each checkbox is independent of all other checkboxes in a group, and checking one box doesn’t uncheck the others.
Where not to use
Avoid using checkboxes when a user can select only one option from a list; in this case, use radio instead.
Do not use checkboxes for options that take immediate effect, such as switching between light and dark mode; instead, use a toggle for such actions.

**Do:**
- Use checkboxes to allow users to select multiple options (or none) from a list, providing flexibility for multiple selections.
- Use checkboxes to allow users to make multiple selections from a list of options, enabling them to choose one or more items as needed.
- Long labels may wrap to a second line, and this is preferable to truncation. Text should wrap beneath the checkbox so the control and label are top-aligned.
- Make sure the error message is properly aligned with the area of the error. For example, if the error pertains to a specific group, it should be a global error message clearly indicating the issue.
- Ensure that the error message is always associated with the label, so users can clearly understand the context of the error.

**Don't:**
- Use a radio button for selecting multiple options. Instead, use it for choosing a single option from a list of mutually exclusive choices.
- Use checkboxes to represent activation states (e.g., toggling on or off). For activation or binary states, use toggles to provide a clearer visual cue.
- Do not centrally align labels to text boxes, as this can create visual misalignment and hinder readability.
- Don’t place the error message in a location that doesn’t clearly associate with the specific element or group in error, as this can lead to confusion and hinder user understanding.
- Don’t replace the label with the error message. The label should remain visible, and the error message should be an additional, separate indication.
