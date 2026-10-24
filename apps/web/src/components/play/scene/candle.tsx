import { ms, sceneMotion, type ArtProps, type LookArt } from './parts';

// Candle: the candle melts down as time runs out; its flame shrinks and, at 0:00, gives way to a
// curl of smoke. Board coordinates and colors from gen62hw.py candle().

const BASE = 640;
const CX = 292;
const WAX = '#F4ECDC';
const DRIPS = [
  [4, 26],
  [22, 14],
  [44, 34],
  [58, 18],
] as const;
// Ruler marks beside the candle, so the melt reads like a scale (0, 15, 30, 45 and 60 of 60).
const MARKS = [0, 0.25, 0.5, 0.75, 1];

function CandleArt({ f, out, animate, uid }: ArtProps) {
  const h = Math.round(60 + 300 * f);
  const top = BASE - h;
  const puddle = Math.round(18 + 40 * (1 - f));
  const fl = Math.max(0, Math.min(1, f * 1.1 + 0.05));
  const fh = 58 * fl;
  const glow = `${uid}-glow`;
  const flame = out ? (
    <path d={`M${CX} ${top - 4} c-10 -14 10 -22 0 -38 c-8 -12 8 -20 2 -32`} stroke="#B9A9D6" strokeOpacity={0.55} strokeWidth={3} fill="none" strokeLinecap="round" />
  ) : (
    // The flame flickers about its base (the wick top).
    <g transform={`translate(${CX} ${top})`}>
      <g>
        {animate && <animateTransform attributeName="transform" type="scale" values="1 1;0.95 1.06;1.03 0.95;0.97 1.03;1 1" dur={ms(sceneMotion.flickerMs)} repeatCount="indefinite" />}
        <g transform={`translate(${-CX} ${-top})`}>
          <ellipse cx={CX} cy={top - fh * 0.35} rx={70 * fl} ry={70 * fl} fill={`url(#${glow})`} />
          <path
            d={`M${CX} ${top - fh} C${CX + 16 * fl} ${top - fh * 0.45} ${CX + 14 * fl} ${top - 4} ${CX} ${top - 2} C${CX - 14 * fl} ${top - 4} ${CX - 16 * fl} ${top - fh * 0.45} ${CX} ${top - fh}Z`}
            fill="#F6B04A"
          />
          <path
            d={`M${CX} ${top - fh * 0.6} C${CX + 7 * fl} ${top - fh * 0.3} ${CX + 6 * fl} ${top - 5} ${CX} ${top - 4} C${CX - 6 * fl} ${top - 5} ${CX - 7 * fl} ${top - fh * 0.3} ${CX} ${top - fh * 0.6}Z`}
            fill="#FFE7A3"
          />
        </g>
      </g>
    </g>
  );
  return (
    <>
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#F6B04A" stopOpacity={0.55} />
          <stop offset="1" stopColor="#F6B04A" stopOpacity={0} />
        </radialGradient>
      </defs>
      {MARKS.map((mark) => (
        <rect key={mark} x={CX - 62} y={Math.round(BASE - 60 - 300 * mark)} width={14} height={2} fill="#B9A9D655" />
      ))}
      <ellipse cx={CX} cy={BASE + 18} rx={48 + puddle * 0.4} ry={9} fill={WAX} opacity={0.9} />
      <rect x={CX - 34} y={top} width={68} height={h} rx={6} fill={WAX} />
      <rect x={CX + 14} y={top + 4} width={10} height={Math.max(0, h - 8)} rx={4} fill="#E2D6C0" />
      {h > 70 && DRIPS.map(([dx, dl]) => <path key={dx} d={`M${CX - 34 + dx} ${top + 8} q0 ${dl} 5 ${dl} q5 0 5 -${dl}Z`} fill={WAX} />)}
      <path d={`M${CX} ${top} v-8`} stroke="#2A1E1A" strokeWidth={3} strokeLinecap="round" />
      {flame}
      <path
        d={`M${CX - 74} ${BASE + 14} Q${CX} ${BASE + 44} ${CX + 74} ${BASE + 14} L${CX + 62} ${BASE + 30} Q${CX} ${BASE + 56} ${CX - 62} ${BASE + 30}Z`}
        fill="#6B5A86"
      />
      <ellipse cx={CX} cy={BASE + 14} rx={74} ry={14} fill="#8A78A8" />
      <path d={`M${CX + 74} ${BASE + 20} q26 0 26 16 q0 14 -22 12`} stroke="#6B5A86" strokeWidth={7} fill="none" />
    </>
  );
}

export const candle: LookArt = {
  box: { x: 196, y: 184, width: 176, height: 540 },
  align: { x: 'center', y: 'end' },
  holder: () => ({ x: CX - 10, y: BASE + 46, anchor: 'center' }),
  stars: { seed: 3, count: 22, y0: 110, y1: 700 },
  Art: CandleArt,
};
