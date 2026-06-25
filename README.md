# `design` — design-language skill (AI source of truth)

> **`.md` = AI optimization · `.html` = human view** (repo convention). This file is the AI source.
> The human view is [`README.html`](./README.html). The skill's *runtime* artifacts (the design
> language it manages) are **two files in the target project**: `DESIGN.md` + `design.html`.
> A worked example of those two artifacts is in [`example-output/`](./example-output/).

A **lightweight** design-language skill: it gives a project one design philosophy the AI applies
**by default**, kept in just **two files**, and operated through **five verbs** (full CRUD + apply +
preview). The token values live in **one** place — the `:root` of an interactive `design.html` — and
the philosophy lives in `DESIGN.md`. One dispatcher, one bin name (`design`), zero deps (Node ≥18).

- **Task:** [`../07-design-language.md`](../07-design-language.md)
- **Targets:** Claude Code · Codex · Cursor (one source, three shells)

---

## 1. The problem it solves

> *"Design language → after it is properly defined, we can actually create good designs."*

Agents improvise UIs without a fixed set of values and rules to anchor to. This skill makes
"make it look good" deterministic: **apply these tokens + these rules**. Mirrors the md/html split —
the philosophy/rules are AI-readable prose (`DESIGN.md`); the concrete inventory is a human-viewable,
**editable** style guide (`design.html`) whose `:root` is the machine source of truth.

**The whole point is a side-by-side workflow** — like "Claude design + preview". The coding agent
runs in the terminal on one half of the screen; the human runs `design preview` and watches
`design.html` on the other half, tweaking tokens live in the in-page editor and exporting them back
into `design edit --from-export`. And because `design.html` paints its **own page background** with
`var(--bg)` — and `design get` sets `--bg` to the background it detects in the scanned frontend — the
preview literally matches the app it empowers.

---

## 2. The two artifacts (what the skill manages)

| File | Audience | Role |
|---|---|---|
| `DESIGN.md` | **AI** | **Philosophy + rules.** Principles (hierarchy, spacing rhythm, contrast/elevation, density, color usage, motion, voice) and *rules the AI applies as judgment* on every UI task — e.g. "one accent per view", "body text is `--ink`, never pure white on dark", "spacing only from the scale". Carries a compact mirror of the token names so the AI can read the inventory without parsing HTML. |
| `design.html` | **Human** | **Interactive living style guide.** A self-contained page whose `:root { --… }` CSS block (colors in **HSL**, font stacks, type scale, spacing, radii, shadows) is the **canonical machine-readable token source**. Its own page background is `var(--bg)`, so it mirrors the target app. It renders swatches + font specimens + sample components, and includes an **editor panel**: change a value in-page → live preview → **Export tokens** copies the new `:root` back out so your decisions feed straight into `design edit --from-export`. |

> **Why values live in `design.html`'s `:root` (not a JSON file):** CSS variables are trivially
> machine-parseable (one regex — see `lib/tokens.mjs` `parseRoot`), the page renders from them
> directly, and a human can both *see* and *change* them in a browser. Two files, no extra build
> artifact.

---

## 3. The five verbs (CRUD + apply + preview)

```
design create    # C — author a fresh design language from brand refs (greenfield)
design get       # R — read an existing frontend; cluster & centralize its styles (brownfield)
design edit      # U — modify the tokens (set/remove a token, fold in an in-browser export)
design apply     #     propagate the tokens into the frontend (exact-match codemod, dry-run first)
design preview   #     live-reload server for design.html — the human half of the side-by-side loop
```

> **CRUD mapping.** create = **C**, get = **R** (read reality into tokens), edit = **U** (also
> covers **D** — `--remove` a token is an edit). "Delete the whole language" = just remove the two
> files (git). `apply` propagates; `preview` is the live human feedback loop.

Each verb is specified on the repo's uniform schema under [`functionalities/`](./functionalities/):

| # | Verb | File | Writes |
|---|---|---|---|
| 01 | `create` | [`functionalities/01-create.md`](./functionalities/01-create.md) | the 2 artifacts (new) |
| 02 | `get` | [`functionalities/02-get.md`](./functionalities/02-get.md) | the 2 artifacts (from extraction), on `--write` |
| 03 | `edit` | [`functionalities/03-edit.md`](./functionalities/03-edit.md) | the 2 artifacts only |
| 04 | `apply` | [`functionalities/04-apply.md`](./functionalities/04-apply.md) | frontend files, on `--write` |
| 05 | `preview` | [`functionalities/05-preview.md`](./functionalities/05-preview.md) | nothing (read-only HTTP server) |

### CLI surface (one dispatcher: `scripts/cli.mjs`, bin `design`)

```
design create [--bg <c>] [--accent <c>] [--sans <stack>] [--mono <stack>] [--out <dir>]
design get <frontend-dir> [--write] [--out <dir>]
design edit [--set --<tok> <val>]... [--remove --<tok>]... [--from-export <file>] [--force] [--out <dir>]
design apply <frontend-dir> [--write] [--out <dir>]
design preview [<design.html>] [--port <n>]
```

Colors accept **hex or hsl** (normalized to HSL on the way in). `--out` defaults to `.`.

---

## 4. Typical flows

