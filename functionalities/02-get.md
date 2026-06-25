# Functionality 02 — `get` (extract & centralize an existing frontend)

**Verb:** get (CRUD **R**) · **Writes:** the 2 artifacts, **only with `--write`** · **Idempotent:** same frontend → same report · **Order:** brownfield entry point

## Purpose
Read an existing frontend, find its visual patterns, and **centralize** them into one token set —
turning a sprawl of hardcoded colors/fonts into the two managed artifacts. This is the inverse of the
deterministic-checker's token linter: that flags hardcoded values; `get` collects, clusters, and
consolidates them. It also **detects the page background** and seeds `--bg` with it, so the generated
`design.html` (which paints itself with `var(--bg)`) literally matches the scanned app.

## Inputs
```
design get <frontend-dir> [--write] [--out <dir>]
```
- `<frontend-dir>` — directory to scan (required). Recursively walked; `node_modules`, `.git`,
  `dist`, `build`, `.next`, `coverage` are skipped.
- `--write` — scaffold `DESIGN.md` + `design.html` from the proposed token set. Without it, the
  command is **report-only**.
- `--out <dir>` — where to write the artifacts when `--write` is given (default `.`).

## Expected project structure
```
<frontend-dir>/**     # read-only scan target (.css/.scss/.sass/.less/.html/.tsx/.jsx/.ts/.js/.vue/.svelte/.astro)
<out>/DESIGN.md       # written only with --write
<out>/design.html     # written only with --write
```

## How it works (deterministic)
1. **Scan** (`lib/scan.mjs`) for visual literals: hex / rgb(a) / hsl(a) colors, `font-family`
   stacks, and background declarations — including authoritative `html`/`body`/`:root` backgrounds.
2. **Normalize** colors to HSL via `lib/color.mjs`.
3. **Cluster** near-duplicate colors within a fixed distance (e.g. `#fff` ≈ `#ffffff`; `#2b6cff` ≈
   `#2c6dff`) and **count usages**; the most-used member becomes the canonical token. The accent is
   the most-used reasonably-saturated mid-tone (`s ≥ 35`, `25 ≤ l ≤ 80`); the most-used font stack
   becomes `--font-sans`.
4. **Detect the page background** (body/html/:root background wins over generic backgrounds) and seed
   `--bg`; all other slots fall back to the defaults.
5. **Report** (read-only): files scanned, distinct colors → cluster count, detected background +
   accent, the top color clusters (`canonical ← near-duplicates · usage`), and the top font stacks.
   Stable-sorted, no timestamps.
6. **With `--write`**, scaffold `DESIGN.md` + `design.html` from the proposed set (same emitters as
   `create`). The scanned frontend is **never** modified — that's `apply`.

## Output
A consolidation report; with `--write`, the two artifacts seeded from the real codebase (with `--bg`
matched to the app).

## Safety
- **Read-only unless `--write`.** Never edits the scanned frontend.
- Deterministic clustering (fixed thresholds, stable tie-break by usage then lexical order).

## Failure modes it prevents
- **Palette sprawl** — N near-identical colors collapse to one token with a usage count.
- **Mismatched preview** — `--bg` is taken from the app's real background, so the style guide matches.
- **Guesswork** — tokens are derived from what's actually used, not invented.
