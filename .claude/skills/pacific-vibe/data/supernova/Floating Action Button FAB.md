# Floating Action Button (FAB)

A Floating Action Button (FAB) can serve as a navigational element that represents a primary, high-priority action that often leads users to key destinations.

Shortcuts: It can act as a persistent shortcut to the most critical action, such as composing a message in an email app or starting a new document in a productivity tool.
Entry point to primary flow: It helps users quickly enter a workflow, such as creating a new post, booking a trip, or initiating a chat.
Consistency: The FAB remains in a fixed position, ensuring that users can easily find and access the primary action from anywhere in the app.
Full-screen transition: When tapped, a FAB can open a modal, side panel, or transition the user to a full-screen experience for a more immersive action.

## Accessibility

Elements should be labeled properly to ensure proper function of assistive technology such as screen readers, screen magnifiers, and speech recognition software, used by people with disabilities. Refer to the WCAG guidelines for detailed accessibility guidelines.
Closed = False (collapsed)
Closed = False
Open = True

Focus order refers to the logical sequence in which interactive elements (such as buttons, links, and form inputs) receive focus when a user navigates through a page using the keyboard (typically the Tab key). For screen reader accessibility, the focus order is crucial because it dictates how users perceive and interact with the content.
Open = False
Open = True

Keyboard:
- Tab: Focus lands on (non-disabled) button
- Space or Enter: Activates the (non-disabled) button

## Usage

**Do:**
- Use the FAB for a high-priority, primary action. Ensure it represents the most critical, frequently used action on a screen.
- Ensure clear, intuitive visual indications. Use a glyph that clearly communicates the action to reduce ambiguity.

**Don't:**
- Don’t use multiple FABs on a single screen. A FAB should highlight a single, dominant action— multiple FABs can create confusion.
- Don’t use it for secondary or less important actions. If the action isn’t a primary function of the screen, consider alternative placements like a toolbar or bottom navigation.
