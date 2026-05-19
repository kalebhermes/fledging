# Bottom nav bar

The Bottom Navigation component provides users with quick access to key sections of the app, improving navigation efficiency and accessibility. It is a persistent UI element displayed at the bottom of the screen, allowing users to switch between primary destinations with a single tap.

## Accessibility

Ensure focus lands on the selected tab first, then moves through the remaining tabs in left-to-right order starting with the “Home” tab.
Example: Selected tab is "Home" tab
Example: Selected tab is "Credit Card" tab

Keyboard:
- Tab: Navigate through different actions in the bottom nav
- Space or Enter: Activates the action

## Usage

**When to use:** Primary app destinations that users need quick access to from anywhere.
Navigating between three to five key sections to maintain clarity and usability.
Smaller screen sizes, such as mobile devices, where space is limited.

**Don't use when:** Single-purpose views, like reading an individual message or performing a one-off task.
Settings or user preferences, which are typically accessed less frequently.
Larger screen layouts, where a sidebar or other navigation structures may be more effective.

**Do:**
- Include labels for bottom navigation items to provide clarity and make navigation intuitive.
- Use concise, clear labels. Bottom navigation labels should be brief, straightforward, and easy to interpret. The goal is to convey meaning quickly, even at a glance.

**Don't:**
- Don't do only label or only icons in the bottom navigation. While icons are useful, relying solely on them can confuse users. It’s essential to pair icons with labels to improve navigation comprehension and accessibility.
- Don't make labels lengthy or overly complex. Long or convoluted labels can overwhelm users and make navigation harder to scan. Keep labels succinct to ensure better readability and a cleaner interface.
- Simplify the navigation. Limit the number of items in the bottom navigation to make it intuitive and easy to use. A good range is 3 to 5 items to avoid clutter and ensure quick access to key actions.
- Navigation bar destinations have fixed positions. They don’t scroll or move horizontally.
