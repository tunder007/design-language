# @softeneers/design-language

> A design language as machine-readable tokens (tokens.json) + a generated CSS sheet, a CSS generator and a token linter that flags hardcoded hex/px values.

Zero runtime dependencies. Node ≥ 18. Part of the [Softeneers tools](https://github.com/tunder007/softeneers-tools) suite.

## Install

```bash
# one-off, no install
npx @softeneers/design-language

# or install globally
npm i -g @softeneers/design-language

# or as a dev dependency
npm i -D @softeneers/design-language
```

## Usage

```bash
design-gen-css         # regenerate tokens.css
design-lint [path]     # flag hardcoded values
```

Binaries provided: `design-gen-css`, `design-lint`.

## What it does

See [`functionalities/`](./functionalities/) for the full per-feature documentation, and
[`example-output/`](./example-output/) for sample reports.

## Part of a suite

Install every Softeneers tool at once with the wrapper:

```bash
npm i -g softeneers-tools
softeneers-tools run design-language -- [args]
```

## License

MIT © 2026 Softeneers
