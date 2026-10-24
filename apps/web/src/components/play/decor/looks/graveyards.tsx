import { cx } from '@/lib/ui';

import { BatAt, Fence, Grass, Moon, Stone } from '../art';
import { Body, Room, Text, useUid, type DecorBodyProps, type LookDecor } from '../frame';
import styles from '../Decor.module.css';

// Graveyard (N9-p07, G3): a gold moon and two bats over the word, the banned words as rows marked
// with little tombstones under R.I.P. IF YOU SAY, and a graveyard of planted stones, a cross, an iron
// fence and a bare tree along the bottom. Harvest moon (N6-c10, G5): the same rows in two columns,
// with a big orange moon rising behind the graveyard.

const NIGHT = '#081418';
// Ground under the stones, run out past the page's sides and down under the controls.
const GROUND = 'M-4000 41 L0 40 C60 41 112 30 150 22 C170 19 190 20 210 23 C250 30 290 38 330 38 C350 37 362 36.6 372 36.5 L4372 36.5 L4372 640 L-4000 640Z';
const TUFTS = [
  [2, 42.3],
  [24, 42.8],
  [66, 39.6],
  [112, 30],
  [140, 24.5],
  [166, 22.1],
  [230, 29.8],
  [256, 35.1],
  [294, 39.8],
  [328, 39.9],
  [352, 38.9],
] as const;

function GraveyardBody({ word, banned, swipeItem }: DecorBodyProps) {
  const uid = useUid();
  return (
    <Body look="graveyard">
      <Room view={[0, 100, 372, 108]} align="xMaxYMax">
        <Moon uid={uid} cx={288} cy={156} r={52} light="#F7E6AE" mid="#E3C878" dark="#C9A44F" glow="#E3C87866" />
        <BatAt left={110} top={150} scale={0.8} color="#06141A" />
        <BatAt left={180} top={180} scale={0.55} color="#06141A" />
      </Room>
      <Text className={cx(styles.graveyardText, styles.tombs)}>
        {swipeItem(word)}
        {swipeItem(banned)}
      </Text>
      <Room view={[0, 600, 372, 150]} grow>
        <defs>
          <radialGradient id={`${uid}-fog`}>
            <stop offset="0" stopColor="#D9EFEC" stopOpacity={0.08} />
            <stop offset="0.7" stopColor="#D9EFEC" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={96} cy={635} rx={113} ry={35} fill={`url(#${uid}-fog)`} />
        <ellipse cx={299} cy={638} rx={102} ry={32} fill={`url(#${uid}-fog)`} />
        {/* The bare tree reaches up beside the rows. */}
        <path
          d="M70 240 L66 120 Q64 80 40 50 M66 120 Q80 70 112 44 M64 90 Q50 70 20 64 M78 80 Q90 40 84 10 M46 56 Q40 30 28 22 M100 52 Q118 50 126 36"
          transform="translate(250 452)"
          stroke={NIGHT}
          strokeWidth={7}
          strokeLinecap="round"
          fill="none"
        />
        <Fence top={616} step={18} x0={-6} height={60} rails={[22, 54]} color={NIGHT} opacity={0.85} />
        <Stone x={18} y={619} w={46} h={62} top={23} rotate={-3} color={NIGHT} />
        <Stone x={80} y={627} w={36} h={46} top={8} rotate={2} color={NIGHT} />
        <path d="M11 0 H19 V12 H30 V20 H19 V44 H11 V20 H0 V12 H11Z" transform="translate(132 600) scale(1.4)" fill={NIGHT} />
        <Stone x={190} y={606} w={48} h={58} top={24} color={NIGHT} />
        <g transform="translate(0 632)" fill={NIGHT}>
          <path d={GROUND} />
          <Grass at={TUFTS} color={NIGHT} />
        </g>
      </Room>
    </Body>
  );
}

export const graveyard: LookDecor = { Body: GraveyardBody };

const EARTH = '#0A0603';

function HarvestMoonBody({ word, banned, swipeItem }: DecorBodyProps) {
  const uid = useUid();
  return (
    <Body look="harvestMoon">
      <Text className={cx(styles.harvestText, styles.tombs)}>
        {swipeItem(word)}
        {swipeItem(banned)}
      </Text>
      <Room view={[0, 462, 372, 288]} grow>
        <Moon uid={uid} cx={206} cy={580} r={110} light="#FFC77A" mid="#F6A65A" dark="#E8812A" at={[45, 40]} glow="#E8812A44" glowBlur={80} glowSpread={20} />
        <g transform="translate(0 560)" fill={EARTH}>
          <path d="M-4000 120 L0 110 Q120 70 230 96 Q310 112 372 90 L4372 90 L4372 700 L-4000 700Z" />
          <path d="M48 104 L48 66 Q48 46 68 46 Q88 46 88 66 L88 100Z" />
          <path d="M122 92 L122 40 H130 V58 H146 V66 H130 V90Z" transform="translate(-6 0)" />
          <path d="M164 90 L164 62 Q164 50 178 50 Q192 50 192 62 L192 92Z" />
          <path d="M262 104 L262 54 Q262 34 284 34 Q306 34 306 54 L306 106Z" />
          <path d="M326 96 L326 72 L350 72 L350 96Z" />
        </g>
        <Fence top={612} step={22} x0={-6} height={56} rails={[22, 50]} color={EARTH} />
      </Room>
    </Body>
  );
}

export const harvestMoon: LookDecor = { Body: HarvestMoonBody };
