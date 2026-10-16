// Word-fit sizing without measuring text on a device: estimate widths from a glyph-width table so
// every platform (and the server, for previews) picks the same font size for a word in a box.
// The Manrope ExtraBold table lives in @unspoken/design-tokens (typography.wordMetrics).

export type GlyphMetrics = {
  // Advance widths in em, keyed by single character. Accented letters fall back to their base letter.
  widths: Readonly<Record<string, number>>;
  // Width in em for characters missing from the table.
  fallback: number;
  // Letter spacing in em added after every character (negative tightens). Must match the text style.
  tracking: number;
  // Gap in em between words on a line when a phrase wraps.
  wordGap: number;
};

export type FitOptions = {
  // Box width in px (or points/dp; any unit, as long as sizes use the same one).
  width: number;
  max?: number;
  min?: number;
  maxLines?: number;
  // Share of the width the text may use, leaving room for rendering differences between engines.
  safety?: number;
};

function charEm(ch: string, metrics: GlyphMetrics): number {
  const direct = metrics.widths[ch];
  if (direct !== undefined) return direct;
  const base = ch.normalize('NFD').charAt(0);
  return metrics.widths[base] ?? metrics.fallback;
}

// Width of a piece of text in em, tracking included.
function textWidthEm(text: string, metrics: GlyphMetrics): number {
  let em = 0;
  for (const ch of text) em += charEm(ch, metrics) + metrics.tracking;
  return em;
}

// Lines a phrase wraps to at this size, breaking at spaces and after hyphens like the browser does.
// Infinity when a single piece is wider than the box (the word would break inside itself).
export function linesAt(text: string, size: number, width: number, metrics: GlyphMetrics): number {
  const pieces = text.trim().split(/(?<=-)|\s+/).filter(Boolean);
  let lines = 1;
  let used = 0;
  let afterHyphen = false;
  for (const piece of pieces) {
    const w = textWidthEm(piece, metrics) * size;
    if (w > width) return Infinity;
    // A piece after a hyphen joins without a space; after a space it needs the word gap.
    const gap = afterHyphen ? 0 : metrics.wordGap * size;
    const add = used === 0 ? w : used + gap + w;
    if (used > 0 && add > width) {
      lines += 1;
      used = w;
    } else {
      used = add;
    }
    afterHyphen = piece.endsWith('-');
  }
  return lines;
}

// The biggest whole font size, from max down to min, at which the text fits the width in at most
// maxLines lines without breaking inside a word. Returns min when nothing larger fits.
export function fitWordSize(text: string, metrics: GlyphMetrics, options: FitOptions): number {
  const { width, max = 50, min = 22, maxLines = 2, safety = 0.97 } = options;
  const room = width * safety;
  for (let size = max; size > min; size -= 1) {
    if (linesAt(text, size, room, metrics) <= maxLines) return size;
  }
  return min;
}

// Reverse shows one underline per letter. Long answers get narrower blanks so the longest word
// fits the room beside the show/hide button.
export function blankCellSize(
  word: string,
  { room, gap = 6, min = 12, max = 30 }: { room: number; gap?: number; min?: number; max?: number },
): number {
  const longest = Math.max(1, ...word.trim().split(/\s+/).map((w) => w.length));
  return Math.max(min, Math.min(max, Math.floor((room - gap * (longest - 1)) / longest)));
}
