# Rows (Small)

The Small Row is an alternative to the Standard Row where a condensed and contained layout is required. This alternative layout should only be used when only a title and value are needed. If a subtitle and value detail is required, then use the Standard Row types.

Note that not all Standard Row types are offered in the Small Row layout.

Types of small rows

Row Type

Visual

Usage

row-default-small

The most commonly used row pattern for displaying multiple data points

row-action-small

Lets users edit the data displayed in the row

row-statusPill-small

Highlight status with a status pill

row-valueChange-small

Show positive or negative value change and most recent value. Value changes are dynamic and adjust over time at a pre-determined cadence

row-progress-small

Shows a small progress meter to track progression, such as pay-off progression or application progression

row-holdings-small

Displays holdings-related information

## Accessibility

Each row is labeled differently depending on the use case of the row, follow the following guidelines to ensure accessibility for the component.

Since the entire row is actionable, there is no need for the screen reader to focus on individual elements within it. When the focus lands on the row, the screen reader should announce all relevant information in a single, cohesive statement, ensuring that users receive the full context at once. This includes the title, count, subtitle, right-side content, and any indication of the action.

Keyboard:
- Tab: Move to the next actionable element
- Space or Enter: Confirm action

## Usage

**Don't use when:** Content exceeds limits:
Title regularly needs >2 lines (or >1 line when paired with a count).
Subtitle regularly needs >4 lines (or >1 line in inverse title/subtitle layouts).
Value or Detail fields need more than 10 characters.
Items aren’t closely related or can’t be grouped: If related rows can’t be grouped (or would appear as isolated stand‑alones), explore other options.
The content isn’t quick‑scan, side‑by‑side information: If the layout demands dense, long‑form, or multi‑element content that breaks the row’s concise, scannable pattern.
Concepts are complex and may require visualizations, more text content, or complex interactions: Explore bespoke modules that solve the complex problem built upon our core components.
Selections not in the context of other rows: If a selection from a set of 3-5 options needs to be made, then consider using the Selector Tile if the selections don’t need to be in the context of other rows.
