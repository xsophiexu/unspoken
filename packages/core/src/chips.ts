// Packing banned-word chips onto as few lines as possible. Chips wrap like flex-wrap: in order, each
// starting a new line when it doesn't fit. A long chip early on can leave a gap that a later chip
// would fill, so reordering a little can save a line (Appendicitis goes from 5 lines to 4 when
// Psoas sign moves up beside Fecalith). Pure: give it widths, or text and a measure function.

export type ChipPacking = {
  // Chip indexes in the order to show them.
  order: number[];
  // The same indexes split into lines, as flex-wrap draws that order.
  lines: number[][];
};

// Above this many chips, chips keep their order: the search below grows as 3^n. Cards have at most
// 10 banned words, which it handles in about a millisecond.
export const MAX_PACKED_CHIPS = 12;

// How flex-wrap lays chips out in the given order.
function wrap(widths: readonly number[], order: readonly number[], lineWidth: number, gap: number): number[][] {
  const lines: number[][] = [];
  let used = 0;
  for (const i of order) {
    const w = widths[i] as number;
    const line = lines[lines.length - 1];
    if (line && used + gap + w <= lineWidth) {
      line.push(i);
      used += gap + w;
    } else {
      lines.push([i]);
      used = w;
    }
  }
  return lines;
}

function bits(mask: number): number {
  let n = 0;
  for (let m = mask; m; m &= m - 1) n++;
  return n;
}

// The order with the fewest lines, and among those the fewest pairs of chips swapped from the
// original order. Lines are built one at a time from the chips left (each line in original
// order, since that never costs a swap), over every set of chips placed so far: for each set, the
// fewest lines, then the fewest swaps, then the order that keeps earlier chips earliest (so a
// short chip moves up into a gap rather than a long one moving down). A line of chips S placed
// before the chips still left R swaps each pair of x in S and y in R where y came before x.
function bestOrder(widths: readonly number[], lineWidth: number, gap: number): number[] {
  const n = widths.length;
  const full = (1 << n) - 1;
  const width = new Array<number>(full + 1).fill(0);
  for (let s = 1; s <= full; s++) {
    const low = s & -s;
    const w = widths[31 - Math.clz32(low)] as number;
    const rest = s ^ low;
    width[s] = rest === 0 ? w : (width[rest] as number) + gap + w;
  }
  // A chip wider than the line still gets a line of its own.
  const fits = (s: number) => (s & (s - 1)) === 0 || (width[s] as number) <= lineWidth;

  const lines = new Array<number>(full + 1).fill(Infinity);
  const swaps = new Array<number>(full + 1).fill(Infinity);
  const seq: number[][] = new Array<number[]>(full + 1).fill([]);
  lines[0] = 0;
  swaps[0] = 0;
  for (let placed = 0; placed < full; placed++) {
    if (lines[placed] === Infinity) continue;
    const left = full ^ placed;
    for (let s = left; s; s = (s - 1) & left) {
      if (!fits(s)) continue;
      const rest = left ^ s;
      let cost = 0;
      for (let m = s; m; m &= m - 1) cost += bits(rest & ((m & -m) - 1));
      const next = placed | s;
      const l = (lines[placed] as number) + 1;
      const c = (swaps[placed] as number) + cost;
      if (l > (lines[next] as number) || (l === lines[next] && c > (swaps[next] as number))) continue;
      const order = [...(seq[placed] as number[])];
      for (let m = s; m; m &= m - 1) order.push(31 - Math.clz32(m & -m));
      if (l === lines[next] && c === swaps[next] && !isEarlier(order, seq[next] as number[])) continue;
      lines[next] = l;
      swaps[next] = c;
      seq[next] = order;
    }
  }

  return seq[full] as number[];
}

// Whether order a comes before order b, comparing chip by chip.
function isEarlier(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return (a[i] as number) < (b[i] as number);
  return false;
}

// Orders chips to fill the fewest lines of `lineWidth`, staying as close to their original order as
// it can (the fewest pairs swapped). When no order saves a line, the original order stands.
export function packChips(widths: readonly number[], lineWidth: number, gap = 0): ChipPacking {
  const original = widths.map((_, i) => i);
  const asIs = wrap(widths, original, lineWidth, gap);
  if (widths.length > MAX_PACKED_CHIPS) return { order: original, lines: asIs };
  const order = bestOrder(widths, lineWidth, gap);
  // Lines as flex-wrap will draw this order (the same count; a break may fall elsewhere).
  const lines = wrap(widths, order, lineWidth, gap);
  return lines.length < asIs.length ? { order, lines } : { order: original, lines: asIs };
}

// packChips for text: measures each chip and returns the texts in their packed order, by line.
export function packChipTexts<T extends string>(
  texts: readonly T[],
  measure: (text: T) => number,
  lineWidth: number,
  gap = 0,
): { order: T[]; lines: T[][] } {
  const { order, lines } = packChips(texts.map(measure), lineWidth, gap);
  const at = (i: number) => texts[i] as T;
  return { order: order.map(at), lines: lines.map((line) => line.map(at)) };
}
