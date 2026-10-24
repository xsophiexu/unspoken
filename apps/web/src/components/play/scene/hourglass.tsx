import { Bat, type ArtProps, type LookArt } from './parts';

// Hourglass: the sand drains from the top chamber into a pile below while the bats fly off. Board
// coordinates and colors from gen62hw.py hourglass().

const CX = 186;
const TY = 196;
const MY = 346;
const BY = 496;
const W = 96;
const SAND = '#E3C878';
const FRAME = '#5A4632';
const POST = '#7A6046';
const BAT = '#0A0E12';
// Each bat's start and the way it leaves as time passes (share of 120 across, 140 up).
const BATS = [
  [70, 170, -0.6, 0.5],
  [300, 190, 0.4, 0.6],
  [110, 250, -0.7, 0.2],
  [270, 270, 0.6, 0.25],
] as const;

// Half the glass's width at height y.
const halfWidth = (y: number) => (y < MY ? (W * (y - MY)) / (TY - MY) : (W * (y - MY)) / (BY - MY));

function HourglassArt({ f, out, animate }: ArtProps) {
  // The top chamber's sand surface, and the pile's peak below.
  const level = MY - 6 - (MY - 6 - TY - 14) * f;
  const pile = BY - 14 - (BY - 14 - MY - 30) * (1 - f) * 0.62;
  const floor = halfWidth(BY - 14);
  return (
    <>
      <rect x={CX - 118} y={TY - 22} width={236} height={18} rx={6} fill={FRAME} />
      <rect x={CX - 118} y={BY + 4} width={236} height={18} rx={6} fill={FRAME} />
      <rect x={CX - 110} y={TY - 4} width={8} height={BY - TY + 8} rx={3} fill={POST} />
      <rect x={CX + 102} y={TY - 4} width={8} height={BY - TY + 8} rx={3} fill={POST} />
      <path
        d={`M${CX - W} ${TY} L${CX + W} ${TY} L${CX + 8} ${MY} L${CX + W} ${BY} L${CX - W} ${BY} L${CX - 8} ${MY}Z`}
        fill="#FFFFFF10"
        stroke="#C9D6DD"
        strokeOpacity={0.7}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {f > 0.02 && (
        <path d={`M${CX - halfWidth(level) + 4} ${level} L${CX + halfWidth(level) - 4} ${level} L${CX + 5} ${MY - 4} L${CX - 5} ${MY - 4}Z`} fill={SAND} />
      )}
      {!out && <rect x={CX - 1.5} y={MY - 4} width={3} height={pile - MY + 6} fill={SAND} />}
      <path d={`M${CX - floor + 8} ${BY - 12} Q${CX} ${pile} ${CX + floor - 8} ${BY - 12}Z`} fill={SAND} />
      <path d={`M${CX - W + 18} ${TY + 12} L${CX - 26} ${MY - 30}`} stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={5} strokeLinecap="round" />
      {BATS.map(([x, y, dx, dy], i) => (
        <Bat key={i} x={x + (1 - f) * dx * 120} y={y - (1 - f) * dy * 140} s={0.9} color={BAT} animate={animate} phase={i / BATS.length} />
      ))}
    </>
  );
}

export const hourglass: LookArt = {
  box: { x: 0, y: 150, width: 372, height: 424 },
  align: { x: 'center', y: 'center' },
  holder: () => ({ x: CX, y: BY + 40, anchor: 'center' }),
  stars: { seed: 5, count: 18, y0: 100, y1: 560 },
  Art: HourglassArt,
};
