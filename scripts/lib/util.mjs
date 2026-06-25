// util.mjs — small zero-dep filesystem helpers shared across the design verbs.
import fs from 'node:fs';
import path from 'node:path';

export { fs, path };

export const read = (f) => fs.readFileSync(f, 'utf8');
export const exists = (f) => fs.existsSync(f);

export function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

// Recursively list files under dir (sorted, deterministic), optionally filtered by extension set.
export function walk(dir, exts = null, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const skip = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (skip.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, exts, base, out);
    else if (!exts || exts.has(path.extname(e.name).toLowerCase())) out.push(abs);
  }
  return out;
}

export const FRONTEND_EXTS = new Set(['.css', '.scss', '.sass', '.less', '.html', '.htm',
  '.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte', '.astro']);
