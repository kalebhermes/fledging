---
name: pacific-vibe
description: Build UIs with SoFi's Pacific design system. Prototypes, internal tools, dashboards. Optional full SoFi app chrome. Works in new or existing projects. Searches 100+ components, 272 icons. Figma integration.
metadata: # note that these are not required by the official spec, but ARE required by this service
  author: team:webcore
  version: "2.1"
  slack_channel_link: https://sofi.enterprise.slack.com/archives/C09EGQUALRJ
argument-hint: "<description of what to build>"
---

# Pacific Vibe — Build UIs with SoFi's Design System

You are now operating in **Pacific Vibe** mode. Every UI you generate must conform to SoFi's **Pacific** design system. You have access to tools that give you live component APIs, design tokens, and project scaffolding.

## Skill Directory

All script paths in this document are **relative to this skill's directory** (the directory containing this SKILL.md). When running commands, resolve them against that directory.

## Prerequisites

Before using `verify-ui.mjs` or `scaffold.mjs`, ensure the skill dependencies are installed:

```bash
cd <skill-dir> && npm install
```

Component search and token lookup work without any dependencies (pre-built data).

## Architecture

```
User request → search/get-tokens (pre-built data/) → Build with Pacific components + tokens
```

Component APIs, design tokens, and Supernova design guidelines are pre-built and shipped with the skill in `data/`. No repo clone, no scraping, no tokens needed at runtime.

**Data frozen at**: `@sofi-web-ui/core@8.1.4`, `@sofi-web-ui/base@3.8.2` — see `data/version.json` for details.

**Available tools:**
| Script | Purpose |
|--------|---------|
| `search.mjs <query>` | Find components by name/keyword |
| `search.mjs <query> --type=icons` | Find icons by name (272 icons, 4 categories) |
| `get-tokens.mjs <category>` | Get tokens (colors, spacing, typography...) |
| `scaffold.mjs <dir> [--chrome=full\|minimal\|none]` | Generate Vite + React + Pacific starter project |
| `verify-ui.mjs <command>` | Screenshot, console capture, and DOM audit for Pacific compliance |

---

## Pacific Design Principles

### Colors — Always Semantic

- **DO**: Use semantic color tokens from `colorTokens` (e.g. `colorTokens.contentPrimaryDefault`, `colorTokens.surfacePrimary`)
- **NEVER**: Use primitive colors (`colorPrimitives.blue600`), hex values (`#1a73e8`), or CSS color names
- **Import path**: `import { colorTokens } from '@sofi-web-ui/base/dist/colorTokens.stylex'`
- Semantic tokens automatically adapt to dark mode

### Spacing — Token-Based Rhythm

- **DO**: Use `globalTokens.rpx*` values for all spacing (margin, padding, gap)
- **Available**: `rpx10` (0.625rem) through `rpx56` (3.5rem) in 2px increments
- **NEVER**: Use raw pixel values, em values, or arbitrary rem values
- **Import path**: `import { globalTokens } from '@sofi-web-ui/base/dist/globalTokens.stylex'`

### Typography — Use Text Scales

- **DO**: Use `textTokens` for all text styling
- **Hierarchy** (large → small): Display → Headline → Title → Label → Body
- Each scale has ExtraLarge, Large, Medium, Small, ExtraSmall variants
- Additional scales: Underline, Overline, Button, BodyEmphasized
- **NEVER**: Set raw `fontSize`, `fontWeight`, or `lineHeight` values
- **Usage**: `<h1 {...stylex.props(textTokens.headlineMedium)}>Title</h1>`

### Elevation — Box Shadows

- **DO**: Use `boxShadowsTokens` for depth/elevation
- Levels 1-5, both `dropShadowDown*` and `dropShadowUp*`
- **Import path**: `import { boxShadowsTokens } from '@sofi-web-ui/base/dist/boxShadows.stylex'`

### Borders

- **DO**: Use `globalTokens.borderRadius*` (12, 16, 20, 24)
- Standard border: `1px solid ${colorTokens.strokeEdge}`

### Theming — Dark Mode

Pacific's `darkMode` theme is a **StyleX theme object** created with `stylex.createTheme()`. It overrides the CSS custom properties defined by `colorTokens` for an element and all its descendants.

**CRITICAL: Themes must be applied via `stylex.props()`, NOT as a className string.**

**NEVER use `plusMode`.** The `plusMode` theme assumes a dark gradient background that the scaffold does not provide. Applying it produces near-white text on a cream background — completely unreadable. Only `darkMode` is safe for general use.

