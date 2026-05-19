# Toast

A Toast is a brief, non-intrusive notification that confirms the outcome of a recent action or process. Toasts appear temporarily and are designed to inform without interrupting the user’s workflow or requiring immediate action.

They typically:

Appear at the bottom of the screen
Auto-dismiss after a short duration
Optionally persist until a user takes action
Should be concise and clear

Toasts enhance usability by providing feedback in a lightweight, non-blocking way.

## Accessibility

Toasts must include descriptive, concise messages.
Ensure all messages are readable by assistive technologies (e.g., screen readers).
Without CTA
With CTA

When a toast is triggered, the screen reader automatically reads the toast out aloud.
Non-Interactive Toasts (Informational messages)
The screen reader automatically reads out the toast message as soon as it is triggered without landing a focus on it.
Do not change the tab order
Users should continue tabbing through the interface as if the toast doesn’t exist.
Interactive Toasts (Action buttons like "Undo" or "Retry")
The toast should be keyboard-accessible, but should not steal focus.
The tab order should be:
User continues tabbing through the main UI.
Once they reach the toast, the first interactive element inside it (e.g., "Undo" button) should be focusable.
After exiting the toast, focus should return to the next item in the natural tab order.

Keyboard:
- Tab: Moves focus to CTA (if present)
- Space or enter: Activates the CTA

## Content Guidelines

Tips for writing great toast content
Write for speed, not delight. Toasts should be read in a second or two.
Avoid overly specific details. Don’t include file names, user names, or timestamps unless necessary.
Never use toasts for marketing or upsell. They should respond to a user action — not initiate one.
Actions should be relevant and immediate. If including a text action, make sure it directly addresses the message (e.g. “Undo” for archive, not “Learn more”).

General writing rules
Use sentence case
	
Payment sent

Payment Sent

Do not use periods
	
Settings updated

Settings updated.

Keep it short
	
Aim for fewer than two lines

Avoid extra detail the user can get from the surrounding UI

Use an instructive, neutral tone

Toasts should be helpful and straightforward. Avoid sounding overly excited or promotional. They’re not the place to celebrate, sell, or entertain. Just confirm what happened and let the user move on.

Card locked

Woohoo! You locked your card!

Recurring transfer scheduled

You did it! Your transfer is set up!

Types of toast messages
Confirmation messages

Use for successful actions. Stick to a short phrase — past-tense, no punctuation, sentence case.

Good

Why it works

Card replaced

Short, confirms the action, no filler

Transfer submitted

No need to say where or when — that’s in the UI

Two-factor authentication turned on

Describes the exact setting

Beneficiary added

Straightforward confirmation of the user’s intent

Vault deleted

Uses the UI term ("Vault") and past-tense verb

Informational messages

Use when letting the user know about something not initiated by them — or that doesn’t complete right away. Add a simple action when helpful.

Good

Optional CTA (Always in sentence case)

Your statement is ready

[View]

Transfer is in progress

[View]

A new version is available

[Update]

Some features may be limited

[Learn more]

Error messages
Use when something didn’t work. Keep the tone neutral and suggest a clear next step.

Good

Optional CTA (Always in sentence case)

Payment failed

[Try again]

Couldn’t verify account

[Update]

Transfer couldn’t be completed

[Retry]

Issue adding bank

[Learn more]

Something went wrong

[Reload]

Avoid this style:

Uh oh! Something broke. Try again?

We had a hiccup. Hang tight!

Toasts should help members recover or continue, not distract or confuse them.

## Usage

Toasts are used to communicate brief updates about the status of an application's process — such as confirming a task was successfully completed. They are low-emphasis, temporary, and appear in front of other UI elements without blocking critical interactions.
Use concise, clear language. Action links (e.g., “Undo,” “View More”) should be brief and only included when necessary.
Toasts should appear visually in front of other UI elements, but must not block essential actions or controls.

**When to use:** To confirm successful completion of a user-initiated task.
To notify users of non-critical updates that do not require immediate action.
To provide optional follow-up actions related to a recent interaction.

When to not use
Use a Banner for system-level alerts, warnings, or persistent messages.
Use a Dialog when the information is critical and requires user attention, action, or a decision.

Do or Dont’s
Do

Use toasts for confirmations, simple notifications, or low-priority alerts that don’t interrupt the user experience.

Don't

Don't use toasts for critical information that requires user attention — use overlays or dialogs instead.

Do

Always position toasts at the bottom of the screen with 16px padding above bottom elements.

Don't

Don't place toasts elsewhere on the screen — consistency in placement improves recognition and usability.

Do

Ensure toasts do not obscure bottom navigation bars or action buttons.

Don't

Don't let toasts to cover essential UI elements, as it negatively impacts usability.

Do

Limit interactive toasts to a single clear action (e.g., “Undo”).

Don't

Don't add multiple actions to a toast — if more interaction is needed, use an overlay or modal.

Don't

Don’t display multiple toasts simultaneously.
If multiple toasts are triggered in quick succession, they should appear one at a time, prioritized from most important to least important to avoid overwhelming the user and ensure clarity.

Don't

Avoid using stylized text or inline links in toasts.
These can introduce unnecessary complexity and accessibility issues. If a link is needed, use a clearly labeled buttoninstead, or consider using a different component better suited for richer content.

Don't

Don’t include a dismiss action unless necessary.
Toasts are designed to auto-dismiss by default, so a manual close button is typically redundant unless user control is explicitly needed.

**Do:**
- Use toasts for confirmations, simple notifications, or low-priority alerts that don’t interrupt the user experience.
- Always position toasts at the bottom of the screen with 16px padding above bottom elements.
- Ensure toasts do not obscure bottom navigation bars or action buttons.
- Limit interactive toasts to a single clear action (e.g., “Undo”).

**Don't:**
- Don't use toasts for critical information that requires user attention — use overlays or dialogs instead.
- Don't place toasts elsewhere on the screen — consistency in placement improves recognition and usability.
- Don't let toasts to cover essential UI elements, as it negatively impacts usability.
- Don't add multiple actions to a toast — if more interaction is needed, use an overlay or modal.
- Don’t display multiple toasts simultaneously.
- Avoid using stylized text or inline links in toasts.
- Don’t include a dismiss action unless necessary.