```bash
# Side-by-side (the point): agent in the terminal, human watching the browser.
#   terminal half:                       │   browser half:
design create --accent "#2b6cff" \       │   design preview          # live-reload localhost:4321
  --sans "Inter, system-ui"              │   # tweak tokens in-page, click "Export tokens"
design edit --from-export tokens.txt     │   # ...page reloads automatically on every write

# Greenfield: define a language, review it live, fold tweaks back, roll it out.
design create --bg "hsl(222 24% 8%)" --accent "#2b6cff"
design preview                     # review swatches/specimens; tweak; Export tokens
design edit --from-export ./exported-root.txt
design edit --set --accent "hsl(24 95% 53%)"   # or a precise single-token change
design apply src/                  # dry-run: preview the var(--token) diff
design apply src/ --write          # write on approval

# Brownfield: centralize what already exists, then enforce it.
design get src/                    # scan → cluster near-duplicate colors → detect --bg → report
design get src/ --write            # scaffold DESIGN.md + design.html from the real palette
design preview                     # sanity-check — page bg matches the scanned app's bg
design apply src/                  # see what would become var(--token); add --write to apply
```

---

## 5. Determinism & safety (repo convention)

- **Read-only by default.** `get` and `apply` print a report/diff and write only with `--write`;
  `preview` never writes (it's an HTTP server).
- **`apply` is a codemod, not a vibe.** It replaces a color literal with `var(--token)` only on an
  **exact match** (after HSL normalization); non-matching literals are reported as *unmapped* (feed
  them back to `get`/`edit`), never silently rewritten. Idempotent — a second run on the same scope
  finds nothing. Git-reversible.
- **`edit` validates before writing.** Colors are normalized to HSL; `--ink`-on-`--bg` and
  `--ink`-on-`--panel` contrast is checked against WCAG AA (≥4.5) and **warns** — the edit is held
  back unless you pass `--force` (or `--write`). A malformed `--from-export` errors out.
- **Deterministic.** Fixed token order, stable sort, no timestamps/randomness; zero deps (Node ≥18) —
  same discipline as every skill here.
- **Self-verifying.** `scripts/self-test.mjs` **passes 13/13**: create renders a `:root` with `--bg`
  and the accent applied; the page dogfoods `--bg` and ships the editor + export; tokens round-trip
  stably; `get` detects the background and clusters near-duplicate colors; `edit` normalizes a color
  set, flags low contrast, and parses `--from-export`; `apply` rewrites a dirty fixture, is
  idempotent on the second pass, and reports unmapped literals; `preview` serves the HTML with the
  live-reload client injected; `writeArtifacts` emits both files.

---

## 6. Implementation

All under `scripts/`, zero-dep, Node ≥18:

- `cli.mjs` — the one dispatcher (bin `design`); parses argv, prints reports/diffs, writes artifacts.
- `create.mjs` · `get.mjs` · `edit.mjs` · `apply.mjs` · `preview.mjs` — the five verbs (pure modules
  that return data; the CLI does the I/O).
- `lib/color.mjs` — hex/rgb/hsl → HSL normalization, distance, WCAG contrast.
- `lib/tokens.mjs` — the token model: fixed `TOKEN_ORDER`, `defaultTokens`, `parseRoot`,
  `serializeRoot`.
- `lib/render.mjs` — token map → `design.html` (from `lib/template.html`) + `DESIGN.md`.
- `lib/scan.mjs` — read a frontend, extract literals, cluster colors, detect the page background.
- `lib/io.mjs` — `loadTokens` / `writeArtifacts` (the two-file load/save).
- `lib/util.mjs` — fs helpers, deterministic `walk`, `FRONTEND_EXTS`.
- `lib/template.html` — the interactive page template (`:root` placeholder + editor + export).
- `self-test.mjs` — 13 offline checks (above).

---

## 7. Acceptance criteria — **met**

- [x] `create` scaffolds a valid `DESIGN.md` + `design.html` from flags (no existing frontend needed).
- [x] `get` extracts visual literals, clusters near-duplicates, detects `--bg`, and reports before writing.
- [x] `design.html` is self-contained, paints its page with `var(--bg)`, renders every token, and its editor exports a valid `:root` block.
- [x] `edit` normalizes colors to HSL and validates contrast (ink-on-bg / ink-on-panel ≥ WCAG AA), warning unless `--force`.
- [x] `apply` dry-runs a diff, replaces only exact-match literals, reports unmapped values, and is idempotent.
- [x] `preview` runs a zero-dep live-reload server (SSE) that auto-reloads the browser on file change.
- [x] `self-test.mjs` passes offline and deterministically (**13/13**).

---

## 8. Build status — **done**

- ✅ Spec on the 5-verb (CRUD + apply + preview) model with the 2-artifact design.
- ✅ Functionality docs: `create` · `get` · `edit` · `apply` · `preview`.
- ✅ Scripts: one dispatcher (`cli.mjs`) + five verbs + `lib/*` + `self-test.mjs` (13/13).
- ✅ Example output: `example-output/DESIGN.md` + interactive `example-output/design.html`.

## References
- [`../07-design-language.md`](../07-design-language.md) — the task card.
- [`example-output/`](./example-output/) — a worked `DESIGN.md` + interactive `design.html`.
- [`../skill-deterministic-checker/`](../skill-deterministic-checker/) — scores "all values are tokens"-style rules; `apply` is the inverse codemod.
