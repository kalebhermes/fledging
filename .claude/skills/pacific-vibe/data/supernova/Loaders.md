# Loaders

Loaders are UI elements that notify users that an application is performing an action in the background. Loaders help manage user expectations by providing visual cues that indicate that the app is working on something, and that the user should wait for a few moments.

Pacific has 3 types of loaders - Page loader, Button loader and Skeleton loader

## Accessibility

The primary accessibility focus for the loading component is to communicate its status to users relying on assistive technologies. The label should automatically notify users that an action is in progress as soon as the loading state is triggered. For example, the loader should announce:
"Loading…"
"Loading home screen…"
"Loading your content…"
This informs users of the ongoing process and provides context.
Localize the Label Based on Screen or Use Case
The label should be customized based on the screen or specific use case. Tailoring the label ensures users get clear, context-sensitive feedback while waiting for content, data processing, or an action to complete. This improves the user experience by providing relevant and meaningful messaging that aligns with the task at hand.
Convey when loading has completed
Once the loading indicator disappears, it signals that the process is complete. However, users who cannot visually perceive the icon's disappearance need an alternative cue that the system is ready for interaction, particularly if the load time is lengthy.
To address this:
Ensure focus is shifted to the new content or active elements once loading is complete. This provides a clear, intuitive cue that the system is now interactive.
Annotate which element takes focus after loading, ensuring the behavior is predictable and accessible for all users.
Deactivate the page
While the inline loading component is not keyboard operable, it may temporarily replace or disable related components while loading is in progress. For instance, when loading is triggered by a button click, relevant input fields or actions may be disabled until the loading state resolves to "complete" or "error."
In this case, users should be prevented from navigating the page until the loading action is complete.
Handling Loading Errors
If an error occurs during loading, an error message should be displayed and announced to the user. Suggested error messages include:
"You’re not connected – Please ensure your Wi-Fi or cellular data is on, then try again."
"Let’s try that again – It’s not you, it’s us. Mind giving it another go?"
If the error is tied to a specific field (e.g., missing or incorrect data), the screen reader should automatically focus on that field and announce the specific error message for that component. This ensures users are immediately informed of what needs to be corrected.
Scaling
Page loader and button loaders will stay consistent across scaling.
The skeleton loader's size will adjust based on the user's text scaling preferences. If the user has selected a larger text size, elements like text boxes and containers in the skeleton state will scale accordingly to match the increased size, ensuring a consistent experience. As text boxes become larger, the skeleton loader will also expand to maintain proportionality and visual coherence. This ensures that the skeleton loader remains aligned with the user's accessibility settings, preserving both clarity and functionality. Text scaling guidelines

The loading component does not require keyboard accessibility since it is intentionally non-operable and non-navigable. As such, it is not included in the focus order.

## Usage

Page loaders
A Page Loader is used when an entire page or a significant portion of the page is loading or refreshing. It serves as a visual cue to users, signaling that the system is actively working and that the full content is not yet available.

**Do:**
- Use this loader when the entire page or a major portion of the page is loading. This includes full page refreshes or large data loads that affect multiple elements on the page.
- A page loader should occupy the entire screen to clearly indicate to the user that the entire page is in the process of loading.

**Don't:**
- Avoid using this loader for small, isolated actions or individual components. For those situations, opt for a Button Loader or Skeleton Loader instead, as they are better suited for localized loading states.
- Don't show more than one loader at a time to avoid an overly-busy interface. Show a single loader over the collection of loading content instead.
- Do not display any content or elements beneath the loader, as it can create a cluttered and distracting user interface that may confuse or frustrate users.
