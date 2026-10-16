// Where How to play puts a caption beside its cut-out, so the Expo app and the site place it the
// same way. Coordinates are in the overlay's own space (its top-left is 0, 0).

export type SpotRect = { x: number; y: number; w: number; h: number };

export type CaptionPlacement = {
  // Text alignment inside the caption box.
  align: 'start' | 'center' | 'end';
  left: number;
  right: number;
  // One of these is set: the caption's top edge (under the cut-out) or its bottom edge measured
  // up from the overlay's bottom (over the cut-out).
  top?: number;
  bottom?: number;
};

type Frame = {
  width: number;
  height: number;
  // The top of the controls along the bottom (the step dots): a caption never reaches below it.
  floor: number;
  // The side margin the caption keeps from the overlay's edges.
  side: number;
  // Space between the cut-out and the caption.
  gap: number;
  // The widest a caption gets beside a small cut-out, as a share of the overlay's width.
  maxShare: number;
};

// Under the cut-out when there is more room below it, over it otherwise. A wide cut-out (the word,
// the banned list, Play) has the caption lined up with its edges. A small one near an edge (the
// menu button, a level badge) has a narrower caption whose edge lines up with the cut-out's: right-
// aligned on the right, left-aligned on the left. A small one in the middle has it centered under it.
export function captionPlacement(hole: SpotRect, frame: Frame): CaptionPlacement {
  const { width, height, floor, side, gap, maxShare } = frame;
  const holeRight = hole.x + hole.w;
  const below = height - (hole.y + hole.h) > hole.y;
  const vertical = below ? { top: hole.y + hole.h + gap } : { bottom: height - Math.min(hole.y, floor) + gap };
  if (hole.w >= width / 2) {
    return { align: 'start', left: Math.max(side, hole.x), right: Math.max(side, width - holeRight), ...vertical };
  }
  const max = Math.min(width * maxShare, width - side * 2);
  const center = hole.x + hole.w / 2;
  if (center > width * 0.6) {
    const right = Math.max(side, width - holeRight);
    return { align: 'end', left: Math.max(side, width - right - max), right, ...vertical };
  }
  if (center < width * 0.4) {
    const left = Math.max(side, hole.x);
    return { align: 'start', left, right: Math.max(side, width - left - max), ...vertical };
  }
  const left = Math.min(Math.max(side, center - max / 2), width - side - max);
  return { align: 'center', left, right: width - left - max, ...vertical };
}

export type TourGesture = 'forward' | 'back' | null;

// What a touch or pointer gesture on How to play does, from how far it moved (dx right, dy down).
// A tap (barely moving) or a swipe left or up moves forward; a swipe right or down goes back; a
// short drag in between does nothing.
export function tourGesture(dx: number, dy: number, { slop, swipe }: { slop: number; swipe: number }): TourGesture {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < slop && ay < slop) return 'forward';
  const along = ax > ay ? dx : dy;
  if (Math.abs(along) < swipe) return null;
  return along > 0 ? 'back' : 'forward';
}
