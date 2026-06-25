# Functionality 04 — `apply` (propagate tokens into the frontend)

**Verb:** apply · **Writes:** frontend files, **only with `--write`** · **Idempotent:** a second run on the same scope is a no-op · **Order:** rollout (the risky one — treated as a codemod)

## Purpose
Make the design language real in the codebase: replace hardcoded color literals with `var(--token)`
references across a frontend directory — diff-first and reversible.

## Inputs
```
design apply <frontend-dir> [--write] [--out <dir>]
```
- `<frontend-dir>` — directory to rewrite (required). Recursively walked; `node_modules`, `.git`,
  `dist`, `build`, `.next`, `coverage` are skipped.
- `--write` — actually write the changes. Without it, the command is a **dry-run** (diff + report
  only).
- `--out <dir>` — directory holding the token source `design.html` to read (default `.`). Requires an
  existing `design.html` there (run `create`/`get` first).

## Expected project structure
```
<out>/design.html     # token source — its :root is loaded
<frontend-dir>/**     # scanned; rewritten only with --write
                      # (.css/.scss/.sass/.less/.html/.tsx/.jsx/.ts/.js/.vue/.svelte/.astro)
```

## How it works (deterministic)
1. Load the tokens from `<out>/design.html` and build a `normalized-HSL → token-name` map from the
   color tokens (first token wins for a given value).
2. Walk the frontend, and in each file replace every color literal (hex / rgb(a) / hsl(a)) that
   **matches a token's value exactly** (after HSL normalization) with `var(--token)`. Literals with
   no exact match are tallied as **unmapped**, never rewritten.
3. Print a report: total exact-match replacements, files affected, a short per-file diff preview, and
   the first unmapped literals (feed these back into `get`/`edit`).
4. With `--write`, write the rewritten files; otherwise note it was a dry-run.

## Output
A dry-run diff + report (replacement count, files, unmapped literals); with `--write`, the rewritten
files.

## Safety
- **Dry-run by default; exact-match-only.** No approximate rewrites — near-matches are reported as
  unmapped, never guessed.
- **Idempotent** — already-tokenized files have no remaining literal to match, so re-running changes
  nothing.
- **Reversible** — one logical change set; revert with git.

## Failure modes it prevents
- **Wrong rewrites** — only exact value matches become `var(--token)`; everything else is surfaced.
- **Half-tokenized code** — the report lists every unmapped literal so nothing is silently skipped.
- **Unreviewable mega-diffs** — dry-run-first keeps the change set legible before it lands.
