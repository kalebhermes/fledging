# Text inputs

Text Inputs are UI elements that allow users to input and edit text. They are fundamental building blocks of user interfaces, especially for forms, search bars, or any interaction requiring user-provided text. Text fields are versatile and can be designed to handle various input types, from single-line text to complex multi-line entries.

## Accessibility

Accessibility labels are crucial for ensuring inputs are usable by individuals relying on screen readers.

Keyboard:
- Tab: Enter text field, move to next actionable element
- Enter: Submit or select element
- Esc: Cancel or clear

## Usage

Text fields are used to collect data from users. They can exist as a single input or in a series of inputs, known as a form. Common use cases include forms that collect personal information such as name, address, and email.
Default text inputs
Masked text input
Text area input
Small text input
Single digit
Digit field input
Usage by type
Type
Usage
input-text
Short responses, single line of text or short inputs
input-masked
Single line of text or single input of sensitive information such as password, PIN, or SSN
input-textArea
Long form response that requires multiple lines of text. Overflow scrolls vertically.
input-textSmall
Short responses, single line of text or short inputs at a smaller scale such as amounts or dates
input-digit
Single numerical digit inputs such as with one-time passwords (OTP), two-factor authentication codes (2FA) and PIN inputs.
input-digitField
Numerical input where multiple digits are required in one input such as # of items, ± amount, free-form amounts
Do
Use the correct type of text input according to the data being collected. For example, digit inputs for short number based responses like pins or codes.
Don't
Don't use a standard text input for short number based inputs such as pins or codes.

**When to use:** Direct user input: Collect essential user data (e.g., name, email, account details). Inputting sensitive financial information, like credit card numbers or bank account details.
Open-ended input: When users need to provide free-form responses (e.g., comments, explanations).
Short data entry: Inputting concise data such as OTPs, ZIP codes, or dates.
Customizable information: Fields where users can update or personalize details (e.g., setting a nickname for an account).

**Don't use when:** Predefined options: When choices can be predefined or limited, use dropdowns, radio buttons, or checkboxes (e.g., selecting account types or payment methods).
Structured inputs: For highly structured or predictable inputs, like dates or phone numbers, use dedicated input masks or specialized components.
Information selection: When users need to select from a list of predefined options (e.g., auto-complete for city/state).
Passive data display: To show read-only information, such as account balances or summaries, use static text or labels.
Error-prone fields: Avoid text fields for critical, complex, or error-prone data where guided steps or funnels might be better.

Considerations
General usage
Security: Mask sensitive inputs like passwords or PINs by default and use secure keyboard options on mobile platforms.
Validation: Provide real-time validation to minimize user errors, especially for numerical or sensitive fields.
Accessibility: Ensure all text fields are properly labeled and keyboard-navigable.
Formatting: Automatically format inputs like credit card numbers or account numbers to improve readability.
Do

Automatically validate inputs as the user is interacting with the field.

Don't

Don't wait until after the user is done typing to validate possible errors.

Content limitations

Text in a form field should not be truncated if the input data is too long. Instead, use the appropriate text input field for the length of data needed.

Single line input: Our standard text input, input-text, should not wrap text vertically or truncate text. Character count limitations should be set based on the width of the input field, where the max character count equals the width of one single line of text. If needed, the content should scroll horizontally within the input.
Multi line input: If multiple lines of text are needed for an input, then the only text field that should be used is our input-textArea form field. The container should not expand vertically as the text exceeds the determined height, rather these input fields should automatically scroll vertically if there is any overflow content.
Do

Always use clear labels with form fields.

Don't

Don't leave room for confusion when labeling form fields.

Do

Long text should horizontally scroll within the input if needed.

Don't

Don't truncate text that is too long to fit in one line for single line input fields and don't expand the container of multi-line input fields.

**Do:**
- Use the correct type of text input according to the data being collected. For example, digit inputs for short number based responses like pins or codes.
- Automatically validate inputs as the user is interacting with the field.
- Always use clear labels with form fields.
- Long text should horizontally scroll within the input if needed.

**Don't:**
- Don't use a standard text input for short number based inputs such as pins or codes.
- Don't wait until after the user is done typing to validate possible errors.
- Don't leave room for confusion when labeling form fields.
- Don't truncate text that is too long to fit in one line for single line input fields and don't expand the container of multi-line input fields.
