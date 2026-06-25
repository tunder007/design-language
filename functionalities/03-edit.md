# Functionality 03 — `edit` (modify the tokens)

**Verb:** edit (CRUD **U**, and **D** via `--remove`) · **Writes:** the 2 artifacts only · **Idempotent:** re-applying the same set/remove is a no-op · **Order:** maintenance

## Purpose
Change the design language to taste: set or remove a token, swap a font, or fold in the exact values
a human tuned in the browser — re-rendering `design.html` (`:root` + specimens) and `DESIGN.md` (rule
+ token mirror) together so the two never drift. This is the terminal half of the side-by-side loop:
the human tweaks in `design preview` and clicks **Export tokens**; you fold that export back in here.

## Inputs
```
design edit [--set --<tok> <val>]... [--remove --<tok>]... [--from-export <file>] [--force] [--out <dir>]
```
- `--set --<tok> <val>` — set one token (repeatable). The leading `--` on the token name is optional
  (`--set --accent …` ≡ token `--accent`). Color tokens are normalized to HSL; other values pass
  through. Example: `--set --accent "hsl(24 95% 53%)"`.
- `--remove --<tok>` — remove a token (repeatable). Token-name `--` optional.
- `--from-export <file>` — a file containing the `:root { … }` block exported from `design.html`'s
  editor panel; its tokens **replace** the current set. A file with no `:root` block is an error.
- `--force` — apply even when validation raises contrast warnings (so does `--write`).
- `--out <dir>` — directory holding the existing `design.html` to load and rewrite (default `.`).

Requires an existing `design.html` under `--out` (run `create`/`get` first).

## Expected project structure
```
<out>/design.html     # required input (its :root is loaded); rewritten
<out>/DESIGN.md       # rewritten (rule + token mirror)
```

## How it works (deterministic)
1. Load the current tokens from `<out>/design.html` (`lib/io.mjs` `loadTokens`).
2. Apply the delta: `--from-export` (replace), then each `--set` (with HSL normalization for color
   tokens), then each `--remove`. Build a changelog line per change.
3. **Validate**: `--ink`-on-`--bg` and `--ink`-on-`--panel` contrast against WCAG AA (≥4.5 body). If
   either falls short it's a **warning** — the edit is held back (printed, not written) unless
   `--force` (or `--write`) is passed. A malformed `--from-export` is a hard **error** (exit 2).
4. Re-render both artifacts from the new token map (`lib/render.mjs`) and write them.

## Output
Updated `DESIGN.md` + `design.html`, a changelog of what changed, and any contrast warnings. If only
warnings (and no `--force`), prints the warnings and writes nothing.

## Safety
- Writes **only** the two artifacts — never the frontend (that's `apply`).
- Contrast validation gates low-contrast palettes behind `--force`.
- `--from-export` trusts the human's in-browser decisions but still runs the contrast check.

## Failure modes it prevents
- **Drift** between the philosophy doc and the token values — they're re-rendered as one unit.
- **Inaccessible palettes** — ink-on-bg / ink-on-panel contrast is checked on every edit.
- **Lost in-browser tuning** — `--from-export` folds the exact exported `:root` straight back in.
