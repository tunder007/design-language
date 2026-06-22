# Functionality 05 — Token lint

**Writes:** no (read-only report) · **Idempotent:** yes · **Order:** runs on demand / in CI

## Purpose
Enforce the "**all visual values are tokens**" rule: scan a `.css`/`.html`/`.tsx` file for
**hardcoded hex colors and px values that are NOT declared in `tokens.json`**, and report each as a
`file:line:col` violation. This is the deterministic check that turns the design language from a
suggestion into a guarantee.

## Inputs
- One or more target files (`.css`, `.html`, `.tsx`, or any text).
- `design/tokens.json` (the allow-list of blessed values) — overridable with `--tokens <path>`.

## Expected project structure
```
scripts/lint-tokens.mjs     # the CLI
scripts/lib/run.mjs         # pure lintFile(text, tokens) → { violations:[…] }
design/tokens.json          # the source of blessed literals
```

## How it works (deterministic)
1. `extractTokenLiterals(tokens)` harvests every hex and px literal declared anywhere in the token
   tree (including inside compound values like gradients), normalized lowercase → the allow-list.
2. `lintFile(text, tokens)` scans each line for hex (`#rgb`/`#rrggbb`/…) and px (`16px`, `1.5px`):
   - a literal **in** the allow-list → fine (it's a token).
   - `0px` → ignored (harmless).
   - the `:root { … }` token-definition block is exempt (that's where literals legitimately live),
     as are comment lines.
   - everything else → a violation `{ line, col, type, value, snippet }`.
3. Violations are sorted by line then column (stable output).
4. The CLI prints a report and exits **1** if any violations exist, **0** if clean — a CI gate.

## Output
A printed report:
```
example-output/dirty.css: 3 violation(s)
  example-output/dirty.css:3:10  HEX #ff0000  →  color: #ff0000; …
example-output/clean.css: clean — 0 hardcoded values outside the token system.
```
(See [`../example-output/lint-report.txt`](../example-output/lint-report.txt).)

## Safety
- **Read-only by nature** — never writes, never mutates input. Safe to run anywhere, including on a
  target project's source.

## Failure modes it prevents
- **Magic hex/px creeping back into components** after the token system exists.
- **"Looks on-brand" by accident** — the lint makes on-brand a checkable property, not a vibe.
- **Regressions in generated UIs** — wire it into CI so any new screen must use tokens to pass.
