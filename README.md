# web-slides

A lightweight, zero-dependency web presentation engine built with vanilla HTML/CSS/JS. No build tools required.

---

## Quick Start

> **Note:** The engine uses `fetch()` to load slides. Opening `index.html` via `file://` will fail due to CORS. Use a local server.

```bash
# Option 1 — npx serve (recommended)
npx serve .

# Option 2 — Python
python -m http.server 8000

# Option 3 — VS Code Live Server
# Right-click index.html → "Open with Live Server"
```

Open `http://localhost:3000` (or the port shown) to view the presentation.

---

## Project Structure

```
web-slides/
├── index.html              # SPA entry point
├── config.js               # Global settings
├── app.js                  # Engine: navigation, scaling, themes, includes
│
├── main/
│   ├── layout.html         # Single-slide dev preview
│   ├── slides/
│   │   ├── slides.js       # Manifest: ordered slide list
│   │   ├── 01/slide-01.html  # Cover
│   │   ├── 02/slide-02.html  # Content + media
│   │   ├── 03/slide-03.html  # Split (two columns)
│   │   └── 04/slide-04.html  # Farewell
│   ├── components/         # Shared includes (header, footer, progress bar)
│   ├── assets/             # Images, videos, and other resources
│   └── style/
│       ├── base.css        # Reset, frame layout, footer-nav controls
│       ├── themes.css      # Color tokens (light / dark)
│       └── components.css  # Component styles
│
└── templates/
    ├── slide-templates/    # Ready-to-copy: cover, content, split, farewell
    ├── component-templates/# Component usage guide (how-to-use.html)
    ├── style-templates/    # Alternative theme presets
    └── asset-templates/    # Example assets
```

---

## How to Add a Slide

1. Create the slide folder and file:
   ```
   main/slides/05/slide-05.html
   ```

2. Copy a template from `templates/slide-templates/` and edit it:
   ```html
   <div class="slide slide-content">
     <div data-include="main/components/slide-header.html"></div>
     <div data-include="main/components/slide-progress.html"></div>
     <main class="slide-main">
       <!-- your content here -->
     </main>
     <div data-include="main/components/slide-footer.html"></div>
   </div>
   ```

3. Add the path to the manifest:
   ```js
   // main/slides/slides.js
   window.WEB_SLIDES.SLIDES = [
     'main/slides/01/slide-01.html',
     ...
     'main/slides/05/slide-05.html', // ← new
   ]
   ```

### Available slide templates

| Template | Class | Description |
|----------|-------|-------------|
| `cover.html` | `.slide-cover` | Title slide with centered content |
| `content.html` | `.slide-content` | Bullet list (variation A) or two-column text+image (variation B) |
| `split.html` | `.slide-split` | Two equal columns — ideal for side-by-side content |
| `farewell.html` | `.slide-farewell` | Closing slide with contact info |

---

## Shared Components (`data-include`)

Use `data-include` for fragments that are **identical across all slides**:

```html
<div data-include="main/components/slide-header.html"></div>
<div data-include="main/components/slide-progress.html"></div>
<div data-include="main/components/slide-footer.html"></div>
```

Components are cached after the first fetch — no re-download while navigating.

### Progress bar

The `slide-progress.html` component renders a clickable segmented bar. Each segment represents a slide; clicking it navigates directly. Segments are generated dynamically by `app.js`. Place it after the header:

```html
<div data-include="main/components/slide-progress.html"></div>
```

### Footer (with navigation controls)

The footer includes presenter info **and** built-in navigation: ◀ prev / counter / next ▶ | theme toggle | fullscreen toggle. All buttons are wired automatically by the engine.

---

## Inline Snippets

Components that **vary per slide** (title, images, videos) should be copied inline:

```html
<!-- Title box -->
<div class="title-box">
  <div class="accent-bar"></div>
  <h1 class="title">My Title</h1>
  <p class="subtitle">Subtitle</p>
</div>

<!-- Resized image (default: contain, no crop) -->
<div class="resized-image" style="--width: 500px; --height: 350px;">
  <img src="main/assets/photo.png" alt="Description">
</div>

<!-- Resized image with crop -->
<div class="resized-image" data-fit="cover" style="--width: 500px; --height: 350px;">
  <img src="main/assets/photo.png" alt="Description">
</div>

<!-- Resized video -->
<div class="resized-video" style="--width: 600px; --height: 340px;">
  <video src="main/assets/clip.mp4" controls preload="metadata"></video>
</div>
```

`data-fit` options: `contain` (default), `cover`, `fill`, `scale-down`.

> See `templates/component-templates/how-to-use.html` for the full component reference.

---

## Navigation

| Action | Input |
|--------|-------|
| Next slide | `→` / `Space` / swipe left / ▶ button |
| Previous slide | `←` / `Shift+Space` / swipe right / ◀ button |
| Toggle fullscreen | `F` key / ⛶ button |
| Toggle theme | ☾/☀ button in footer |
| Jump to slide | Click a progress-bar segment or use `index.html#3` |

Keyboard shortcuts are ignored inside `<input>`, `<textarea>`, or `contenteditable`.

---

## Configuration (`config.js`)

```js
window.WEB_SLIDES.CONFIG = {
  slideWidth:          1920,    // fixed canvas width (px)
  slideHeight:         1080,    // fixed canvas height (px)
  defaultTheme:        'light', // 'light' | 'dark'
  transition:          'fade',  // 'fade' | 'none'
  transitionDuration:  200,     // fade duration (ms)
}
```

---

## Themes

The engine toggles between `light` and `dark`. The default is set by `defaultTheme` in `config.js`; the footer button toggles at runtime.

Presets in `templates/style-templates/` are **token replacements** for `.theme-light` and `.theme-dark` — they are not new theme names. To use a preset:

1. Open a file in `templates/style-templates/`
2. Copy the full contents into `main/style/themes.css`, replacing the existing block

Available presets:
- **`theme-corporate.css`** — institutional tones, serif typography
- **`theme-minimal.css`** — monochrome, neutral
- **`theme-vibrant.css`** — warm/orange palette

---

## Single-Slide Dev Preview

To work on one slide without navigating the full deck:

```
http://localhost:3000/main/layout.html?slide=main/slides/02/slide-02.html
```

`layout.html` runs `app.js` in `preview` mode: no manifest, no hash navigation, no deck controls. Ideal for Live Server hot-reload.

---

## URL and Bookmarks

The URL hash reflects the current slide:
```
index.html#1   → first slide
index.html#3   → third slide
```

Reloading keeps you on the same slide. Invalid hashes fall back to the first slide.

---

## License

MIT — see [LICENSE](LICENSE).
