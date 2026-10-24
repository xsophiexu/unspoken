import { ms, sceneMotion, type ArtProps, type LookArt } from './parts';

// Potion: the flask drains as time runs out, with fewer bubbles and a fainter glow; the time is on a
// paper tag tied to the neck. Board coordinates and colors from gen62hw.py potion().

const CX = 186;
const CY = 610;
const R = 112;
const LIQUID = '#7FD08A';
// Nine bubbles (offset from the flask's middle and radius); a full flask shows all of them.
const BUBBLES = [
  [-52, 40, 4],
  [18, 72, 3],
  [60, 10, 5],
  [-20, 88, 4],
  [44, 56, 3],
  [-64, -20, 5],
  [6, 24, 4],
  [-36, 64, 3],
  [30, -36, 4],
] as const;

function PotionArt({ f, animate, uid }: ArtProps) {
  const level = CY + R - (2 * R - 8) * f;
  const clip = `${uid}-flask`;
  const bubbles = BUBBLES.slice(0, Math.floor(9 * f));
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <circle cx={CX} cy={CY} r={R - 6} />
        </clipPath>
      </defs>
      <ellipse cx={CX} cy={CY} rx={R + 40} ry={R + 40} fill={LIQUID} opacity={0.12 * f} />
      <rect x={CX - 30} y={CY - R - 70} width={60} height={80} fill="#FFFFFF14" stroke="#D8CDEA" strokeOpacity={0.7} strokeWidth={3} />
      <rect x={CX - 36} y={CY - R - 92} width={72} height={26} rx={6} fill="#8A6A4A" />
      <circle cx={CX} cy={CY} r={R} fill="#FFFFFF10" stroke="#D8CDEA" strokeOpacity={0.7} strokeWidth={3} />
      <g clipPath={`url(#${clip})`}>
        <rect x={CX - R} y={level} width={2 * R} height={2 * R} fill={LIQUID} />
        <path d={`M${CX - R} ${level} q28 -8 56 0 t56 0 t56 0 t56 0`} fill="#A6E3AE" />
        {bubbles.map(([dx, dy, r], i) => {
          const y = Math.max(level + 12, CY + dy);
          return (
            <circle key={i} cx={CX + dx} cy={y} r={r} fill="#CFF5D3" opacity={0.7}>
              {animate && (
                <>
                  <animate attributeName="cy" values={`${y};${y - 10}`} dur={ms(sceneMotion.bubbleMs)} begin={ms((-i * sceneMotion.bubbleMs) / 9)} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0" dur={ms(sceneMotion.bubbleMs)} begin={ms((-i * sceneMotion.bubbleMs) / 9)} repeatCount="indefinite" />
                </>
              )}
            </circle>
          );
        })}
      </g>
      <path d={`M${CX - R + 24} ${CY - 40} A${R - 20} ${R - 20} 0 0 1 ${CX - 30} ${CY - R + 22}`} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d={`M${CX + 30} ${CY - R - 40} q34 -6 44 18`} stroke="#C9A44F" strokeWidth={2} fill="none" />
    </>
  );
}

export const potion: LookArt = {
  box: { x: 30, y: 400, width: 312, height: 364 },
  align: { x: 'center', y: 'center' },
  holder: () => ({ x: CX + 58, y: CY - R - 30, anchor: 'start' }),
  stars: { seed: 9, count: 16, y0: 90, y1: 420 },
  Art: PotionArt,
};
