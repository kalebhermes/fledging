# Accordion

An accordion is a UI component that displays a vertical stack of collapsible panels. Each panel can be expanded or collapsed individually to reveal or hide its content. This design pattern is often used to present content that can be grouped logically into sections, with each section typically containing one level of information. Accordions help reduce the amount of visible content on a page, providing a cleaner and more organized layout, while allowing users to access detailed information when needed.

## Accessibility

When the user clicks to expand or collapse, the accordion, focus should stay on the accordion's heading and voice out its state: "What options do I have, Collapsed." or "What options do I have, expanded."
Once expanded, they would use ‘tab’ to go through the expanded content.

Keyboard:
- Tab: Navigate to accordion and navigate to content
- Space or Enter: Expand or collapse the accordion

## Usage

**When to use:** An accordion is effective for organizing large amounts of content while initially keeping some details hidden. It’s ideal for allowing users to expand sections they’re interested in, without overwhelming them with too much information at once.

**Don't use when:** Avoid using an accordion to hide critical information, especially if it’s essential for decision-making or understanding. If most users are likely to read all the content, an accordion could create unnecessary clicks and risk important details being overlooked.

**Do:**
- Use an accordion when the content is extensive or contains details that aren't always needed. It allows users to access additional information as needed, keeping the interface clean and organized.
- Use accordions beneath relevant items in the interface to reduce page length and improve content organization.
- Keep accordions in the collapsed state by default, allowing users to expand them only when needed.
- Use accordions on the base layer of the screen to keep content easily accessible without disrupting the overall layout.

**Don't:**
- Avoid using an accordion for critical or essential information, as it may be overlooked or hidden from users.
- Avoid using accordions at the top of the page. They are best suited for secondary or supplementary information.
- Avoid expanding accordions by default, as this can lead to content overload and clutter the screen.
- Avoid placing accordions inside containers or elevated surfaces, as this can interfere with the clarity and flow of the interface.

**Content:** Titles: Keep titles brief and to the point, but ensure they are descriptive enough to give users a clear idea of what content will be revealed when the section is expanded.
Long Titles: If titles need to be longer, make sure they don't wrap to more than three lines. This helps maintain readability and ensures that the accordion remains visually clean and easy to navigate.
