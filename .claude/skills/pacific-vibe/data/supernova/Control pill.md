# Control pill

The Control Pill is an interactive, pill-shaped element used to display and edit contextual settings—like account selection, coin switching, or stock selection—without navigating away from the current screen. It combines the compact form of a chip with the affordance of a drop down, summarizing the current state and opening a modal or bottom sheet to make changes.

Unlike buttons, which trigger immediate actions and navigate a user through an experience, or drop downs, which display inline lists, control pills are best for exposing complex or extended selections (like choosing from a finite list of crypto coins or stocks) in a compact way.

Other pill types
Filter Pill — Documentation
Performance Pill — Documentation
Selector Pill — Documentation
Status Pill — Documentation

Find it in Figma

All Pacific Pill components can be found in the Pacific Core UI (Global) Figma library.

Step 1 — from the global library, select Pills.

Step 2 — choose the pill-control component

Step 3 — Drag into your file or play with the properties in the component playground.

Check out each button component in the component playground view to see high-level usage guidelines, properties, and more!

When to use
The choices needs to be visible and easily changeable in place (e.g., coin type, stock type, account, or sort).
The user benefits from seeing the current selection without opening a new view.
The bottom sheet displays a complex or scrollable list (e.g., countries, crypto coins, stocks, or currency type).
You want to preserve layout density and avoid large form controls.

Related components
Button – triggers actions
Dropdown input – inline list selections
Filter pill – shows applied filters inline
Status pill – static label for read-only status
Segmented control – toggles between visible options

## Accessibility

Use a descriptive accessible name that combines the control’s function and its current selection.
Example: “Sort, by price low to high” or “Account, checking.”
Avoid labels like “Open filter” or “Sort button,” which don’t expose the current value.
When the control has a key/value label pattern (e.g., “Sort: Price”), ensure the entire phrase is read as one name.
For dynamic states, the label should update programmatically when the selection changes.
Example: aria-live="polite" or reactive label text in native frameworks.
In cases where the pill includes an icon or avatar, ensure that the text label remains the accessible name; decorative images should use aria-hidden="true".
Avoid abbreviations or truncations that reduce clarity for screen reader users. If truncation is necessary visually, the full value should remain accessible in the code.
Implementation
Flutter
Use Semantics(label: 'Sort, by price low to high', button: true) on the container widget.
Ensure the label updates when the selection changes.
Web
Use a <button> element with a label or aria-label that includes the current state.
Example:
<button aria-expanded="false" aria-controls="sort-sheet" aria-label="Sort, by price low to high"> Sort: Price <svg aria-hidden="true">...</svg> </button>
For a user navigating with VoiceOver or TalkBack:
Sort, by price low to high, button, double tap to open list of sort options.
When overlay opened:
Sort options, modal dialog. Swipe right to navigate options.
After making a selection and closing:
Sort, by date added, button.

In a page, the screen reader should go through all the supporting pieces of information on the screen before landing on the action button. The Focus Order should ensure logical and predictable focus traversal within a set of control pills and any associated modals or bottom sheets. Follow this focus order for screen reader navigation recommended by WCAG guidelines.
Control pills should appear in the tab or focus order based on their visual layout (usually left to right).
When a pill is activated and the sheet or modal opens:
Move focus to the first focusable element inside the sheet/modal.
Trap focus within the modal until it is dismissed.
When closed, return focus to the originating pill.
For multiple control pills in a horizontal set (e.g., Sort, Coins, Stocks), ensure focus traversal follows the same order as reading direction (left to right).
Avoid skipping pills or grouping them under a single focusable container — each pill should receive its own focus stop.
When a pill is disabled, it should be skipped in focus navigation.
Implementation
Flutter
Use FocusTraversalGroup and FocusNode to maintain focus order consistency.
When a BottomSheet closes, call FocusScope.of(context).requestFocus(pillFocusNode) to restore focus.
Web
Use tabindex="0" (default for <button>).
Manage focus restoration manually when using custom modals.

