# Progress meters

This page focuses on guidelines and documentation for Progress Meter components. See our Steppers guidelines for horizontal and vertical stepper components.

A progress meter and a stepper both communicate progress, but they differ in how they represent it and what kind of user experience they support.

Meter vs. Stepper
Meter: “60% complete”
Purpose: Shows how much progress has been made toward a goal, often as a percentage
Visual: Usually a linear bar (horizontal or vertical) that fills up
Use cases: Download/upload progress, form completion, performance scores, etc
Focus: Quantity of progress
Interaction: Typically non-interactive — it's a passive display of status
Stepper: “Step 2 of 5 — Mailing Address”
Purpose: Shows where a user is in a multi-step process or flow
Visual: A series of steps (often horizontal or vertical) connected by lines
Use cases: Signup flows, checkout processes, onboarding steps, etc
Focus: Sequence and current position in a flow
Interaction: Can be interactive (letting users go back/forward) or non-interactive, depending on context

## Accessibility

Assistive technologies, such as screen readers, can read the label on pills, making the meaning of the badge accessible to all users. The label should effectively convey the same message without solely relying on color.

Keyboard:
- Tab: Selects the progress meter and label

## Usage

The progress meter is a non-interactive, determinate component that visually communicates how far a user has progressed through a known process. It fills proportionally based on completion percentage or step count. Use it to give users a clear sense of orientation and encourage task completion, especially in flows that require focus or have multiple parts.

**When to use:** The process has a known number of steps or a measurable percentage of completion
You want to motivate users to complete a task by showing how far they’ve come
The process has multiple sections or phases that take time or effort
Progress can be objectively calculated (e.g., steps completed out of total steps)

**Don't use when:** The process has uncertain or variable duration (use an indeterminate loader instead)
Progress can’t be accurately calculated
The task is a single-step or very short interaction where a meter adds unnecessary visual noise
It could give a false sense of completion before backend processes are finalized
When you need to indicate page loading or content loading

Common use cases
Profile completeness meter for unlocking features or personalization
Savings goal tracker showing progress toward a target amount
Data visualization comparing percentages
Spending insights tracking

**Do:**
- Use as a visual reference within the context of related information, such as in a card.
- Use meters to track progress over time, such as application progress or account set up.

**Don't:**
- Don't use at the global page level in a funnel or flow. This would indicate specific steps, which should be represented by a stepper component rather than a percent based meter.
- Don't use meters as loading indicators to track the progress of loading.
