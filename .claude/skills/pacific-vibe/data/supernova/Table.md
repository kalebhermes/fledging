# Table

Tables organize and present data in a structured, easy-to-scan layout. They are particularly useful for displaying datasets that are comparative, repetitive, or require clear organization across multiple fields. In our system, tables are often used to display loan terms, offers, account details, and other forms of structured information. Currently, we support two types of table layouts:

Default: standard full-width layout, where all columns are visible without horizontal scrolling
Small: a condensed mobile version where horizontal scrolling is enabled with a sticky first column to preserve context across scrolling actions
Note that the small version of the table layout may not be the best adaptation for your use case. We recommend reorganizing table data into cards designed for mobile viewports as an alternative solution.

## Accessibility

Elements should be labeled properly to ensure proper function of assistive technology such as screen readers, screen magnifiers, and speech recognition software, used by people with disabilities. Refer to the WCAG guidelines for detailed accessibility guidelines.

Focus order refers to the logical sequence in which interactive elements (such as buttons, links, and form inputs) receive focus when a user navigates through a page using the keyboard (typically the Tab key). For screen reader accessibility, the focus order is crucial because it dictates how users perceive and interact with the content.

Keyboard:
- Tab: Moves the focus to the next interactive element (links, buttons, form fields, etc.)
- Shift + Tab: Moves the focus to the previous interactive element
- Enter + Space: Activates the currently focused element (e.g., clicking a button or selecting a link)
- Escape: Closes active element

## Usage

Tables are best used for organizing large sets of related data in a structured, scannable format. They allow users to easily compare, analyze, and make decisions based on multiple attributes at once. In our system, tables are designed to prioritize clarity, efficiency, and accessibility across both desktop and mobile layouts. Choosing when and how to use tables thoughtfully ensures users can quickly find and understand key information without feeling overwhelmed.

**When to use:** When presenting structured, repetitive data that users need to scan, compare, or analyze.
When displaying financial information such as loan offers, account balances, transaction details, payment schedules, or investment performance.
When column labels add important context to the information and help users understand attributes at a glance.
When data needs to be sortable, scannable, or organized in a consistent format across multiple items.

**Don't use when:** When displaying only one or two fields of data — in that case, simpler UI patterns like cards, lists, or key-value pairs may be more appropriate.
When information is highly narrative, unstructured, or short-form — consider using text content layouts instead.
When users are expected to take action on a single item — modals, tiles, or action rows could offer a more focused interaction.

Common use cases
Showing multiple loan offer options side-by-side for user comparison.
Listing a history of transactions with amounts, dates, and descriptions.
Summarizing account balances across multiple financial products (e.g., savings, credit cards, investments).
Presenting investment performance details such as returns, risk levels, and fees.
Displaying repayment schedules including due dates, remaining balance, and minimum payment amounts.

**Do:**
- Do use clear, concise labels in the header row for easy scanning.
- Do keep columns consistent in data type and formatting (e.g., all dollar amounts right-aligned).
- Do enable horizontal scrolling gracefully on mobile with a sticky first column for context.
- Do use the full-width property from edge to edge (mobile only) for large tables that have several columns.
- Don't use a full-width (no border radii) Table when padding is included on either side of the page.

**Don't:**
- Don’t overload tables with too much dense data — prioritize what matters most to users.
- Don’t make users scroll both vertically and horizontally excessively — design the layout to minimize cognitive load.
- Don’t mix too many different data types (like text, numbers, icons, buttons) without clear separation — it can cause visual clutter and confusion.
