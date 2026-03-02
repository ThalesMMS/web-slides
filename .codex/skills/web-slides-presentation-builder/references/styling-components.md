# Styling And Components

## Theme System

- Active theme class is on `<body>`: `.theme-light` or `.theme-dark`.
- Theme tokens live in `main/style/themes.css`.
- For visual redesigns, change tokens first; avoid per-component hardcoded colors.
- See `references/project-map.md` → "Theme Tokens" for the complete token list.

## Core Layout Classes (base.css)

| Class / Selector | Purpose |
|------------------|---------|
| `.slide` | Required root wrapper for every fragment |
| `.slide-main` | Primary content region (flex column, `padding: 64px`, `gap: 36px`) |
| `.slide-main--center` | Vertical centering for cover/farewell slides |
| `.slide-main--columns` | Two-column layout (`flex-direction: row`, `gap: 64px`) |
| `.column` | Child of `--columns`, fills equal width |

## Shared Fragments (via `data-include`)

| Component | File | Notes |
|-----------|------|-------|
| Header | `main/components/slide-header.html` | Brand name + section label |
| Progress bar | `main/components/slide-progress.html` | Clickable segments, built dynamically by JS |
| Footer | `main/components/slide-footer.html` | Presenter info + nav controls (prev/next/counter/theme/fullscreen) |

### Footer Structure

The footer contains two sections:
- `.footer-info`: presenter name and year.
- `.footer-nav`: navigation controls with `data-nav` attributes (`prev`, `counter`, `next`, `theme`, `fullscreen`).
- `.footer-nav__sep`: vertical separator line between nav groups.

All footer buttons are wired by `app.js` after each slide load. Do not add `id` attributes or `onclick` handlers — the engine uses `[data-nav="..."]` selectors.

### Progress Bar Classes (components.css)

| Class | Purpose |
|-------|---------|
| `.slide-progress` | Container bar (flex, `height: 4px`, `padding: 4px 64px`) |
| `.slide-progress__segment` | One clickable segment per slide |
| `.slide-progress__segment.is-current` | Active slide (scaled up, accent color) |
| `.slide-progress__segment.is-visited` | Previously visited slide (accent color) |

## Reusable Content Components (components.css)

| Class | Purpose |
|-------|---------|
| `.title-box` | Flex column grouping for `.title`, `.subtitle`, `.accent-bar` |
| `.accent-bar` | 72×5px colored bar (uses `--color-accent`) |
| `.bullet-list` | Arrow-prefixed list (`→` markers in `--color-accent`) |
| `.resized-image` | Image container with CSS variable sizing |
| `.resized-video` | Video container with CSS variable sizing |
| `.image-frame` | Legacy image wrapper — kept for compatibility only |
| `.presenter-name` | Cover slide author line |
| `.contact-info` | Farewell slide contact block |

### Typography Helpers

- `.text-accent` — `color: var(--color-accent)`
- `.text-muted` — `color: var(--color-text-muted)`
- `.text-secondary` — `color: var(--color-text-secondary)`

## Media Sizing Patterns

Use CSS variables `--width` and `--height` for stable layout on the 1920×1080 canvas:

```html
<!-- Image (default fit: contain) -->
<div class="resized-image" style="--width: 620px; --height: 360px;">
  <img src="main/assets/example.png" alt="Description">
</div>

<!-- Image with crop -->
<div class="resized-image" data-fit="cover" style="--width: 620px; --height: 360px;">
  <img src="main/assets/photo.png" alt="Description">
</div>

<!-- Video -->
<div class="resized-video" style="--width: 600px; --height: 340px;">
  <video src="main/assets/clip.mp4" controls preload="metadata"></video>
</div>
```

Fit behavior via `data-fit` attribute:

| Value | Behavior |
|-------|----------|
| `contain` | Fit inside container, no crop (default) |
| `cover` | Fill and crop to fit |
| `fill` | Stretch to fill exactly |
| `scale-down` | Like contain but never upscales |

**Important**: always check the vertical space budget before choosing heights. See `references/authoring-workflow.md` → "Media Sizing Rules" for the calculation method and examples.

## Style Change Strategy

- **One-off slide tweaks**: inline `style` attributes are acceptable.
- **Repeated patterns**: add or adjust classes in `main/style/components.css`.
- **Global visual direction**: edit `main/style/themes.css` or copy a preset from `templates/style-templates/`.
- **Never hardcode colors** in slide markup — always use theme tokens so both light and dark themes work.
