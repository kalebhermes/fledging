# Segmented control

A segmentedControl is a linear set of 2-3 options with one segment selected at a time. A segmented control allows users to input, filter, change the presentation, or browse content in a view.

## Accessibility

Accessibility labels are crucial for ensuring segmented controls usable by individuals relying on screen readers.
Screen reader labeling for segmented controls should align with the visible label of the tab. Additional details can be included in the screen reader label when needed to provide clarity and reduce potential confusion. You should also include the tab's position in the set (e.g., "Option 1 of 5"), to help users understand the total number of tabs in the menu.

The focus initially appears on the first interactive element, signaling to the user that it is selected. From there, the user can continue navigating through the remaining interactive elements within the tab menu until all available items are navigated.

Keyboard:
- Tab: Move to the next actionable on the screen
- Space or Enter: Activate a tab

## Usage

**When to use:** To switch between views within a small area of content.
When changing the view or filter only, not navigating to different sections. Best for lightweight, local context switching, not for broader navigation.
When the options are few (2–4) and closely related.

**Don't use when:** To switch between views that represent the main content of a surface → use tabs instead.
To navigate between categories or sections under a parent → use tabs instead.
To act as radio control within a form.
When the switch significantly changes the layout or functionality of the screen.
Common use cases

Browsing between subscription options

Browsing between payment options

Filtering between holdings and watchlist

Filtering options settings

Considerations

When choosing between tabs versus segmented controls, use this guide to select the right component:

Component

Use Case

segmentedControl

The categories are few (2–4).

Tapping a segmented control will filter a smaller content segment in the current view or change its presentation.

Content in one segment is likely to exist in another.

tab

There may be up to 6 categories needing horizontal scroll.

Tapping a tab slides in a new view from the left or right to reveal new content under a parent rather than toggling a view.

Usually, content within one tab doesn't live inside another.

**Do:**
- Use clear labels
- Ensure minimal loading state
- Maintain clear hierarchy

**Don't:**
- Don't use long labels
- Don’t allow slow switching or loading
- Don’t disrupt hierarchy with unclear spacing
