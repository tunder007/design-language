#!/usr/bin/env node
// self-test.mjs — OFFLINE, DETERMINISTIC. Builds fixtures in a temp dir and cleans up.
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTokens } from './create.mjs';
import { extract } from './get.mjs';
import { editTokens } from './edit.mjs';
import { planApply, applyPlan } from './apply.mjs';
import { startPreview } from './preview.mjs';
import { renderHtml } from './lib/render.mjs';
import { parseRoot, serializeRoot } from './lib/tokens.mjs';
import { writeArtifacts, loadTokens } from './lib/io.mjs';

const results = [];
const check = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail });
const dir = mkdtempSync(join(tmpdir(), 'design-selftest-'));

try {
  // (a) create → render: page background matches --bg (bg-matching), editor + export present.
  const t = createTokens({ accent: '#ff6a00' });
  const html = renderHtml(t);
  const back = parseRoot(html);
  check('(a) create+render: :root carries --bg and accent applied',
    back['--bg'] === t['--bg'] && back['--accent'] === 'hsl(25 100% 50%)',
    JSON.stringify({ bg: back['--bg'], accent: back['--accent'] }));
  check('(b) render html dogfoods --bg + ships editor & export',
    html.includes('background: var(--bg)') && html.includes('Export tokens') && html.includes("id=\"colorCtrls\""));

  // (c) token round-trip is stable: parse(serialize(parse(html))) is identical.
  const once = parseRoot(html);
  const twice = parseRoot(serializeRoot(once) + '');
  check('(c) tokens round-trip stable', JSON.stringify(once) === JSON.stringify(twice));

  // (d) get: extract from a fixture frontend → detect bg, cluster near-dup blues, pick accent.
  const fe = join(dir, 'fe'); mkdirSync(fe, { recursive: true });
  writeFileSync(join(fe, 'app.css'),
    'body{background:#0b0e14;color:#e6e9ef;font-family:Inter, sans-serif}\n' +
    '.btn{background:#4395f9}\n.link{color:#4290f8}\n.btn2{background:#4395f9}\n', 'utf8');
  const got = extract(fe);
  const bgIsDark = /hsl\(\s*\d+\s+\d+%\s+([0-9]|1[0-5])%/.test(got.tokens['--bg']);
  check('(d) get detects background from frontend', !!got.background && bgIsDark, got.tokens['--bg']);
  check('(d2) get clusters near-duplicate blues + sets accent', !!got.accent && /hsl\(21[0-5]/.test(got.accent), got.accent || '(none)');

  // (e) edit: set a token + low-contrast warning; from-export round-trips.
  const ed = editTokens(t, { set: { '--accent': '#22c55e' } });
  check('(e) edit applies a color set (normalized to hsl)', /^hsl\(/.test(ed.tokens['--accent']));
  const lowc = editTokens({ ...t, '--ink': 'hsl(220 10% 30%)', '--bg': 'hsl(220 10% 22%)' }, {});
  check('(e2) edit flags low ink-on-bg contrast', lowc.warnings.some((w) => /contrast/.test(w)), lowc.warnings.join('|'));
  const fromExp = editTokens({}, { fromExport: serializeRoot(t) });
  check('(e3) edit --from-export parses a :root block', fromExp.tokens['--bg'] === t['--bg']);

  // (f) apply: a dirty file with a literal equal to a token value → replaced with var(); idempotent.
  const proj = join(dir, 'proj'); mkdirSync(proj, { recursive: true });
  writeArtifacts(proj, t);                          // design.html with t's :root
  const tokens = loadTokens(proj);
  const accentHex = '#ff6a00';                       // equals --accent (hsl(24 100% 50%))
  const target = join(proj, 'ui.css');
  writeFileSync(target, `.cta{color:${accentHex};background:#123456}`, 'utf8');
  const plan = planApply(proj, tokens);
  const cta = plan.edits.find((e) => e.file === target);
  check('(f) apply replaces exact-match literal with var(--accent)',
    !!cta && cta.after.includes('var(--accent)') && !cta.after.includes(accentHex), cta ? cta.after : '(no edit)');
  applyPlan(plan);
  const plan2 = planApply(proj, tokens);
  check('(f2) apply is idempotent (second run finds nothing in ui.css)',
    !plan2.edits.find((e) => e.file === target));
  check('(f3) apply reports unmapped literals', plan2.unmapped.size > 0 || plan.unmapped.size > 0);

  // (g) preview server serves the file with a live-reload client injected.
  let previewOk = false, previewDetail = '';
  try {
    const { server, url } = await startPreview(join(proj, 'design.html'), { port: 0 });
    const res = await fetch(url);
    const body = await res.text();
    previewOk = body.includes('EventSource(\'/__reload\')') && body.includes(':root');
    server.close();
  } catch (e) { previewDetail = 'threw: ' + e.message; }
  check('(g) preview serves html + injects live-reload', previewOk, previewDetail);

  // (h) create writes both artifacts; DESIGN.md has the token mirror.
  const cdir = join(dir, 'created'); mkdirSync(cdir, { recursive: true });
  writeArtifacts(cdir, t);
  const md = readFileSync(join(cdir, 'DESIGN.md'), 'utf8');
  check('(h) writeArtifacts emits design.html + DESIGN.md (with mirror)',
    existsSync(join(cdir, 'design.html')) && md.includes('Token mirror') && md.includes('`--accent`'));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.pass);
for (const r of results) process.stdout.write(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` -- ${r.detail}` : ''}\n`);
process.stdout.write(`\n${failed.length === 0 ? 'PASS' : 'FAIL'}: ${results.length - failed.length}/${results.length} checks passed\n`);
process.exit(failed.length === 0 ? 0 : 1);
