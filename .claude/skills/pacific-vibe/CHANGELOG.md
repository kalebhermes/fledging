# Changelog

## 2.1

- Fix `--chrome=minimal` template: `ProductFlowHeader` sub-components are in `@sofi-web-ui/core`, not `sofi-header`
- Remove unnecessary `@sofi-web-ui/sofi-header` dependency for minimal chrome mode
- Keep `base: './'` in normal build mode for correct asset paths under prefix hosting
- Add deploy step (step 13): suggest `/deploy-static` for sharing prototypes, with availability detection
- Document SPA routing constraints (HashRouter recommended, BrowserRouter limitation tracked in FOUNDA-1920)
- Document build mode guidance for deploy-static integration

## 2.0

- Chrome modes: `--chrome=none` (default), `--chrome=minimal`, `--chrome=full`
- Minimal chrome: ProductFlowHeader with logo, product name, dark mode toggle
- Full chrome: SoFiHeader + Footer with PageShell layout
- Calibrate-pacific integration for design system knowledge
- Supernova data enrichment: component descriptions and keywords in search
- Type-checker fallback for empty props resolution

## 1.0

Initial release of the pacific-vibe skill.

- Scaffold Vite + React + Pacific starter projects
- Single-file build mode (default): one self-contained HTML via vite-plugin-singlefile
- Normal build mode: standard multi-file Vite output with code splitting
- 100+ searchable Pacific components, 272 icons
- Dark mode toggle scaffold
- StyleX integration with Pacific design tokens
- Figma integration support
