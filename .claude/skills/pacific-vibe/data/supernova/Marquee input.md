# Marquee input

Input components are interactive elements that collect data from users. Each input type is designed for specific purposes, ensuring that users can easily and accurately provide the required information. These components often include labels, placeholders, and validation feedback to guide and assist users during data entry. The input-marquee is a special input type that acts as the hero of the page. It’s intended to be the primary focal point for the user and the most important input in a form.

The Marquee Input supports currency data and numerical data input.

Types

Currently, the system supports 3 types of Input Marquees. Refer to this list below for quick usage guidelines.

## Accessibility

Accessibility labels are crucial for ensuring inputs are usable by individuals relying on screen readers.
Default
Standalone
Inline

Default
Standalone
Inline

Keyboard:
- Tab: Move to the next actionable element

## Usage

The input-marquee is a prominent input field designed to capture high-visibility or critical user information in forms or funnels. Unlike standard input fields, the marquee input is large in size, both visually and functionally, making it the focal point of the page.

**When to use:** Amounts: The input-marquee is reserved for dollar amount inputs. This can include desired loan amounts, transfer amounts, sending money, making a payment, etc.
User input: The input marquee is reserved for interactive form elements, which require user input. It is not for static data.

**Don't use when:** Static data: Avoid this component when the hero value is only for informative display purposes.
Insignificant information: Don’t use the marquee for common fields like: name, email, address, etc.
Overuse: The input-marquee should not be overused, rather it should be used with clear intention to create hierarchy on the page and emphasize the input data.
Considerations

When incorporating tooltips into your interface, it's essential to balance their utility with usability and accessibility to ensure they enhance the user experience. Here are some key considerations:

Purpose and necessity
Use sparingly: The input marquee should only be used once on a screen.
Avoid redundancy: Only the primary input should be in the marquee style. Any other inputs on the page would be secondary or tertiary to this hero input and would be a standard input type.
Do

Use the input marquee as a hero form element at the top of a form section (generally at the top of the page).

Don't

Don't use an input marquee for insignificant information or below smaller form inputs.

Interaction

The input-marquee is inherently interactive, therefore we should maintain consistency in state usage and styles. The stroke, for example, provides an affordance to the user that the element is interactive, despite the amount being a neutral color.

Do

Use the marquee as designed and intended so that the element is consistent and familiar to users.

Don't

Don't modify type, padding, structure, or tokens.

Placement and layout

The input marquee should always be centered on the page because it is the hero of the page. By breaking up the layout, the input commands it’s focal point and emphasis. When users interact with the element, the input should seamlessly expand and contract horizontally from it’s center, while remaining pinned to the center and top of the parent container.

Do

Always align centered on the page in all states.

Don't

Don't left or right align to page.

**Do:**
- Use the input marquee as a hero form element at the top of a form section (generally at the top of the page).
- Use the marquee as designed and intended so that the element is consistent and familiar to users.
- Always align centered on the page in all states.

**Don't:**
- Don't use an input marquee for insignificant information or below smaller form inputs.
- Don't modify type, padding, structure, or tokens.
- Don't left or right align to page.
