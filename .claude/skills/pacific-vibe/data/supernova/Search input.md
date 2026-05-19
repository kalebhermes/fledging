# Search input

The Search Input component is a special type of text-based input that allows users to quickly locate specific information within large datasets, such as transactions, holdings, accounts, or stocks. By enabling users to input text queries, this component simplifies navigation and improves the efficiency of accessing critical financial data.

## Accessibility

Accessibility labels are crucial for ensuring inputs are usable by individuals relying on screen readers.

Keyboard:
- Tab: Enter text field, move to next actionable element
- Enter: Submit or select element
- Esc: Cancel or clear

## Usage

The input-search component is designed to help users quickly locate specific content, items, or information within a dataset or system. It is commonly used in scenarios where browsing or filtering would be inefficient, such as finding transactions or discovering product offerings. By allowing users to enter queries and receive relevant results, search inputs improve discoverability, streamline navigation, and enhance the overall efficiency of the user experience.

**When to use:** Discoverability: Use a search input when users need to quickly locate specific content, items, or information within a large dataset (e.g., accounts, transactions, products).
Efficiency: When searching is faster or more effective than browsing, especially in dense or hierarchical information structures.
Dynamic Content: For applications with real-time or predictive search capabilities that display results dynamically as the user types.

**Don't use when:** Limited Content: Avoid search inputs if the dataset is small enough to browse or filter manually.
Unstructured Data: If the content cannot be effectively indexed or searched, consider alternative solutions like categorized navigation.
No User Benefit: Avoid adding a search input purely for aesthetic purposes without a clear use case or user need.
Considerations
Placement
Position the search input prominently where users expect it.
Global Search: Place in the header or top navigation.
Scoped Search: Embed within a specific section or context (e.g., within a transactions page).
Use visual prominence to differentiate it from other form fields.
Do

Don't

Placeholder text
Provide concise and descriptive placeholder text to guide users (e.g., "Search accounts or transactions").
Avoid generic placeholders like “Search...” unless the context is entirely clear.
Do

Don't

Loading
Provide visual feedback (e.g., skeleton loader or spinner) when search results are being fetched.
Do

Don't

Search triggers
Trigger search when:
The user presses “Enter” or “Done” on keyboard or keypad.
The user selects a suggestion or result.
The user clicks a search button (if applicable).
Do

Error handling
Gracefully handle scenarios with no results. Provide actionable guidance such as:
“No matches found. Try refining your search.”
Avoid dead ends by offering suggestions, filters, or related searches.
Do

Don't

Content limitations

Text in a form field should not be truncated if the input data is too long. Instead, use the appropriate text input field for the length of data needed.

Query length
Don’t truncate intput text. If needed, the users search query should horizontally scroll within the input field.
Set a character limit for queries based on the backend system's processing capacity. Common limits range from 100 to 500 characters, depending on the use case.
Error feedback
Provide clear feedback if the user exceeds the limit. For example:
Inline message: “Search queries cannot exceed 200 characters.”
Disable submission until the query is within the limit.
Avoid overly restrictive limits
Ensure limits accommodate realistic use cases (e.g., multi-word searches, complex queries).
Do

Don't

**Do:**
- Error handling

**Don't:**
- Placeholder text
- Loading
- Search triggers
- Content limitations
