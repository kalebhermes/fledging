# Marquee

The static Marquee is a large, visually prominent typographic element used to introduce key content on a page or within a section. It helps establish hierarchy, set the tone, and draw attention to important content without requiring user input. Typically used at the top of a page, the static Marquee supports clear and bold communication through consistent styling and placement.

We currently support a few type of static Marquees:

marquee-standard
marquee-superscript
marquee-medium
marquee-small

## Accessibility

Accessibility labels are crucial for ensuring inputs are usable by individuals relying on screen readers.
Standard Marqee
Superscript Marquee
Medium Marquee
Small Marquee

Standard Marquee
Superscript Marquee
Medium Marquee
Small Marquee

Keyboard:
- Tab: Move to the next actionable element
- Esc: Deselect

## Usage

Use the static Marquee component to highlight the key piece of data on a page or within a section. To maintain its visual impact, it should be used sparingly. The component is most effective when paired with supporting context, such as a label or dynamic content like a live stock price change.
Type
Usage
marquee-standard
L1, L2 hero
marquee-superscript
L1, L2 hero
marquee-medium
L2, L3 hero
marquee-small
Cards, Containers

**When to use:** To draw attention to a key data point or message at the top of a page or section
When emphasizing a primary metric, like account balance or stock price
As a hero-style element to anchor a form, dashboard, or feature landing page
In combination with live or dynamic data to communicate updates or status changes

**Don't use when:** When the information is secondary or doesn't require visual emphasis
In dense layouts or areas with competing visual elements
As a replacement for standard text styles in lists, tables, or cards
In contexts where user input is expected — use a Marquee Input instead

Considerations
Data hierarchy: Use the Marquee to surface the most important data point on the screen—such as account balance, credit card balance, or net worth—so users can quickly orient themselves.
Clarity and precision: Display data in a clear, digestible format. Avoid long strings or overly complex messaging that may dilute the impact.
Contextual labeling: Always pair the Marquee with a clear label (e.g., “Current balance” or “Spending insights”) to provide context and reduce ambiguity.
Live updates: When displaying values that may change frequently, like stock prices or investment balances, ensure real-time updates are smooth and accessible.
Consistency: Use consistent formatting for numerical values, currency symbols, and decimal places to reinforce trust and readability.
Responsiveness: Make sure the component adapts well to smaller screens without truncating data.

**Do:**
- Use to surface high-priority data like account balance, credit limit, or portfolio value.
- Keep the content concise and avoid wrapping or truncation.
- Pair with a clear label or descriptor to give meaning to the number or value displayed.
- Trailing % should top align with the number, like the superscript cents pattern.

**Don't:**
- Don’t use for low-priority or secondary data points.
- Don’t use without surrounding context — it should never feel disconnected from the context of the page or section.
- Don’t repurpose for input — use the Marquee Input for editable or interactive text.
- Don't bottom align % to the number or indicate % in the same size and weight as the primary number.
