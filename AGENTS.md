# Scope

This is the Digital Garden Appearance & Reading site plugin, not an Obsidian plugin.
Preserve existing reading/accent controls. Do not edit Digital Garden core or users'
notes to implement rendering features.

# Easy TikZ

Render during the build through the public setupEleventy/setupMarkdown hooks.
Keep the prebuilt lib/ runtime self-contained: gardens must not run npm installs,
launch browsers/TeX, send diagrams to external services or load an editor runtime.
Preserve callouts, normal math, unrelated fences and original Markdown. PNG URLs
are content-addressed and must invalidate on source/settings/renderer changes.
Keep resource limits and readable light/dark variants. Preserve all third-party
licenses and the pinned renderer source when rebuilding lib/.

Use Serena for focused symbol navigation when available. Run focused graph tests,
the existing browser test and npm run check. Verify the actual garden build before
releasing runtime changes. Document untested UI/hosting cases honestly.

compat/ contains a separate Easy TikZ upstream source patch, not an automatically
installed part of this site plugin. Never silently monkey-patch another plugin.


# Shared visual contract: Obsidian and Digital Garden

## Priority and direction

- **Obsidian is the primary authoring experience and visual reference.** Optimize fast note taking, readability, beautiful typography, accessibility and reliable definition/block references there first.
- **Visual changes in either direction require checking both surfaces.** When Folio or an Obsidian callout/plugin changes, update the garden counterpart. When the garden improves visually, assess and bring the same improvement back to Obsidian where it improves the authoring experience.
- Match the two as closely as practical: light/dark palettes, typography, heading hierarchy, spacing, ordinary and mathematical callouts, video disclosures, tables, scientific images and print/PDF sources.
- **Never make Obsidian uglier, less readable or slower to use merely to achieve parity.** If browser/Obsidian capabilities differ, preserve the better Obsidian presentation and adapt the garden. Record the deliberate difference and its reason; do not claim pixel identity when it was not verified.
- Parity is a design requirement, not permission to rewrite notes, rename block IDs, publish drafts, expose a vault or alter unrelated functionality. Preserve the user's wording, sources, links and reference IDs.
- Authoring must stay fast. A video is one line: `> [!video] [Title](YouTube URL)`. Definitions and references use native callout/block syntax. Put implementation complexity in code, never extra HTML the user must type.

## Owners and source of truth

| Surface | Repository | Owned files |
| --- | --- | --- |
| Obsidian appearance | [Folio](https://github.com/koltensaccount/Folio) | `src/*.css`, generated `theme.css` |
| Obsidian callout behavior | [callout-links](https://github.com/koltensaccount/callout-links) | `src/video.js`, `src/study-labels.js`, `src/plugin.js`, generated `main.js` |
| Garden behavior | [garden-plugin-theme-toggle](https://github.com/koltensaccount/garden-plugin-theme-toggle) | plugin source, manifest, generated `assets/video-sources.js` |
| Garden integration | [my-digital-garden](https://github.com/koltensaccount/my-digital-garden) | `src/site/styles/custom-style.scss`, generated `_folio-callouts.scss`, installed Appearance plugin |

Do not hand-edit generated CSS/runtime copies. Folio's `scripts/sync_garden.py` copies the canonical callout CSS and Callout Links video and study-label behavior to the garden repositories; run it after either canonical source changes. Garden-specific layout adapters belong in the garden stylesheet, without regressing Obsidian to accommodate them. Never edit a bundled/minified plugin copy as the only implementation.

## Required workflow

1. Inspect every affected repository's current branch, instructions and dirty changes. Preserve concurrent edits and newer published fixes.
2. Make the best Obsidian implementation; port it to the garden or review a garden-originated improvement against Obsidian.
3. From Folio, run `python3 scripts/build.py` and `python3 scripts/sync_garden.py` with the sibling checkouts present (or supply `--garden`, `--appearance`, `--callouts`). Build Callout Links with `npm run check`; install Appearance using its `install:garden` script. Build/check generated files again.
4. Verify `python3 scripts/build.py --check`, `python3 scripts/sync_garden.py --check`, relevant plugin tests, and the real garden build. Review light/dark and narrow/wide layouts, Live Preview/Reading as relevant, collapsed/expanded video states, keyboard access, mathematical references and print/PDF. Record limits honestly.
5. Keep source, generated outputs and agent guidance in the corresponding GitHub repositories. Explain paired changes, remaining differences, tests, and whether they are local, pushed, merged or deployed. Do not silently leave the counterpart behind.

The design policy and source map must remain consistent in all four root `AGENTS.md` files. More specific plugin instructions still apply unless they conflict with the user's explicit priorities above.
