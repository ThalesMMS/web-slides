# Authoring Workflow

## 1. Translate Request Into Deck Plan

- Identify objective (inform, persuade, report, pitch, teach).
- Decide slide actions: create, rewrite, reorder, remove.
- Set a narrative sequence:
  - opening context,
  - core evidence or message,
  - closing CTA/summary.
- Map each slide to an existing layout pattern before inventing new structure.

### Layout Selection Guide

| Pattern | Class | Best for |
|---------|-------|----------|
| Cover | `slide-cover` + `slide-main--center` | Opening slide with title, subtitle, presenter name |
| Content | `slide-content` + `slide-main` | Title + bullets, optionally with media below |
| Split | `slide-split` + `slide-main--columns` | Two independent content streams side by side |
| Farewell | `slide-farewell` + `slide-main--center` | Closing slide with thank you + contact info |

Use `slide-main--columns` whenever content naturally splits into two halves. Use plain `slide-main` when content flows top-to-bottom.

## 2. Implement Slide Structure

- Create or update slide files in `main/slides/NN/slide-NN.html`.
- Use this skeleton unless the request requires a custom structure:

```html
<div class="slide slide-content">
  <div data-include="main/components/slide-header.html"></div>
  <div data-include="main/components/slide-progress.html"></div>
  <main class="slide-main">
    <!-- content -->
  </main>
  <div data-include="main/components/slide-footer.html"></div>
</div>
```

- Always include header, progress, and footer unless explicitly asked to omit.
- Keep slide root class consistent with existing patterns.

## 3. Keep Manifest In Sync

- Update `main/slides/slides.js` whenever slide paths change.
- Keep one path per slide in the intended order.
- Use server-root paths (e.g. `main/slides/05/slide-05.html`).
- Helper script for scaffolding:

```bash
python3 skills/web-slides-presentation-builder/scripts/add_slide.py --template content
python3 skills/web-slides-presentation-builder/scripts/add_slide.py --template split --number 3
python3 skills/web-slides-presentation-builder/scripts/add_slide.py --template cover --dry-run
```

The script copies the template, creates the numbered folder, and appends the entry to `slides.js`.

## 4. Fill Content And Media

- Use strong title hierarchy with `title-box` (`.title` + `.subtitle` + `.accent-bar`).
- Keep bullets concise and scannable (3–5 items).
- Prefer `resized-image` and `resized-video` over legacy `image-frame`.
- Store media in `main/assets/` and use meaningful `alt` text for images.

### Media Sizing Rules

The canvas is 1920×1080. After header (~76px), progress (~12px), and footer (~54px), **~938px** of vertical space remains. The `.slide-main` has `padding: 64px` on all sides, leaving **~810px** of usable height inside the content area.

Before placing media, **subtract the height of other content**:

| Content element | Typical height |
|-----------------|---------------|
| `title-box` (title + accent-bar) | ~110px |
| `title-box` (title + accent-bar + subtitle) | ~160px |
| Each `bullet-list` item | ~50px |
| Gap between items (`.slide-main` gap) | 28–36px |

**Example budget**: title-box (~110px) + 3 bullets (~150px) + gaps (~100px) = ~360px used → **~450px remaining for media**.

When placing images and videos:
- Use `--width` and `--height` CSS variables on `resized-image` / `resized-video`.
- Keep total height within the remaining budget to avoid silent clipping (`overflow: hidden` on `.slide`).
- When placing media side by side, keep total width under ~1700px (1920 − 2×64px padding − gap).

## 5. Visual And Behavior QA

- Start local server and open `index.html`.
- Verify:
  - every manifest path loads without console errors,
  - header/progress/footer include correctly on each slide,
  - counter shows correct `N / total` and nav buttons enable/disable properly,
  - progress bar segments match slide count and highlight correctly,
  - theme toggle looks acceptable on every touched slide,
  - media fits without clipping (no content disappearing at the bottom),
  - fullscreen button works and icon changes state.
- Use preview mode for focused iteration:

```text
main/layout.html?slide=main/slides/NN/slide-NN.html
```

## 6. Common Failure Modes

- **Broken include**: relative path like `../../components/...` instead of server-root path.
- **Missing manifest entry**: slide created but not added to `slides.js`.
- **Path typo**: folder number doesn't match filename (e.g. `03/slide-02.html`).
- **Media overflow**: image/video too tall for remaining vertical space — content silently clipped.
- **Hardcoded colors**: inline colors that break in the opposite theme.
- **Over-customized markup**: bypasses shared component classes, loses theme/layout consistency.
- **Duplicate manifest entries**: same path listed twice causes duplicate progress segments.
- **Missing `alt` text**: accessibility gap on images.
