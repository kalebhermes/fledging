# Pill group

A Pill Group arranges a small set of pills into a single, scannable control cluster with shared behavior and layout rules. The group’s overflow scrolls horizontally and while each pill handles it’s own filter or navigational behavior. The pill-group component supports either:

Filter pills: toggle-style pills (multi-select on/off)
Selector pills: direct-toggle or navigation pills (single-select or small multi-select)
Always avoid mixing pill types in the same group or using other pill types that are intended to live on their own such as the status pill or control pill.

Find it in Figma

All Pacific Pill components can be found in the Pacific Core UI (Global) Figma library.

Step 1 — from the global library, select "Pills".

Step 2 — choose the pill-selector component.

Step 3 — Drag into your file or play with the properties in the component playground.

Check out each button component in the component playground view to see high-level usage guidelines, properties, and more!

When to use

Use a Pill Group when you need to visually and functionally organize a small set of related Selector Pills or Filter Pills that change the context or content of a surface. A Pill Group provides structure, spacing, and interaction consistency when pills appear together — helping users quickly scan, compare, and toggle between contextual views.

## Accessibility

For a user navigating with VoiceOver or TalkBack:
Single-select account pill group:
Account selection, Checking, button, pressed.
Navigational asset selector:
Asset selection, BTC, link, current page.

Contrast: ensure text-to-background contrast meets WCAG AA (≥4.5:1).
Touch targets: minimum 44×44 pt/px area per pill.
Text scaling: support 200% zoom without clipping or overlap.

Keyboard:
- Tab: Moves focus into the pill group and sequentially through each pill (left → right). Focus follows visual order.
- Shift + Tab: Moves focus backwards through pills or out of the group.
- Enter: Activates the focused pill — toggles state or navigates to its target view. Function depends on pill type.
- Space: Activates or toggles the focused pill (equivalent to Enter). Required for consistency across browsers.
- Esc: (Optional) Dismisses any active overlay or focus trap (if part of a toolbar). Not typically used in pill groups.
- Home / End: (Optional) Moves focus to the first or last pill in the group. Helpful for long pill rows.

## Usage

**When to use:** Use a Pill Group when:

You have a small, predefined set of related options (typically 4-12).
The user needs to toggle or navigate between states or contexts directly from the surface they’re viewing.

**Don't use when:** Avoid using a Pill Group when:

Discoverability and exposure is less important as the parent element is descriptive of the options.
Instead: use a dropdown or bottom sheet pattern for long or dynamic lists.
Each option requires additional sub-selections or configuration.
Instead: use a Control Pill that opens a modal or sheet for switching selections.
You’re switching entire sections or features of the product.
Instead: use secondary tabs for section-level changes, or primary tabs for page level view changes.
You’re performing actions like add, save, or submit. Or you need to navigate the user through core screens or flows with actions like next, back, or continue.
Instead: use a button component.
You’re displaying static labels that are not interactive.
Instead: use a Status Pill or a tag component.
