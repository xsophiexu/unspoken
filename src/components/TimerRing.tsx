import Svg, { Path } from 'react-native-svg';

type Props = {
  width: number;
  height: number;
  // 0 to 1, how much of the round is left.
  progress: number;
  track: string;
  color: string;
};

const STROKE = 8;
const RADIUS = 30;
// Gap at the top center where the time label sits.
const GAP = 108;

// The ring runs counterclockwise from the left of the top gap, around the card,
// back to the right of the gap, matching the Current Version design.
export function TimerRing({ width, height, progress, track, color }: Props) {
  const i = STROKE / 2;
  const r = RADIUS;
  const left = width / 2 - GAP / 2;
  const right = width / 2 + GAP / 2;
  const d = [
    `M${left} ${i}`,
    `H${i + r}`,
    `A${r} ${r} 0 0 0 ${i} ${i + r}`,
    `V${height - i - r}`,
    `A${r} ${r} 0 0 0 ${i + r} ${height - i}`,
    `H${width - i - r}`,
    `A${r} ${r} 0 0 0 ${width - i} ${height - i - r}`,
    `V${i + r}`,
    `A${r} ${r} 0 0 0 ${width - i - r} ${i}`,
    `H${right}`,
  ].join(' ');

  const straight = 2 * (left - i - r) + 2 * (height - 2 * i - 2 * r) + (width - 2 * i - 2 * r);
  const length = straight + 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(1, progress)) * length;

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
      <Path d={d} fill="none" stroke={track} strokeWidth={STROKE} strokeLinecap="round" />
      {shown > 0 ? (
        <Path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${shown} ${length}`}
        />
      ) : null}
    </Svg>
  );
}
