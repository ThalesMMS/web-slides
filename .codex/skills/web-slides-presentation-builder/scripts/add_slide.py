#!/usr/bin/env python3
"""
Create a new numbered slide from a template and append it to the manifest.

Example:
  python skills/web-slides-presentation-builder/scripts/add_slide.py --template content
"""

from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a numbered slide and add it to main/slides/slides.js"
    )
    parser.add_argument(
        "--project-root",
        default=".",
        help="Path to repository root (default: current directory)",
    )
    parser.add_argument(
        "--template",
        default="content",
        choices=["cover", "content", "split", "farewell"],
        help="Template file in templates/slide-templates",
    )
    parser.add_argument(
        "--number",
        type=int,
        help="Slide number to create (default: next available)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite slide file if it already exists",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would change without writing files",
    )
    return parser.parse_args()


def next_slide_number(slides_root: Path) -> int:
    numbers = []
    for entry in slides_root.iterdir():
        if entry.is_dir() and entry.name.isdigit():
            numbers.append(int(entry.name))
    return (max(numbers) + 1) if numbers else 1


def render_slide_id(number: int) -> str:
    return f"{number:02d}"


def resolve_paths(project_root: Path, template: str, number: int) -> dict[str, Path | str]:
    slide_id = render_slide_id(number)
    template_path = project_root / "templates" / "slide-templates" / f"{template}.html"
    slide_dir = project_root / "main" / "slides" / slide_id
    slide_file = slide_dir / f"slide-{slide_id}.html"
    manifest = project_root / "main" / "slides" / "slides.js"
    manifest_entry = f"main/slides/{slide_id}/slide-{slide_id}.html"
    return {
        "template_path": template_path,
        "slide_dir": slide_dir,
        "slide_file": slide_file,
        "manifest": manifest,
        "manifest_entry": manifest_entry,
    }


def update_manifest_text(text: str, entry: str) -> tuple[str, bool]:
    manifest_pattern = re.compile(
        r"(window\.WEB_SLIDES\.SLIDES\s*=\s*\[)([\s\S]*?)(\]\s*;?)",
        re.MULTILINE,
    )
    match = manifest_pattern.search(text)
    if not match:
        raise ValueError("Could not find window.WEB_SLIDES.SLIDES array in slides.js")

    if f"'{entry}'" in match.group(2) or f"\"{entry}\"" in match.group(2):
        return text, False

    body = match.group(2)
    entry_line = f"  '{entry}',"
    stripped = body.rstrip()

    if stripped:
        if stripped.endswith(","):
            new_body = f"{stripped}\n{entry_line}\n"
        else:
            new_body = f"{stripped},\n{entry_line}\n"
    else:
        new_body = f"\n{entry_line}\n"

    updated = text[: match.start(2)] + new_body + text[match.end(2) :]
    return updated, True


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_root).resolve()

    slides_root = project_root / "main" / "slides"
    if not slides_root.exists():
        raise SystemExit(f"Missing slides directory: {slides_root}")

    number = args.number if args.number is not None else next_slide_number(slides_root)
    if number < 1:
        raise SystemExit("--number must be >= 1")

    paths = resolve_paths(project_root, args.template, number)
    template_path = paths["template_path"]
    slide_dir = paths["slide_dir"]
    slide_file = paths["slide_file"]
    manifest = paths["manifest"]
    manifest_entry = paths["manifest_entry"]

    if not template_path.exists():
        raise SystemExit(f"Template not found: {template_path}")
    if not manifest.exists():
        raise SystemExit(f"Manifest not found: {manifest}")
    if slide_file.exists() and not args.force:
        raise SystemExit(
            f"Slide already exists: {slide_file}\n"
            "Use --force to overwrite or pass --number with a different value."
        )

    manifest_text = manifest.read_text(encoding="utf-8")
    updated_manifest_text, changed_manifest = update_manifest_text(manifest_text, manifest_entry)

    print(f"Project root: {project_root}")
    print(f"Template:     {template_path.relative_to(project_root)}")
    print(f"Slide file:   {slide_file.relative_to(project_root)}")
    print(f"Manifest:     {manifest.relative_to(project_root)}")
    print(f"Entry:        {manifest_entry}")

    if args.dry_run:
        print("\nDry run complete. No files written.")
        return 0

    slide_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(template_path, slide_file)

    if changed_manifest:
        manifest.write_text(updated_manifest_text, encoding="utf-8")
        print("Updated slides manifest.")
    else:
        print("Manifest already contained entry. No manifest change.")

    print("Created slide successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
