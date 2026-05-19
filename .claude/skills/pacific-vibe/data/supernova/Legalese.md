# Legalese

The Legalese Component is designed to display legal disclaimers, terms, or agreements in a structured and user-friendly manner. It ensures that users receive the necessary legal information before proceeding and includes a checkbox for acknowledgment and acceptance of the terms.

## Accessibility

The loading component does not require keyboard accessibility since it is intentionally non-operable and non-navigable. As such, it is not included in the focus order.

Keyboard:
- Tab: Navigate throughout the component
- Space or Enter: Expand or collapse the accordion

## Usage

The Legalese component is designed to display legal disclaimers, terms, and agreements in a clear and concise manner, with functionality that ensures compliance through user acknowledgment.

**When to use:** Consent & Agreements: When users need to explicitly agree to terms before proceeding
Regulatory & Compliance Disclosures: For legal requirements like financial agreements, privacy policies, and authorization consents.
Sensitive Data Submission: When collecting personally identifiable information (e.g., Social Security Numbers, banking details).
Where not to use
Everyday UI Elements: Avoid in buttons, tooltips, and error messages
Informational Content: Use plain language for explanations instead.
User Actions & Navigation: Don't overload menus or CTAs with legalese.

**Do:**
- Ensure scrollability if the legal text exceeds screen height, preventing excessive truncation.
- Optimize component height based on text length—longer content should have a larger height.
- Follow a structured checkbox layout for attestation to maintain UI consistency and clarity.

**Don't:**
- Avoid presenting an entire legal notice as a single scrollable page, as this forces users to scroll extensively before reaching the attestation checkbox.
- Don’t make the legalese component too small, as it should provide a comfortable reading experience without feeling cramped.
- Don’t embed checkboxes inside the legal text section, as it disrupts layout uniformity and reduces readability.

**Content:** Keep It Concise: Summarize legal text in plain language first before linking to full agreements.
Use Progressive Disclosure: Allow users to expand details if needed (e.g., collapsible sections).
Highlight Key Actions: Use bold text for critical details (e.g., “Authorization to run credit”).
Link to Full Policies: Ensure users can access the complete legal document if needed.
