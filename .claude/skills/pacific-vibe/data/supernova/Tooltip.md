# Tooltip

Our Tooltip component is a small, contextual pop-up that provides brief, informative text when a user hovers over, focuses on, or interacts with an element. Tooltips are commonly used to offer explanations, definitions, or supplementary details without cluttering the main interface.

## Accessibility

Accessibility labels are crucial for ensuring tooltips are usable by individuals relying on screen readers.

Keyboard:
- Tab: Move to the next actionable element
- Esc: Close tooltip

## Usage

Tooltips are great for providing additional contextual information without cluttering the interface. They can enhance the user experience by offering clarifications, instructions, or details precisely when and where they are needed. However, tooltips must be implemented thoughtfully to avoid usability issues and overuse.

**When to use:** Providing definitions for terms or abbreviations (e.g., hovering over "APR" to see "Annual Percentage Rate")
Explaining the purpose of glyphs or buttons (e.g., a "question mark" icon with more details about a setting)
Offering guidance for form fields or controls (e.g., a tooltip for password requirements)
Data visualization details (e.g., details regarding a specific data point on a chart)

**Don't use when:** Critical Information: Tooltips are supplementary and should not contain critical instructions or information that users need to complete a task.
Overuse: Too many tooltips can overwhelm users and lead to a cluttered experience. They should not be default component for displaying additional information, rather they should be used intentionally and contextually.
Considerations

When incorporating tooltips into your interface, it's essential to balance their utility with usability and accessibility to ensure they enhance the user experience. Here are some key considerations:

Purpose and necessity
Use Sparingly: Only include tooltips when additional information is essential and not already clear in the UI.
Avoid Redundancy: If the information can be conveyed directly within the UI, prioritize clarity over reliance on tooltips.
Do

Consider more appropriate patterns before using a tooltip, especially when the information being shown is important or more dense and on a mobile device.

Don't

Tooltips on mobile are often harder to interact with and therefore shouldn't be the first consideration for common patterns like the info glyph.

Trigger and visibility
Clear Triggers: Ensure users can easily identify interactive elements that display tooltips (e.g., glyphs, buttons, or links).
Delay Timing: Use a short delay before showing or hiding tooltips to prevent accidental triggering or premature dismissal.

Placement and layout
Proximity: Position tooltips close to their trigger elements without overlapping or obscuring important content. We’ve built in a 8px margin around the tooltip component to prevent overlap with the trigger.
Responsiveness: Ensure tooltips adapt well to different screen sizes and orientations.

Tooltips can be positioned on all sides of the trigger. But take into consideration the viewport and what content will be covered by the tooltip. Positioning center aligned above the target is preferred whenever possible.

Do

There should always be an 8px gap between the trigger and tooltip.

Don't

Don't cover the trigger with the tooltip.

Content limitations
Brevity: Keep tooltip content concise and focused. Long text can overwhelm users and clutter the interface.
Clarity: Write tooltip text in plain, straightforward language to avoid confusion.

**Do:**
- Consider more appropriate patterns before using a tooltip, especially when the information being shown is important or more dense and on a mobile device.
- There should always be an 8px gap between the trigger and tooltip.

**Don't:**
- Tooltips on mobile are often harder to interact with and therefore shouldn't be the first consideration for common patterns like the info glyph.
- Don't cover the trigger with the tooltip.
