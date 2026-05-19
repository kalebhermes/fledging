# Rows

The PacificRow is a key structural element used to display a collection of related data points in a clean, easy-to-read format. It is typically used for lists, records, or any situation where information needs to be displayed in a tabular, grid-like, or stacked format. This component allows the presentation of data in a compact, yet organized way, with customizable design options for each element within the row.

## Accessibility

Each row is labeled differently depending on the use case of the row, follow the following guidelines to ensure accessibility for the component.
Default row
Informational row
Disabled row
Toggle row
Action - Copy
Action - Edit
Action - Delete
Action - Add
Action - Checkbox
Action - Radio
Progress row
Holdings row
Title card row

Since the entire row is actionable, there is no need for the screen reader to focus on individual elements within it. When the focus lands on the row, the screen reader should announce all relevant information in a single, cohesive statement, ensuring that users receive the full context at once. This includes the title, subtitle, right-side content, and any indication of the action.

Keyboard:
- Tab: Move to the next actionable element
- Space or Enter: Confirm action

## Usage

Rows are ideal for stacking information to make visual scanning easy. Since the cells inside are aligned side by side, they allow the user to scan a series of related data quickly while maintaining readability. Key data points are condensed, simple, and responsive across devices. Rows are often used for selection patterns where list items, icons, or even forms are shown side by side.
In-line actions
When designing rows that let users edit, copy, or delete content, ensure the row establishes a clear association with the title being acted upon. The title should represent the primary content being targeted, while the subtitle serves as supplementary information to provide additional context.
Use row-add, row-delete, row-delete or row-edit instead of adding link text.
Content limitations
Make sure the content is easily understood and brief. Follow these guidelines when inserting content into rows based on the title's relationship.
Title without count
Do: Maximum 2 lines of title can be used here. Keep the text within each row concise and direct to avoid crowding or complexity. Subtitle can be a maximum of 4 lines, but we recommend aiming for no more than 2 lines.
Don’t: Exceed the title beyond 2 lines; be concise where possible.
Title with count
Do: Maximum 1 line of title should be there in a case where the title is clubbed with a count. Subtitle stays a maximum of 4 lines.
Don’t: Exceed the title beyond 1 line.
Title with inverse relationship
Do: Limit the subtitle to 1 line and the title to 2 lines of text.
Don’t: Exceed the subtitle beyond 1 line and title beyond 2 lines.
Value & Detail Character Limit
Maximum character count for both Value and Detail fields is 10 characters each.
Ensure text remains concise and clear within this limit.
Grouping
Ensure to group rows that are closely related:
Do: Group rows by category or relationship to maintain a logical flow and improve usability.
Don’t: Avoid placing related rows as stand-alone rows, as it can disrupt the user’s experience and create unnecessary separation.
Artwork guidance
Ensure that the artwork is consistent and related to the row:
Do: Use glyphs that complement the content of each row, making it easier for users to quickly identify categories.
Don’t: Avoid using random or unrelated icons, which can confuse the user about the purpose of the data being presented.
Get rid of backgrounds for glyphs
Glyphs should’t contain a gray background.
Do: Use glyphs with no background.
Don’t: Give a gray background to glyphs.
Clipping
Do: Either apply a corner radius of 24px to the group or add a bottom cap for a clean, finished look.
Don’t: Leave the bottom row of a group unclipped or without a bottom cap, as it can appear incomplete or visually unrefined.
Dividers
In a list of rows, the last row in the list should not show the divider, unless a bottom cap “View more” button is present.
Ensure that different rows have a clear visual divider between them.
Do: Hide the row divider if another divider element is being added, to avoid redundancy.
Don’t: Use two divider elements together, as it can create unnecessary visual clutter.
Do: Remove the row divider if the row is the last (bottom) row in a group, ensuring a seamless and polished visual appearance.
Don’t: Leave the row divider visible on the bottom row, as it can disrupt the overall design consistency.
Tap targets
Single-tap target
Do: Make the entire row tappable to ensure easy interaction.
Don’t: Restrict the tap target to just one specific element, as it can reduce usability and frustrate users.
Double-tap target
Do: Ensure the entire row is tappable for the primary action, and include a secondary tap target for additional actions.
Don’t: Restrict the tap targets to two small, confined areas within the row, as this can hinder usability and interaction.
Tap target guidelines
Ensure the secondary tap target is at least 48×48 px in size to ensure UX best practices.
