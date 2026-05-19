# Sub header

A subHeader is used to visually group and separate related content by date. It helps users quickly scan and understand when certain actions or events occurred, improving the overall readability and organization of a list.

Common use cases: Activity logs, transaction history, message threads
Not interactive — purely for context and scannability
Typically appears sticky at the top of a group or section when in a container

## Accessibility

The screen reader should navigate the page in a logical, hierarchical order and lands on the sub-header in the same order

Keyboard:
- Tab: Move to the next actionable element on the page

## Usage

The Sub-header is a non-interactive label used to group related content within a list or section, often based on time (e.g., dates, years) or categories (e.g., statuses, types). It helps users quickly scan and understand the structure of information without adding cognitive load.
Purpose
Provides contextual grouping for list-based content
Improves readability and scannability in long or scrollable views
Reinforces temporal or categorical boundaries within a dataset
How to Use
Place sub header above the first item in a group to clearly separate it from other content.
Use consistent label formats (e.g., “March 2025”, “2024”, or “Completed”) depending on the content type.
Ensure sub header are visually distinct from the list items — typically using smaller font size, muted color, and rounded background.

**Do:**
- Use sub-headers to organize large lists of related information
- Keep labels concise and consistently formatted. It’s recommended to keep them short enough to fit on a single line.
- Ensure the sub-headers are non-actionable
- Use sub-headers inside containers and on color-surface-elevated surface.
- Only use the In Container=False variant on the page surface outside of any container.

**Don't:**
- Don’t use sub-headers for grouping unrelated content types.
- Don't create long labels for sub-headers.
- Use a Header component if you need to include a call-to-action (CTA) alongside the title.
- Don't use sub-headers on color-surface-sub
- Don't use the In Container=False variant within a card or container.
