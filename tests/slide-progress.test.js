/**
 * Tests for the slide-progress component CSS changes.
 *
 * PR: Improve progress bar hit area
 *
 * Key changes verified:
 *  - .slide-progress container height expanded to 32px (larger click target)
 *  - .slide-progress container top/bottom padding removed (was 4px, now 0)
 *  - .slide-progress__segment fills the 32px container with transparent bg
 *  - Visual bar moved to ::after pseudo-element (4px tall, vertically centered)
 *  - Hover / visited / current state rules target ::after, not the element
 *  - Transforms on state rules include the required translateY(-50%) offset
 *
 * Uses the Node.js built-in test runner (node:test) — no extra dependencies.
 * Run with:  node --test tests/slide-progress.test.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = resolve(__dirname, '../main/style/components.css');
const css = readFileSync(CSS_PATH, 'utf8');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the declaration block for a given CSS selector.
 * Returns the raw text between the first matching `{` and its closing `}`.
 * Handles the simple (non-nested) single-block case used in this stylesheet.
 */
function getRuleBlock(selector) {
  // Escape special CSS characters for use in a regex
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match selector followed by optional whitespace then a brace-delimited block
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 's');
  const match = css.match(re);
  if (!match) return null;
  return match[1]; // contents between the braces
}

/**
 * Returns true if `block` contains a declaration like `prop: value` (trimmed,
 * case-insensitive property name, exact value match after colon).
 */
function hasDeclaration(block, prop, value) {
  if (!block) return false;
  const propEscaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${propEscaped}\\s*:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
  return re.test(block);
}

/**
 * Returns true if `block` contains a declaration whose value *includes* the
 * given substring (useful for transform chains like "translateY(-50%) scaleY(2)").
 */
function declarationIncludes(block, prop, substring) {
  if (!block) return false;
  const propEscaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Capture everything after `prop:` up to the next `;` or end-of-block
  const re = new RegExp(`\\b${propEscaped}\\s*:\\s*([^;]+)`, 'i');
  const match = block.match(re);
  if (!match) return false;
  return match[1].includes(substring);
}

/**
 * Returns the raw declaration value for `prop`, or null if the block does not
 * declare it.
 */
