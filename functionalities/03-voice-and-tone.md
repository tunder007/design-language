# Functionality 03 — Voice & tone

**Writes:** no (specification) · **Idempotent:** n/a · **Order:** independent of the visual tokens

## Purpose
Make the project's **writing** as consistent as its visuals: a microcopy guide so generated UI
text is plain, honest, and on-brand by default — matching LUMEN's rights-first, no-overclaim tone.

## Inputs
- The project's existing voice (plain, factual, evidence-led) as seen across `lumen-docs/` and the
  benchmark/skill prose.

## Expected project structure
```
design/voice.md   # principles · tone-by-surface · microcopy rules · examples
```

## How it works (deterministic)
1. States **principles** (plain over clever; honest about certainty; neutral not euphemistic; show
   the basis; respect the reader's time; no blame in the UI).
2. Gives **tone by surface** (headlines, findings, empty states, errors, buttons).
3. Pins concrete **microcopy rules** (verb-first buttons, fixed severity vocabulary P0–P3, units on
   numbers, ISO dates, status words, sentence case, no exclamation marks).
4. Provides **Don't / Do** examples and accessibility-of-language rules (expand acronyms, don't rely
   on color alone, meaningful link text).

## Output
`design/voice.md` — the authoritative tone guide referenced by any UI/copy task.

## Safety
- Pure guidance; no side effects.

## Failure modes it prevents
- **Overclaiming** in a rights-sensitive product ("proof of a bot farm" vs. "signals consistent with").
- **Inconsistent severity wording** drifting from the P0–P3 vocabulary used in the visuals.
- **Marketing-voice creep** (exclamation marks, hype adjectives) that erodes trust.
- **Inaccessible copy** ("click here", color-only severity, unexpanded acronyms).
