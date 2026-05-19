# Dialog

Dialogs are modal windows that interrupt the current flow to present important information or require user action. They appear in front of the app's content, drawing attention to decisions that must be acknowledged or resolved before continuing.

Dialogs are best used for short, focused interactions, such as confirmations, error handling, or action approvals.

## Accessibility

Accessibility labels are crucial for ensuring inputs are usable by individuals relying on screen readers.

Keyboard:
- Tab: Move to the next element
- Esc: Dismiss dialog
- Space or Enter: Trigger an action

## Usage

Dialogs are modal surfaces that interrupt a user’s flow to present critical information or request a decision. They should be used sparingly and designed for short, focused tasks that require user acknowledgment or action before continuing.

**When to use:** Use dialogs for high-priority, interruptive flows such as:

Confirmations (e.g., “Delete this item?”)
Critical decisions (e.g., “Exit without saving?”)
System alerts (e.g., payment failure, permission error)
One-time prompts that must be resolved before proceeding
Acknowledge-only tasks, like confirming terms or alerts

**Don't use when:** Use bottom sheets when the interaction is:

Contextual, not critical
Part of a multi-step flow (e.g., form entry, date picker)
A secondary action (e.g., filters, edit options)
Content-heavy and benefits from scrolling
Dismissible without immediate action

Keep dialogs brief and action-oriented
Use clear, concise messaging
Show only one dialog at a time
Actions must be explicitly labeled (avoid "X" as the only dismiss method)

**Do:**
- Use dialogs for short, focused decisions
- Display only one dialog at a time
- Use explicit text buttons for actions like “Cancel” or “Dismiss”
- Include a dismiss button in addition to the scrim
- Use dialogs for prompts that block an app’s normal operation, and for critical information that requires a specific user task, decision, or acknowledgement
- Use a bottom sheet when content exceeds dialog height and needs to scroll
- Use a single action only if it’s an informative message.

**Don't:**
- Don’t use dialogs for complex flows or long content
- Don’t nest dialogs or stack multiple modals
- Don’t use only an "X" icon for dismissing actionable dialogs
- Don’t rely solely on tapping the overlay to dismiss
- Don’t use dialogs for low- or medium-priority information. Instead use a snackbar, which can be dismissed or disappear automatically.
- Don’t enable scrolling within dialogs — they should be self-contained and quick
- Don’t use dialogs as an entry point to another flow or task
