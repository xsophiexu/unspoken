// Advance widths of Manrope ExtraBold, in ems, measured from the font file.
const LOWER = [0.583, 0.624, 0.583, 0.625, 0.608, 0.386, 0.624, 0.636, 0.296, 0.301, 0.552, 0.296, 0.916, 0.636, 0.627, 0.624, 0.625, 0.412, 0.547, 0.444, 0.636, 0.568, 0.814, 0.563, 0.57, 0.535];
const UPPER = [0.683, 0.637, 0.746, 0.71, 0.59, 0.53, 0.741, 0.734, 0.296, 0.513, 0.665, 0.541, 0.86, 0.729, 0.758, 0.65, 0.758, 0.67, 0.671, 0.61, 0.726, 0.653, 0.989, 0.672, 0.63, 0.68];
const OTHER: Record<string, number> = { '-': 0.42, "'": 0.28, '’': 0.31, ' ': 0.2, '.': 0.32, ',': 0.32, '&': 0.68, '!': 0.38, '?': 0.57 };
// Matches the word style: letterSpacing -1 at 50px.
const TRACKING = -0.02;

function charEm(ch: string): number {
  const base = ch.normalize('NFD')[0];
  const code = base.charCodeAt(0);
  if (code >= 97 && code <= 122) return LOWER[code - 97];
  if (code >= 65 && code <= 90) return UPPER[code - 65];
  if (code >= 48 && code <= 57) return 0.62;
  return OTHER[base] ?? 0.7;
}

function textEm(text: string): number {
  let em = 0;
  for (const ch of text) em += charEm(ch) + TRACKING;
  return em;
}

// Lines a phrase wraps to at this size, breaking at spaces and after hyphens like the browser does.
function linesAt(word: string, size: number, width: number): number {
  const pieces = word.trim().split(/(?<=-)|\s+/).filter(Boolean);
  let lines = 1;
  let used = 0;
  for (const piece of pieces) {
    const w = textEm(piece) * size;
    if (w > width) return Infinity;
    const add = used === 0 ? w : used + (piece.startsWith('-') ? 0 : 0.2 * size) + w;
    if (used > 0 && add > width) {
      lines += 1;
      used = w;
    } else {
      used = add;
    }
  }
  return lines;
}

// The biggest font size, up to max, at which the word fits the width without breaking inside a word.
export function fitWordSize(word: string, width: number, max = 50, min = 22, maxLines = 2): number {
  const room = width * 0.97;
  for (let size = max; size > min; size -= 1) {
    if (linesAt(word, size, room) <= maxLines) return size;
  }
  return min;
}

// Font size for a difficulty name in a three-column tile grid, so long names like Grandmaster stay on one line.
export function tileNameSize(name: string, screenWidth: number): number {
  const inner = (Math.min(screenWidth, 480) - 40) * 0.31 - 24;
  return fitWordSize(name, inner, 16, 11, 1);
}
