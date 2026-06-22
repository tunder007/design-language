# Functionality 04 — CSS generation (tokens.json → tokens.css)

**Writes:** yes (`design/tokens.css`) · **Idempotent:** yes · **Order:** runs after any token edit

## Purpose
Project the machine source of truth (`tokens.json`) into a CSS custom-property sheet
(`tokens.css`) so any HTML/TSX can consume the design language with `var(--…)` and never hardcode
a value. Keeps the two representations in lock-step.

## Inputs
- `design/tokens.json` (the source).
- CLI flags: none (write) or `--check` (verify the committed CSS is current, write nothing).

## Expected project structure
```
design/tokens.json          # source
design/tokens.css           # generated output
scripts/gen-css.mjs         # the CLI
scripts/lib/run.mjs         # pure generateCss(tokens)
```

## How it works (deterministic)
1. `generateCss(tokens)` (pure, in `lib/run.mjs`) flattens the nested token object into ordered
   `[--var, value]` pairs using a stable name mapping:
   - nesting joins with `-`: `severity.p0.rail` → `--severity-p0-rail`.
   - camelCase splits to kebab: `color.blueDeep` → `--color-blue-deep`.
   - the `meta`/`$schema` block is skipped.
2. Pairs are emitted in `tokens.json` key order (stable) inside a single `:root { … }` block, with a
   "GENERATED — do not edit" header.
3. **Determinism guarantee:** same `tokens.json` → byte-identical `tokens.css` on every run (no
   randomness, no timestamps).
4. `--check` mode compares the freshly generated string to the committed file and exits non-zero on
   drift — a CI gate that the CSS was regenerated after a token change.

## Output
`design/tokens.css` — a `:root` sheet of every token as a CSS variable.

## Safety
- Writes exactly one file, fully overwritten from source (no partial/merged state).
- `--check` is read-only.
- Idempotent: regenerating without source changes produces the identical file.

## Failure modes it prevents
- **`tokens.json` and `tokens.css` drifting** out of sync (the `--check` gate catches stale CSS).
- **Hand-edited CSS** silently diverging from the source (header warns; CI fails).
- **Non-reproducible builds** — generation is deterministic, so two runs/agents agree.
