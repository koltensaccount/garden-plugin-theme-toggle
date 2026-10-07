# Theme Toggle for Digital Garden

A single subtle light/dark switch at the bottom left of the file browser.
Uses the installed theme's `theme-light` and `theme-dark` modes and remembers
each visitor's choice. Navigation scrolls above the pinned button.

Install this repository URL through Digital Garden's **Install from GitHub**
menu. Enable/disable and configure the plugin in that same menu. Publish or
redeploy the garden after changing settings. Requires garden plugin support.

Automatic mode detection inspects the installed theme's stylesheet via CSSOM.
A theme with only one explicit mode keeps the toggle visible but disabled,
with a tooltip explaining the supported mode. If selectors are missing or
the stylesheet cannot be inspected, both modes are assumed. Use the **Theme
mode support** setting to explicitly select `both`, `light`, or `dark` when
needed. No alternate theme is injected. Without a file browser, no toggle is
shown. Storage failures are handled without interrupting switching.

No build or dependency installation is required. For local development:

```sh
npm run check
npm run install:garden -- /path/to/my-digital-garden
```

The installer preserves existing garden settings. For releases, update both
version fields and push. Digital Garden prefers the latest GitHub release if
one exists; otherwise it installs from the default branch.