```typescript
import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { darkMode } from '@sofi-web-ui/base';
import { colorTokens } from '@sofi-web-ui/base/dist/colorTokens.stylex';

function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    // Pass the theme as part of the stylex.props() array
    <div {...stylex.props([isDark && darkMode, styles.page])}>
      {/* All children automatically get dark mode colors */}
      <button onClick={() => setIsDark(d => !d)}>Toggle theme</button>
    </div>
  );
}

const styles = stylex.create({
  page: {
    backgroundColor: colorTokens.surfaceBase,
    color: colorTokens.contentPrimaryDefault,
    minHeight: '100vh',
  },
});
```

**How it works under the hood:**

1. `darkMode` is created via `stylex.createTheme(colorTokens, { ...overrides })` — it maps ~150 semantic color tokens to dark-appropriate primitive values
2. When passed to `stylex.props()`, StyleX compiles it into a className that sets scoped CSS custom properties on that element
3. Any descendant using `colorTokens.*` tokens automatically picks up the dark values because they reference the same CSS custom properties
4. No React context, no ThemeProvider — it's purely CSS cascade

**Common mistakes:**

```typescript
// WRONG — darkMode is a theme object, not a CSS class string
<div className={darkMode}>

// WRONG — String() coercion loses the StyleX metadata
<div className={String(darkMode)}>

// WRONG — spreading separately creates duplicate className attributes
<div {...stylex.props(styles.page)} className={darkMode}>

// CORRECT — include theme in the stylex.props() array
<div {...stylex.props([isDark && darkMode, styles.page])}>
```

**Scope:** The theme applies to the element and its DOM subtree. You can theme subsections independently:

```typescript
// Dark page with a light card
<div {...stylex.props([darkMode, styles.page])}>
  <div {...stylex.props(styles.card)}>
    {/* This card uses dark mode colors */}
  </div>
</div>
```

**Available themes:**

- `darkMode` — dark surfaces, light text, border strokes instead of shadows

### Dark Mode Toggle (included in scaffold)

The scaffold template includes a `DarkModeToggle` component in the header by default. It's a custom switch with Pacific's `Night` icon embedded in the knob. Pacific's `Toggle` component doesn't support content inside the knob handle, so this is built directly from tokens.

The toggle is already wired up in the scaffolded `App.tsx`:
- `isDark` state on the root `App` component
- `darkMode` theme applied to the root `<div>` via `stylex.props([isDark && darkMode, styles.page])`
- `DarkModeToggle` in the header with `aria-label="Dark mode"` and `role="switch"`

**Key tokens used:**
- Track: `colorTokens.surfaceSwitchUnselected` (off) / `colorTokens.surfaceElevatedSelected` (on)
- Knob: `colorTokens.surfaceElevatedDefault`
- Icon: `Night` from `@sofi-web-ui/icons`, 14px, using `contentSecondaryDefault` (off) / `contentPrimaryDefault` (on)

If the app doesn't need dark mode, remove the `DarkModeToggle`, the `isDark` state, and the `darkMode` import — revert the root div to `stylex.props(styles.page)`.

---

## Layout Patterns

Six layout components are available in `templates/layouts/`. Copy them into the project's `src/components/layouts/` as needed — they are **not** auto-copied by scaffold (except for `--chrome=full` which copies PageShell and FullWidth).

For full documentation with props tables and composition examples, read `data/layout-patterns.md`.

**Quick reference:**

| Component | Use For | Key Props |
|-----------|---------|-----------|
| `PageShell` | App wrapper with SoFiHeader + Footer | `chrome` (bool, default true) |
| `SidebarLeft` | Left nav + main content | `sidebar`, `sidebarWidth` (default "240px") |
| `SidebarRight` | Main content + right panel | `sidebar`, `sidebarWidth` (default "320px") |
| `FullWidth` | Single column, optional max-width | `maxWidth` (default "100%") |
| `TwoColumn` | Equal 50/50 split | `left`, `right`, `gap` |
| `HeroContent` | Banner above content | `hero`, `children` |

**Composition pattern:**

```tsx
<PageShell>
  <HeroContent hero={<PageBanner />}>
    <SidebarLeft sidebar={<Nav />}>
      <TwoColumn left={<Metrics />} right={<Activity />} />
    </SidebarLeft>
  </HeroContent>
</PageShell>
```

To use a layout, copy it from `templates/layouts/` into `src/components/layouts/` and create a barrel export. Only copy what you need.

---

## Component Usage Rules

### 1. Always Search Before Building

