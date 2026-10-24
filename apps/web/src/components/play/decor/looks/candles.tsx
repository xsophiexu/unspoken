import { Glow } from '../art';
import { Body, Room, Text, useUid, type DecorBodyProps, type LookDecor } from '../frame';
import styles from '../Decor.module.css';

// Candles (N8-k07, CN1): the Ombre header with the clock and its line under it, the banned words in
// two ruled columns, and a row of lit candles of different heights glowing along the bottom over a
// dark floor, above Skip and Correct buttons.

// Each candle: left, top, width and height.
const CANDLES = [
  [12, 631, 28, 75],
  [53, 592, 34, 114],
  [105, 648, 26, 58],
  [150, 608, 32, 98],
  [200, 637, 28, 69],
  [245, 584, 34, 122],
  [296, 628, 28, 78],
  [336, 602, 32, 104],
] as const;
// The glow around each flame: its box's left and top (120 px across).
const GLOWS = [
  [-34, 541],
  [10, 502],
  [58, 558],
  [106, 518],
  [154, 547],
  [202, 494],
  [250, 538],
  [292, 512],
] as const;

// Wax running over the candle's top edge.
const drips = (w: number) => `M0 0 H${w} V8 Q${w - 3} 20 ${w - 6} 9 Q${w * 0.62} 4 ${w * 0.55} 14 Q${w * 0.47} 22 ${w * 0.4} 9 Q${w * 0.24} 3 ${w * 0.18} 12 Q4 16 0 8Z`;

function CandlesBody({ word, banned, swipeItem }: DecorBodyProps) {
  const uid = useUid();
  return (
    <Body look="candles">
      <Text className={styles.candlesText}>
        {swipeItem(word)}
        {swipeItem(banned)}
      </Text>
      <Room view={[0, 470, 372, 280]} grow>
        <defs>
          <filter id={`${uid}-flame`} x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx={0} dy={0} stdDeviation={4} floodColor="#F6A65A" />
          </filter>
        </defs>
        <Glow
          uid={uid}
          cx={186}
          cy={745}
          r={203}
          rx={298}
          stops={[
            [0, '#F6A65A', 0.2],
            [0.75, '#F6A65A', 0],
          ]}
        />
        {GLOWS.map(([left, top]) => (
          <Glow
            key={left}
            uid={uid}
            cx={left + 60}
            cy={top + 60}
            r={60}
            stops={[
              [0, '#FFD27A', 0.33],
              [0.45, '#F6A65A', 0.11],
              [0.7, '#F6A65A', 0],
            ]}
          />
        ))}
        {CANDLES.map(([x, top, w, h]) => (
          <g key={x}>
            <g transform={`translate(${x} ${top})`}>
              <rect width={w} height={h} rx={3} fill="#F2DDBF" />
              <path d={drips(w)} fill="#FFF1DE" />
            </g>
            <rect x={x + w / 2 - 1} y={top - 6} width={2} height={7} fill="#2A1508" />
            <g transform={`translate(${x + w / 2 - 10.2} ${top - 36}) scale(0.85)`}>
              <path d="M12 0 Q22 16 18 28 Q12 36 6 28 Q2 16 12 0Z" fill="#FFD27A" filter={`url(#${uid}-flame)`} />
              <path d="M12 12 Q16 22 14 28 Q12 30 10 28 Q8 22 12 12Z" fill="#FFF4E6" />
            </g>
          </g>
        ))}
        {/* The floor, on under the controls. */}
        <rect x={-4000} y={704} width={8372} height={600} fill="#0A0603" />
      </Room>
    </Body>
  );
}

export const candles: LookDecor = { Body: CandlesBody };
