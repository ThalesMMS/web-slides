---
name: web-slides-presentation-builder
description: Build and maintain real presentations inside this web-slides repository (vanilla HTML/CSS/JS). Use when requests involve creating new slides, rewriting slide content, reordering deck flow, changing shared components, adjusting themes/styles, fixing manifest/include/navigation issues, or preparing assets and polish for delivery using files in main/slides, main/components, main/style, app.js, config.js, and templates.
---

# Web Slides Presentation Builder

Follow this skill to turn user requests into production-ready updates for this repository's slide engine and content.

## Quick Start

1. Read `references/project-map.md` to refresh runtime constraints and the **canvas space budget**.
2. Choose a path:
   - For content or deck-structure requests → read `references/authoring-workflow.md`.
   - For visual or theme requests → read `references/styling-components.md`.
   - For both → read both; start with authoring, then styling.
3. Implement changes in project files (`main/`, `config.js`, `app.js`) — not in templates, unless asked to create reusable templates.
4. Validate with the QA checklist in `references/authoring-workflow.md` before finalizing.

## Execution Rules

1. Treat slide files as **HTML fragments** — never add `<html>`, `<head>`, or `<body>`.
2. Use **server-root include paths** (`main/components/...`) for all `data-include` values.
3. Keep the manifest **authoritative** in `main/slides/slides.js`; order defines presentation sequence, counter, and progress bar.
4. **Reuse existing classes/components** before introducing new markup or CSS.
5. Keep **theme compatibility** for both `.theme-light` and `.theme-dark` unless the user explicitly asks to drop one. Never hardcode colors in slide markup.
6. Prefer **minimal, targeted edits** that preserve engine behavior in `app.js`.
7. **Always check the vertical space budget** before sizing media. The usable content height is ~810px (after header, progress, footer, and padding). Subtract title-box (~110px) and each bullet (~50px) to find remaining space. Oversized media is silently clipped.
8. Footer nav controls use **`data-nav` attributes** — never add `id` or `onclick` to them. The engine rebinds them on every slide load.
9. **Always include all three shared fragments** (header, progress, footer) unless the user explicitly requests otherwise.

## Build Workflow

1. **Plan** — Convert the request into a slide-level plan:
   - identify target slides (create / edit / reorder / remove),
   - define narrative arc (opening → evidence → takeaway),
   - map each slide to an existing layout pattern (cover / content / split / farewell).

2. **Structure** — Implement slide skeleton first:
   - create/update slide fragments in `main/slides/NN/slide-NN.html`,
   - include header + progress + footer,
   - update `main/slides/slides.js`.

3. **Content** — Fill in text and media:
   - update text hierarchy (`title-box`, `bullet-list`),
   - add media via `resized-image` / `resized-video` with appropriate `--width` / `--height`,
   - calculate the space budget before choosing media dimensions,
   - store assets in `main/assets/` with meaningful `alt` text.

4. **Style** — Apply visual tweaks only where needed:
   - use theme tokens from `main/style/themes.css`,
   - keep layout helpers in `main/style/components.css`,
   - for one-off adjustments, inline `style` is acceptable,
   - avoid hardcoded per-slide colors.

5. **Verify** — Before finalizing, confirm:
   - manifest paths resolve (no 404s),
   - includes resolve (no ⚠ errors in DOM),
   - navigation counter, buttons, and progress bar work,
   - media fits without clipping,
   - both light and dark themes look correct on touched slides,
   - preview mode works for each touched slide.

## Common Commands

Use a local server (never `file://`):

```bash
npx serve .
# or
python3 -m http.server 8000
```

Single-slide preview:

```
http://localhost:3000/main/layout.html?slide=main/slides/02/slide-02.html
```

Scaffold a new slide from a template and update manifest:

```bash
python3 skills/web-slides-presentation-builder/scripts/add_slide.py --template content
python3 skills/web-slides-presentation-builder/scripts/add_slide.py --template split --number 5
python3 skills/web-slides-presentation-builder/scripts/add_slide.py --template cover --dry-run
```

## Resources

| File | Use when |
|------|----------|
| `references/project-map.md` | You need runtime constraints, canvas budget, token list, or engine behaviors |
| `references/authoring-workflow.md` | You need end-to-end workflow, layout selection, media sizing rules, or QA checklist |
| `references/styling-components.md` | You need the component/class inventory, footer structure, or style change strategy |
| `scripts/add_slide.py` | You need to scaffold a numbered slide from templates and append it to the manifest |

Load only the references needed for the current task to keep context lean.
