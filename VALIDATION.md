# Validation

## Version 1.3.0 Easy TikZ Publishing

2026-10-29: `npm run check` and `npm test` passed (3 tests, none skipped), including the existing Appearance browser test and two focused build-side graph tests. Tests cover 4x PNG dimensions/signatures, distinct light/dark outputs, unchanged source text, callout containment, ordinary MathJax and unrelated fences, cache hits, cache corruption recovery, source-edit invalidation, disabled mode, invalid-source diagnostics, size limits and 2D/3D/JSON export. No runtime dependencies are installed in a garden; the ready-to-copy bundle was used.

An actual upstream garden at `af6a9ecd872be27d1edb5f371748376a62d1a24b` built successfully on Node 22.23.3 with synthetic 2D-in-callout and 3D notes. No core source edits were required. The focused Chrome integration check decoded all PNGs, asserted nonblank pixels and 3040 px natural widths, verified callout containment and the absence of raw graph code, and checked light/dark visibility at 1600 and 390 px. No uncaught page errors occurred. Generated PNGs and mobile screenshot were visually reviewed. Native printing, arbitrary themes, all-plugin combinations, hosted deployment and interactive Easy TikZ editing in the running Obsidian UI were not exercised for this release.

The separate Easy TikZ 4.6.0 callout-save patch passed 7 focused replacement cases, the 4 existing fence cases and a production TypeScript/build check. It preserves quoted/nested/indented callouts, CRLF and tilde fences, literal replacement text and surrounding prose; ambiguous/stale/unclosed targets are refused. The rebuilt artifact was installed locally with a backup of the previous main.js. An Obsidian reload and user confirmation of the editor save remain required. The damaged callout fence in the user's Chapter 1 note was repaired, preserving graph settings and prose.

The initial sandboxed build/browser runs failed due to denied DNS and localhost binding; reruns with approved access passed. Existing dependency audit warnings in upstream Digital Garden/Easy TikZ were not addressed as unrelated upgrades. Historical matrices below are not new validation of the graph renderer.

Version 1.2.0 validated on 2026-10-07, Node 22.23.3 and Google Chrome 154 (Playwright).

## Accent picker update

`npm run check` and `npm test` passed (1 browser test, none skipped). Regression checks cover orange link accents with white button styling, theme overrides of probe/swatch colors, seven palette slots, a stable native picker during input, custom-color persistence across reload and mode changes, reset behavior, and mobile overflow.

The actual Digital Garden at upstream commit `80a33ffa6cb198ecf733e5944b4a60510970e3b0` built successfully with only Appearance & Reading enabled. Focused browser checks passed at 1600 px and 390 px: the Theme swatch matched the rendered link accent, custom color survived reload, no horizontal overflow or browser errors occurred. Desktop/mobile screenshots were visually reviewed. The OS-native color dialog itself was not automated.

## Standalone

`npm ci`, `npm run check`, `npm test`: 1 tests passed, none skipped. Tests include real Chromium interactions on focused fixtures, syntax/manifest checks and any existing Node unit coverage. Native printing is stubbed; no OS print dialog opens.

## Previous upstream integration

Initial release validation used upstream Digital Garden commit `80a33ffa6cb198ecf733e5944b4a60510970e3b0` and registry commit `ed1b497a4cd584721edf51e7c1a3ef9481229818`. Each of the six reading/layout plugins was installed and built individually on Node 22. No core source modifications were required.

Every nonempty subset of the six reading/layout plugins (63) was browser-tested against the actual compiled upstream page at 1800, 1100 and 390 px widths. The harness selects emitted runtime scripts/styles while preserving current core markup and configuration slots; it does not rebuild all 63 combinations separately. Checks cover responsive overflow, native right-sheet compatibility, single footer ownership, repeated initialization, folded-target navigation and complete print visibility. Six permutations of Appearance, Print and Resizable initialization passed; removing the Appearance contribution left the other controls usable.

Eight separate stress scenarios passed: left-only, right-only, no panes, both collapsed across reading-width classes; reversible mouse snap and synthetic browser TouchEvents with preferred-width restoration; fold/TOC/progress/print cancellation; canvas; no headings. Console errors and uncaught page errors were asserted absent in final subset and stress runs.

`TZ=UTC npm test` in upstream: 390 tests passed. Without UTC, upstream's two date expectations fail in America/Chicago (388 pass); core was not changed to hide this timezone issue.

## Screenshot

`screenshot.png` is a real screenshot captured from this current upstream test garden with synthetic public demonstration notes, not a generated/mock illustration.

## Limits

Chromium/Edge was exercised, not Firefox/WebKit or physical touch hardware. Native browser `dialog`, modern layout CSS and optional relative OKLCH are used; unsupported relative colors fall back to the theme accent. Accent contrast is checked against the primary background, not every possible third-party theme surface. Current core uses full-document navigation; disabling/uninstalling is supported through rebuild and page reload, not a hot-unload API. Third-party navigation replacements may require integration checks.
