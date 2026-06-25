// edit.mjs — modify the philosophy + tokens (CRUD U; removal = D). Validates before returning.
import { parseRoot } from './lib/tokens.mjs';
import { parseColorToHsl, contrastRatio } from './lib/color.mjs';

const isColorToken = (name) =>
  /^--(bg|bg-2|panel|panel-2|inset|line|ink|ink-2|muted|faint|accent|accent-2|accent-ink|success|warn|danger|info)$/.test(name);

// opts: { set: {name: value}, remove: [name], fromExport: "<:root text>" }
export function editTokens(current, opts = {}) {
  let tokens = { ...current };
  const warnings = [], errors = [], changelog = [];

  if (opts.fromExport) {
    const parsed = parseRoot(opts.fromExport);
    if (Object.keys(parsed).length) { tokens = parsed; changelog.push('replaced tokens from exported :root'); }
    else errors.push('--from-export: no :root block found');
  }
  if (opts.set) {
    for (const [rawKey, rawVal] of Object.entries(opts.set)) {
      const name = rawKey.startsWith('--') ? rawKey : '--' + rawKey;
      const val = isColorToken(name) ? (parseColorToHsl(rawVal) || rawVal) : rawVal;
      tokens[name] = val;
      changelog.push(`set ${name} = ${val}`);
    }
  }
  if (opts.remove) {
    for (const rawKey of opts.remove) {
      const name = rawKey.startsWith('--') ? rawKey : '--' + rawKey;
      if (name in tokens) { delete tokens[name]; changelog.push(`removed ${name}`); }
    }
  }

  // validation
  if (tokens['--ink'] && tokens['--bg']) {
    const c = contrastRatio(tokens['--ink'], tokens['--bg']);
    if (c < 4.5) warnings.push(`ink-on-bg contrast ${c}:1 < 4.5 (WCAG AA body) — pass --force to keep`);
  }
  if (tokens['--ink'] && tokens['--panel']) {
    const c = contrastRatio(tokens['--ink'], tokens['--panel']);
    if (c < 4.5) warnings.push(`ink-on-panel contrast ${c}:1 < 4.5 (WCAG AA body)`);
  }

  return { tokens, warnings, errors, changelog };
}
