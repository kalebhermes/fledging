# Keypad

The keypad component allows users to input numerical values in a structured and intuitive manner. It includes digits, a decimal point, and a backspace function, with a call-to-action button for submission.

## Accessibility

Keypad Activation
When a user lands on a page or performs an action that opens the keypad, the screen reader should announce "Keypad open" to indicate its activation.
Keypad Dismissal
When the keypad is dismissed due to user action or navigation, the screen reader should announce "Keypad dismissed" to inform the user.
These announcements ensure a clear and accessible experience for users relying on screen readers.
Keypad with Quick actions
Keypad with Autofill

Keypad with Quick actions
Keypad with Autofill

Keyboard:
- Tab: Navigate through the component
- Space or Enter: Selection action

## Usage

**When to use:** The keypad should be used whenever users need to input numeric values, such as amounts, OTPs, PINs, and similar digit-based inputs.

**Do:**
- Use a dedicated keypad for numeric input to provide a seamless and user-friendly experience.
- Use a date picker for date-related inputs, as it allows users to easily select and adjust month, day, and year, making the process more intuitive.
- Use consistent information across parallel actions
- Scale the keypad according to the specified scaling guidelines to ensure a consistent experience across devices.
- Allow users to tap outside the keypad to dismiss it easily, ensuring a smooth and intuitive experience.
- Enable auto-population of fields like OTPs using the system's suggestion feature to enhance user convenience and reduce manual input.

**Don't:**
- Avoid using the default iOS numpad whenever possible, as it may not align with the design and usability requirements.
- Avoid using the keypad for date entry, as it limits functionality and user convenience.
- Mix mismatched content across quick actions
