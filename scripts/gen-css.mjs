#!/usr/bin/env node
// gen-css — regenerate design/tokens.css from design/tokens.json (the machine source of truth).
// Deterministic: same tokens.json → byte-identical tokens.css. Default writes the file; pass
// --check to verify the committed tokens.css is up to date (exit 1 if it drifted) without writing.
//
// Usage:
//   node scripts/gen-css.mjs            # write design/tokens.css
//   node scripts/gen-css.mjs --check    # CI gate: fail if tokens.css is stale
import { fs, path, here, loadTokens, readText } from "./lib/util.mjs";
import { generateCss } from "./lib/run.mjs";

const checkOnly = process.argv.includes("--check");
const cssPath = path.join(here, "..", "..", "design", "tokens.css");

const css = generateCss(loadTokens());

if (checkOnly) {
  const current = readText(cssPath);
  if (current === css) {
    console.log("tokens.css is up to date.");
    process.exit(0);
  }
  console.error("tokens.css is STALE — run `node scripts/gen-css.mjs` to regenerate.");
  process.exit(1);
}

fs.writeFileSync(cssPath, css);
console.log(`Wrote ${path.relative(path.join(here, "..", ".."), cssPath)} (${css.split("\n").length - 1} lines).`);