Before creating ANY custom UI element, search for an existing Pacific component:

```bash
node <skill-dir>/search.mjs "button"
node <skill-dir>/search.mjs "dialog" --props
node <skill-dir>/search.mjs "input" --category=form-inputs
```

Use `--props` to get full prop details when you need the API.

### 2. Import Patterns

```typescript
// Components
import { Button, Card, Banner } from "@sofi-web-ui/core";
import { TextInput, Select, Checkbox } from "@sofi-web-ui/form-inputs";
import { Icon, Settings, ChevronDown } from "@sofi-web-ui/icons";

// Tokens (MUST use /dist/ path)
import { colorTokens } from "@sofi-web-ui/base/dist/colorTokens.stylex";
import { globalTokens } from "@sofi-web-ui/base/dist/globalTokens.stylex";
import { boxShadowsTokens } from "@sofi-web-ui/base/dist/boxShadows.stylex";

// Typography + utilities
import {
  textTokens,
  mergeStyleXProps,
  BaseStyleXProps,
} from "@sofi-web-ui/base";

// Theme (NEVER use plusMode — it requires a dark background the scaffold doesn't provide)
import { darkMode } from "@sofi-web-ui/base";

// StyleX
import * as stylex from "@stylexjs/stylex";
```

### 3. StyleX Styling Pattern

All custom styling must use StyleX:

```typescript
import * as stylex from '@stylexjs/stylex';
import { colorTokens } from '@sofi-web-ui/base/dist/colorTokens.stylex';
import { globalTokens } from '@sofi-web-ui/base/dist/globalTokens.stylex';

const styles = stylex.create({
  container: {
    backgroundColor: colorTokens.surfacePrimary,
    padding: globalTokens.rpx24,
    borderRadius: globalTokens.borderRadius16,
  },
  hover: {
    backgroundColor: colorTokens.surfaceSecondaryHover,
  },
});

// Apply styles:
<div {...stylex.props(styles.container)} />

// Conditional styles:
<div {...stylex.props([styles.container, isHovered && styles.hover])} />
```

**CRITICAL: StyleX requires longhand CSS properties.** Shorthand properties are NOT supported:

```typescript
// WRONG — will fail at build time
const styles = stylex.create({
  card: {
    border: "1px solid red", // shorthand — FORBIDDEN
    borderBottom: "1px solid gray", // shorthand — FORBIDDEN
    padding: "16px 24px", // shorthand with multiple values — OK only for same-unit
  },
});

// CORRECT — use longhand properties
const styles = stylex.create({
  card: {
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colorTokens.strokeDividePrimary,
  },
});
```

### 3b. Typography — Prefer the Typography Component

Use the `Typography` component from `@sofi-web-ui/core` instead of raw `textTokens` + stylex.props:

```typescript
// PREFERRED — uses Typography component
import { Typography } from '@sofi-web-ui/core';

<Typography as="h1" styleOf="headlineMedium">Title</Typography>
<Typography as="span" styleOf="bodyMedium" textColor="contentSecondary">
  Subtitle text
</Typography>

// ALSO OK — direct token usage for custom elements
import { textTokens } from '@sofi-web-ui/base';
<span {...stylex.props(textTokens.labelSmall)}>Custom element</span>
```

### 4. Custom Component Pattern

If you must create a custom component (no Pacific equivalent exists), follow the BaseStyleXProps pattern:

```typescript
import { BaseStyleXProps, mergeStyleXProps } from '@sofi-web-ui/base';
import * as stylex from '@stylexjs/stylex';

interface MetricCardProps extends BaseStyleXProps<React.HTMLAttributes<HTMLDivElement>> {
  title: string;
  value: string | number;
}

export function MetricCard({ title, value, className, style, ...props }: MetricCardProps) {
  return (
    <div
      {...props}
      {...mergeStyleXProps(
        stylex.props([styles.card, style]),
        className
      )}
    >
      <span {...stylex.props(textTokens.labelMedium)}>{title}</span>
      <span {...stylex.props(textTokens.displaySmall)}>{value}</span>
    </div>
  );
}
```

### 5. Icons

```typescript
import { Icon } from '@sofi-web-ui/icons';
import { Settings } from '@sofi-web-ui/icons';

<Icon icon={Settings} size={24} iconColor="contentPrimaryDefault" />
```

