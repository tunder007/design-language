// Pure core for the design-language tooling. No I/O, no randomness, no time → fully deterministic.
// Two responsibilities:
//   1. generateCss(tokens)      → tokens.json becomes a CSS custom-property sheet (tokens.css).
//   2. lintFile(text, tokens)   → flag hardcoded hex colors / px values NOT present in tokens.json.
// Both are consumed by the CLIs (gen-css.mjs, lint-tokens.mjs) and the self-test, so behavior is
// identical wherever they run.

// ----- shared: collect every literal value tokens.json declares -----------------------------

// Walk the token tree and return the set of every string leaf value. Used by the linter to decide
// whether a literal found in source is "blessed" (declared in tokens.json) or an ad-hoc value.
export function collectTokenValues(tokens) {
  const values = new Set();
  (function recur(node) {
    if (node == null) return;
    if (typeof node === "string") { values.add(node.trim()); return; }
    if (typeof node === "object") { for (const k of Object.keys(node)) recur(node[k]); }
  })(tokens);
  return values;
}

// Extract every hex color and px literal that the tokens declare (normalized lowercase), so the
// linter can compare apples to apples regardless of how they appear inside compound values
// (e.g. "linear-gradient(90deg,#1f6feb,#58a6ff)" contributes #1f6feb and #58a6ff).
export function extractTokenLiterals(tokens) {
  const hexes = new Set();
  const pxs = new Set();
  for (const v of collectTokenValues(tokens)) {
    for (const m of v.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) hexes.add(m[0].toLowerCase());
    for (const m of v.matchAll(/\b\d+(?:\.\d+)?px\b/g)) pxs.add(m[0].toLowerCase());
  }
  return { hexes, pxs };
}

// ----- 1. CSS generation -------------------------------------------------------------------------

// Flatten a nested token object into ordered [varName, value] pairs.
// `color.bg` → `--color-bg`; `severity.p0.rail` → `--severity-p0-rail`. camelCase → kebab.
function flatten(node, prefix, out) {
  for (const key of Object.keys(node)) {
    if (key.startsWith("$") || prefix === "" && (key === "meta")) continue; // skip $schema / meta block
    const seg = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    const name = prefix ? `${prefix}-${seg}` : seg;
    const val = node[key];
    if (val != null && typeof val === "object") flatten(val, name, out);
    else out.push([`--${name}`, String(val)]);
  }
}

// Deterministic: same tokens object → byte-identical CSS string (stable key order from JSON).
export function generateCss(tokens) {
  const pairs = [];
  flatten(tokens, "", pairs);
  const body = pairs.map(([k, v]) => `  ${k}: ${v};`).join("\n");
  return `/* GENERATED FILE — do not edit by hand.
   Source: design/tokens.json · Regenerate: node scripts/gen-css.mjs
   The LUMEN design language as CSS custom properties. Any HTML can use var(--…). */
:root {
${body}
}
`;
}

// ----- 2. Token linter ---------------------------------------------------------------------------

// Lines/contexts where a literal is allowed even if not a token:
//   - the :root token-definition block itself (that's where values are legitimately declared),
//   - generated CSS comment headers.
// We approximate "inside :root" by tracking brace depth after a `:root` selector.

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
// px values: catch `16px`, `1.5px`. Ignore 0px-less zeros (just "0") and values inside url()/comments handled by caller.
const PX_RE = /\b\d+(?:\.\d+)?px\b/g;

// lintFile(text, tokens) → { violations: [{ line, col, type, value, snippet }] }
// Flags hex colors and px values that are NOT declared anywhere in tokens.json.
// Read-only by nature: it never mutates input or writes files.
export function lintFile(text, tokens) {
  const { hexes, pxs } = extractTokenLiterals(tokens);
  const violations = [];
  const lines = text.split(/\r?\n/);

  // Track whether we are inside the :root{...} token-definition block (literals expected there).
  let inRoot = false;
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineNo = i + 1;

    // Update :root tracking BEFORE deciding to skip, using this line's braces.
    const rootStart = /:root\b[^{]*\{/.test(raw);
    if (rootStart) { inRoot = true; depth += (raw.match(/\{/g) || []).length; depth -= (raw.match(/\}/g) || []).length; }
    else if (inRoot) {
      depth += (raw.match(/\{/g) || []).length;
      depth -= (raw.match(/\}/g) || []).length;
      if (depth <= 0) inRoot = false;
    }

    // @media query conditions cannot use var(--…) (a CSS limitation), so px there is unavoidable
    // and not a token violation. Comment lines are also exempt.
    const skipLine = inRoot || /^\s*\/\//.test(raw) || /^\s*\*/.test(raw) || /@media\b/.test(raw);

    // Strip line/inline comments cheaply so we don't flag values inside notes.
    const scan = skipLine ? "" : raw;

    for (const [re, type, blessed] of [[HEX_RE, "hex", hexes], [PX_RE, "px", pxs]]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(scan))) {
        const value = m[0].toLowerCase();
        if (blessed.has(value)) continue;       // declared in tokens.json → fine
        if (type === "px" && /^0(?:\.0+)?px$/.test(value)) continue; // 0px is harmless
        violations.push({
          line: lineNo,
          col: m.index + 1,
          type,
          value: m[0],
          snippet: raw.trim().slice(0, 120)
        });
      }
    }
  }

  // Stable order: by line, then column.
  violations.sort((a, b) => a.line - b.line || a.col - b.col);
  return { violations };
}

// Render a human report from a lint result. `file` is the path label shown in `file:line:col`.
export function formatReport(file, result) {
  if (result.violations.length === 0) {
    return `${file}: clean — 0 hardcoded values outside the token system.\n`;
  }
  const rows = result.violations.map(
    (v) => `  ${file}:${v.line}:${v.col}  ${v.type.toUpperCase()} ${v.value}  →  ${v.snippet}`
  );
  return `${file}: ${result.violations.length} violation(s)\n${rows.join("\n")}\n`;
}
