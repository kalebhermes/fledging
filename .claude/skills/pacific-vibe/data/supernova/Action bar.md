# Action bar

The Action Bar is a UI component designed to display a set of actions in a single row, providing users with quick access to key functions. It enhances usability by grouping related actions in an easily accessible format, ensuring a seamless and efficient user experience.
This component is particularly useful in scenarios where multiple actions need to be presented without cluttering the interface, allowing users to interact with the most relevant options effortlessly.

## Accessibility

Keyboard:
- Tab: Navigate between actions
- Space or Enter: Trigger an action

## Usage

**When to use:** You need to display multiple related actions in a single row for quick access.
Users frequently interact with these actions, and they should always be visible.
Screen space is limited, and a compact, organized layout is required.
Actions are equally important and should be presented without a hierarchy.

**Don't use when:** There are too many actions to fit in a single row—use a dropdown menu or overflow menu instead.
Actions are secondary or infrequent—placing them in a context menu or floating action button (FAB) may be more suitable.
The primary action is significantly more important than others—highlight the key action while grouping secondary actions separately.

**Do:**
- Keep the Action Bar between 2 to 4 actions to maintain clarity and usability.
- Use short, concise labels—ideally one word for clarity.
- Ensure that actions are contextual to the screen, guiding users through the intended flow.

**Don't:**
- If more than 5 actions are needed, consider using a FAB (Floating Action Button) or a list of rows instead.
- Avoid long labels that increase cognitive load and clutter the interface.
- Avoid using the Action Bar as an entry point for major product flows or primary navigation.
