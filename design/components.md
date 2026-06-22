# Components — anatomy & token usage

Every component below is part of the dark theme already in use across `benchmark.html` and the
skill README sheets. This doc specifies each one's **anatomy** (the parts) and the **tokens** each
part must use. Rule: a component never introduces a raw hex/px — it composes `var(--…)` from
`design/tokens.css`. The token linter (`scripts/lint-tokens.mjs`) enforces this.

See it rendered: [`showcase.html`](./showcase.html). Token names: [`tokens.css`](./tokens.css).

---

## Score gauge
A single metric on a card, with a big number, an optional delta, and a fill bar.

| Part | Token(s) |
|---|---|
| Container | `--component-gauge-bg`, `--component-gauge-border`, `--component-gauge-radius`, `--component-gauge-pad` |
| Label (uppercase) | `--component-gauge-label-color`, type `--type-scale-label-*` |
| Number | `--component-gauge-num-size`, `--component-gauge-num-weight`; `/10` suffix uses `--color-faint` |
| Delta (up) | `--component-gauge-delta-up-bg`, `--component-gauge-delta-up-text`, `--component-gauge-delta-up-border`, `--radius-pill` |
| Fill bar track | `--component-gauge-bar-track`, `--component-gauge-bar-height`, `--radius-sm` |
| Fill (by axis) | AI → `--component-gauge-fill-ai`; determinism → `--component-gauge-fill-det`; composite → `--component-gauge-fill-comp` |

## Severity badge (P0–P3)
A small pill stating priority. The semantic mapping is fixed.

| Severity | bg | text | border |
|---|---|---|---|
| P0 critical | `--severity-p0-bg` | `--severity-p0-text` | `--severity-p0-border` |
| P1 high | `--severity-p1-bg` | `--severity-p1-text` | `--severity-p1-border` |
| P2 medium | `--severity-p2-bg` | `--severity-p2-text` | `--severity-p2-border` |
| P3 low/info | `--severity-p3-bg` | `--severity-p3-text` | `--severity-p3-border` |

Shape: `--component-badge-radius`, `--component-badge-pad`, `--component-badge-size`,
`--component-badge-weight`, `--component-badge-tracking`.

## Finding card
A panel with a colored left rail keyed to severity, a title (with an inline badge), and a fix line.

| Part | Token(s) |
|---|---|
| Container | `--component-finding-card-bg`, `--component-finding-card-border`, `--component-finding-card-radius`, `--component-finding-card-pad` |
| Left rail width | `--component-finding-card-rail-width` |
| Rail color | the matching `--severity-pN-rail` |
| Title | `--type-scale-h3-*`, contains a severity badge |
| Fix line | `--color-muted`; emphasis (`<b>`) → `--color-ink2` |

## Card (generic / accented)
Neutral content panel, optionally with a 3px accent left border (blue/violet/green).

| Part | Token(s) |
|---|---|
| Container | `--component-card-bg`, `--component-card-border`, `--component-card-radius`, `--component-card-pad` |
| Accent rail | `--component-card-accent-width` + `--color-blue` \| `--color-violet` \| `--color-green` |

## Table (with score chips)
Full-width, row-lined, hover-highlighted. Numeric cells carry a score chip.

| Part | Token(s) |
|---|---|
| Header cells | `--component-table-head-color`, `--component-table-head-size`, `--component-table-head-weight` (uppercase, tracked) |
| Cells | `--component-table-cell-pad`, `--component-table-font-size` |
| Row separator | `--component-table-row-line` |
| Row hover | `--component-table-row-hover` |
| Score chip — high (8–10) | `--component-score-chip-high-*` |
| Score chip — mid (6–7) | `--component-score-chip-mid-*` |
| Score chip — low (≤5) | `--component-score-chip-low-*` |

Chip shape: `--component-score-chip-radius`, `--component-score-chip-pad`,
`--component-score-chip-weight`, `--component-score-chip-size`.

## Pill / tag
Inline, low-emphasis label (e.g. target agents, attributes).

| Part | Token(s) |
|---|---|
| Pill | `--component-pill-border`, `--component-pill-color`, `--component-pill-radius`, `--component-pill-pad`, `--component-pill-size` |

## Lead / note callout
A panel with a 3px accent left border for an intro paragraph or an aside.

| Part | Token(s) |
|---|---|
| Container | `--component-lead-bg`, `--component-lead-border`, `--component-lead-radius`, `--component-lead-pad` |
| Accent | `--component-lead-accent-width` + `--component-lead-accent` (blue) — use `--color-violet` for "note" |

## Inline code
| Part | Token(s) |
|---|---|
| `code` | `--component-code-bg`, `--component-code-border`, `--component-code-radius`, `--component-code-color`, mono `--type-font-mono` |

---

## Rules for every component
1. **No raw values.** Colors and spacing come from tokens. New need → add a token first.
2. **Severity is semantic, not decorative.** P0=red, P1=amber, P2=blue, P3=grey — never reassigned.
3. **One radius family, one spacing scale.** Reach for an existing step before inventing one.
4. **Surfaces stack:** page (`--surface-page`) → panel (`--color-panel`) → inset (`--color-inset`).
5. **Borders are `--space-px` (1px) `--color-line`.** Soft dividers use `--surface-line-soft`.
