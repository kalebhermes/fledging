# Pacific Vibe — TODO

## Props extraction noise

The type-checker fallback in `index-repo.mjs` resolves props for components that extend external types (e.g., `TooltipProps extends PopoverProps<'div'>`). A >50 props filter strips obvious HTML attributes (`on*`, `aria-*`, `style`, `className`, etc.), but some noise remains:

- **Card** (10 props): includes `defaultChecked`, `defaultValue`, `radioGroup`, `inlist` — HTML globals leaking through the filter
- **PhoneInput** (47 props), **DateInput** (48 props): inherit `<input>` element props — technically correct but noisy. Most are standard HTML input attributes (`accept`, `alt`, `autoComplete`, `checked`, etc.) rather than component-specific API

### Options

1. **Tighter HTML blocklist** — add more HTML globals to the `HTML_ATTRS` set in `extractPropsViaTypeChecker()`
2. **Heuristic: own vs inherited** — compare type-checker resolved props against the AST-extracted own members. Props that appear in the AST declaration are "own"; the rest are inherited
3. **Declaration source filtering** — check each property's declaration file path; drop anything from `node_modules` or React type definitions
4. **Lower the threshold** — reduce the 50-prop cap to 30 to catch PhoneInput/DateInput

Option 2 is the most robust long-term fix.
