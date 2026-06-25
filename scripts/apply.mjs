// apply.mjs — propagate tokens into the frontend: replace exact-match color literals with var(--token).
// Dry-run by default (cli writes only on --write). Exact-match only; idempotent.
import { read, write, walk, FRONTEND_EXTS } from './lib/util.mjs';
import { parseColorToHsl } from './lib/color.mjs';
import { COLOR_TOKENS } from './lib/tokens.mjs';

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g;

// Build normalizedHSL -> varname from the color tokens (first token wins for a given value).
function valueMap(tokens) {
  const map = new Map();
  for (const name of COLOR_TOKENS) {
    const v = tokens[name];
    if (!v) continue;
    const h = parseColorToHsl(v);
    if (h && !map.has(h)) map.set(h, name);
  }
  return map;
}

export function planApply(dir, tokens) {
  const map = valueMap(tokens);
  const files = walk(dir, FRONTEND_EXTS);
  const edits = [];
  const unmapped = new Map();
  for (const f of files) {
    let text; try { text = read(f); } catch { continue; }
    let count = 0;
    const after = text.replace(COLOR_RE, (lit) => {
      const h = parseColorToHsl(lit);
      if (h && map.has(h)) { count++; return `var(${map.get(h)})`; }
      if (h) unmapped.set(h, (unmapped.get(h) || 0) + 1);
      return lit;
    });
    if (count > 0) edits.push({ file: f, before: text, after, count });
  }
  return { edits, unmapped, mappedTokens: map.size };
}

export function applyPlan(plan) {
  for (const e of plan.edits) write(e.file, e.after);
  return plan.edits.reduce((n, e) => n + e.count, 0);
}
