# Functionality 02 — Components

**Writes:** no (specification) · **Idempotent:** n/a · **Order:** builds on tokens (01)

## Purpose
Define the **reusable components** already in use across the repo — score gauge, severity badge
(P0–P3), finding card, generic/accented card, table with score chips, pill/tag, lead/note callout,
inline code — as an anatomy + token-usage spec, so any agent can rebuild them identically without
re-deriving styling.

## Inputs
- `design/tokens.json` / `design/tokens.css` (the values each component part references).
- The in-use markup in `benchmark.html` and the skill `README.html` sheets (the reference rendering).

## Expected project structure
```
design/components.md   # the spec (anatomy + token map per component)
design/showcase.html   # the rendered proof (functionality is visible)
```

## How it works (deterministic)
1. Each component is documented with: its **anatomy** (named parts) and a **token map** (which
   `var(--…)` each part must use).
2. Severity-keyed components (badge, finding-card rail, score chip) bind to the fixed P0–P3 mapping.
3. `showcase.html` renders every component using only `var(--…)`, serving as the visual contract:
   if a component drifts, the showcase shows it.

## Output
`design/components.md` (the spec) and the component sections of `design/showcase.html` (the render).

## Safety
- Documentation + a self-contained HTML view; no writes to a target project.
- The showcase inlines tokens from the generated CSS, so it stays consistent with the source.

## Failure modes it prevents
- **Re-inventing components per project** with slightly different padding/radius/severity colors.
- **Decorative misuse of severity color** (e.g. red for emphasis) — the spec ties color to meaning.
- **Hidden hardcoded values inside components** — the token map makes the expected variables explicit,
  and the linter (05) catches deviations.
