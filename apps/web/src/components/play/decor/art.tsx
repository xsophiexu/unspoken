import type { ReactNode } from 'react';

// Pieces of art the favourite Halloween looks share, drawn in board px (the 372 × 826 play page of
// their designs, design/word-packs/halloween-favourite-looks).

// The designs' bat (a 60 × 26 shape), centered on (cx, cy) and w wide, optionally turned.
const BAT = 'M30 8 C27 2 24 2 22 6 C16 0 8 2 0 10 C8 9 12 12 14 18 C18 14 22 14 26 18 L30 14 L34 18 C38 14 42 14 46 18 C48 12 52 9 60 10 C52 2 44 0 38 6 C36 2 33 2 30 8Z';

export function Bat({ cx, cy, w, color, rotate = 0 }: { cx: number; cy: number; w: number; color: string; rotate?: number }) {
  const s = w / 60;
  return <path d={BAT} fill={color} transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${s}) translate(-30 -13)`} />;
}

// A bat placed as the designs place them: an svg of the given width at (left, top), its 60 × 26 box
// scaled about its middle by `scale`.
export function BatAt({ left, top, w = 60, scale = 1, color, rotate = 0 }: { left: number; top: number; w?: number; scale?: number; color: string; rotate?: number }) {
  return <Bat cx={left + w / 2} cy={top + (w * 26) / 60 / 2} w={w * scale} color={color} rotate={rotate} />;
}

// A moon: a disc lit from the upper left, in a soft glow (the designs' box-shadow 0 0 blur spread).
export function Moon({
  uid,
  cx,
  cy,
  r,
  light,
  mid,
  dark,
  glow,
  glowBlur = 70,
  glowSpread = 14,
  at = [40, 40],
  children,
}: {
  uid: string;
  cx: number;
  cy: number;
  r: number;
  light: string;
  mid: string;
  dark: string;
  glow?: string;
  glowBlur?: number;
  glowSpread?: number;
  at?: readonly [number, number];
  children?: ReactNode;
}) {
  const fill = `${uid}-moon-${Math.round(cx)}`;
  // CSS's `circle at x% y%` reaches the farthest corner.
  const reach = Math.hypot(1 - at[0] / 100, 1 - at[1] / 100) * 100;
  const blur = `${uid}-blur-${Math.round(cx)}`;
  return (
    <>
      <defs>
        <radialGradient id={fill} cx={`${at[0]}%`} cy={`${at[1]}%`} r={`${reach}%`}>
          <stop offset="0" stopColor={light} />
          <stop offset="0.6" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
        {glow && (
          <filter id={blur} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={glowBlur / 2} />
          </filter>
        )}
      </defs>
      {glow && <circle cx={cx} cy={cy} r={r + glowSpread} fill={glow} filter={`url(#${blur})`} />}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${fill})`} />
      {children}
    </>
  );
}

// A soft round glow of radius r: stops are [offset 0..1, color, opacity], fading out after the last.
export function Glow({ uid, cx, cy, r, rx, stops }: { uid: string; cx: number; cy: number; r: number; rx?: number; stops: readonly (readonly [number, string, number])[] }) {
  const id = `${uid}-glow-${Math.round(cx)}-${Math.round(cy)}`;
  return (
    <>
      <defs>
        <radialGradient id={id}>
          {stops.map(([offset, color, opacity]) => (
            <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
          ))}
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx ?? r} ry={r} fill={`url(#${id})`} />
    </>
  );
}

export type Star = readonly [x: number, y: number, size: number, opacity: number];

// The designs' stars: dots of size × size px at (x, y).
export function Stars({ stars, color }: { stars: readonly Star[]; color: string }) {
  return (
    <g fill={color}>
      {stars.map(([x, y, size, opacity], i) => (
        <circle key={i} cx={x + size / 2} cy={y + size / 2} r={size / 2} opacity={opacity} />
      ))}
    </g>
  );
}

// An iron fence: pickets `step` apart (one at x0) across the page, each with a spear point, and two
// rails. top: the points' tips; height: the pickets' length under the points.
export function Fence({
  top,
  step,
  x0,
  height,
  rails,
  color,
  opacity,
}: {
  top: number;
  step: number;
  x0: number;
  height: number;
  rails: readonly number[];
  color: string;
  opacity?: number;
}) {
  // On past the page's sides, for windows wider than the game column.
  const xs: number[] = [];
  for (let x = x0 - step * Math.ceil(800 / step); x <= 1172; x += step) xs.push(x);
  return (
    <g fill={color} opacity={opacity}>
      {xs.map((x) => (
        <g key={x}>
          <rect x={x} y={top + 10} width={3} height={height} />
          <path d={`M${x - 3} ${top + 12} L${x + 1.5} ${top} L${x + 6} ${top + 12}Z`} />
        </g>
      ))}
      {rails.map((y) => (
        <rect key={y} x={-800} y={top + y} width={1972} height={3} />
      ))}
    </g>
  );
}

