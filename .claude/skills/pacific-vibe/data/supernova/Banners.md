# Banners

The PacificBanner component is a versatile UI element used to display important messages. It can be either informational or interactive, providing users with clear, actionable feedback or guidance. Banners help draw attention to critical information and come in three distinct styles, each indicating a different type of message: information, tip, caution, and danger. This ensures users can quickly understand the context and importance of the message being communicated.

## Accessibility

Critical and danger banners have a role=”alert” and are announced by assistive technologies when they appear.
Banner-accessibility-1
All other banners have a role=”status” and are read after any critical announcements.

Banner-accessibility-order-2

Keyboard:
- Tab: Navigate through different elements such as banner body and then CTA
- Space or Enter: Activates the CTA

## Content Guidelines

Best practices

Banners help get important messages across quickly. Use them for info, tips, cautions, or warnings so users can easily understand what’s happening and what they might need to do.

Info
Use for general updates, reminders, or secondary details. The tone should be neutral and reassuring—clear but not overly urgent.
Keep it short and scannable (1–2 lines).
Keep it straightforward—no need for extra reassurance.

Tip
Use for advice, education, or brand-driven insights. The tone should be helpful, engaging, and in SoFi’s brand voice.
Focus on a clear benefit for the user.
Keep it positive and action-oriented.

Caution
Use for temporary issues, outages, or errors. The tone should be calm, transparent, and reassuring.
Acknowledge the issue, but don’t over-apologize.
If a fix is in progress, mention it to reassure users.

Warning
Use for urgent or irreversible actions, like account closures or past-due payments. The tone should be serious but supportive—no fear-based language.
Format phone numbers like (XXX) XXX-XXXX for readability.
If including a phone number, add a CTA: Call us or Make a payment. (??) 
Stay direct but supportive—focus on solutions, not just the problem.

Mechanics
Use sentence case for all text.
Keep headers optional but use them when clarity or emphasis is needed.
Body text should be short and actionable (max ~120 characters).
Limit CTAs to two and make them clear (e.g., Review settings or Contact us).
Avoid redundancy—the banner itself should communicate urgency without extra fluff.

Content length
Header (optional): ~40 characters max
Body text: ~120 characters max
CTA labels: 2–3 words max

Writer AI prompt

"Write a concise banner message for a financial app. The banner should be [informational, a tip, a caution, or a warning]. Use a [a neutral and reassuring tone for info, a helpful and engaging tone for tips, a calm and transparent tone for cautions, and a serious but supportive tone for warnings]. Keep the message clear and actionable, with a maximum of X characters in the header and X characters in the body.”

## Usage

It’s important to use the correct banner type for your use case. We want to keep the meaning of each type consistent with other components across the platform, such as the status-pill.
Type
Purpose
Preferred Glyph
Example
Content Example
Info
Secondary or nice to have information
glyph-interface-info-stroke
“Pay only $100/mo during your residency. Payments listed below start six months after you complete your residency or fellowship.”
Tip
Advice, education, SoFi’s voice, brand
glyph-interface-lightbulb
“Turn your 35% APR credit card down to a 3.5% APR pre-approved personal loan. Learn more.”
Caution
Outage or error messaging
glyph-interface-error-stroke
“Sorry, we’re having trouble on our end. We’re on it and are fixing the issue as quickly as possible. Thanks for your patience.”
Danger
Irreversible consequences, Past due, Account closed
glyph-interface-error-stroke
“You're behind on payments. Get back on track by making a payment, or explore other options with our team at (833) 531-2510.”
General do’s and don’ts
Do
The Danger type banner where Emphasized=True should only be used at the global level (top of a page).
Don't
Don't use the Danger type banner where Emphasized=True contextually within a page.
Do
The Caution type banner where Emphasized=True should only be used at the global level (top of a page).
Don't
Don't use the Caution type banner where Emphasized=True contextually within a page.
Do
Don't include a glyph in your banner if the surrounding content or elements are also using glyphs.
Don't
Don't include a banner glyph if the surrounding content is already heavily using glyphs. This will just add more visual noise.
Appended Banners
Attaching a banner to a card or row component is a common pattern that can be used as an alternative to a standalone banner. The appended banner creates a stronger visual connection between the card or row content and the banner content.
Card with Banner
Attach a banner to a card template by toggling on the banner property of the card container component. The banner and card lockup are intentionally set up to include specific attributes, so just select the card size and banner type, then use the component as a template to add your content to.
When a banner is appended to a card, the banner’s corner radii inherits the card sizes specific corner radii and smoothing specs.
Large card
Medium card
Small card
Appended Banner Do’s and Don’ts
Do
When appending a banner to a card or row, only use the deemphasized style. The Emphasized Danger style is intended for global banner usage at the top of a page.
Don't
Don't use the Emphasized version of the Danger banner when appending banners to a card or row.
Do
When appending a banner to a card or row, only use the deemphasized style. The Emphasized Caution style is intended for global banner usage at the top of a page.
Don't
Don't use the Emphasized version of the Caution banner when appending banners to a card or row.
Do
Type properties should be consistent when using similar styles in close proximity. In this example, a Status Pill and Banner are being used to communicate that a payment is due soon. Both elements use the Caution Type to reinforce the urgency in the messaging.
Don't
Don't use different Type properties when using similar status elements together such as a Status Pill and Banner. Their Types should be cohesive (ie. either using the Info Type or Caution Type, but not both.)

**Do:**
- The Danger type banner where Emphasized=True should only be used at the global level (top of a page).
- The Caution type banner where Emphasized=True should only be used at the global level (top of a page).
- Don't include a glyph in your banner if the surrounding content or elements are also using glyphs.
- When appending a banner to a card or row, only use the deemphasized style. The Emphasized Danger style is intended for global banner usage at the top of a page.
- When appending a banner to a card or row, only use the deemphasized style. The Emphasized Caution style is intended for global banner usage at the top of a page.
- Type properties should be consistent when using similar styles in close proximity. In this example, a Status Pill and Banner are being used to communicate that a payment is due soon. Both elements use the Caution Type to reinforce the urgency in the messaging.

**Don't:**
- Don't use the Danger type banner where Emphasized=True contextually within a page.
- Don't use the Caution type banner where Emphasized=True contextually within a page.
- Don't include a banner glyph if the surrounding content is already heavily using glyphs. This will just add more visual noise.
- Don't use the Emphasized version of the Danger banner when appending banners to a card or row.
- Don't use the Emphasized version of the Caution banner when appending banners to a card or row.
- Don't use different Type properties when using similar status elements together such as a Status Pill and Banner. Their Types should be cohesive (ie. either using the Info Type or Caution Type, but not both.)
