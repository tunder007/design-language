#!/usr/bin/env node
// Self-test for the design language. OFFLINE & deterministic. Uses a unique temp fixture dir,
// asserts the guarantees, cleans up, and exits non-zero on any failure.
//   - tokens.json parses and contains the core color keys + severity P0–P3
//   - CSS generation is deterministic (same json → byte-identical css, twice)
//   - lintFile flags a hardcoded hex NOT in tokens, and passes a tokens-only file
import os from "node:os";
import { fs, path, here, loadTokens } from "./lib/util.mjs";
import { generateCss, lintFile, extractTokenLiterals } from "./lib/run.mjs";

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? "  ✓" : "  ✗"} ${msg}`); if (!cond) failures++; };

const fixture = path.join(os.tmpdir(), "design-language-selftest");
fs.rmSync(fixture, { recursive: true, force: true });
fs.mkdirSync(fixture, { recursive: true });

console.log("\nDesign language — self-test");
console.log(`fixture: ${fixture}\n`);

// --- tokens.json contract ---
console.log("Tokens");
const tokens = loadTokens();
ok(typeof tokens === "object" && tokens != null, "tokens.json parses to an object");
const coreColors = ["bg", "panel", "line", "ink", "muted", "faint", "blue", "violet", "green", "amber", "red"];
ok(coreColors.every((k) => typeof tokens.color?.[k] === "string"), `core color keys present (${coreColors.join(", ")})`);
ok(["p0", "p1", "p2", "p3"].every((k) => tokens.severity?.[k]?.label), "severity P0–P3 defined");
ok(typeof tokens.type?.fontSans === "string" && typeof tokens.space?.["8"] === "string", "type + space scales present");

// --- deterministic CSS generation ---
console.log("CSS generation");
const css1 = generateCss(tokens);
const css2 = generateCss(loadTokens());
ok(css1 === css2, "same tokens.json → byte-identical CSS (deterministic)");
ok(css1.includes("--color-bg: #0b0f14;"), "generated CSS exposes --color-bg");
ok(css1.includes("--severity-p0-rail: #f85149;"), "generated CSS exposes --severity-p0-rail");
const cssFixture = path.join(fixture, "tokens.css");
fs.writeFileSync(cssFixture, css1);
ok(fs.readFileSync(cssFixture, "utf8") === css1, "CSS round-trips through disk unchanged");

// --- linter ---
console.log("Linter");
const lits = extractTokenLiterals(tokens);
ok(lits.hexes.has("#58a6ff") && lits.pxs.has("16px"), "token literals harvested (hex + px)");

// a file with a stray hardcoded color + px not in tokens → must be flagged
const dirty = `.x{color:#ff0000;padding:99px;margin:16px;border:1px solid var(--color-line)}`;
const dirtyRes = lintFile(dirty, tokens);
ok(dirtyRes.violations.some((v) => v.type === "hex" && v.value === "#ff0000"), "flags hardcoded #ff0000");
ok(dirtyRes.violations.some((v) => v.type === "px" && v.value === "99px"), "flags non-token 99px");
ok(!dirtyRes.violations.some((v) => v.value === "16px"), "does NOT flag 16px (it is a token)");
ok(!dirtyRes.violations.some((v) => v.value === "1px"), "does NOT flag 1px border (it is a token)");

// a tokens-only file → clean. The :root definition block is exempt (that is where values live).
const clean = `:root{--color-bg:#0b0f14;--space-8:16px}\n.y{background:var(--color-bg);padding:var(--space-8)}`;
const cleanRes = lintFile(clean, tokens);
ok(cleanRes.violations.length === 0, `tokens-only file is clean (found: ${cleanRes.violations.length})`);

// the real generated tokens.css must itself lint clean (its hexes are all declared inside :root)
console.log("Dogfood");
const realCss = fs.readFileSync(path.join(here, "..", "..", "design", "tokens.css"), "utf8");
ok(lintFile(realCss, tokens).violations.length === 0, "design/tokens.css lints clean against itself");

// --- cleanup ---
fs.rmSync(fixture, { recursive: true, force: true });

console.log(failures ? `\nSELF-TEST FAILED (${failures} assertion${failures > 1 ? "s" : ""})\n` : `\nSELF-TEST PASSED\n`);
process.exit(failures ? 1 : 0);
