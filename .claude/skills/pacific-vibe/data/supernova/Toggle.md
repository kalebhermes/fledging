# Toggle

Toggles (aka Switch) let users turn an individual option on or off, typically for activating or deactivating specific settings. They are ideal when items in a list need to be controlled independently, providing a clear, quick way to adjust settings. Make sure the toggle’s status (on or off) is immediately visible at a glance.

## Accessibility

The accessibility label for a toggle is generally the same as the label/text associated to it.

Since the disabled state is non-actionable, it should be skipped in the tab order.

The screen reader should navigate the page in a logical, hierarchical order and focus on the toggle component, including its label and any associated error state, as a single, cohesive unit.

Keyboard:
- Tab: Moves focus to the toggle/switch.
- Space or Enter: Toggles the switch state between "on" and "off."

## Content Guidelines

Toggle content guidelines

Toggles let users control a setting by turning it on or off. Your job as a content designer is to make sure the label is clear, scannable, and accurately describes what the toggle controls when it’s on. These labels often appear in settings, preferences, or control panels where quick comprehension matters.

Label the setting, not the state
	
• Write the label as the name of the feature or setting

• Make it easy to read and understand at a glance

• Make sure it makes sense when read with “on/off”

For example: Overdraft protection on/off

• Write the label as a sentence

• Describe the current state of the toggle

❌ Overdraft protection is on

❌ Turn on overdraft protection

Focus on what happens when the toggle is on

The label should describe the feature or action that will be active when the toggle is turned on. This makes the control more intuitive and easier to scan, especially in a list of settings.

Good examples:

Overdraft protection
Push notifications
Face ID login
Savings round-ups

Use concise, scannable labels

Toggle labels should be short, front-loaded with the keyword, and easy to scan. Avoid phrasing the label as a question or a call to action.

• Front-load key terms (e.g. Email notifications, not Would you like to receive emails?)

• Use sentence case

• Keep labels under 4 words when possible

• Use full sentences or ask questions

• Repeat what's already implied by the toggle interaction

Add optional supporting text when needed

Use short descriptions (inline or below the label) to clarify what the setting does. This is especially helpful for complex or unfamiliar features.

Example:

Label: Overdraft protection

Subtext/description: Automatically transfer from savings to cover transactions when checking is low.

Tips:
Only add descriptions when they improve clarity
Keep descriptions concise and action-oriented
Avoid repeating the label or stating the obvious

Write toggle labels so they work with assistive tech

Ask yourself: Does the label make sense when read aloud with “on” or “off”? If it doesn’t, rework the label.

Examples:
	
Notifications on/off

Turn on notifications on/off → doesn’t make sense

When toggles are used as switch-style buttons
If a toggle visually resembles a button but behaves like a switch (e.g. grid vs list view, dark mode toggle), use a recognizable icon and visually indicate state changes. These should still follow the same content principles: short, purposeful, and state-aware.

## Usage

**When to use:** When offering a simple, binary choice, such as turning an option on or off.
In situations where the action should take immediate effect without requiring additional confirmation.
When the toggle functions independently, with no dependencies or interactions with other toggles in the interface.

**Don't use when:** Each toggle should be treated as a standalone control for a single option, functioning independently of others. For multiple, related choices, consider using a Checkboxes or Radio to better represent interrelated options.

**Do:**
- Use a label to give toggle context when possible.
- Use a tab, instead of a toggle, for options that aren't yes or no.
- Consider using a button, instead of a toggle, for single actions and navigational elements.

**Don't:**
- Avoid truncating label text. Instead, allow it to wrap to form another line.
- Avoid using a toggle for options that aren't yes or no.
- Don’t use a toggle for taking an action like downloading an app, since turning off the toggle wouldn’t uninstall it. Consider a button for that instead.
