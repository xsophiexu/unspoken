import { mix, ms, sceneMotion, type ArtProps, type LookArt } from './parts';

// Jack-o'-lantern: the candle inside burns down, so the carved face's glow dims and the pumpkin
// darkens; a gold arc over it shows how much light is left. Board coordinates and colors from
// gen62hw.py jack().

const CX = 186;
const CY = 600;
const ARC = 170;
const ARC_LENGTH = Math.PI * ARC;

function JackArt({ f, animate }: ArtProps) {
  const glow = mix('#2A1608', '#FFD36A', f);
  const mouth = mix('#3A1E0C', '#F6A24A', f);
  const skin = (c: string) => mix('#2A160A', c, 0.45 + 0.55 * f);
  const arc = `M${CX - ARC} ${CY - 10} A${ARC} ${ARC} 0 0 1 ${CX + ARC} ${CY - 10}`;
  return (
    <>
      <ellipse cx={CX} cy={CY} rx={190} ry={150} fill="#F6A24A" opacity={0.22 * f} />
      <ellipse cx={CX - 70} cy={CY} rx={78} ry={118} fill={skin('#C9601E')} />
      <ellipse cx={CX + 70} cy={CY} rx={78} ry={118} fill={skin('#C9601E')} />
      <ellipse cx={CX} cy={CY} rx={88} ry={124} fill={skin('#E07A2E')} />
      <ellipse cx={CX - 34} cy={CY} rx={40} ry={122} fill={skin('#D86E26')} opacity={0.7} />
      <ellipse cx={CX + 34} cy={CY} rx={40} ry={122} fill={skin('#D86E26')} opacity={0.7} />
      <path d={`M${CX - 8} ${CY - 120} q-4 -30 14 -40 l8 8 q-10 8 -8 32Z`} fill="#4E6B34" />
      {/* The carved face flickers like the candle behind it. */}
      <g>
        {animate && <animate attributeName="opacity" values="1;0.84;0.96;0.8;1" dur={ms(sceneMotion.glowMs)} repeatCount="indefinite" />}
        <path d={`M${CX - 92} ${CY - 38} l38 -36 l20 40Z`} fill={glow} />
        <path d={`M${CX + 92} ${CY - 38} l-38 -36 l-20 40Z`} fill={glow} />
        <path d={`M${CX} ${CY - 14} l-14 24 h28Z`} fill={glow} />
        <path
          d={`M${CX - 110} ${CY + 30} Q${CX} ${CY + 120} ${CX + 110} ${CY + 30} L${CX + 84} ${CY + 48} l-12 -16 l-14 22 l-16 -18 l-16 22 l-14 -20 l-16 20 l-14 -22 l-16 18 l-14 -22 l-12 16Z`}
          fill={mouth}
        />
      </g>
      <path d={arc} stroke="#FFFFFF14" strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d={arc} stroke="#F6B04A" strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={`${(ARC_LENGTH * f).toFixed(1)} ${ARC_LENGTH.toFixed(1)}`} />
    </>
  );
}

export const jack: LookArt = {
  box: { x: 0, y: 366, width: 372, height: 386 },
  align: { x: 'center', y: 'center' },
  holder: () => ({ x: CX, y: 372, anchor: 'center' }),
  Art: JackArt,
};
