#!/usr/bin/env node
// cli.mjs — one front door for the design-language skill.
//
//   design create [--bg <c>] [--accent <c>] [--sans <stack>] [--mono <stack>] [--out <dir>]
//   design get <frontend-dir> [--write] [--out <dir>]
//   design edit [--set --<tok> <val>]... [--remove --<tok>]... [--from-export <file>] [--out <dir>]
//   design apply <frontend-dir> [--write]
//   design preview [<design.html>] [--port <n>]
//
// create/get/edit are DRY-RUN-ish: get/apply preview before writing; create/edit write the two
// artifacts (design.html + DESIGN.md). Zero deps, Node >=18.
import { read, exists, path } from './lib/util.mjs';
import { loadTokens, writeArtifacts } from './lib/io.mjs';
import { createTokens } from './create.mjs';
import { extract } from './get.mjs';
import { editTokens } from './edit.mjs';
import { planApply, applyPlan } from './apply.mjs';
import { startPreview } from './preview.mjs';

function parse(argv) {
  const a = { _: [], flags: {}, set: {}, remove: [], write: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--write') a.write = true;
    else if (t === '--set') { const k = argv[++i]; a.set[k] = argv[++i]; }
    else if (t === '--remove') a.remove.push(argv[++i]);
    else if (t.startsWith('--')) a.flags[t.slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true;
    else a._.push(t);
  }
  return a;
}

function diffPreview(edits) {
  let shown = 0;
  for (const e of edits) {
    console.log(`  ${e.file}  (${e.count} replacement${e.count === 1 ? '' : 's'})`);
    if (shown++ < 3) {
      const bl = e.before.split('\n'), al = e.after.split('\n');
      for (let i = 0; i < bl.length && i < al.length; i++) {
        if (bl[i] !== al[i]) { console.log(`    - ${bl[i].trim()}`); console.log(`    + ${al[i].trim()}`); }
      }
    }
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const a = parse(argv.slice(1));
  const out = a.flags.out || '.';

  switch (cmd) {
    case 'create': {
      const tokens = createTokens({ bg: a.flags.bg, accent: a.flags.accent, fontSans: a.flags.sans, fontMono: a.flags.mono });
      const files = writeArtifacts(out, tokens);
      console.log(`\nCreated design language:\n  ${files.join('\n  ')}\nOpen design.html (or: design preview) to review & tune.\n`);
      return;
    }
    case 'get': {
      const dir = a._[0];
      if (!dir) { console.error('usage: design get <frontend-dir> [--write]'); process.exit(2); }
      const { tokens, report } = extract(dir);
      console.log('\n' + report + '\n');
      if (a.write) { const files = writeArtifacts(out, tokens); console.log(`Wrote:\n  ${files.join('\n  ')}\n`); }
      else console.log('(report only — re-run with --write to scaffold DESIGN.md + design.html)\n');
      return;
    }
    case 'edit': {
      const current = loadTokens(out);
      if (!current) { console.error(`no design.html found in ${path.resolve(out)} — run "design create" or "design get" first`); process.exit(2); }
      const fromExport = a.flags['from-export'] ? read(a.flags['from-export']) : null;
      const { tokens, warnings, errors, changelog } = editTokens(current, { set: a.set, remove: a.remove, fromExport });
      if (errors.length) { console.error('Errors:\n  ' + errors.join('\n  ')); process.exit(2); }
      if (warnings.length && !a.write && !a.flags.force) {
        console.log('\nValidation warnings (re-run with --force to apply anyway):\n  ' + warnings.join('\n  ') + '\n');
        return;
      }
      const files = writeArtifacts(out, tokens);
      console.log(`\nEdited:\n  ${changelog.join('\n  ') || '(no changes)'}\nWrote:\n  ${files.join('\n  ')}` + (warnings.length ? `\nWarnings:\n  ${warnings.join('\n  ')}` : '') + '\n');
      return;
    }
    case 'apply': {
      const dir = a._[0];
      if (!dir) { console.error('usage: design apply <frontend-dir> [--write]'); process.exit(2); }
      const tokens = loadTokens(out);
      if (!tokens) { console.error('no design.html found — run "design create"/"design get" first'); process.exit(2); }
      const plan = planApply(dir, tokens);
      const total = plan.edits.reduce((n, e) => n + e.count, 0);
      console.log(`\napply ${dir}: ${total} exact-match replacement(s) across ${plan.edits.length} file(s); ${plan.unmapped.size} unmapped literal(s).\n`);
      diffPreview(plan.edits);
      if (plan.unmapped.size) console.log('\nUnmapped (feed back into get/edit): ' + [...plan.unmapped.keys()].slice(0, 10).join(', '));
      if (a.write) { applyPlan(plan); console.log(`\nWrote ${plan.edits.length} file(s).\n`); }
      else console.log('\n(dry-run — re-run with --write to apply)\n');
      return;
    }
    case 'preview': {
      const file = a._[0] || path.join(out, 'design.html');
      if (!exists(file)) { console.error(`not found: ${file} — run "design create"/"design get" first`); process.exit(2); }
      const port = a.flags.port ? Number(a.flags.port) : 4321;
      const { url } = await startPreview(file, { port });
      console.log(`\nPreview (live-reload) → ${url}\nServing ${path.resolve(file)} · edits reload the browser automatically. Ctrl+C to stop.\n`);
      return;
    }
    default:
      console.log(`design — design-language skill.

  design create [--bg <c>] [--accent <c>] [--sans <stack>] [--mono <stack>]   author a fresh language
  design get <dir> [--write]                                                  extract & centralize an existing frontend
  design edit [--set --<tok> <val>]... [--remove --<tok>] [--from-export <f>] modify tokens (validated)
  design apply <dir> [--write]                                                propagate tokens (dry-run by default)
  design preview [design.html] [--port n]                                     live-reload preview server

  Two artifacts: DESIGN.md (rules) + design.html (interactive, :root = token source of truth).`);
  }
}

main();
