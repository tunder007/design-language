// io.mjs — load/save the two artifacts. Keeps the verb modules pure (they return data; cli writes).
import { read, write, exists, path } from './util.mjs';
import { parseRoot } from './tokens.mjs';
import { renderHtml, renderDesignMd } from './render.mjs';

export function loadTokens(dir = '.') {
  const f = path.join(dir, 'design.html');
  if (!exists(f)) return null;
  return parseRoot(read(f));
}

export function writeArtifacts(dir, tokens) {
  write(path.join(dir, 'design.html'), renderHtml(tokens));
  write(path.join(dir, 'DESIGN.md'), renderDesignMd(tokens));
  return [path.join(dir, 'design.html'), path.join(dir, 'DESIGN.md')];
}
