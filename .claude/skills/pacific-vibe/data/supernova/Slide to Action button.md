# Slide to {Action} button

The Slide to {Action} or Slide Button is a high-intent interactive component that requires users to slide a draggable handle from one side to the other to complete an action. Unlike standard buttons that activate with a simple tap or click, this component introduces intentional friction by requiring a deliberate gesture. This added interaction ensures that users are fully aware of their action, reducing accidental activations and reinforcing commitment to the task.

This component is best suited for actions that have a level of permanence, sensitivity, or require an extra layer of user confirmation. It serves as a safeguard against unintended actions while maintaining a smooth and intuitive experience. Common use cases include:

High-stakes actions – completing irreversible transactions, such as transferring funds, submitting payments, or confirming high-value purchases.
Security and safety confirmations – performing critical actions like logging out of all devices, resetting a password, or confirming identity verification.
Physical or real-world interactions – triggering processes that affect the physical world, such as unlocking a device, ending a session, or initiating an emergency alert.

## Accessibility

Elements should be labeled properly to ensure proper function of assistive technology such as screen readers, screen magnifiers, and speech recognition software, used by people with disabilities. Refer to the WCAG guidelines for detailed accessibility guidelines.
Default
Disabled

Focus order refers to the logical sequence in which interactive elements (such as buttons, links, and form inputs) receive focus when a user navigates through a page using the keyboard (typically the Tab key). For screen reader accessibility, the focus order is crucial because it dictates how users perceive and interact with the content.

Keyboard:
- Tab: Focus lands on (non-disabled) button
- Space or Enter: Activates the (non-disabled) button

## Usage

The Slide to {Action} button is a high-intent interactive component designed to introduce a moment of deliberate user engagement before completing an action. Unlike traditional tap or click-based buttons, this component requires users to slide a handle across a track, reinforcing their intent and minimizing accidental activations.
By introducing intentional friction, the Slide to {Action} button ensures that users are fully aware of the action they are taking, making it particularly valuable in scenarios where confirmation is critical.
Use cases
Accidental activation must be prevented – When a mistaken tap could lead to unwanted consequences, such as permanently deleting an account, submitting a non-reversible transaction, or triggering a process that cannot be undone.
User commitment is required – when the action signifies a deliberate decision, such as confirming a purchase, agreeing to terms, or initiating a long-running process. The physical engagement of sliding reinforces the user’s intent.
A sense of control is required – when users need to feel assured that their action is purposeful and cannot happen too easily, such as unlocking sensitive data, approving a critical workflow, or finalizing an agreement.
Disruptive confirmation dialogs – instead of requiring an extra confirmation step (like a modal asking “Are you sure?”), the sliding gesture itself serves as a natural confirmation mechanism, maintaining flow and reducing unnecessary steps.

**Do:**
- Use a standard button to navigate throughout a flow.
- Only use the slide button on brand color backgrounds.
- Slide button should not be used with the keypad.
- Keep labels short and concise. Only use sentence case.
- Use for high-stakes or irreversible actions – Implement this component when an action has significant consequences, such as confirming a payment, permanently deleting an item, or initiating a critical process.

**Don't:**
- Don't use the slide button to navigate.
- Don't use the slide button on bone. If needed, we will create a new variant with specific color tokens for on bone surfaces.
- Don't use the slide button in the keypad. It should be reserved for Review pages and final irreversible actions.
- Don't use long labels for the button. It should be Slide to {Action}, which should be one or two words. Do not use Title Case or CAPS.
- Don’t use for low-stakes actions – Avoid using this component for simple actions like navigating, submitting a basic form, or dismissing a notification, as it adds unnecessary friction.
