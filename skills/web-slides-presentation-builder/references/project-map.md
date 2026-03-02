# Project Map

## Runtime Model

- `index.html` is the presentation entry point.
- `config.js` defines `window.WEB_SLIDES.CONFIG` (canvas size, theme, transition).
- `main/slides/slides.js` defines ordered manifest `window.WEB_SLIDES.SLIDES`.
- `app.js` loads slide fragments via `fetch()`, resolves `data-include`, and controls nav/theme/progress/fullscreen/swipe.
- `main/layout.html` runs the same engine in preview mode for a single slide path.

## Non-Negotiable Constraints

- Run through HTTP server (`npx serve .` or `python3 -m http.server`); `file://` fails because of `fetch()`.
- Write slides as HTML fragments only; never add `<html>`, `<head>`, or `<body>` inside slide files.
- Keep include paths server-root relative (e.g. `main/components/slide-header.html`).
- Keep global namespace under `window.WEB_SLIDES`.
- Keep manifest order accurate; it controls deck sequence, counter, and progress bar.

## Canvas Space Budget

The fixed canvas is **1920 × 1080 px**. After shared components, the usable area for `<main class="slide-main">` is approximately:

| Element | Height (px) | Notes |
|---------|-------------|-------|
| `.slide-header` | ~76 | `padding: 28px 64px` + border |
| `.slide-progress` | ~12 | 4px bar + 4px padding top/bottom |
| `.slide-footer` | ~54 | `padding: 18px 64px` + border |
| **Available for content** | **~938** | 1080 − 76 − 12 − 54 |

When sizing media (`resized-image`, `resized-video`), subtract the height of title-box (~110px) and bullet-list items (~50px each) from the 938px budget to avoid overflow. The `.slide` root uses `overflow: hidden`, so anything that doesn't fit is silently clipped.

## Primary Edit Targets

- `main/slides/NN/slide-NN.html`: slide content.
- `main/slides/slides.js`: add/remove/reorder slide paths.
- `main/components/*.html`: shared fragments (header, footer with nav, progress bar).
- `main/style/base.css`: frame, reset, transition shell, footer-nav controls.
- `main/style/components.css`: reusable layout and component classes.
- `main/style/themes.css`: light/dark design tokens.
- `main/assets/`: deck media (images, videos).

## Theme Tokens (complete list)

Both `.theme-light` and `.theme-dark` define these CSS custom properties:

| Token | Purpose |
|-------|---------|
| `--color-bg` | Slide background |
| `--color-bg-outer` | Page background behind the frame |
| `--color-surface` | Header/footer/card backgrounds |
| `--color-surface-alt` | Hover states, secondary surfaces |
| `--color-text-primary` | Main text color |
| `--color-text-secondary` | Subtitles, supporting text |
| `--color-text-muted` | Footer text, counters |
| `--color-accent` | Accent bar, bullet markers, progress |
| `--color-accent-hover` | Progress hover, accent interactions |
| `--color-border` | Borders, separators |
| `--color-shadow` | Frame box-shadow |
| `--font-family` | Global font stack |

## Engine Behaviors To Preserve

- **Includes**: recursive with `MAX_DEPTH=10`, cached per session. Depth exceeded → console warning.
- **Hash navigation**: `#N` maps to slide index (1-based in URL, 0-based internally).
- **Keyboard**: `ArrowRight`/`Space` → next, `ArrowLeft`/`Shift+Space` → prev, `F` → fullscreen.
- **Touch**: swipe left → next, swipe right → prev (50px threshold).
- **Footer controls**: prev/counter/next + theme toggle + fullscreen toggle. These are inside the `data-include` footer, so they are **re-injected and re-bound on every slide load** via `bindFooterControls()`.
- **Theme toggle**: only `light` ↔ `dark`; adding new theme names requires engine changes.
- **Progress bar**: segments are generated dynamically from manifest length. Classes: `.is-current` on active slide, `.is-visited` on prior slides. Segments are clickable → `goTo(index)`.
- **Fullscreen**: `requestFullscreen()` / `exitFullscreen()`, synced via `fullscreenchange` event.

## Templates

- `templates/slide-templates/*.html`: starting points (`cover`, `content`, `split`, `farewell`) — copy and edit, not used at runtime.
- `templates/component-templates/how-to-use.html`: documents all snippets and shared includes.
- `templates/style-templates/*.css`: preset token replacements for `.theme-light` / `.theme-dark` blocks (`corporate`, `minimal`, `vibrant`).