// Tufts of grass along the ground: three blades at each (x, y).
export function Grass({ at, color }: { at: readonly (readonly [number, number])[]; color: string }) {
  const d = at
    .map(([x, y]) => `M${x} ${y} L${x + 2} ${y - 9} L${x + 4} ${y}Z M${x + 4} ${y} L${x + 7} ${y - 13} L${x + 9} ${y}Z M${x + 9} ${y} L${x + 12} ${y - 8} L${x + 14} ${y}Z`)
    .join(' ');
  return <path d={d} fill={color} />;
}

// A cobweb in the corner at (x, y): spokes and sagging rings. flip turns it to hang from a right
// corner (x is then the right edge).
export function Web({
  x,
  y,
  size,
  spokes,
  rings,
  color,
  width,
  flip = false,
}: {
  x: number;
  y: number;
  size: number;
  spokes: number;
  rings: number;
  color: string;
  width: number;
  flip?: boolean;
}) {
  const angles = Array.from({ length: spokes }, (_, i) => (i * Math.PI) / 2 / (spokes - 1));
  const pt = (r: number, a: number) => [r * Math.cos(a), r * Math.sin(a)] as const;
  const ringPaths = Array.from({ length: rings }, (_, k) => {
    const r = (size * (k + 1)) / rings;
    let d = '';
    angles.forEach((a, i) => {
      const [px, py] = pt(r, a);
      if (i === 0) d = `M${px.toFixed(1)} ${py.toFixed(1)}`;
      else {
        const mid = (a + (angles[i - 1] ?? 0)) / 2;
        const [qx, qy] = pt(r * 0.86, mid);
        d += ` Q${qx.toFixed(1)} ${qy.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)}`;
      }
    });
    return d;
  });
  return (
    <g transform={`translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}`} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round">
      {angles.map((a) => {
        const [px, py] = pt(size, a);
        return <line key={a} x1={0} y1={0} x2={px.toFixed(1)} y2={py.toFixed(1)} />;
      })}
      {ringPaths.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

// The designs' spider legs on one side: start, control and tip, from the middle of its head.
const LEGS = [
  [-6.6, -0.1, -22.8, -16.4, -32.6, -13.1],
  [-6.6, 3.8, -26, -5.7, -39, 2.1],
  [-6.6, 7.6, -26, 5, -39, 17.4],
  [-6.6, 11.5, -21.2, 15.8, -32.6, 32.7],
] as const;

// A spider hanging on its thread from (x, top), its head `depth` below the top, drawn at `scale` of
// the designs' big spider.
export function HangingSpider({
  x,
  top,
  depth,
  scale,
  color,
  thread,
  legWidth,
}: {
  x: number;
  top: number;
  depth: number;
  scale: number;
  color: string;
  thread: string;
  legWidth: number;
}) {
  const hy = top + depth;
  return (
    <g>
      <line x1={x} y1={top} x2={x} y2={hy - 4 * scale} stroke={thread} strokeWidth={1.2} />
      <g transform={`translate(${x} ${hy}) scale(${scale})`} stroke={color} strokeWidth={legWidth / scale} fill="none" strokeLinecap="round">
        {LEGS.map(([sx, sy, qx, qy, tx, ty]) => (
          <g key={sy}>
            <path d={`M${sx} ${sy} Q${qx} ${qy} ${tx} ${ty}`} />
            <path d={`M${-sx} ${sy} Q${-qx} ${qy} ${-tx} ${ty}`} />
          </g>
        ))}
        <ellipse cx={0} cy={13.8} rx={10.6} ry={13} fill={color} stroke="none" />
        <circle cx={0} cy={0} r={6.5} fill={color} stroke="none" />
      </g>
    </g>
  );
}

// A gravestone shape: a round-topped slab at (x, y), w × h, turned about its foot.
export function Stone({ x, y, w, h, top, color, rotate = 0 }: { x: number; y: number; w: number; h: number; top: number; color: string; rotate?: number }) {
  const r = Math.min(top, w / 2);
  const d = `M${x} ${y + h} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h}Z`;
  return <path d={d} fill={color} transform={`rotate(${rotate} ${x + w / 2} ${y + h})`} />;
}
