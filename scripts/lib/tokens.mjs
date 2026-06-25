// tokens.mjs — the token model. The CANONICAL source of truth at runtime is the `:root { … }`
// block inside design.html; these helpers parse it out, serialize it back, and provide the
// default set used by `create`. Colors are HSL. Order is fixed so output is deterministic.

// Ordered token names grouped by category. The serializer emits in exactly this order.
export const TOKEN_ORDER = [
  // foundation
  '--bg', '--bg-2', '--panel', '--panel-2', '--inset', '--line', '--ink', '--ink-2', '--muted', '--faint',
  // accent
  '--accent', '--accent-2', '--accent-ink',
  // semantic
  '--success', '--warn', '--danger', '--info',
  '--success-bg', '--warn-bg', '--danger-bg', '--info-bg',
  // type
  '--font-sans', '--font-mono',
  '--text-xs', '--text-sm', '--text-base', '--text-lg', '--text-xl', '--text-2xl', '--text-3xl', '--lh',
  // space
  '--space-px', '--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-7', '--space-8',
  // radius
  '--radius-sm', '--radius-md', '--radius-lg', '--radius-pill',
  // elevation
  '--shadow-sm', '--shadow',
];

// The color tokens shown as swatches / editable as colors (subset of TOKEN_ORDER).
export const COLOR_TOKENS = ['--bg', '--bg-2', '--panel', '--panel-2', '--inset', '--line',
  '--ink', '--ink-2', '--muted', '--faint', '--accent', '--accent-2', '--accent-ink',
  '--success', '--warn', '--danger', '--info'];

// A calm, dark, single-accent default. `create` starts here and overlays the brief.
export function defaultTokens(bg = 'hsl(222 24% 8%)') {
  return {
    '--bg': bg, '--bg-2': 'hsl(222 22% 11%)', '--panel': 'hsl(222 20% 13%)', '--panel-2': 'hsl(222 18% 16%)',
    '--inset': 'hsl(222 26% 7%)', '--line': 'hsl(222 14% 22%)',
    '--ink': 'hsl(220 22% 92%)', '--ink-2': 'hsl(220 16% 82%)', '--muted': 'hsl(220 12% 64%)', '--faint': 'hsl(220 10% 46%)',
    '--accent': 'hsl(213 94% 62%)', '--accent-2': 'hsl(213 94% 70%)', '--accent-ink': 'hsl(222 40% 9%)',
    '--success': 'hsl(152 58% 50%)', '--warn': 'hsl(38 92% 58%)', '--danger': 'hsl(0 78% 62%)', '--info': 'hsl(199 89% 60%)',
    '--success-bg': 'color-mix(in oklab, var(--success) 16%, var(--bg))',
    '--warn-bg': 'color-mix(in oklab, var(--warn) 16%, var(--bg))',
    '--danger-bg': 'color-mix(in oklab, var(--danger) 16%, var(--bg))',
    '--info-bg': 'color-mix(in oklab, var(--info) 16%, var(--bg))',
    '--font-sans': "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    '--font-mono': "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    '--text-xs': '.75rem', '--text-sm': '.875rem', '--text-base': '1rem', '--text-lg': '1.25rem',
    '--text-xl': '1.5rem', '--text-2xl': '2rem', '--text-3xl': '2.75rem', '--lh': '1.55',
    '--space-px': '1px', '--space-1': '.25rem', '--space-2': '.5rem', '--space-3': '.75rem', '--space-4': '1rem',
    '--space-5': '1.5rem', '--space-6': '2rem', '--space-7': '3rem', '--space-8': '4rem',
    '--radius-sm': '6px', '--radius-md': '10px', '--radius-lg': '14px', '--radius-pill': '999px',
    '--shadow-sm': '0 1px 2px hsl(222 40% 4% / .4)', '--shadow': '0 8px 30px hsl(222 40% 4% / .5)',
  };
}

// Parse the FIRST `:root { … }` block of a design.html (or .css) into a {name: value} map.
export function parseRoot(text) {
  const m = /:root\s*\{([\s\S]*?)\}/.exec(text);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const d = /\s*(--[\w-]+)\s*:\s*([^;]+);/.exec(line);
    if (d) out[d[1]] = d[2].trim();
  }
  return out;
}

// Serialize a token map into a deterministic `:root { … }` block (known order first, extras after).
export function serializeRoot(tokens, indent = '  ') {
  const seen = new Set();
  const lines = [];
  for (const name of TOKEN_ORDER) {
    if (name in tokens) { lines.push(`${indent}${name}: ${tokens[name]};`); seen.add(name); }
  }
  for (const name of Object.keys(tokens).sort()) {
    if (!seen.has(name)) lines.push(`${indent}${name}: ${tokens[name]};`);
  }
  return `:root {\n${lines.join('\n')}\n}`;
}

// Merge a delta over a base, dropping keys whose value is null (token removal).
export function applyDelta(base, delta) {
  const out = { ...base };
  for (const [k, v] of Object.entries(delta)) { if (v == null) delete out[k]; else out[k] = v; }
  return out;
}
