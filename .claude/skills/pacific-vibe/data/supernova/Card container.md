# Card container

Cards are used to contain related information. They can be interactive, constructed of different components, or a simple container for static content. Our two foundational card components are PacificCard and PacificCardContainer. These are the card styles that we support without content, just plug in your content to use them as a base to built any card component on.

## Accessibility

When using a screen reader, the written information on a card is spoken out loud. If an image on a card is only for decoration, it should ’t be read by the screen reader. Additionally, all elements that can be interacted with must be accessible to both screen readers and keyboard users.

Non-actionable card - Focus on the card and verbalize the action.
Card with actionable buttons -
Tray banner
Pill
Header
Supporting data/body
Image with alt text
Primary CTA
Secondary CTA/actopm
Card with an actionable container - Focus on the card and verbalize the action.

Keyboard:
- Tab: Move forward to the next card
- Shift + tab: Move focus backward to the previous card
- Space: If the card is selectable, the space bar will toggle selection.

## Usage

**Do:**
- When displaying cards in a vertical list, cards should be the same size (small, medium, or large). This will ensure that their corner radii are consistent.
- Keep the space (gap) between cards consistent.
- Cards in a grid should be the same size (small, medium, or large).
- Vertical and horizontal gaps should be consistent throughout the grid.
- Card sizes should be consistent in a carousel.
- Horizontal gaps should be consistent in carousels.
- Only use either a label or an appended banner with a card container.
- Only use a label or banner with a card in the primary position.
- Only pair non-emphasized style banners with cards.
- Keep status indicators visually consistent. In this example, the pill and appended banner are communicating related information, therefore they're using the same status types.
- Use the nested banner properties as they are intended.
- Only append banners to the bottom of a card.
- Create hierarchy among cards by calling out the most relevant information with the Brand label type.
- Card labels should only be used to call out the most primary information in a set.
- Keep the label text short, concise, and no more than one line.

**Don't:**
- Don't mix card sizes in a vertical list.
- Don't mix gap values between vertically stacked cards in a list. Follow our dimensions guidelines for more info.
- Don't mix card sizes in a grid layout.
- Don't mix different vertical and horizontal gaps.
- Don't mix card sizes in a carousel.
- Don't mix gap values between cards in a carousel.
- Do not combine a banner and label together with one card.
- Don't use a label or appended banner with a card in the tertiary position.
- Don't use the emphasized version of a banner when attached to cards.
- Don't mix visual status indicator types when communicating related information. The pill and banner should visually show a relationship.
- Don't change banner font sizes, colors, padding, or corner radius.
- Don't append banners to the top of a card.
- Don't overuse the Brand card label style as it draws the users eye and should be used to create hierarchy among many options.
- Don't attach labels to secondary or tertiary information and don't attach a label to a full width card at larger breakpoints.
- Don't use wordy labels or wrap the label's text to two or more lines.
