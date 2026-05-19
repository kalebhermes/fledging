# Date picker

The Date Picker component enables users to select a date or date range through an intuitive calendar interface, making date selection quick and easy. Also known as calendar.

## Accessibility

The text field's accessibility label should clearly state the purpose of the input (for example, deliver date) and should match the placeholder text when the field is empty.
In case a selection has not been made
In case a selection has already been made
Screen readers will state the full day, month, date, and year instead of just the day number.

While navigating through dates, the screen reader should skip on disabled ones.
If the user has already made a selection, the focus first lands on the selected date.
If the user has not made a selection, the focus first lands on today's date.
Keyboard interactions
Ensure all elements are navigable via keyboard and affordances have been made for keyboard shortcuts as below.
Ensure keyboard shortcuts are readily available for keyboard and screen reader users by providing the shortcut key in the tooltip. It should be included in the hint description to be read out by the screen reader.
Keys
Action
Enter/Space/Down
Opens the date picker
Enter/Space
Closes the date picker and saves the selected date
Tab
Move between different action areas of the date picker
Up/Down/Left/Right
Navigate to different dates in Dates of the month . up/down for rows and left/right for columns
Page up/down
Move to the same date on next/previous month
Home/End
Move to the first day of the month
Shift + Page up/down
Moves to the same date in the next/previous year
Shift + M
Moves to the month list dropdown
Shift + Y
Moves to the year list dropdown
Truncated labels and tooltips
Truncating labels isn't ideal, but tooltips allow the full text to be shown on hover or keyboard focus.
Days of the week are not interactive and are therefore not focusable via keyboard, yet the tooltip is available on hover. The date picker relies on the conventionality of these abbreviations for some assistive technology users.

Keyboard:
- Enter/Space/Down: Opens the date picker
- Enter/Space: Closes the date picker and saves the selected date
- Tab: Move between different action areas of the date picker
- Home/End: Move to the first day of the month

## Usage

**When to use:** When users need to select a specific date or a date range using a calendar popup
When date selection must be restricted to a valid range (e.g., future appointments, booking windows).
For workflows where date accuracy matters, and visual context aids decision-making.

**Don't use when:** If the user is selecting a static or distant date (e.g., birthdate), where typing is faster than navigating through multiple calendar views.
Single date picker configurations
Calendar Display
Supports multiple views: Days of current month, month picker, or year picker.

Month View
Allows users to pick a month within a selected year.
The year selector remains visible for quick navigation.

Year View
Enables users to select a specific year.
Ideal for workflows involving long date ranges or backdated entries.

Weekend Days
Define which days are considered weekends based on your product’s locale or business context.
You can disable weekends for cases like booking business-only dates.

Disable Specific Dates
Individual dates (e.g., holidays)
Ranges (e.g., system blackout periods)
All dates before or after a given threshold (e.g., today’s date)

Error message
Always display field-level error messages for invalid dates or incorrect formats.
Be specific: instead of “Invalid input”, use messages like “Please enter a date in MM/DD/YYYY format.”
Refer to the Input dropdown  documentation for consistent error behavior, visuals, and accessibility specs.

Range picker

The range view allows users to select a start and end date as part of a continuous date range, typically visualized within the calendar UI by highlighting the selected dates and the days in between.

**Do:**
- Use placeholder text to clearly indicate the expectations from user.
- Disable unavailable or out-of-range dates directly in the picker to prevent selection errors.
- Use a range picker when users need to select a span of time, like for filtering transactions or booking stays.
- Let users manually type static or distant dates (e.g., birthdates) when it's faster than navigating a calendar.

**Don't:**
- Don’t let users guess the format or rely on trial and error to input valid dates.
- Don’t allow users to select invalid dates only to show an error message after the fact.
- Don’t force users to go through the single-date picker twice to define a range — it’s confusing and inefficient.
- Don’t display a full date picker for known or memorable dates that don’t benefit from visual selection.
