# Filter pill

Filter pill or item uses tags or descriptive words to narrow down or organize content based on specific criteria. They act as visual indicators of active filters and enable users to adjust or refine their selections easily.

They are particularly effective in scenarios where:

Multiple filters are applied simultaneously.
Filters need to be added or removed dynamically.
A compact design is required for a clean and organized interface.

Filter pills (aka items) improve user experience by offering a clear, intuitive, and interactive way to refine results without overwhelming the interface.

## Accessibility

Group Labels
Each filter group (e.g., "Loan Type" or "Loan Provider") should have a clear label to indicate the category. This label should also inform users of the selected items within the group, if applicable.
Filter pill (item) Labels
The accessibility label for each filter pill should match its visible label. This ensures consistency and clarity for users relying on assistive technologies.

When navigating a filter group, the screen reader should first announce the selected filters in the order they appear.
After reading through the selected filters, it should then move to the first unselected filter in the list.
This ensures that users receive immediate feedback on their current selections before exploring additional options.

Keyboard:
- Tab: Move to the next actionable on the screen/different groups
- Space or Enter: Select/Deselect a filter item

## Usage

**When to use:** Filter pills are best used in contexts where users need to narrow down a list or set of results based on specific criteria. Their compact design and flexibility make them a great choice for dynamic and interactive filtering.

Use Case 1: Filters via a Filter Glyph/Overlay

This approach involves users tapping a filter glyph (commonly represented by an icon) that opens an overlay, sidebar, or modal containing filtering options. It is typically used in situations where there are numerous or complex filters that cannot be accommodated on the main screen.

Key Characteristics:

Entry Point: A single glyph or button (e.g., a funnel icon) serves as the access point for all filters.
Filtering Options: Users can select one or multiple filters presented in an overlay/modal format.
Save or Apply Filters: Often includes an "Apply" or "Save" button to confirm selections, or the filters apply dynamically as users make changes.

Pros:

Accommodates a large number of filters without cluttering the screen.
Allows users to focus on filtering in a separate, dedicated space.