272 icons across 4 categories (Interface, Products, Social, SoFiX). Use `search.mjs` with `--type=icons` to find icons by name — see [Search Icons](#search-icons) below.

---

## Anti-Patterns — NEVER Do These

| Anti-Pattern                                    | Why                                                       | Do This Instead                                                |
| ----------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| Hardcode colors (`#1a73e8`, `rgb(...)`)         | Breaks theming                                            | Use `colorTokens.*` semantic tokens                            |
| Hardcode spacing (`16px`, `1rem`)               | Inconsistent rhythm                                       | Use `globalTokens.rpx*` tokens                                 |
| Raw font sizes (`fontSize: '14px'`)             | Breaks typography scale                                   | Use `textTokens.*` scales                                      |
| Build custom Modal/Dialog/Toast                 | Duplicates existing components                            | Use Pacific `Dialog`, `Toast`, `Banner`                        |
| Use `styled-components`, `emotion`, CSS modules | Conflicts with StyleX atomic CSS                          | Use `stylex.create()`                                          |
| Use `className` for styling                     | Reserved for Glassbox masking (`sr-mask`, `sr-whitelist`) | Use `style` prop (StyleX)                                      |
| Use `any` type                                  | Type safety violation                                     | Use proper types, `unknown`, or generics                       |
| Inline styles via `style` HTML attribute        | Not atomic, not themeable                                 | Use `stylex.props()`                                           |
| Import tokens without `/dist/`                  | Build-time resolution failure                             | Import from `@sofi-web-ui/base/dist/*`                         |
| Apply `darkMode` via className                  | Theme objects aren't CSS class strings                    | Pass through `stylex.props([isDark && darkMode, styles.page])` |
| Use `plusMode`                                   | Assumes dark gradient bg the scaffold doesn't provide     | Don't use it — produces unreadable text on light backgrounds   |

---

## Operations Reference

### Search Components

```bash
# Find by name
node <skill-dir>/search.mjs "button"

# Find with full props
node <skill-dir>/search.mjs "select" --props

# Filter by package
node <skill-dir>/search.mjs "input" --category=form-inputs

# List all components
node <skill-dir>/search.mjs ""
```

### Search Icons

```bash
# Find by name
node <skill-dir>/search.mjs "settings" --type=icons

# Filter by category
node <skill-dir>/search.mjs "bank" --type=icons --category=Products

# List all icons in a category
node <skill-dir>/search.mjs "" --type=icons --category=Social

# List all icons
node <skill-dir>/search.mjs "" --type=icons
```

Returns ready-to-use `import` and `usage` snippets for each match.

### Get Tokens

```bash
# List all categories (summary)
node <skill-dir>/get-tokens.mjs all

# Get specific category
node <skill-dir>/get-tokens.mjs colors
node <skill-dir>/get-tokens.mjs spacing
node <skill-dir>/get-tokens.mjs typography
node <skill-dir>/get-tokens.mjs elevation
node <skill-dir>/get-tokens.mjs borders

# Search within a category
node <skill-dir>/get-tokens.mjs colors --search=surface
```

### Scaffold a New Project

When the user wants to start a new project from scratch:

```bash
# Default: no chrome, single-file build
node <skill-dir>/scaffold.mjs /path/to/new-project

# With full SoFi app chrome (SoFiHeader + Footer)
node <skill-dir>/scaffold.mjs /path/to/new-project --chrome=full

# With minimal chrome (ProductFlowHeader + basic footer)
node <skill-dir>/scaffold.mjs /path/to/new-project --chrome=minimal

# Standard multi-file Vite build (combine with any chrome mode)
node <skill-dir>/scaffold.mjs /path/to/new-project --build-mode=normal --chrome=full

cd /path/to/new-project
npm install
npm run dev
```

This creates a Vite + React + TypeScript project pre-configured with:

- Pacific packages (`@sofi-web-ui/base`, `core`, `form-inputs`, `icons`)
- StyleX Vite plugin
- Global CSS imported
- Verdaccio registry configured
- Example App.tsx with Pacific theme setup

**Chrome modes** (`--chrome`):

- `none` (default) — plain header with dark mode toggle. No SoFi branding.
- `minimal` — `ProductFlowHeader` from `@sofi-web-ui/sofi-header` (SoFi logo + product name + dark mode toggle). Simple footer with copyright. Lighter than full — zero API deps.
- `full` — `SoFiHeader` + `Footer` with legal links via `PageShell` layout component. Copies `PageShell.tsx` and `FullWidth.tsx` into `src/components/layouts/`. Adds `@sofi-web-ui/sofi-header` and `@sofi-web-ui/footer` to dependencies and `externalPackages` in vite.config.ts.

**Build modes** (`--build-mode`):

- `single-file` (default) — `npm run build` produces one self-contained `dist/index.html` with all JS, CSS, and StyleX CSS inlined. Works from `file://` without CORS issues. Uses `vite-plugin-singlefile` + a post-build `inline-css.mjs` script.
- `normal` — standard Vite multi-file build to `dist/`.

**Note on `externalPackages`:** Chrome modes automatically add `@sofi-web-ui/sofi-header` and/or `@sofi-web-ui/footer` to the StyleX unplugin's `externalPackages` in vite.config.ts. This is required for StyleX compilation — without it, these packages would be pre-bundled by Vite and their StyleX calls would crash the browser.

### Supernova Design Guidelines

The `search.mjs` output includes a `supernovaFile` field pointing to cached design guidelines (when available). These provide usage do's/don'ts, accessibility guidance, and content best practices beyond what the code APIs give you.

**Reading Supernova docs (preferred — uses cached files):**

When `search.mjs` returns a `supernovaFile`, read it directly with the Read tool for design guidance on that component.

**Only read Supernova docs for the specific components being used in the current task.** Each file averages ~7KB — reading all 50 would consume excessive context. Be selective.

50 components have pre-built Supernova docs covering: Overview (anatomy, resources), Accessibility (labeling, focus order, keyboard nav), Content (copy best practices), and Usage (do's/don'ts, patterns).

### Verify UI

After building or modifying UI code, verify the result programmatically:

```bash
# Full verification: screenshot + console + audit
node <skill-dir>/verify-ui.mjs all --url=http://localhost:5173

# Screenshot only
node <skill-dir>/verify-ui.mjs screenshot --url=http://localhost:5173

# Console output only (catch runtime errors)
node <skill-dir>/verify-ui.mjs console --url=http://localhost:5173

# DOM audit only (Pacific compliance)
node <skill-dir>/verify-ui.mjs audit --url=http://localhost:5173

# Scope to a specific element
node <skill-dir>/verify-ui.mjs all --selector="#app main"

# Custom viewport
node <skill-dir>/verify-ui.mjs screenshot --viewport=375x812

# Full-page screenshot
node <skill-dir>/verify-ui.mjs screenshot --full-page
```

Output is JSON to stdout. The `screenshot.path` field points to the saved PNG which can be read as an image for visual inspection. The `audit` section reports Pacific design system violations:

- `no-inline-styles` — style attributes (whitelists StyleX custom property injections)
- `no-hardcoded-colors` — hex/rgb/hsl literals in stylesheets instead of `var(--...)` tokens
- `heading-hierarchy` — skipped heading levels (h1 → h3)
- `img-alt-text` — images missing alt attribute
- `empty-interactive-elements` — buttons/links without accessible text
- `stylex-css-loaded` — confirms StyleX CSS is present in the document
- `pacific-coverage` — reports StyleX class usage across elements (info only)

---

## Figma MCP Integration (Optional)

If the Figma Desktop MCP tools are available (`mcp__figma-desktop__*`), use them to extract design context before building:

- `get_design_context` — Extracts layout structure, component hierarchy, and reference code from Figma frames. **Use this first** when a Figma URL is provided.
- `get_screenshot` — Captures visual reference from Figma for comparison with your build.
- `get_variable_defs` — Gets design token values from Figma variables. Cross-reference with Pacific tokens via `get-tokens.mjs`.
- `get_code_connect_map` — Maps Figma nodes to sofi-web-ui code components (Code Connect is configured in sofi-web-ui).

**Workflow when Figma URL is provided:**

1. Call `get_design_context` with the node ID extracted from the URL
2. Use Code Connect mappings to identify which Pacific components match the design
3. Cross-reference Figma variables with Pacific tokens
4. Proceed with normal component search + build workflow

If Figma MCP is not connected, work from screenshots, descriptions, or the component search results. Figma integration is optional — all builds can proceed without it.

---

## Architecture Guidance

### Quick Dashboard / Prototype

Use `scaffold.mjs` to generate a Vite + React + Pacific starter:

- Best for: internal tools, metrics dashboards, proof-of-concepts
- Stack: Vite + React + StyleX + Pacific
- Includes dark mode toggle in the header by default (Night icon in switch knob)
- No routing, no SSR — just fast static builds

**Build modes**: The scaffold supports two build modes via `--build-mode`:

- `single-file` (default) — `npm run build` produces a single self-contained `dist/index.html`. All JS is inlined by `vite-plugin-singlefile`, and StyleX CSS (which the unplugin emits outside Vite's pipeline) is inlined by a post-build `inline-css.mjs` script. The result works from `file://` without CORS issues — useful for sharing dashboards as a single file. Best for simple prototypes and quick shares.
- `normal` — standard multi-file Vite build to `dist/` with code splitting and per-asset content hashing. Better for larger apps with lazy loading or multiple views. Both modes use `base: './'` (relative asset paths) so the build works when hosted under any URL prefix (e.g., via `/deploy-static`).

**Choosing a build mode**: Single-file is the right default — it's the most portable (works from `file://`, any hosted path, and as an email attachment). Switch to `normal` when the app is large enough that code splitting matters, or when you need per-asset cache busting.

**Routing for hosted prototypes**: If the project uses React Router and will be hosted via `/deploy-static`, use `HashRouter` (not `BrowserRouter`). The static hosting proxy does not support SPA fallback — a deep route refresh with BrowserRouter returns 404. HashRouter URLs (`/#/dashboard`) work because the hash fragment is never sent to the server.

**Build workflow**: Both `npm run dev` and `npm run build` fully compile StyleX. The dev server uses `@stylexjs/unplugin` which serves compiled CSS via a virtual module (`/virtual:stylex.css`) with HMR support. Use `npm run dev` for fast iteration and `npm run serve` (build + preview) for production-accurate output.

**Vite configuration**: The template includes these Vite plugins:

1. `sofiJsxPlugin` (enforce: 'pre') — transforms JSX preserved in sofi-web-ui's .js dist files
2. `stylex.vite()` from `@stylexjs/unplugin` — StyleX compilation + CSS extraction for both dev and build. Auto-injects `<link>` and `<script>` for dev HMR.
3. `react()` — standard React JSX + fast refresh

**Critical: `externalPackages`** — sofi-web-ui doesn't declare `@stylexjs/stylex` as a dependency in its package.json, so the unplugin's auto-discovery misses it. The `externalPackages` option explicitly registers sofi-web-ui packages so the unplugin: (a) excludes them from Vite's `optimizeDeps` pre-bundling, and (b) runs its Babel transform on them to compile `defineVars`/`create` calls. Without this, pre-bundled code would contain uncompiled StyleX runtime calls that crash the browser.

### Full Application

For production applications, use sofi-scripts (SoFi's Next.js framework):

- Best for: customer-facing apps, multi-page experiences
- This skill helps with component selection and design token usage, but project scaffolding should use sofi-scripts directly

---

## Existing Projects

When the user wants to apply Pacific to an **existing** project (detected by: `package.json` exists, `src/` has code), do not scaffold — instead, help them adopt Pacific incrementally.

### Detection

If the user asks to "add Pacific" or "use the design system" and an existing project is present, offer options:

1. **Tokens only** — apply Pacific design tokens (colors, spacing, typography) to existing styles
2. **Tokens + layouts** — add layout components on top of tokens
3. **Full adoption** — migrate to Pacific React components (only for React projects, with user approval)

### Token Application by Stack

`get-tokens.mjs` provides semantic token names and their compiled values. Map them to the project's styling approach:

| Stack | Token Format | Example |
|-------|-------------|---------|
| CSS | `:root { --pacific-surface-base: #fff; }` custom properties | `background: var(--pacific-surface-base)` |
| SCSS | `$pacific-surface-base: #fff;` variables | `background: $pacific-surface-base` |
| Tailwind | Extend `tailwind.config.js` theme with Pacific values | `className="bg-pacific-surface-base"` |
| CSS-in-JS / StyleX | Direct token imports from `@sofi-web-ui/base` | `colorTokens.surfaceBase` |

For non-StyleX stacks, run `get-tokens.mjs colors` and extract the compiled CSS values to create a token file in the project's preferred format.

### Compliance Tiers

Start conservative and escalate with user agreement:

1. **Tokens only** — replace hardcoded colors, spacing, and typography with Pacific token values. Works with any stack.
2. **Layout patterns** — copy layout components from `templates/layouts/` for page structure. Requires React.
3. **Full component adoption** — replace custom UI elements with Pacific components. Requires React + StyleX. **Only propose with explicit user approval.**

### Guardrails

- Always start with tokens — they're the least invasive and work everywhere.
- For small React projects, you may propose migration to full Pacific stack — but only with explicit user approval.
- Never remove working functionality to force Pacific adoption.
- If the project uses a conflicting CSS approach (CSS modules, Tailwind, styled-components), stick to token values and don't introduce StyleX.

---

## Error Handling

| Error                               | Cause                                               | Fix                                                   |
| ----------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| npm install fails                   | Verdaccio not accessible                            | Check VPN connection, verify `.npmrc` registry config |
| Token import error                  | Missing `/dist/` in import path                     | Use `@sofi-web-ui/base/dist/colorTokens.stylex`       |
| verify-ui connection refused        | Dev server not running                              | Start the dev server with `npm run dev` first         |
| verify-ui navigation timeout        | Page took too long to load                          | Check if the URL is correct, increase `--wait`        |
| `stylex.defineVars` call at runtime | Vite optimizer cache stale after config changes     | Delete `node_modules/.vite` and restart dev server    |
| Dark mode has no effect             | Theme applied via className instead of stylex.props | Use `stylex.props([isDark && darkMode, styles.page])` |
| `Invalid empty selector` (lightningcss) | A `stylex.create` rule compiles to empty CSS      | See [Invalid Empty Selector](#invalid-empty-selector) below |

### Invalid Empty Selector

The `Invalid empty selector` error from lightningcss/`@stylexjs/unplugin` means a `stylex.create` rule compiled to CSS with no selector. This crashes the Vite dev server on page load. Common causes:

1. **Empty style object** — a key in `stylex.create` with `{}` or only `null`/`undefined` values
2. **Spread of a non-existent token** — e.g., `stylex.props(textTokens.nonExistent)` compiles to nothing
3. **Conditional style that always resolves to falsy** — e.g., `stylex.props(condition && styles.foo)` where `condition` is always false at compile time

**Fix**: search all `stylex.create` calls for empty objects or keys with no CSS properties. Delete them or add at least one valid CSS property. Then delete `node_modules/.vite` and restart the dev server.

**Important**: if you encounter this error during verification, do NOT enter a long fix-and-retry loop. The error is in the StyleX compilation, not in the runtime HTML. Focus on checking `stylex.create` definitions in the source files — the error is always there, not in how components are rendered.

---

## Calibration Context

Calibration docs are structured design knowledge captured by the `/calibrate-pacific` skill. They live in `calibration/screens/` and `calibration/components/` (relative to this skill's directory) and encode designer-verified decisions about component selection, token usage, layout, and responsive behavior for specific screens and components.

### Format

Each calibration doc is a Markdown file with YAML frontmatter. Screen docs have:

```yaml
---
type: screen
name: <Display Name>
calibrated: <YYYY-MM-DD>
author: <designer-name>
components:
  pacific: [ContainedButton, Card, Typography, ...]   # exact components.json names
  layout: [PageShell, SidebarLeft, ...]                # layout template names
  custom: [FeedItem, ...]                              # non-Pacific elements
---
```

Component docs have:

```yaml
---
type: component
name: <Display Name>
calibrated: <YYYY-MM-DD>
author: <designer-name>
component: Card                    # exact components.json name
package: "@sofi-web-ui/core"
related: [CardLink, Banner, ...]
---
```

### How to use calibration docs

Calibration docs are **strong defaults** — they represent designer-verified decisions and should inform:
- Which Pacific components to use and which variants/configurations
- Token choices for spacing, colors, and typography
- Layout structure and responsive breakpoints
- Do's and don'ts specific to the screen or component

Calibration docs do **not** override the user's explicit request. If the user asks for something that contradicts a calibration doc, follow the user's request and note the deviation.

---

## Workflow

When the user says `/pacific-vibe "build X"`:

1. **Understand the request** — what components and layouts are needed?
   - If a **Figma URL** is provided and Figma MCP tools are available, call `get_design_context` first to analyze the design before searching components.
   - **Chrome inference**: if the request mentions "internal dashboard" / "admin tool" → suggest `--chrome=minimal`. If "product prototype" / "looks like SoFi" / "user-facing" → suggest `--chrome=full`. If ambiguous, ask.
   - **Existing project**: if `package.json` exists and `src/` has code, skip scaffold — see the [Existing Projects](#existing-projects) section.
2. **Check for calibration docs** — look for designer-captured knowledge that applies to this build:
   - Kebab-case the screen or feature name from the user's request (e.g., "Home Feed" → `home-feed`). Check if `calibration/screens/<slug>.md` exists.
   - List all files in `calibration/screens/` and `calibration/components/` to find additional relevant matches (e.g., building a "Dashboard" might match `account-dashboard.md`).
   - If a **screen calibration doc** is found: read it and use it as the starting point. The `components.pacific` list becomes your initial component set. Follow the Component Hierarchy for structure, and apply the Token Usage and Responsive Behavior sections.
   - For each component you plan to use (whether from calibration or your own analysis), check if `calibration/components/<name-kebab-case>.md` exists and read it.
   - If **no calibration docs** exist, proceed normally — they're optional.
3. **Search components and icons** — find Pacific components and icons that match the UI needs (use `--type=icons` for icon search). If calibration docs were loaded, prioritize the components listed in the frontmatter — search only for additional components not already specified by calibration.
4. **Read Supernova docs** — for each component you plan to use, if `supernovaFile` is present in search results, read it. Focus on Usage (do's/don'ts) and Accessibility sections. Only read docs for components you're actively using — don't bulk-read. If a component calibration doc exists, its Do's/Don'ts and Token Map supplement Supernova guidance — prefer the calibration doc for project-specific decisions.
5. **Look up tokens** — get the right colors, spacing, typography for the design
6. **Scaffold if needed** — if starting from scratch, use `scaffold.mjs` with the appropriate `--chrome` mode
7. **Copy layouts if needed** — if the UI needs layout composition beyond what the chrome mode provides, copy additional layout components from `templates/layouts/` into `src/components/layouts/`
8. **Build with Pacific** — write code using Pacific components, tokens, and StyleX patterns
9. **Verify (automated)** — run `verify-ui.mjs all` against the running dev server. Check console for runtime errors. The DOM audit is **advisory** — see notes below.
10. **Verify (visual review)** — read the screenshot PNG returned by `verify-ui.mjs` (use the Read tool on the `screenshot.path`). Cross-reference what you see against the Supernova docs loaded in step 4. Specifically check for:
   - **Component appropriateness** — are the right Pacific components used for each UI element? (e.g., Banner for alerts, not a custom styled div)
   - **Layout and spacing rhythm** — does the spacing between elements look consistent and use the Pacific 8px grid rhythm?
   - **Visual hierarchy** — is the typography scale used correctly? (Display > Headline > Title > Label > Body)
   - **Content guidelines** — does the copy follow Supernova content best practices (sentence case, concise labels, action-oriented button text)?
   - **Usage do's/don'ts** — are components used in ways that match the Supernova Usage section? (e.g., Banner shouldn't be dismissible for critical errors, Dialog should have a clear primary action)
   - **Accessibility visual cues** — is there sufficient contrast, are focus states visible, are interactive elements clearly distinguishable?
   - **Overall cohesion** — does the UI feel like a Pacific app, or are there areas that look custom/off-brand?
11. **Fix & re-verify** — if issues are found in either step 9 or 10, fix the code and re-run verification until clean. Prioritize: runtime errors > visual review findings > audit notes.
12. **Present** — share the screenshot with the user and summarize any trade-offs or deviations from Pacific guidelines
13. **Deploy (optional)** — if the user wants to share the prototype, suggest `/deploy-static`. It auto-detects `dist/` from `npm run build` (use `--build-mode=normal` for multi-file hosting). The prototype will be served at `https://internal.sofi.com/webcore-static/static/prototypes/{name}/v{n}/` (VPN-only). To check availability: look for `deploy-static` in the skills list (check if `<skill-dir>/../deploy-static/SKILL.md` exists). If not installed, tell the user: "Install the deploy-static skill from https://prompts.sofi.com/?skills=deploy-static to enable one-command hosting."

### DOM Audit Advisory

The `verify-ui.mjs audit` is **informational, not a gate**. Known false positives:

- `rgba(0,0,0,0)` / `transparent` — emitted by design system components internally
- `--x-*` CSS custom properties — generated by StyleX at compile time (not hardcoded colors)
- Chrome components (SoFiHeader, Footer) may inject inline styles for layout

**The screenshot + console output are the reliable signals.** If the screenshot looks correct and the console is clean, the build is good. Audit findings should inform improvements, not block shipping.

---

## Maintainer: Rebuilding Data

The `data/` directory ships pre-built with the skill. To rebuild it (e.g., after a sofi-web-ui release):

```bash
# Prerequisites: npm install in skill dir, sofi-web-ui cloned locally
cd <skill-dir>

# Rebuild component APIs + tokens (writes to data/)
node index-repo.mjs --repo-path=<path-to-sofi-web-ui>

# Rebuild Supernova design guidelines (writes to data/supernova/)
node supernova-scrape.mjs all
```

This updates `data/components.json`, `data/tokens.json`, `data/supernova-map.json`, `data/supernova/*.md`, and `data/version.json`. Commit the updated `data/` directory to ship the new version.
