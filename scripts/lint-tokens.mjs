#!/usr/bin/env node
// lint-tokens — scan a .css/.html/.tsx file for HARDCODED hex colors and px values that are NOT
// declared in design/tokens.json, and report them as file:line:col violations. Read-only by
// nature: it never writes. Exit 0 when clean, 1 when violations are found (CI gate friendly).
//
// Usage:
//   node scripts/lint-tokens.mjs <file> [<file> ...]
//   node scripts/lint-tokens.mjs --tokens <path/to/tokens.json> <file>
import { fs, path, readText, loadTokens, readJSON } from "./lib/util.mjs";
import { lintFile, formatReport } from "./lib/run.mjs";

const argv = process.argv.slice(2);
let tokensPath = null;
const files = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--tokens") { tokensPath = argv[++i]; continue; }
  files.push(argv[i]);
}

if (files.length === 0) {
  console.error("usage: node scripts/lint-tokens.mjs [--tokens tokens.json] <file> [<file> ...]");
  process.exit(2);
}

const tokens = tokensPath ? readJSON(path.resolve(tokensPath)) : loadTokens();

let total = 0;
const blocks = [];
for (const f of files) {
  const text = readText(path.resolve(f));
  if (text == null) { console.error(`  cannot read: ${f}`); process.exitCode = 2; continue; }
  const result = lintFile(text, tokens);
  total += result.violations.length;
  blocks.push(formatReport(f, result));
}

process.stdout.write("\nToken lint — hardcoded values not in design/tokens.json\n\n");
process.stdout.write(blocks.join("\n"));
process.stdout.write(total === 0 ? "\nLINT PASSED — every value is a token.\n" : `\nLINT FAILED — ${total} hardcoded value(s).\n`);
process.exit(total === 0 ? 0 : 1);
