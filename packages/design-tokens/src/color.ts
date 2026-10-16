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

// The neutral grey with the same WCAG luminance as an opaque color, so contrast between two colors
// is unchanged when both are greyed (disabled controls).
export function greyscale(hex: string): string {
  const v = unchannel(relativeLuminance(hex));
  return toHex({ r: v, g: v, b: v, a: 1 });
}

// text greyed (greyscale), moved only as far toward black or white as it takes to reach `min`
// contrast on an opaque background: text that reads, while staying as quiet as allowed.
export function readableGrey(text: string, background: string, min = AA_TEXT): string {
  const grey = greyscale(composite(text, background));
  if (contrastRatio(grey, background) >= min) return grey;
  const start = parseHex(grey).r * 255;
  let best = grey;
  let bestDistance = Infinity;
  for (let byte = 0; byte <= 255; byte++) {
    const v = byte / 255;
    const candidate = toHex({ r: v, g: v, b: v, a: 1 });
    const distance = Math.abs(byte - start);
    if (distance < bestDistance && contrastRatio(candidate, background) >= min) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}
