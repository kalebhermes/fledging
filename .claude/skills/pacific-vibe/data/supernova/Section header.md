# Section header

The Section Header component is a typographic component that introduces and labels distinct sections of content, helping to establish a clear visual hierarchy. It provides context for the content that follows, ensuring users can quickly understand and navigate the structure of the page or interface.

## Accessibility

Elements should be labeled properly to ensure proper function of assistive technology such as screen readers, screen magnifiers, and speech recognition software, used by people with disabilities. Refer to the WCAG guidelines for detailed accessibility guidelines.
sectionHeader-accessibility-label-static-01
sectionHeader-accessibility-label-static-01

Focus order refers to the logical sequence in which interactive elements (such as buttons, links, and form inputs) receive focus when a user navigates through a page using the keyboard (typically the Tab key). For screen reader accessibility, the focus order is crucial because it dictates how users perceive and interact with the content.
Default
Default — glyph + subtitle
Action — glyph + subtitle
Static text — glyph + subtitle
Summary — glyph + subtitle

Keyboard:
- Tab: Navigate through different elements such as text, glyph, subtitle, and action button
- Space or Enter: Interact with actionable elements

## Usage

Section Headers are commonly used as a way of clearly grouping related information. The establish the start of a section or “zone”. The section header should clearly communicate what type of content will be displayed or available below the header. Section headers can be simple titles or a title + subtitle. They also support common actions like navigating to a full page view, sorting content, or editing content within a section.
Considerations
When using the header-section component, it’s important to take into consideration the following guidelines.
Type
The Section Header Type property currently provides 4 configurations of the component: Default, Action, Static text, and Summary.
Type property in Figma
Default
Default — Info glyph
Default — Subtitle
Action
Static text
Summary
Padding (Left + Right)
As shown above, the Section Header text and action should align within the standard 16px (mobile) page margins so that the content is aligned with cards, containers, and other page content. This means, depending on how the section is constructed, the text may need 20px of padding or only 4px.
Padding property in Figma properties panel
Use 20px padding if the Section Header touches the edge of the viewport (ie. isn't nested within the 16px body padding or 16px page margins.)
Use 4px padding if the Section Header is wrapped in the body 16px padding.
Right glyph
The Right Glyph property is related to the Type=Action Section Header component. Whenever possible, try to select the relevant glyph from the preferred glyph menu. These are common actions that can be taken from the Section Header.
Select the relevant Action glyph from the preferred list
Preferred glyphs
Do
Do only use Actions that are relevant to the entire section and keep the component styles (ie. color, type, etc.)
Don't
Don't include destructive actions in the Section Header and don't change any component styles (ie. color, type, etc.)
Do
Only use 16px glyphs within the Section Header component.
Don't
Don't use anything other than 16px glyphs within the Section Header.
Content limitations
The Section Header is designed to be clear and easy to read for all users. Keep these recommendations in mind when deciding on copy for your Section Header.
Viewport width is 375+
Viewport is 320 to 375

**Do:**
- Do only use Actions that are relevant to the entire section and keep the component styles (ie. color, type, etc.)
- Only use 16px glyphs within the Section Header component.

**Don't:**
- Don't include destructive actions in the Section Header and don't change any component styles (ie. color, type, etc.)
- Don't use anything other than 16px glyphs within the Section Header.