function getDeclarationValue(block, prop) {
  if (!block) return null;
  const propEscaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${propEscaped}\\s*:\\s*([^;]+)`, 'i');
  const match = block.match(re);
  return match ? match[1].trim() : null;
}

function parseScaleY(transform) {
  const match = transform?.match(/\bscaleY\(\s*([0-9.]+)\s*\)/i);
  return match ? Number(match[1]) : NaN;
}

/**
 * Returns true if the CSS source contains NO rule matching the given selector
 * after normalizing whitespace. This keeps the check stable across formatting
 * variants such as `.selector {` and `.selector{`.
 */
function selectorAbsent(selector) {
  const stripComments = text => text.replace(/\/\*[\s\S]*?\*\//g, '');
  const normalize = text => stripComments(text).replace(/\s+/g, '');
  return !normalize(css).includes(normalize(selector));
}

// ---------------------------------------------------------------------------
// Tests: .slide-progress (container)
// ---------------------------------------------------------------------------

describe('.slide-progress container', () => {
  const block = getRuleBlock('.slide-progress');

  test('rule block exists', () => {
    assert.ok(block !== null, '.slide-progress rule not found in CSS');
  });

  test('height is 32px (enlarged hit area)', () => {
    assert.ok(
      hasDeclaration(block, 'height', '32px'),
      `Expected height: 32px but got: ${block}`,
    );
  });

  test('height is NOT 4px (old value removed)', () => {
    // The container must not still carry the original 4 px height
    assert.ok(
      !hasDeclaration(block, 'height', '4px'),
      'Old height: 4px should not appear in .slide-progress',
    );
  });

  test('padding has no top/bottom offset (0 64px)', () => {
    assert.ok(
      hasDeclaration(block, 'padding', '0 64px'),
      `Expected padding: 0 64px but got: ${block}`,
    );
  });

  test('padding does NOT use the old 4px top/bottom value', () => {
    assert.ok(
      !hasDeclaration(block, 'padding', '4px 64px'),
      'Old padding: 4px 64px should not appear in .slide-progress',
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: .slide-progress__segment (individual segment button)
// ---------------------------------------------------------------------------

describe('.slide-progress__segment', () => {
  const block = getRuleBlock('.slide-progress__segment');

  test('rule block exists', () => {
    assert.ok(block !== null, '.slide-progress__segment rule not found');
  });

  test('height is 100% (fills the 32px progress container)', () => {
    assert.ok(
      hasDeclaration(block, 'height', '100%'),
      `Expected height: 100% in .slide-progress__segment`,
    );
  });

  test('min-height is NOT 4px (old value removed)', () => {
    assert.ok(
      !hasDeclaration(block, 'min-height', '4px'),
      'Old min-height: 4px should not appear in .slide-progress__segment',
    );
  });

  test('minimum inline size keeps segments usable when flexed', () => {
    assert.ok(
      hasDeclaration(block, 'min-inline-size', '24px'),
      `Expected min-inline-size: 24px in .slide-progress__segment`,
    );
  });

  test('position is relative (required for ::after positioning)', () => {
    assert.ok(
      hasDeclaration(block, 'position', 'relative'),
      `Expected position: relative in .slide-progress__segment`,
    );
  });

  test('background is transparent (visual bar delegated to ::after)', () => {
    assert.ok(
      hasDeclaration(block, 'background', 'transparent'),
      `Expected background: transparent in .slide-progress__segment`,
    );
  });

  test('does NOT set background to var(--color-border) directly', () => {
    // The border color must now live in the ::after pseudo-element, not here
    assert.ok(
      !hasDeclaration(block, 'background', 'var(--color-border)'),
      'background: var(--color-border) must not appear on .slide-progress__segment',
    );
  });

  test('does NOT set border-radius directly (moved to ::after)', () => {
    assert.ok(
      !hasDeclaration(block, 'border-radius', '2px'),
      'border-radius must not appear directly on .slide-progress__segment',
    );
  });
});

describe('.slide-progress__segment focus-visible state', () => {
  const block = getRuleBlock('.slide-progress__segment:focus-visible');

  test(':focus-visible rule exists', () => {
    assert.ok(block !== null, '.slide-progress__segment:focus-visible rule not found');
  });

  test(':focus-visible provides an element-level focus outline', () => {
    assert.ok(
      hasDeclaration(block, 'outline', '2px solid var(--color-focus, var(--color-accent, #005fcc))'),
      `Expected focus-visible outline using focus/accent fallback`,
    );
    assert.ok(
      hasDeclaration(block, 'outline-offset', '3px'),
      `Expected focus-visible outline-offset: 3px`,
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: .slide-progress__segment::after (visual bar pseudo-element)
// ---------------------------------------------------------------------------

describe('.slide-progress__segment::after', () => {
  const block = getRuleBlock('.slide-progress__segment::after');

  test('rule block exists (new pseudo-element)', () => {
    assert.ok(block !== null, '.slide-progress__segment::after rule not found');
  });

  test('content is empty string (required for pseudo-element rendering)', () => {
    assert.ok(
      hasDeclaration(block, 'content', "''"),
      `Expected content: '' in ::after`,
    );
  });

  test('position is absolute', () => {
    assert.ok(hasDeclaration(block, 'position', 'absolute'), `Expected position: absolute`);
  });

  test('left is 0 (spans full width)', () => {
    assert.ok(hasDeclaration(block, 'left', '0'), `Expected left: 0`);
  });

  test('right is 0 (spans full width)', () => {
    assert.ok(hasDeclaration(block, 'right', '0'), `Expected right: 0`);
  });

  test('top is 50% (vertical centering anchor)', () => {
    assert.ok(hasDeclaration(block, 'top', '50%'), `Expected top: 50%`);
  });

  test('height is 4px (visual bar is slim despite 32px hit area)', () => {
    assert.ok(hasDeclaration(block, 'height', '4px'), `Expected height: 4px in ::after`);
  });

  test('background is var(--color-border) (default visual state)', () => {
    assert.ok(
      hasDeclaration(block, 'background', 'var(--color-border)'),
      `Expected background: var(--color-border) in ::after`,
    );
  });

  test('border-radius is 2px', () => {
    assert.ok(hasDeclaration(block, 'border-radius', '2px'), `Expected border-radius: 2px`);
  });

  test('transform includes translateY(-50%) for vertical centering', () => {
    assert.ok(
      declarationIncludes(block, 'transform', 'translateY(-50%)'),
      `Expected transform to include translateY(-50%) in ::after`,
    );
  });

  test('transform-origin is center', () => {
    assert.ok(
      hasDeclaration(block, 'transform-origin', 'center'),
      `Expected transform-origin: center in ::after`,
    );
  });

  test('transition covers background and transform', () => {
    assert.ok(
      declarationIncludes(block, 'transition', 'background'),
      `Expected transition to include background`,
    );
    assert.ok(
      declarationIncludes(block, 'transition', 'transform'),
      `Expected transition to include transform`,
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: hover state — must target ::after, NOT the bare element
// ---------------------------------------------------------------------------

describe('.slide-progress__segment:hover state', () => {
  test(':hover::after rule exists', () => {
    const block = getRuleBlock('.slide-progress__segment:hover::after');
    assert.ok(block !== null, '.slide-progress__segment:hover::after rule not found');
  });

  test(':hover::after sets background to var(--color-accent-hover)', () => {
    const block = getRuleBlock('.slide-progress__segment:hover::after');
    assert.ok(
      hasDeclaration(block, 'background', 'var(--color-accent-hover)'),
      `Expected background: var(--color-accent-hover) on hover::after`,
    );
  });

  test(':hover::after transform includes translateY(-50%)', () => {
    const block = getRuleBlock('.slide-progress__segment:hover::after');
    assert.ok(
      declarationIncludes(block, 'transform', 'translateY(-50%)'),
      `Hover transform must retain translateY(-50%) for correct centering`,
    );
  });

  test(':hover::after transform includes scaleY(2)', () => {
    const block = getRuleBlock('.slide-progress__segment:hover::after');
    assert.ok(
      declarationIncludes(block, 'transform', 'scaleY(2)'),
      `Hover transform must scale the visual bar (scaleY(2))`,
    );
  });

  test('bare :hover rule (without ::after) does NOT exist', () => {
    // Guard against regression: old code styled .slide-progress__segment:hover
    // directly; that should be gone since it would scale the entire 32px segment.
    assert.ok(
      selectorAbsent('.slide-progress__segment:hover {'),
      'Bare .slide-progress__segment:hover rule must not exist (would scale hit area)',
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: is-visited state — must target ::after
// ---------------------------------------------------------------------------

describe('.slide-progress__segment.is-visited state', () => {
  test('.is-visited::after rule exists', () => {
    const block = getRuleBlock('.slide-progress__segment.is-visited::after');
    assert.ok(block !== null, '.slide-progress__segment.is-visited::after rule not found');
  });

  test('.is-visited::after sets background to var(--color-accent)', () => {
    const block = getRuleBlock('.slide-progress__segment.is-visited::after');
    assert.ok(
      hasDeclaration(block, 'background', 'var(--color-accent)'),
      `Expected background: var(--color-accent) on .is-visited::after`,
    );
  });

  test('bare .is-visited rule (without ::after) does NOT exist', () => {
    assert.ok(
      selectorAbsent('.slide-progress__segment.is-visited {'),
      'Bare .slide-progress__segment.is-visited rule must not exist',
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: is-current state — must target ::after with correct transform
// ---------------------------------------------------------------------------

describe('.slide-progress__segment.is-current state', () => {
  const block = getRuleBlock('.slide-progress__segment.is-current::after');

  test('.is-current::after rule exists', () => {
    assert.ok(block !== null, '.slide-progress__segment.is-current::after rule not found');
  });

  test('.is-current::after sets background to var(--color-accent)', () => {
    assert.ok(
      hasDeclaration(block, 'background', 'var(--color-accent)'),
      `Expected background: var(--color-accent) on .is-current::after`,
    );
  });

  test('.is-current::after transform includes translateY(-50%)', () => {
    assert.ok(
      declarationIncludes(block, 'transform', 'translateY(-50%)'),
      `Current-slide transform must include translateY(-50%) for correct centering`,
    );
  });

  test('.is-current::after transform includes scaleY(2.5)', () => {
    assert.ok(
      declarationIncludes(block, 'transform', 'scaleY(2.5)'),
      `Current-slide transform must scale bar to 2.5x (scaleY(2.5))`,
    );
  });

  test('.is-current::after scaleY is 2.5 not the old 2 (stronger emphasis)', () => {
    // scaleY(2) would match the hover level; current slide needs scaleY(2.5)
    assert.ok(
      declarationIncludes(block, 'transform', 'scaleY(2.5)'),
      'Current slide must use scaleY(2.5), not just scaleY(2)',
    );
  });

  test('bare .is-current rule (without ::after) does NOT exist', () => {
    assert.ok(
      selectorAbsent('.slide-progress__segment.is-current {'),
      'Bare .slide-progress__segment.is-current rule must not exist',
    );
  });
});

// ---------------------------------------------------------------------------
// Regression: verify old (pre-PR) selectors are fully replaced
// ---------------------------------------------------------------------------

describe('regression — old selectors removed', () => {
  test('no bare :hover rule on segment exists', () => {
    assert.ok(
      selectorAbsent('.slide-progress__segment:hover {'),
      'Old .slide-progress__segment:hover must be replaced by :hover::after',
    );
  });

  test('no bare .is-visited rule on segment exists', () => {
    assert.ok(
      selectorAbsent('.slide-progress__segment.is-visited {'),
      'Old .slide-progress__segment.is-visited must be replaced by .is-visited::after',
    );
  });

  test('no bare .is-current rule on segment exists', () => {
    assert.ok(
      selectorAbsent('.slide-progress__segment.is-current {'),
      'Old .slide-progress__segment.is-current must be replaced by .is-current::after',
    );
  });

  test('::after pseudo-element rule is present (key PR addition)', () => {
    assert.ok(
      css.includes('.slide-progress__segment::after'),
      'CSS must contain .slide-progress__segment::after pseudo-element rule',
    );
  });
});

// ---------------------------------------------------------------------------
// Boundary / negative cases
// ---------------------------------------------------------------------------

describe('boundary and negative cases', () => {
  test('segment height and container height match (both 32px hit area)', () => {
    const containerBlock = getRuleBlock('.slide-progress');
    const segmentBlock = getRuleBlock('.slide-progress__segment');
    const containerHeight = hasDeclaration(containerBlock, 'height', '32px');
    const segmentHeight = hasDeclaration(segmentBlock, 'height', '100%');
    assert.ok(
      containerHeight && segmentHeight,
      'Container height should be 32px and segment height should fill it',
    );
  });

  test('visual bar height (4px in ::after) is smaller than hit area (32px)', () => {
    const afterBlock = getRuleBlock('.slide-progress__segment::after');
    const visualBarIs4px = hasDeclaration(afterBlock, 'height', '4px');
    const segmentBlock = getRuleBlock('.slide-progress__segment');
    const hitAreaIs32px = hasDeclaration(segmentBlock, 'height', '100%');
    assert.ok(
      visualBarIs4px && hitAreaIs32px,
      'Visual bar (4px) must be shorter than the 32px parent-backed hit area',
    );
  });

  test('is-current scaleY (2.5) is greater than hover scaleY (2)', () => {
    // Validate the relative emphasis: current > hover
    const hoverBlock = getRuleBlock('.slide-progress__segment:hover::after');
    const currentBlock = getRuleBlock('.slide-progress__segment.is-current::after');
    const hoverTransform = getDeclarationValue(hoverBlock, 'transform');
    const currentTransform = getDeclarationValue(currentBlock, 'transform');
    const hoverScale = parseScaleY(hoverTransform);
    const currentScale = parseScaleY(currentTransform);

    assert.equal(hoverScale, 2, `Expected hover scaleY(2), got: ${hoverTransform}`);
    assert.equal(currentScale, 2.5, `Expected current scaleY(2.5), got: ${currentTransform}`);
    assert.ok(currentScale > hoverScale, 'scaleY for is-current must exceed scaleY for :hover');
  });

  test('::after has both transform and transition so animation works correctly', () => {
    const block = getRuleBlock('.slide-progress__segment::after');
    assert.ok(
      declarationIncludes(block, 'transform', 'translateY(-50%)'),
      '::after needs a base transform for the transition to animate from',
    );
    assert.ok(
      declarationIncludes(block, 'transition', 'transform'),
      '::after needs a transition on transform for smooth state changes',
    );
  });

  test('CSS file is readable and non-empty', () => {
    assert.ok(css.length > 0, 'components.css should not be empty');
    assert.ok(css.includes('.slide-progress'), 'components.css must contain .slide-progress rules');
  });
});
