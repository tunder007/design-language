// create.mjs — author a fresh design language from a brief / brand refs (greenfield, CRUD C).
import { defaultTokens } from './lib/tokens.mjs';
import { parseColorToHsl } from './lib/color.mjs';

// opts: { bg, accent, fontSans, fontMono }
export function createTokens(opts = {}) {
  const bg = opts.bg ? parseColorToHsl(opts.bg) || opts.bg : undefined;
  const tokens = defaultTokens(bg);
  if (opts.accent) tokens['--accent'] = parseColorToHsl(opts.accent) || opts.accent;
  if (opts.fontSans) tokens['--font-sans'] = opts.fontSans;
  if (opts.fontMono) tokens['--font-mono'] = opts.fontMono;
  return tokens;
}
