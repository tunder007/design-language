// get.mjs — read an existing frontend, centralize its styles into tokens (brownfield, CRUD R).
import { defaultTokens } from './lib/tokens.mjs';
import { scan, clusterColors, detectBackground } from './lib/scan.mjs';

const sat = (hsl) => { const m = /hsl\(\s*[\d.]+\s+([\d.]+)%\s+([\d.]+)%/.exec(hsl); return m ? { s: +m[1], l: +m[2] } : null; };

// Extract a consolidated token set from a frontend dir. Returns { tokens, report, background, accent }.
export function extract(dir) {
  const s = scan(dir);
  const clusters = clusterColors(s.colors);
  const background = detectBackground(s);
  const tokens = defaultTokens(background || undefined);

  // accent = most-used reasonably-saturated mid-tone color.
  const accent = clusters.map((c) => c.canonical).find((h) => {
    const m = sat(h); return m && m.s >= 35 && m.l >= 25 && m.l <= 80;
  });
  if (accent) tokens['--accent'] = accent;

  const fonts = [...s.fonts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  if (fonts[0]) tokens['--font-sans'] = fonts[0][0];

  return { tokens, background, accent, report: buildReport(s, clusters, background, accent, fonts) };
}

function buildReport(s, clusters, bg, accent, fonts) {
  const L = [];
  L.push(`Scanned ${s.files} file(s) · ${s.colors.size} distinct colors → ${clusters.length} clusters.`);
  L.push(`Detected background: ${bg || '(none — using default --bg)'}`);
  L.push(`Detected accent: ${accent || '(none — using default --accent)'}`);
  L.push('');
  L.push('Top color clusters (canonical ← near-duplicates · usage):');
  for (const c of clusters.slice(0, 12)) {
    const dupes = c.members.filter((m) => m.hsl !== c.canonical).map((m) => m.hsl);
    L.push(`  ${c.canonical}  ×${c.total}${dupes.length ? `   ← ${dupes.join(', ')}` : ''}`);
  }
  if (fonts.length) {
    L.push('');
    L.push('Font stacks:');
    for (const [stack, n] of fonts.slice(0, 5)) L.push(`  ×${n}  ${stack}`);
  }
  return L.join('\n');
}
