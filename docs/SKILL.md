# Design language — specification (AI-optimized)

> **Source of truth for this skill.** This `.md` is written for AI agents (dense, machine-parseable).
> The human view is [`README.html`](./README.html). Per project convention: **`.md` = AI
> optimization, `.html` = human view.** The *visual* source of truth is
> [`design/tokens.json`](./design/tokens.json).

A single source of truth for the visual identity so generated UIs are good and consistent **by
default**. The dark theme already in use across the repo (`benchmark.html` and the two skill
`README.html` sheets) is **extracted** into a formal token system — colors, surfaces, spacing,
radii, type, and component-level tokens — plus a component spec, a voice guide, a CSS generator,
and a token linter that makes "uses only tokens" a checkable property.

- **Task:** [`../07-design-language.md`](../07-design-language.md)
- **Decision (from the task card):** EXTRACT the in-use dark theme — do **not** invent a new palette.
- **Targets:** Claude Code · Codex · Cursor (one source, three shells)

---

## 1. The problem it solves

> *"Design language → after it is properly defined, we can actually create good designs."* — TODO.md

Agents produce inconsistent UIs without a token system to anchor to. Defining the language once,
**machine-readably**, turns "make it look good" into "apply these tokens / components" —
deterministic and on-brand. Mirrors the md/html split: tokens in a machine format
(`tokens.json` → `tokens.css`) are the AI source; the showcase is the human view.

---

## 2. What it does (functionalities)

Five functionalities, each documented under [`functionalities/`](./functionalities/) on the uniform
schema (Purpose · Inputs · Expected project structure · How it works · Output · Safety · Failure
modes it prevents).

| # | Functionality | Writes? |
|---|---|---|
| 01 | [Tokens (color · spacing · type)](./functionalities/01-tokens.md) | no (source data) |
| 02 | [Components](./functionalities/02-components.md) | no (spec + showcase) |
| 03 | [Voice & tone](./functionalities/03-voice-and-tone.md) | no (spec) |
| 04 | [CSS generation (tokens.json → tokens.css)](./functionalities/04-css-generation.md) | yes (`tokens.css`) |
| 05 | [Token lint](./functionalities/05-token-lint.md) | no (read-only report) |

---

## 3. Deliverables (the design system)

| Artifact | Role |
|---|---|
| [`design/tokens.json`](./design/tokens.json) | **Machine source of truth.** color (bg/panel/line/ink/muted/faint/blue/violet/green/amber/red + semantic severity P0–P3), surfaces, spacing scale, radii, type scale + font stacks, component-level tokens (gauge, badge, finding card, table, pill, score chip, lead, code). |
| [`design/tokens.css`](./design/tokens.css) | The same tokens as CSS custom properties — **generated** from `tokens.json` so any HTML can `var(--…)`. |
| [`design/showcase.html`](./design/showcase.html) | **Human view.** Renders every token (color swatches, type scale, spacing, radii) and every component, built with the tokens. |
| [`design/components.md`](./design/components.md) | Component spec — anatomy + token usage per component. |
| [`design/voice.md`](./design/voice.md) | Voice/tone & microcopy guide. |
| [`scripts/lint-tokens.mjs`](./scripts/lint-tokens.mjs) | CLI: flag hardcoded hex/px not in `tokens.json` (`file:line:col`). |
| [`scripts/gen-css.mjs`](./scripts/gen-css.mjs) | CLI: regenerate `tokens.css` from `tokens.json` (`--check` for CI). |
| [`example-output/`](./example-output/) | A sample lint report + the dirty/clean fixtures it was run on. |

---

## 4. Token categories captured (extracted, not invented)

- **Color** — foundation (`bg`, `bg2`, `panel`, `panel2`, `inset`, `line`, `ink`, `ink2`, `muted`,
  `faint`), accents (`blue`, `violet`, `green`, `amber`, `red` + deep/text variants).
- **Severity (semantic)** — `p0`=red, `p1`=amber, `p2`=blue, `p3`=grey, each with `rail`/`text`/`bg`/`border`.
- **Surface** — page gradient, panel, raised panel, inset, hover tint, soft divider.
- **Spacing** — a fixed px scale (`--space-px` … `--space-15`).
- **Radius** — `xs` 5 · `sm` 6 · `md` 7 · `lg` 10 · `xl` 12 · `2xl` 14 · `pill` 20 · `round` 50%.
- **Type** — sans + mono font stacks, base size/line, a 9-step scale (h1/h2/h3/body/small/meta/code/micro/label).
- **Component** — gauge, badge, finding card, card, table, pill, score chip, lead, code.

The values are pulled verbatim from the `:root{…}` blocks of `benchmark.html`,
`tasks/skill-deterministic-checker/README.html`, and `tasks/skill-workspace-optimizer/README.html`.

---

## 5. How to use it

```bash
# Regenerate the CSS after editing tokens.json:
node tasks/design-language/scripts/gen-css.mjs

# CI gate — fail if tokens.css is stale:
node tasks/design-language/scripts/gen-css.mjs --check

# Lint a UI file for hardcoded values not in the token system:
node tasks/design-language/scripts/lint-tokens.mjs <file.css|.html|.tsx>

# Self-test (offline, deterministic):
node tasks/design-language/scripts/self-test.mjs
```

**In a UI:** link/inline `design/tokens.css`, then use `var(--…)` everywhere. Never write a raw
hex/px — the linter will flag it. Components: follow [`design/components.md`](./design/components.md).
Copy: follow [`design/voice.md`](./design/voice.md).

**Invocation per agent**
- **Claude Code:** `/design-language` → `.claude/skills/design-language/SKILL.md`.
- **Codex:** read the design-language section / the `scripts/` it points at.
- **Cursor:** rule `.cursor/rules/design-language.mdc` → same scripts.

---

## 6. Safety & determinism guarantees

- **Linter & `--check` are read-only.** `gen-css.mjs` (write mode) overwrites exactly one generated file.
- **Deterministic.** Same `tokens.json` → byte-identical `tokens.css`; lint output is stably sorted.
  No randomness, no timestamps. Zero dependencies (Node ≥18).
- **Self-verifying.** `self-test.mjs` proves: tokens parse + carry the core color keys and P0–P3;
  CSS generation is deterministic; the linter flags a non-token hex/px and passes a tokens-only file;
  and the generated `tokens.css` lints clean against itself.

---

## 7. Acceptance criteria (from the task)

- [x] All visual values are tokens (no magic hex/px) — enforced by `lint-tokens.mjs`.
- [x] `showcase.html` is consistent with `tokens.json` (uses only `var(--…)`).
- [x] A screen built with the tokens passes a "uses only tokens" lint (see `example-output/clean.css`).

## 8. Build status

- ✅ Tokens extracted → `design/tokens.json`; CSS generated → `design/tokens.css`.
- ✅ Human view `design/showcase.html`; component spec `design/components.md`; voice `design/voice.md`.
- ✅ Tooling: `scripts/gen-css.mjs`, `scripts/lint-tokens.mjs`, pure core `scripts/lib/run.mjs`.
- ✅ `scripts/self-test.mjs` — **PASSED** (offline, temp fixture, cleaned up).
- ✅ Cross-tool shells: `.claude/skills/design-language/SKILL.md`, `.cursor/rules/design-language.mdc`.
- ✅ `example-output/` — sample lint report + dirty/clean fixtures.

## References
- [`../07-design-language.md`](../07-design-language.md) — the task.
- [`../skill-deterministic-checker/`](../skill-deterministic-checker/) — the checker that scores "all values are tokens"-style rules.
- `../../benchmark.html` — one of the source sheets the theme was extracted from (read-only).
