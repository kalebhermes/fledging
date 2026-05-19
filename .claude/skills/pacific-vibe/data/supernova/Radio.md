# Radio

Radio buttons are used for mutually exclusive choices, not for multiple choices. Only one radio button can be selected at a time. When a user chooses a new item, the previous choice is automatically deselected.

## Accessibility

The accessibility label for a radio is generally the same as the label.
Error state
When a radio is in an error state, the screen reader should announce the error message immediately after the radio label.
Example: "Agree to terms, radio, not selected, error: This field is required."

Since the disabled state is non actionable, it should be skipped in the tab order.

The screen reader should navigate the page in a logical, hierarchical order and focus on the radio component, including its label and any associated error state, as a single, cohesive unit. This ensures that all relevant information is conveyed together at once.
If a radio is in a group, the reader should first land on the selected/primary option and then go through the rest.

Keyboard:
- Tab: Moves to the next element in a group
- Space or Enter: Toggles a focused radio between selected and not selected
- Shift + Tab: To select the last radio button item in a group

## Usage

**When to use:** In a list, form, or table where users are presented with multiple related options but can only select one.
When selection does not take effect immediately and requires form submission.
Where not to use
If there is only one item to select or deselect for instance in case of terms and conditions; use a checkbox instead.
When it’s challenging to convey visually that the Radio toggles a setting on or off; use a toggle instead.

**Do:**
- Use radio buttons when users need to select a single, definitive option from a list of mutually exclusive choices, ensuring clarity in the selection process.
- Use a radio button for binary questions where the user’s selection requires form submission to be applied, ensuring clarity and precision in the selection.
- Allow long labels to wrap to a second line instead of truncating them, ensuring the full text is visible. The label text should wrap beneath the radio button for better alignment and readability.

**Don't:**
- Use checkboxes when only one option can be selected, as this can create confusion. Checkboxes are better suited for scenarios where users can choose multiple options or none at all.
- Use a radio button for settings that need to toggle instantly. Instead, use a toggle switch for real-time, immediate changes, especially on mobile, for a clearer and more responsive user experience.
- Do not truncate long labels or force them onto a single line, as this can confuse users and reduce clarity. Avoid misaligning labels with the control.
