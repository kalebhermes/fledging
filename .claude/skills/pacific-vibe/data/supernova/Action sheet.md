# Action sheet

An Action Sheet is a bottom-aligned overlay that presents a set of contextual actions. It's commonly used for mobile interfaces when users need to choose between several related options without navigating away from the current screen.

Appears as a modal sliding up from the bottom
Typically includes multiple action items and a Cancel button
Temporarily blocks interaction with the background content

## Accessibility

ActionSheet Activation - When a user lands on a page or performs an action that opens the ActionSheet, the screen reader should announce "Actions open" to indicate its activation.
ActionSheet Dismissal - When the ActionSheet is dismissed due to user action or navigation, the screen reader should announce "Actions dismissed" to inform the user.

Keyboard:
- Tab and Arrows: Navigate between actions
- Space or Enter: Trigger an action
- Esc: Dismiss the action sheet

## Usage

Action Sheets are used to present a set of contextual actions without taking the user away from the current screen. They are best suited for mobile experiences where space is limited and multiple actions need to be surfaced in a lightweight, interruptive layer

**When to use:** To offer multiple related actions tied to a user-initiated task (e.g., tapping a settings icon)
When the user must make a quick choice between options before continuing
In mobile-first designs, where modal dialogs may feel too heavy
As a replacement for Action bar in case the list is longer.

When to not to use
Don’t use action sheets for critical confirmations or decisions with consequences — use a Dialog instead.
Avoid using them to display large amounts of content or multi-step forms — use a Bottom Sheet or full screen instead.
Don’t use if a single, primary action is needed — a button or toast may be more appropriate.

**Do:**
- Use clear, action-oriented labels
- Include a Cancel option when dismissal is possible
- Keep action count minimal (ideally 2–5 options)
- Use for contextual actions related to user flow.
- Style destructive actions (like “Cancel”) distinctly

**Don't:**
- Don't use vague or overly long labels.
- Don't rely on users tapping outside the sheet to exit if they might get confused
- Overload with too many actions or unrelated choices
- Don't use for critical confirmations or multi-step flows — dialogs or bottom sheets are better.
- Don't place destructive actions at the top or style them the same as neutral ones
