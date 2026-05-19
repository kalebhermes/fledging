# Buttons (v2)

A button component is a fundamental interactive element in a user interface that allows users to perform an action or trigger an event. The button can be used in a variety of contexts, like submitting forms, opening dialogs, navigating to other pages, or triggering system actions.

Button types

The next iteration of our PacificButton supports two button categories: Standard and Text buttons. The standard button supports primary, secondary, and tertiary priority buttons which each have their own styles and variants. The Text button is represented by one text style and no padding. It supports 6 types: default, brand, onDark, tip, caution, and danger. The textButton should be used sparingly and only in context of a component such as the Banner, container, list, or section. See the full list of supported types below:

Standard (Default) Buttons
button-primary-default
button-primary-destructive
button primary-onDark
button-secondary-default
button-secondary-onDark
button-tertiary-default
button-tertiary-onDark
Text Buttons
textButton-default
textButton-brand
textButton-onDark
textButton-tip
textButton-caution
textButton-success
textButton-danger
textButton-onLight

Finding it in Figma

Use the Buttons or Button Group component when you need to communicate an interactive action or set of actions in a design.

Step 1: Navigate to the Assets tab and select the Pacific - Core UI (Global) library.

Step 2: Choose the Buttons folder to see all global button components.

Step 3: Decide which priority and type of button you need for your use case. Drag and drop in your file.

Check out each button component in the component playground view to see high-level usage guidelines, properties, and more!

## Accessibility

The preferred accessibility label for a button should match the text displayed on the button, such as Next, Review, or Done. It is recommended to align the label (used for assistive technology like screen readers) with the visible label text.
If the button doesn’t have visible label text - icon buttons, the label should talk about the action performed by the button, such as Back, Profile etc.

In a page, the screen reader should go through all the supporting pieces of information on the screen before landing on hte action button.

Keyboard:
- Tab: Focus lands on (non-disabled) button
- Space or Enter: Activates the (non-disabled) button

## Usage

**Do:**
- DO use a single primary button per component or view.
- DO match button priority with action importance.
- DO use secondary or tertiary buttons for less critical or alternative actions.
- DO use a primary destructive button for a final, irreversible action.

**Don't:**
- DON'T use multiple primary buttons on the same screen.
- DON'T use a primary button for a "Cancel" or dismissive action.
- DON'T use a tertiary button for a high-priority CTA.
- DON'T mix priority types randomly.
