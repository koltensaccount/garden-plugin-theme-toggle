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
