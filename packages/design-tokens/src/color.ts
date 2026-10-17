// Small color helpers for hex tokens (#RGB, #RRGGBB or #RRGGBBAA). Used to derive translucent
// tones and to check contrast; platforms can use them for the same purposes.

type Rgba = { r: number; g: number; b: number; a: number };

// WCAG 2.x minimum contrast for normal text (AA).
export const AA_TEXT = 4.5;

// WCAG 2.x minimum contrast for icons, borders and other non-text graphics (AA).
export const AA_NON_TEXT = 3;

function parseHex(hex: string): Rgba {
  const h = hex.replace(/^#/, '');
  const full = h.length === 3 || h.length === 4 ? [...h].map((c) => c + c).join('') : h;
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(full)) throw new Error(`Not a hex color: ${hex}`);
  const byte = (i: number) => parseInt(full.slice(i, i + 2), 16) / 255;
  return { r: byte(0), g: byte(2), b: byte(4), a: full.length === 8 ? byte(6) : 1 };
}

function toHex({ r, g, b, a }: Rgba): string {
  const byte = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${byte(r)}${byte(g)}${byte(b)}${a < 1 ? byte(a) : ''}`;
}

// The same color at an opacity, as #RRGGBBAA (understood by CSS and React Native).
export function withAlpha(hex: string, alpha: number): string {
  return toHex({ ...parseHex(hex), a: alpha });
}

// What a translucent color looks like over an opaque background, as #RRGGBB.
export function composite(fg: string, bg: string): string {
  const f = parseHex(fg);
  const b = parseHex(bg);
  const mix = (x: number, y: number) => f.a * x + (1 - f.a) * y;
  return toHex({ r: mix(f.r, b.r), g: mix(f.g, b.g), b: mix(f.b, b.b), a: 1 });
}

function channel(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// WCAG relative luminance of an opaque color.
function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// WCAG contrast ratio of text on a background, from 1 to 21. A translucent text color is first
// flattened onto the background; the background itself must be opaque.
export function contrastRatio(text: string, background: string): number {
  const fg = relativeLuminance(composite(text, background));
  const bg = relativeLuminance(background);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

function unchannel(y: number): number {
  return y <= 0.0031308 ? y * 12.92 : 1.055 * y ** (1 / 2.4) - 0.055;
}

// OKLab (Björn Ottosson's perceptual space): lightness l from 0 to 1, chroma c and hue h (radians)
// as OKLCH. Moving l alone keeps a color's hue and saturation as people see them.
type Oklch = { l: number; c: number; h: number };

function toOklch(hex: string): Oklch {
  const { r, g, b } = parseHex(hex);
  const [lr, lg, lb] = [r, g, b].map(channel) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) };
}

// Linear sRGB for an OKLCH color; channels may fall outside 0 to 1 when it is out of gamut.
function oklchToLinear({ l: L, c, h }: Oklch): [number, number, number] {
  const A = c * Math.cos(h);
  const B = c * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// An OKLCH color as #RRGGBB, lowering chroma (keeping lightness and hue) until it fits sRGB.
function fromOklch(color: Oklch): string {
  const GAMUT_SLACK = 0.0005;
  const CHROMA_STEP = 0.001;
  for (let c = color.c; c > 0; c -= CHROMA_STEP) {
    const rgb = oklchToLinear({ ...color, c });
    if (rgb.every((v) => v >= -GAMUT_SLACK && v <= 1 + GAMUT_SLACK)) {
      const [r, g, b] = rgb.map(unchannel) as [number, number, number];
      return toHex({ r, g, b, a: 1 });
    }
  }
  const [r, g, b] = oklchToLinear({ ...color, c: 0 }).map(unchannel) as [number, number, number];
  return toHex({ r, g, b, a: 1 });
}

// text with its hue and chroma kept, its OKLCH lightness moved away from an opaque background only
// as far as it takes to reach `min` contrast: text that reads while staying as quiet, and as much
// its own color, as allowed. Text on a light background darkens; on a dark one it lightens.
export function readableOn(text: string, background: string, min = AA_TEXT): string {
  const start = toOklch(composite(text, background));
  const reads = (hex: string) => contrastRatio(hex, background) >= min;
  const own = fromOklch(start);
  if (reads(own)) return own;
  const darken = contrastRatio('#000000', background) >= contrastRatio('#FFFFFF', background);
  const LIGHTNESS_STEP = 0.002;
  for (let shift = LIGHTNESS_STEP; shift <= 1; shift += LIGHTNESS_STEP) {
    const l = darken ? start.l - shift : start.l + shift;
    if (l < 0 || l > 1) break;
    const candidate = fromOklch({ ...start, l });
    if (reads(candidate)) return candidate;
  }
  return darken ? '#000000' : '#FFFFFF';
}
