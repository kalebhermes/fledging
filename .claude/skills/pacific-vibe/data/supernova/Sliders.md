# Sliders

Sliders let users select a value or range of values along a defined scale. They provide a visual and interactive way to adjust numeric inputs, often used for settings where an approximate or relative value is sufficient. Sliders are especially useful for scenarios like filtering, adjusting settings, or exploring ranges where users benefit from direct manipulation.

There are three types of sliders in the system:

Default slider – for selecting a single continuous value
Range slider – for selecting a numeric range using two thumbs
Discrete slider – for selecting from predefined, stepped values

## Accessibility

Elements should be labeled properly to ensure proper function of assistive technology such as screen readers, screen magnifiers, and speech recognition software, used by people with disabilities. Refer to the WCAG guidelines for detailed accessibility guidelines.

Focus order refers to the logical sequence in which interactive elements (such as buttons, links, and form inputs) receive focus when a user navigates through a page using the keyboard (typically the Tab key). For screen reader accessibility, the focus order is crucial because it dictates how users perceive and interact with the content.

Keyboard:
- Tab: Moves the focus to the next interactive element (links, buttons, form fields, etc.)
- Shift + Tab: Moves the focus to the previous interactive element
- Enter + Space: Activates the currently focused element (e.g., clicking a button or selecting a link)
- Escape: Closes active element

## Usage

Sliders are best used for selecting numeric values along a defined range, especially when users benefit from quickly adjusting inputs visually rather than typing them. They offer an efficient way to fine-tune options like amounts, ranges, or percentages, and are ideal in scenarios where precision is secondary to ease of interaction. Sliders should be used intentionally and only when they improve the experience over other input types, such as dropdowns or number fields. Choosing the right slider type—default, range, or discrete—depends on the input context and whether the values are continuous or stepped.
Type

**When to use:** 

**Don't use when:** slider-default

A user needs to select a single value along a continuous scale

Precision input is required (e.g., typing an exact value is better)

slider-discrete

A user needs to filter or define a range of values (e.g., min to max)

Only a single value is needed, or the range isn't relevant

slider-range

A user needs to select from fixed, known steps (e.g., 5%, 10%, 15%)

The values are continuous or not well-suited to stepping or ticks

Common use cases
Adjusting a loan amount within available borrowing limits
Selecting a repayment term (e.g., 6, 12, 24 months) using discrete steps
Filtering transaction history by amount range
Narrowing results in investment screeners by performance or risk tolerance
Setting a budget goal or spending threshold
Simulating outcomes for retirement planning or mortgage estimators
Choosing an investment percentage allocation across assets
Adjusting contribution amounts for recurring deposits
Exploring different credit utilization levels for credit card tools

**Do:**
- Use a consistent handle and track style across all sliders
- Use a consistent handle and track style across all sliders
- Use a standard input instead of a slider when it would make the user experience more efficient.

**Don't:**
- Don’t change the color of the track or handle outside the defined variants
- Don’t change the color of the track or handle outside the defined variants
- Don’t use a slider with a marquee input when the marquee input is the more efficient input type.
