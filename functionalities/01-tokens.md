# Functionality 01 — Tokens (color · spacing · type)

**Writes:** no (it is the source data) · **Idempotent:** n/a · **Order:** foundation (everything reads from it)

## Purpose
Hold the **single machine source of truth** for the visual identity: color (foundation + accents +
semantic severity P0–P3), surfaces, the spacing scale, radii, the type scale + font stacks, and
component-level tokens. Every other artifact (CSS, showcase, components spec, linter) derives from
this file, so "make it on-brand" becomes "use these tokens."

## Inputs
- `design/tokens.json` — authored by hand. Values were **extracted** from the dark theme already in
  use (`benchmark.html`, the two skill `README.html` sheets), not invented.

## Expected project structure
```
design/tokens.json     # this file — machine source of truth
design/tokens.css      # generated from it (functionality 04)
```

## How it works (deterministic)
1. Tokens are a nested JSON object grouped by category: `color`, `severity`, `surface`, `space`,
   `radius`, `type`, `component`.
2. Keys are stable and ordered; the generator (functionality 04) flattens them to CSS variables
   with a deterministic name mapping (`color.bg` → `--color-bg`, `severity.p0.rail` →
   `--severity-p0-rail`).
3. Severity is **semantic**: P0=red, P1=amber, P2=blue, P3=grey — each with `rail`, `text`, `bg`,
   `border` for the colored-rail + tinted-badge pattern.
4. The spacing scale is small and fixed (px steps, plus `px`=1px for hairline borders); components
   reference steps, never raw values.

## Output
The parsed token tree, consumed by functionalities 02 (components), 04 (CSS generation), 05 (lint).

## Safety
- Pure data; reading it has no side effects.
- Adding a token is safe and backward-compatible; renaming/removing one is a breaking change —
  regenerate CSS and re-lint consumers.

## Failure modes it prevents
- **Improvised palettes per screen** — there is one place to look, and it matches what's already shipped.
- **Inconsistent severity coloring** — the P0–P3 mapping is defined once and reused everywhere.
- **Magic numbers** — spacing/radii come from a named scale the linter can check against.
