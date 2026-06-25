// scan.mjs — read a frontend, extract visual literals, cluster near-duplicate colors, and detect
// the page background. Deterministic and read-only. This is the inverse of a token linter.
import { read, walk, FRONTEND_EXTS } from './util.mjs';
import { parseColorToHsl, hslDistance } from './color.mjs';

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g;
const FONT_RE = /font-family\s*:\s*([^;}{]+)/gi;
// bg literals: any background declaration (fallback signal).
const BG_RE = /(?:^|[^-])background(?:-color)?\s*:\s*([^;}{]+)/gi;
// page background = background on body/html/:root selectors — authoritative for --bg.
const PAGE_BG_RE = /(?:html|body|:root)\b[^{}]*\{[^}]*?background(?:-color)?\s*:\s*([^;}]+)/gi;

// Tally raw color literals across the frontend into {hsl: count}.
export function scan(dir) {
  const files = walk(dir, FRONTEND_EXTS);
  const colors = new Map();   // hsl -> count
  const fonts = new Map();    // stack -> count
  const bg = new Map();       // hsl -> count (any background context)
  const pageBg = new Map();   // hsl -> count (body/html/:root backgrounds)

  for (const f of files) {
    let text;
    try { text = read(f); } catch { continue; }
    for (const m of text.matchAll(PAGE_BG_RE)) {
      const hsl = parseColorToHsl(m[1].trim().split(/\s+/)[0]);
      if (hsl) pageBg.set(hsl, (pageBg.get(hsl) || 0) + 1);
    }
    for (const m of text.matchAll(COLOR_RE)) {
      const hsl = parseColorToHsl(m[0]);
      if (hsl) colors.set(hsl, (colors.get(hsl) || 0) + 1);
    }
    for (const m of text.matchAll(FONT_RE)) {
      const stack = m[1].trim().replace(/\s+/g, ' ');
      if (stack && !stack.includes('var(')) fonts.set(stack, (fonts.get(stack) || 0) + 1);
    }
    for (const m of text.matchAll(BG_RE)) {
      const hsl = parseColorToHsl(m[1].trim().split(/\s+/)[0]);
      if (hsl) bg.set(hsl, (bg.get(hsl) || 0) + 1);
    }
  }
  return { files: files.length, colors, fonts, bg, pageBg };
}

// Greedy clustering: most-used color is the canonical token; near ones merge into it.
export function clusterColors(colors, threshold = 8) {
  const sorted = [...colors.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const clusters = [];
  for (const [hsl, count] of sorted) {
    const hit = clusters.find((c) => hslDistance(c.canonical, hsl) <= threshold);
    if (hit) { hit.total += count; hit.members.push({ hsl, count }); }
    else clusters.push({ canonical: hsl, total: count, members: [{ hsl, count }] });
  }
  return clusters.sort((a, b) => b.total - a.total || (a.canonical < b.canonical ? -1 : 1));
}

// Pick the frontend's background = the most common color seen in a background context (fallback:
// the darkest frequent color, since most app chrome backgrounds are the page base).
export function detectBackground(scanResult) {
  const { pageBg, bg } = scanResult;
  const top = (map) => (map && map.size)
    ? [...map.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0]
    : null;
  return top(pageBg) || top(bg);   // body/html/:root wins; else most-common background literal
}
