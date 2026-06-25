# Functionality 01 — `create` (define a fresh design language)

**Verb:** create (CRUD **C**) · **Writes:** yes (the 2 artifacts) · **Idempotent:** same flags → byte-identical artifacts · **Order:** greenfield entry point

## Purpose
Author a **fresh** design language when there is no existing frontend to extract from. Starts from a
calm, dark, single-accent default and overlays the brand refs you pass, producing the two runtime
artifacts (`DESIGN.md` + `design.html`) so a new project starts on-brand and consistent **by
default**.

## Inputs
```
design create [--bg <c>] [--accent <c>] [--sans <stack>] [--mono <stack>] [--out <dir>]
```
- `--bg <c>` — page/background color. **hex or hsl** (normalized to HSL). Seeds `--bg`.
- `--accent <c>` — the single accent color (hex or hsl). Seeds `--accent`.
- `--sans <stack>` — body font stack → `--font-sans`.
- `--mono <stack>` — mono font stack → `--font-mono`.
- `--out <dir>` — where to write the two artifacts (default `.`).

Every unspecified slot is filled from the documented default ramp, so output is always complete.

## Expected project structure
```
<out>/DESIGN.md       # created — philosophy + rules + token mirror (AI source)
<out>/design.html     # created — interactive style guide; :root is the token source of truth
```

## How it works (deterministic)
1. Build the token plan from `lib/tokens.mjs` `defaultTokens(bg)`: a neutral ramp
   (`--bg`/`--bg-2`/`--panel`/`--inset`/`--line`/`--ink`/`--muted`/`--faint`), one accent
   (`--accent`/`--accent-2`/`--accent-ink`), semantic colors (`--success`/`--warn`/`--danger`/
   `--info` + `*-bg`), a modular type scale, a fixed spacing scale, radii, and two shadows. Colors
   normalized to **HSL** via `lib/color.mjs`.
2. Overlay the flags (`--bg`, `--accent`, `--sans`, `--mono`) onto the defaults. No randomness — the
   same flags yield the same tokens.
3. Emit `design.html` from `lib/template.html`: the tokens as a `:root { --… }` block, swatches, font
   specimens, the type/space/radius scales, sample components, and the **editor panel** (tune
   in-browser → **Export tokens** to copy the adjusted `:root` back out). The page paints its own
   background with `var(--bg)`.
4. Emit `DESIGN.md`: the principles, the application rules, and a compact mirror of the token names.

## Output
A complete, valid `DESIGN.md` + `design.html`, plus a console note suggesting `design preview` (or
opening `design.html`) to review and tune.

## Safety
- Pure generation; touches only the two artifacts under `--out`.
- Deterministic: identical flags produce byte-identical files.

## Failure modes it prevents
- **Blank-page design** — every new project gets a coherent starting system instead of ad-hoc values.
- **Incomplete token sets** — every required slot is filled (defaulted + documented), so consumers never hit a missing `var`.
- **Hidden values** — the author sees and approves the palette in the browser (`design preview`) before anything ships.
