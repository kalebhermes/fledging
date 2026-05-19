# Steppers

This documentation focuses on vertical and horizontal steppers. See the Progress Meters documentation for guidelines and specifications on our progress meter components.

A progress meter and a stepper both communicate progress, but they differ in how they represent it and what kind of user experience they support.

The stepper component visually communicates a user’s position within a multi-step flow. It breaks down a process into discrete steps and highlights the current step, along with optional indicators for completed and upcoming steps. Steppers help users understand the structure of a task, maintain orientation, and build confidence by making progress visible. They’re especially useful in funnels or workflows where users must complete a specific sequence of actions to reach a goal.

Stepper types
stepper-horizontal — visually tracks steps over time in a horizontal orientation
stepper-horizontal-segmented — full page funnels and flows with a determinant number of steps
stepper-horizontal-small — tracks the progress of a flow or funnel with a determinant number of steps in a condensed surface area, such as a card
stepper-vertical — visually track steps over time in a vertical orientation

Stepper vs. Meter
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
Horizontal stepper
Segmented stepper
Segmented stepper - menu open
Small horizontal stepper
Vertical stepper

Horizontal stepper
Segmented stepper
Segmented stepper - menu open
Small horizontal stepper
Vertical stepper

Keyboard:
- Tab: Moves the focus to the next interactive element (links, buttons, form fields, etc.)
- Shift + Tab: Moves the focus to the previous interactive element
- Enter + Space: Activates the currently focused element (e.g., clicking a button or selecting a link)
- Escape: Closes active element

## Usage

The stepper is a deterministic, visual navigation aid that communicates a user’s position within a multi-step flow. It breaks a complex process into smaller, digestible parts and guides users step-by-step toward completion. Steppers are especially helpful in goal-oriented flows where task structure and progress clarity are important.

**When to use:** The process has a defined number of steps that must be completed in sequence or with some flexibility
You want to help users track their place and build confidence as they move through a task, funnel, or flow
The flow involves multiple screens or stages, each with a distinct purpose
Users may need to return to previous steps or edit completed steps

**Don't use when:** The task is a single-step or very short flow where a stepper adds visual noise
The process has an uncertain number of steps or unfolds dynamically (e.g., variable forms)
You’re showing ongoing progress without discrete milestones—use a progress meter instead
The visual component suggests navigation, but your design doesn’t actually allow users to move between steps
Usage by type

Stepper

Example

Usage

Horizontal

Card, Module

Horizontal Segmented

Top of page (Funnel or Flow)

Horizontal Small

Card, Module

Vertical

Cards, Page surfaces, Bottom Sheets

Common use cases
Application flows for loans, credit cards, or accounts
Identity verification flows with multiple checkpoints
Investment onboarding that gathers risk, goals, and personal info in stages
Transfer or withdrawal flows that require review and confirmation steps
Security setup for multi-factor authentication or recovery options

**Do:**
- Use clear, concise labels for each step so users understand the task at hand
- Reflect the correct step state: active, completed, upcoming (and optionally error)
- Small horizontal steppers support a green progress bar instead of the default neutral.
- Only use a small horizontal stepper in contextual instances such as a card that tracks the application completion steps in a condensed format.

**Don't:**
- Don’t include a stepper for tasks with just one screen or a single form
- Don’t make the stepper interactive unless the flow supports navigating between steps
- Segmented steppers do not support different color segments.
- Don't use the small horizontal stepper at the top of a page or funnel.
