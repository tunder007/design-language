# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-06-26

### Changed (breaking)

- Reworked into a five-verb skill driven by one `design` CLI: `create`, `get`, `edit`, `apply`, `preview`.
- The source of truth is now a single interactive `design.html` whose `:root` holds the HSL tokens (plus a `DESIGN.md` rules file), replacing the previous `tokens.json` + generated CSS split.
- Removed `design-gen-css` / `design-lint` bins (and `tokens.json`/`design/`); added the `design` bin.

### Added

- `create` — author a fresh language from brand-ref flags (`--bg/--accent/--sans/--mono`).
- `get` — scan a frontend, cluster near-duplicate colors, detect the page background, and centralize into tokens.
- `edit` — set/remove tokens or fold in an in-browser export; normalizes HSL and checks WCAG contrast.
- `apply` — exact-match codemod that rewrites color literals to `var(--token)` (dry-run by default, idempotent).
- `preview` — zero-dep live-reload server so the generated `design.html` updates in the browser as you edit.
- The generated `design.html` paints its own page with `var(--bg)`, so the preview matches the app it empowers.
- Hermetic self-test (`npm test`) — 13 checks.

[2.0.0]: https://github.com/tunder007/design-language/releases/tag/v2.0.0

## [1.0.0] - 2026-06-22

### Added

- Initial public release.
- A design language as machine-readable tokens (tokens.json), a generated CSS sheet, a CSS generator and a token linter that flags hardcoded hex/px values.
- Zero runtime dependencies; requires Node >= 18.
- Hermetic self-test (`npm test`) and CI across Node 18, 20 and 22.

[1.0.0]: https://github.com/tunder007/design-language/releases/tag/v1.0.0
