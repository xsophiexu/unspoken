import { Bat, type ArtProps, type LookArt } from './parts';

// Moon: a shadow slides across the full moon from the left as time runs out, its halo fades and two
// bats cross in front. Board coordinates and colors from gen62hw.py moon().

const CX = 226;
const CY = 290;
const R = 112;
const BAT = '#0A111D';
const CRATERS = [
  [-40, -30, 18],
  [30, 40, 24],
  [52, -44, 11],
] as const;

function MoonArt({ f, animate, uid }: ArtProps) {
  const shadowX = CX - 2 * R * f * 1.05;
  const batX = 60 + 250 * (1 - f);
  const clip = `${uid}-clip`;
  const face = `${uid}-face`;
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
        <radialGradient id={face} cx=".4" cy=".38">
          <stop offset="0" stopColor="#FFF6DA" />
          <stop offset="1" stopColor="#E9D79E" />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={R + 38} fill="#F1DFA6" opacity={0.18 * f + 0.02} />
      <circle cx={CX} cy={CY} r={R} fill={`url(#${face})`} />
      <g clipPath={`url(#${clip})`} fill="#D6C48A" opacity={0.55}>
        {CRATERS.map(([dx, dy, r]) => (
          <circle key={dx} cx={CX + dx} cy={CY + dy} r={r} />
        ))}
      </g>
      <g clipPath={`url(#${clip})`}>
        <circle cx={shadowX} cy={CY} r={R + 2} fill="#1B2A42" />
      </g>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F1DFA6" strokeOpacity={0.35} strokeWidth={2} />
      <Bat x={batX} y={CY + R * 0.2 - (1 - f) * 60} s={1.4} color={BAT} animate={animate} />
      <Bat x={batX - 70} y={CY - R * 0.5 + (1 - f) * 30} s={1} color={BAT} animate={animate} phase={0.5} />
    </>
  );
}

export const moon: LookArt = {
  box: { x: 0, y: 120, width: 372, height: 326 },
  align: { x: 'center', y: 'center' },
  holder: () => ({ x: 22, y: 128, anchor: 'start' }),
  stars: { seed: 8, count: 30, y0: 90, y1: 470 },
  Art: MoonArt,
};
