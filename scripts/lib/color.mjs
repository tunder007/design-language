// color.mjs — zero-dep color math. Tokens are authored "hsl style"; this converts to/from hex
// (for <input type=color>), parses the literals a frontend uses, and computes WCAG contrast.

// "#rrggbb" | "#rgb" -> "hsl(H S% L%)"
export function hexToHsl(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hue /= 6;
  }
  return `hsl(${Math.round(hue * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

// "hsl(H S% L%)" (modern space-separated) -> "#rrggbb"
export function hslToHex(hsl) {
  const m = /hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/i.exec(hsl);
  if (!m) return '#000000';
  const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

const NAMED = { white: '#ffffff', black: '#000000', red: '#ff0000', green: '#008000',
  blue: '#0000ff', gray: '#808080', grey: '#808080', transparent: null };

// Parse any CSS color literal a frontend might use into a normalized "hsl(H S% L%)" string,
// or null if it isn't a solid color we can normalize (e.g. transparent, gradients, currentColor).
export function parseColorToHsl(raw) {
  const v = raw.trim().toLowerCase();
  if (v in NAMED) return NAMED[v] ? hexToHsl(NAMED[v]) : null;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return hexToHsl(v);
  let m = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i.exec(v);
  if (m) return hexToHsl('#' + [m[1], m[2], m[3]].map((n) => Math.round(+n).toString(16).padStart(2, '0')).join(''));
  m = /^hsla?\(\s*([\d.]+)(?:deg)?[ ,]+([\d.]+)%[ ,]+([\d.]+)%/i.exec(v);
  if (m) return `hsl(${Math.round(+m[1])} ${Math.round(+m[2])}% ${Math.round(+m[3])}%)`;
  return null;
}

function hslChannels(hsl) {
  const m = /hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/i.exec(hsl);
  return m ? { h: +m[1], s: +m[2], l: +m[3] } : null;
}

// Perceptual distance between two hsl strings (cheap; weights L and hue). Used to cluster near-dupes.
export function hslDistance(a, b) {
  const ca = hslChannels(a), cb = hslChannels(b);
  if (!ca || !cb) return Infinity;
  let dh = Math.abs(ca.h - cb.h); if (dh > 180) dh = 360 - dh;
  return Math.abs(ca.l - cb.l) * 1.5 + Math.abs(ca.s - cb.s) * 0.5 + dh * 0.25;
}

// WCAG relative luminance + contrast ratio (inputs are hsl strings).
function luminance(hsl) {
  const hex = hslToHex(hsl);
  const ch = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((x) => {
    const c = parseInt(x, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export function contrastRatio(a, b) {
  const la = luminance(a), lb = luminance(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}
