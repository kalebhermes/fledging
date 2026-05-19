# Button groups (v2)

A Button Group is a UI component that clusters a set of related buttons together, either in a horizontal or vertical stack, to create a single, cohesive unit. In our design system, its purpose is to provide a standardized way to present a range of interdependent or sequential actions, ensuring visual consistency and an intuitive user experience.

At a high level, a button group clarifies the relationship between actions, guiding the user through a specific workflow or allowing them to choose from a limited set of options. Rather than placing a series of disconnected buttons, a button group consolidates them into a unified component, which reinforces their collective purpose and maintains a clean, organized interface.

Button Group types

The next iteration of our PacificButtonGroup supports two layout types: Vertical and Horizontal. The vertical stack has two variants: Default and Medium . The default variant is the standard page footer for native and mobile web viewports, where as the Medium size is used more on L2 and L3 screens, and within sections on a page. It is also nested inside of our Dialog overlay. Medium and Small variants refer to the size of the PacificButtons within the group (the defaults have large button sizes). The horizontal layouts can also be used in native or mobile web screens, but are primarily used in web/desktop sized viewports. The horizontal layouts offer flexibility when a design calls for more of a side by side grouping of related actions.

Vertical
buttonGroup-vertical (Default)
buttonGroup-vertical-medium
Horizontal
buttonGroup-horizontal (Default)
buttonGroup-horizontal-medium
buttonGroup-horizontal-small

Finding it in Figma

Use the Buttons or Button Group component when you need to communicate an interactive action or set of actions in a design.

Step 1: Navigate to the Assets tab and select the Pacific - Core UI (Global) library.

Step 2: Choose the Button Groups folder to see all global button components.

Step 3: Decide which layout suits your use case.

Check out each button component in the component playground view to see high-level usage guidelines, properties, and more!

## Accessibility

Elements should be labeled properly to ensure proper function of assistive technology such as screen readers, screen magnifiers, and speech recognition software, used by people with disabilities. Refer to the WCAG guidelines for detailed accessibility guidelines.
Vertical
Horizontal

Focus order refers to the logical sequence in which interactive elements (such as buttons, links, and form inputs) receive focus when a user navigates through a page using the keyboard (typically the Tab key). For screen reader accessibility, the focus order is crucial because it dictates how users perceive and interact with the content.
Vertical
Horizontal

Keyboard:
- Tab: Focus lands on (non-disabled) button
- Space or Enter: Activates the (non-disabled) button

## Usage

**When to use:** 

**Don't use when:** Large (Default)

Page footer, bottom sheets, Funnels, Flows

Nested in a card or in multiple instances on a page

Medium

Dialogs, content sections, L2 & L3 page actions

Page/funnel navigation

Small

Nested in containers or cards

Page/funnel navigation

**Do:**
- DO use a clear priority order.
- DO use secondary or tertiary buttons for alternative, non-critical actions.
- DO only use default or destructive styles on base or elevated surfaces.
- DO use the Button Group stacks as defined in Figma.
- DO maintain consistent sizing in a group.

**Don't:**
- DON'T use more than one Primary button.
- DON'T mix destructive buttons with standard Brand (Default) primary buttons.
- DON'T use destructive or default styles onDark or brand marketing backgrounds.
- DON'T swap the button style instance nested in the Button Group component.
- DON'T use mixed sizes for different priorities.
