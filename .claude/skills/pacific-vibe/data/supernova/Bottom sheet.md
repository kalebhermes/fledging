# Bottom sheet

A Bottom Sheet is a surface that slides up from the bottom of the screen to present additional content, actions, or contextual information. It enables users to stay within their current workflow while engaging with secondary tasks or viewing more details.
Bottom Sheets are commonly used for:

Supplementary workflows (e.g., filters, additional options)
Non-critical interruptions (e.g., notifications, previews)
Alternative navigation or action menus
Mobile-first interactions where screen space is limited

## Accessibility

Keyboard:
- Tab: Navigate through different actions in the bottom sheet
- Space or Enter: Activates the action

## Usage

Bottom sheets are best used to surface secondary tasks or contextual information without navigating away from the current screen. They support flexible interaction flows—like confirmations, quick selections, or additional information—and are especially effective in mobile-first experiences.

**When to use:** To present short tasks or follow-up actions (e.g., scheduling, selecting options)
When the user needs to focus on a specific task but stay within the current context
For mobile-friendly alternatives to modals, menus, or action lists
To provide supplementary or preview content (e.g., transaction detail, filter menus)

**Don't use when:** For critical, high-stakes decisions → use a Dialog
For long, scroll-heavy content or complex flows → consider a full-screen view
For content not triggered by direct user action → avoid interruptive UX
When a simple menu, toast, or action sheet is more appropriate.
How to use the component

There are two ways to use this component in Figma:

Choose from prebuilt templates
Use the properties panel to select a ready-made template that fits your use case.
Create your own template
Customize the component from scratch to match your specific design needs.

Pick the option that works best for your workflow.

Option 1 - Choose from prebuilt templates

Option 2 - Create your own template

You can create your own template and add it to the component by following these steps, no detaching required.

Step 1 - Add the component to your file from the native library

Step 2 - Use guidelines from the ‘clear’ template to make a  component with content you need

Step 3 - Select the component that you created via the content instance swap property

Dismiss interaction

The bottom sheet can be dismissed by dragging, tapping the scrim, or by tapping a dismiss or close button. If dismissal is low risk and reversible, let users tap the scrim to dismiss and if there’s any consequence, ambiguity, or next step, require an explicit button.

Use scrim tap only when
Non-destructive, informational sheets (e.g., quick pickers, simple filters with auto-apply).
Read-only or preview content where state is unchanged.
Single-task interruptions where the default desired action is “close.”
Sheets used as transient context (e.g., a lightweight share target chooser).
You also provide another obvious escape (drag down/swipe to dismiss) per platform norms.
Require an explicit button when
Changes aren’t auto-applied or there’s unsaved input that would be lost.
Destructive or high-impact outcomes (money movement, closing an account view, irreversible filters).
Multi-step or confirm-required tasks (review and confirm, legal acknowledgments).
Any sheet that sets long-lived preferences or affects downstream calculations.
When dismissal should also trigger validation, save, or a toast/snackbar with context.
when to offer both
Low risk, but you still want to teach the primary path: keep a clear “done/continue” button and allow scrim as a convenience.
Include a subtle hint like a drag handle and maintain ESC/back behavior.
button labeling best practices
Primary action reflects the result: done, apply, continue, confirm.
Secondary action is explicit: cancel or close (only if needed).
Avoid “x” buttons if the scrim and swipe-to-dismiss already exist; reduce redundancy.
Platform nuances
iOS: Users expect swipe/drag to dismiss and often scrim tap for lightweight sheets. Reserve explicit buttons for commitment.
Android: Modal bottoms/bottom sheets often include explicit actions; ensure system back consistently dismisses. Pair with scrim tap only when safe.
Accessibility considerations
Always expose a visible dismiss affordance somewhere (not just the scrim) for discoverability.
Ensure focus lands on the sheet and traps within until dismissed.
Make the dismiss control reachable and labeled (e.g., “close transfer details”).
Announce outcomes when closing applies changes (e.g., a brief confirmation).
state and telemetry
If scrim dismissal would discard edits, prompt with a lightweight confirm (“discard changes?”) or auto-save draft.
Log how often users scrim-dismiss vs. tap the button; if scrim becomes the dominant exit, consider making the sheet lighter-weight or auto-apply changes.
Decision checklist
Can the result be easily reversed? yes → allow scrim; no → require button.
Are there unsaved edits? yes → require button (or confirm-on-dismiss).
Is the sheet informational or task-based? informational → scrim ok; task-based → button.
Does dismissal need to trigger logic? yes → button.
Examples
View account details preview → Scrim tap allowed + Swipe/Drag; Optional “Done.”
Set transfer amount, not yet scheduled → Require “Continue” or “Review”; Scrim tap prompts to discard.
Filter list with instant apply → Scrim tap allowed; Optional “Done” for clarity.
Edit profile info → Require “Save” and offer explicit “Cancel.” This balances speed for low-risk sheets with safety and clarity when stakes are higher.

**Do:**
- Use bottom sheets for focused, short tasks
- Make sure content is scrollable if it exceeds height
- Dismiss via scrim tap, drag down, or close action. Ensure there are at least 2 options to dismiss the sheet
- Provide a clear header or title for context
- Auto-expand on keyboard input when forms are involved
- Include a visible 'Close' or 'Dismiss' button when the bottom sheet is non-draggable and full-screen, so users have a clear way to exit the view.
- Ensure that horizontal scrolling continues seamlessly from edge to edge within the bottom sheet, without being restricted by visual padding.

**Don't:**
- Use them for complex, multi-step workflows
- Let content get cut off or inaccessible
- Force users to find a single dismiss method
- Drop users into unlabeled content with no context
- Let the keyboard cover input fields or buttons
- Rely solely on gestures or assume users know how to dismiss a full-screen bottom sheet — especially when it’s non-draggable.
- Don’t use left and right padding as scroll endpoints—this clips content and creates an inconsistent scroll experience.
- Use overlays on overlays. If a bottom sheet is already open, a dialog or another bottom sheet should not appear over this.
- A bottom sheet should not open another bottom sheet over it.
- Avoid using more than two CTAs. If your use case calls for more, an action sheet may be more appropriate.
