# Selector pill

The Selector Pill is a compact, pill-shaped element used to represent a selectable context, category, or mode. It allows users to switch between predefined options — such as viewing a specific account, asset, or currency — without opening an additional surface like a modal or bottom sheet.

Unlike the control pill, which displays a current selection and expands to change it, the selector pill acts as a direct toggle or navigation control. It can represent an active state (selected) or inactive state (default) and typically leads to another page or view related to the selection. It can also just act as a simple selection, replacing the original selection of the control pill.

Other pill types
Control Pill — Documentation
Filter Pill — Documentation
Performance Pill — Documentation
Status Pill — Documentation

Find it in Figma

All Pacific Pill components can be found in the Pacific Core UI (Global) Figma library.

Step 1 — from the global library, select "Pills".

Step 2 — choose the pill-selector component.

Step 3 — Drag into your file or play with the properties in the component playground.

Check out each button component in the component playground view to see high-level usage guidelines, properties, and more!

When to use
The user must toggle between predefined contexts such as accounts, coins, or currencies.
The number of available options is small and visually scannable (typically 2–6).
The user should navigate directly to a page or dashboard related to that context.
The selection represents a persistent state that updates app-wide context (for example, “Selected account: Checking”).
When not to use
The user needs to choose from a large or dynamic list of options (use a control pill or dropdown).
The pill triggers primary actions like “Add,” “Confirm,” or “Transfer” (use a button).
The choice is form-related input that must submit data (use a radio group or checkbox set).
The option requires additional sub-selections before navigation (use a control pill with modal).

Related components
Button – triggers actions
Dropdown input – inline list selections
Filter pill – shows applied filters inline
Status pill – static label for read-only status
Segmented control – toggles between visible options

## Accessibility

The accessible name should describe the pill’s label or purpose (e.g., “Checking,” “BTC,” “USD”).
If the pill toggles between on/off states, use the button role with aria-pressed="true/false".
If the pill navigates, use the button or link role and ensure the destination is clear from context or accessible description.
When part of a group, ensure that each pill’s label uniquely identifies its option.
Decorative icons (coin glyphs, flags) should be aria-hidden="true".
When state changes (focused/unfocused), it should be announced by the screen reader.
For a user navigating with VoiceOver or TalkBack:
Pressing right arrow or Tab moves to next:
Savings, button. Not selected.
When focus lands on the first pill:
Checking, button, selected, Account selection.
When activated (Space or Enter):
Savings, selected.

Follow logical left-to-right order in pill groups.
Each pill should be an individual focus stop.
When navigating with keyboard or assistive input, pressing Tab should move through each pill sequentially.
Focus rings or outlines should clearly indicate the current focus target.

Keyboard:
- Tab / Shift+Tab: Moves between pills in a list or group
- Enter or Space: Toggles the pill or activates navigation
- Tab / Shift+Tab: Cycles through focusable items inside
- Esc: Does not apply unless part of a bottom sheet or modal

## Usage

**When to use:** When options are few, fixed, and recognizable at a glance (typically 2–6), where scanning speed matters. Apple’s segmented-control guidance recommends keeping sets small on mobile; selector pills follow the same constraint.
The choice should take effect immediately (toggle a state or navigate to the corresponding view), rather than open a chooser.
The context needs to remain visible as the user reads or acts (account, asset, currency). this mirrors “choice”/“filter” chip ideas but with direct activation instead of opening surfaces.
You’re switching views within the same page or scope in a compact, inline way (similar to segmented controls) and do not require tab semantics or large tab bars.

**Don't use when:** The set is large, searchable, or dynamic. use a dropdown input or a control that opens a bottom sheet, pop over, menu, or modal.
You need primary actions (add, save, convert). Use a button; that’s the platform-recommended pattern for core navigation and actions.
The user must always see the associated panel and switch between content sections; use tabs.
A long label is required. Use another navigational affordance such as a row.
The item is purely status/metadata with no interaction. Use a status pill instead.

Selector pill vs. other components

Component

Description

Best for

Avoid when

Selector Pill

A compact element that functions similar to a button, navigating the user from a specific group to a more detailed view of one selection. For example, categories of stocks.

Discovery, grouped selections, navigation

Sorting, filtering, primary actions, contextual controls

Control Pill

Compact stateful control that opens a bottom sheet or modal to adjust a contextual setting

Account picker, switcher, currency

Primary actions, filters, sorting, navigation

Filter Pill

A compact control that functions similar to a toggle, reducing down data sets.

Time range, date range, sorting, search results, large data sets; single or multi-select

Only a few options are available, short lists or data sets

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

Maintain consistent spacing (typically 8px between pills). See Pill Group.

Placement
Place selector pills at the top of their related section or page — for example:
Above a transaction list to indicate account context.
Above a portfolio view for asset selection.
Near input fields for currency selection.
Group pills horizontally when multiple related contexts are selectable.
Density and grouping
Use consistent spacing tokens (spacing-8) between pills.
For multi-select scenarios, allow multiple pills to appear active simultaneously.
For single-select groups, highlight the selected pill with a focused or selected stroke.

Content

**Do:**
- Group selector pills to create a compact way for users to explore related options.
- Keep labels short and concise. Pair with a glyph if it'll help the communicate more clearly the topics at hand.
- Maintain consistency in the component's fundamental styles like text, stroke, color, etc.

**Don't:**
- Don't use a chevron or dropdown glyph as a visual affordance for interactivity. The selector pills are inherently tappable.
- Don't use selector pills as filters, use the Filter Pill for these use cases.
- Don't change the component's fundamental styles such as text, size, color, stroke, corner radii, asset type, etc.
