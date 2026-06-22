# Voice & tone — microcopy guide

LUMEN is a rights-first observatory. Its voice is **plain, honest, and precise**. We surface
serious findings about coordinated behaviour; the words have to earn trust, not perform it.

## Principles

1. **Plain over clever.** Short sentences. Common words. If a domain term is unavoidable, define it
   once in plain language. No marketing adjectives ("revolutionary", "seamless", "powerful").
2. **Honest about certainty.** Say what we know, what we infer, and what we don't. Prefer
   "signals consistent with coordination" over "proof of a bot network". Never overclaim.
3. **Neutral, not euphemistic.** Name hate narratives accurately; do not soften, but do not editorialize.
4. **Show the basis.** Every claim links to its evidence/source. Numbers carry their method.
5. **Respect the reader's time.** Lead with the result; details follow. One idea per sentence.
6. **No blame in the UI.** Describe behaviour, not people. "Account cluster X" not "the bad actors".

## Tone by surface

| Surface | Tone |
|---|---|
| Headlines / scores | Factual, bare. "AI-optimization: 8.3 / 10." |
| Findings | Direct, with severity first, then the fix. |
| Empty states | Reassuring and instructive: what to do next. |
| Errors | Specific and recoverable: what failed, why, the next step. No stack-trace dumps. |
| Buttons / labels | Verb-first, literal: "Run audit", "Export report", "View source". |

## Microcopy rules

- **Buttons:** verb + object, sentence case. "Run audit" not "AUDIT" or "Let's go!".
- **Severity language:** P0 critical · P1 high · P2 medium · P3 low/info. Use these consistently;
  do not invent synonyms ("urgent", "blocker") in the UI.
- **Numbers:** always with units and, where it matters, the basis. "1,025 links checked" not "many links".
- **Dates:** ISO-like and unambiguous: `2026-06-21`. Never "today" in stored output.
- **Status words:** `planned` · `in-progress` · `blocked` · `done` (matches the task schema).
- **No exclamation marks** in product copy. Calm is the brand.
- **Sentence case** for headings and labels (not Title Case, not ALL CAPS — except the small
  uppercase eyebrow labels, which are a visual style, not shouting).

## Examples

| Don't | Do |
|---|---|
| "🚀 We caught the bad guys!" | "Detected an account cluster with coordination signals." |
| "Something went wrong." | "Couldn't read `tokens.json` — check the file exists, then retry." |
| "AMAZING results!" | "Composite score: 8.0 / 10 (▲ +0.5 vs. previous run)." |
| "Click here" | "View the source thread" |
| "This is definitely a bot farm." | "Signals consistent with coordinated inauthentic behaviour (see evidence)." |

## Accessibility of language

- Expand an acronym on first use: "Coordinated Inauthentic Behaviour (CIB)".
- Don't rely on color alone — pair severity color with its label (P0, P1, …) in text.
- Write link text that makes sense out of context (screen-reader friendly): not "here".
