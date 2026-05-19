# Status pill

The Status Pill is a simple visual element that helps users quickly understand important information. It uses different colors and labels, like success, caution, info, and warning, to draw attention to key details and create a clear order of importance. This makes it easier for users to see and understand what’s important on the screen.

## Accessibility

Assistive technologies, such as screen readers, can read the label on pills, making the meaning of the badge accessible to all users. The label should effectively convey the same message without solely relying on color.
Role of the pill:
Status - Use this in cases where the pill is showing a status.
Text - Use this in cases where the pill is presenting a helper text to the content.

The focus order of the pill will depend on the use case, and how the pill sits in the UI. Follow this focus order for screen reader navigation. WCAG guidelines

Keyboard:
- Tab: Focus lands on the pill.

## Usage

The pill-status is a great way to create hierarchy of information and communicate a status or importance of information to users. Status pills should be used consistently across your design to maintain clarity and avoid user confusion. Consider the context and ensure the color and label are intuitive and consistent with other uses throughout the platform, so users can quickly grasp the meaning without additional explanation.
Selecting a type
When selecting a type, consider the hierarchy of information and the type of information. The pill should be used to create hierarchy, emphasize information, call-out or warn, and recommend. Pill type usage should be consistent across the platform, so using the proper pill type for your use case is pivotal.
Type
Usage
Example label text
Info
Primary information that indicates neutral information or data (neither positive nor negative)
"Pre-qualified”, “Updated”, “New”, "
Secondary
Secondary information or a disabled status
“Sold out”, “Already have”, “Not available”, “Pending”, “Pending review”
Tip
Recommendations, insights, tips, marketing value prop, prominent data
“X.XX% APY”, “Recommended”, “For you”, “XX pts”, “Bonus”
Success
Indicates a positive status
“Increased”, “Complete”, “Success”, “Posted”
Caution
Use to communicate a gentle warning or indicate upcoming soon
“Due in 3 days”, “Due soon”, “Incomplete”
Danger
A negative status that calls for immediate action
“Past due”, "Decreased”, “Charged-of”, “Critical”
On dark
Call out information or a product type on dark or marketing color surfaces
“Recommended”, “For you”, “Get started”, “New”, “Bonus”
Choosing a size
The default size of the status pill across all grid types is the small size. The large variant is used for special use cases where a larger visual call out is required. Generally, you’ll be using the default (small) size which supports text-label-small. The large size supports text-label-medium, so when deciding which size to use in your layout, consider a few things:
What size type is the content contextually related to pill?
Is the pill primary, secondary, or tertiary information?
Are there other pills on the page? Do they need to be consistent or visually differentiated in size?
