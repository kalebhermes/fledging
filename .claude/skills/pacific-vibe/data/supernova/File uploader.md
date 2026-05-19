# File uploader

The File uploader component allows users to upload file(s) from their device using a native file input or by dragging and dropping files into a designated drop zone. Users can select multiple files at once, provided they adhere to the page’s upload requirements. Each selected file will be treated as a unique entry in the file list; if a file is chosen multiple times, user will get an error saying it has already been uploaded.

Drag and drop file uploads enable users to upload files directly by dragging them into the drop zone. Alternatively, users can upload files via a file selection dialog by clicking the text link inside the drop zone. The drop zone component offers flexibility by allowing multiple files to be uploaded simultaneously or limiting the upload to a single file, depending on configuration.

fileUploader2-hero

## Accessibility

Loader Type: Multiple Drop Zones
Loader Type: One Drop Zone with Options Table
Additional Information

Options Table
Single Drop Zone
Additional Information
File Cards
File cards’ status updates
Ensure that any feedback or status changes, such as when a file has been successfully uploaded, errors, or progress updates, are announced to screen reader users.

Keyboard:
- Tab: Move focus between browse buttons, drop zones, file cards, and submit button (sequentially across zones).
- Shift + Tab: Move focus backwards through interactive elements.
- Enter / Space (on Browse button): Opens the native file picker.
- Enter / Space (on Drop zone): Announces “Drag and drop files here, or press Enter to browse.” Opens the native file picker.
- Enter / Space (on Remove/Replace button in File Card): Executes the selected action (remove or replace file).
- Arrow Left / Right: Move focus between file cards within the same upload zone.
- Arrow Up / Down: Move focus between upload zones (or file cards across zones if present).
- Enter / Space (on Submit button): Submits uploaded files. Disabled until required files are uploaded.

## Usage

The File uploader component is used to allow users to easily upload files by dragging and dropping them into a designated area or by selecting files from their device through a file input dialog. It supports single and multiple file uploads, provides clear feedback during the upload process, and handles errors gracefully. This component is ideal for forms, content submissions, and any scenario requiring file input, ensuring a user-friendly and accessible experience.
Usage Guidelines
Choosing the Type of Loader
The single drop zone can accept multiple files and is frictionless, but at times you may need to use multiple drop zones. Use the following table as guidelines for when to use each variant:
Use
Scenario
Single Drop Zone
Use when order does not matter and files can be grouped together.
Supports bulk upload (dragging multiple files at once).
Recommended for when users can upload several of the same type of document (e.g., multiple invoices, receipts).
Multiple Drop Zones
Helps guide users explicitly on what belongs in each slot.
Useful when different document types must be submitted (e.g., Driver’s License, Proof of Address).
Handling Additional Information
To provide further information on a document and its requirements beyond the description or helper text, provide additional information in a bottom sheet that is accessed through the information glyph.
Choosing Between Upload Options
When users have a choice of what documents to upload, use the following guidelines:
Use
Scenario
Inline Description
When: User has only 1–2 alternatives that are easy to understand and require little explanation.
Why: Keeps the flow lightweight without introducing unnecessary steps.
File Table Options
When: Several valid options that need some clarification (e.g., requirements, slight differences), but the list is still short enough to show on the same screen.
Why: Users need a reference to choose correctly, but don’t need to be pulled out of the flow.
Primer Screen
When: Many possible options with different rules, eligibility, or processing differences that could overwhelm the upload step.
Why: Separating the decision process into two steps (choose first, upload second) prevents overload and mistakes.
Uploading Multiple Documents
When users are ask for multiple documents to upload, use the following guidelines:
Use
Scenario
Inline Description
When: The files are of the same type or category, and requirements are easy to understand.
Why: Users don’t need guidance beyond knowing they can attach several items.
Separate Drop Zones
When: Multiple files are required, but they’re of different types with clear, distinct roles. Users may need light cues to ensure they don’t miss any.
Why: Keeps the context together while still making the differences explicit.
Separate Pages
When: Multiple files with unique requirements, validations, or instructions that could overwhelm if shown together.
Why: Breaking the task into separate steps lets the user focus on one requirement at a time, reducing errors.
SoFi Shield Disclaimer
Use the SoFi Shield disclaimer only in situations where we request sensitive information and need to reassure users about security or privacy concerns.
Upon clicking on the SoFi Shield button, the bottom sheet should open with additional information. For full guidelines on SoFi Shield usage, refer to this file.

**Do:**
- Use “Upload” as the action verb in component labels, such as “Upload Files” or “Upload Attachments,” to clearly communicate the action.
- File names should be truncated in the middle if too long, to prevent overflow and maintain readability.
- Error messages on file cards should clearly state the issue (e.g., invalid file type, size limit exceeded).

**Don't:**
- Don't change the action verb.
- Don't show the full file name if it is longer than the width of the file card.
- Don't show the file name if the file doesn't successfully upload.