Keyboard:
- Tab / Shift+Tab: Moves between control pills and other interactive elements in the interface
- Enter or Space: Activates the focused pill and opens its bottom sheet or modal
- Tab / Shift+Tab (when Bottom Sheet is open): Cycles through focusable items inside
- Esc (when Bottom Sheet is open): Closes the overlay and returns focus to the originating pill

## Usage

**When to use:** A current context (account, asset, or currency) needs to remain visible as users perform related actions.
The selection set is distinct and limited (accounts, coins, or currencies), not extensive or filtered dynamically.
The selection opens a dedicated modal or bottom sheet that offers rich visuals (logos, symbols, balances, or conversion details).
The control is persistent across screens and must always reflect the active selection.

**Don't use when:** The element performs a primary action (use a button).
The user must see all options at once (use segmented control or tabs).
The element represents status or read-only metadata (use a tag or status pill).
The control is part of a form field group or the list of options is short (use a dropdown/select).
Adjusting display order, filters, or categories — use menus or filter chips instead.
Triggering primary actions like “Add,” “Transfer,” or “Convert” — use buttons instead.
Selecting form values inline — use dropdown inputs.

Control pill vs. other components

Component

Description

Best for

Avoid when

Control Pill

Compact stateful control that opens a bottom sheet or modal to adjust a contextual setting

Account picker, switcher, currency

Primary actions, filters, sorting, navigation

Filter Pill

A compact control that functions similar to a toggle, reducing down data sets.

Time range, date range, sorting, search results, large data sets; single or multi-select

Only a few options are available, short lists or data sets

Selector Pill

A compact element that functions simliar to a button, navigating the user from a specific group to a more detailed view of one selection. For example, categories of stocks.

Discovery, grouped selections, navigation

Sorting, filtering, primary actions, contextual controls

Button

Triggers an immediate action or navigates

Submitting, saving, navigating, core actions

Displaying state or selections or choice

Dropdown

Inline list for small, direct selections

Form inputs, short option lists

Complex filters, large menus, or mobile-first layouts

Selector Tile

Multi-or-single select option control for a list of few options (3-5)

Short lists, inline selection, funnels, navigating a funnel

Complex decisions need to be made, dense layouts, sorting, filtering

Layout
Control pills typically live on their own, rather than in a group of other Control Pills.
Place control pills above or near the content they control (e.g., table headers, list filters).
Group related pills horizontally (e.g., coin selection, account selection, stock selection).
Allow horizontal scrolling when multiple pills exceed the viewport width.
Maintain consistent spacing (typically 8px between pills). See Pill Group.
Placement
Position Control Pills near the element or data they influence.
Example: In a dashboard, the Account pill should appear above the balance graph or transaction list it controls.
Example: On a conversion screen, the Currency pill should appear adjacent to the amount input.
When multiple pills are used (e.g., Account and Currency), place them in a horizontal row following a logical hierarchy:
Primary context first (Account → Asset → Currency).
Maintain a minimum of 8–12px horizontal spacing between pills to preserve tap clarity.
Density and grouping
Group related pills together using consistent spacing tokens (space-8).
Avoid wrapping pills to multiple lines; use horizontal scroll on mobile if space is limited.
Do not mix Control Pills with buttons in the same visual group. Pills represent state, buttons represent actions.

Content

Control Pills communicate identity-based context, not actions. Labels and visuals should clearly convey “what’s currently active” rather than “what to do next.”

Prioritize recognition over explanation. Users should be able to identify the context (account or asset) instantly.
Avoid action language. The pill represents a state, not a command — prefer “USD” over “Change currency.”
Keep labels between 3–16 characters for ideal fit.
Use sentence case for labels (“Checking,” not “CHECKING”).
If multiple pills appear together, align label tone consistently (all nouns, all proper names).

**Do:**
- Always show the chevron glyph as an actionable affordance.
- Do place control pills close to the data or information they influence or control.
- Keep labels short and recognizable (USD, BTC, Checking).

**Don't:**
- Don't remove the chevron glyph, otherwise the pill may not feel actionable and indicate switching.
- Don't use for sorting, filtering, or core actions.
- Don't use as a navigational element or to take the user away from their current screen.
