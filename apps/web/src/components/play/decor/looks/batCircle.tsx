import { cx } from '@/lib/ui';

import { BatAt, Glow, Moon, Stars, type Star } from '../art';
import { BoardArt, Body, Room, Text, useUid, type DecorBodyProps, type LookDecor } from '../frame';
import styles from '../Decor.module.css';

// Bat circle (N19-h05, MB5): bats circle the word, centered in a soft gold glow under a small moon;
// the banned words in a two-column grid of tiles at the bottom.

const BAT = '#06141A';
// The bats around the word: left, top and width of each (the designs' 60 × 26 bat).
const BATS = [
  [36, 196, 60],
  [141, 163.9, 42],
  [259, 180.7, 66],
  [325, 285.9, 42],
  [20, 332.6, 48],
  [296, 380, 60],
  [82, 415.2, 36],
] as const;

const STARS: readonly Star[] = [
  [124, 410, 1, 0.9],
  [50, 168, 1, 0.9],
  [92, 208, 2, 0.5],
  [17, 756, 2, 0.7],
  [325, 481, 1, 0.7],
  [157, 107, 2, 0.7],
  [26, 183, 1, 0.9],
  [362, 451, 1, 0.5],
  [107, 750, 2, 0.7],
  [98, 464, 2, 0.7],
  [105, 431, 1, 0.3],
  [366, 334, 2, 0.5],
  [66, 439, 1, 0.7],
  [239, 126, 1, 0.7],
  [361, 184, 2, 0.7],
  [13, 430, 2, 0.7],
  [321, 179, 2, 0.5],
  [85, 439, 1, 0.7],
  [90, 473, 2, 0.7],
  [296, 199, 2, 0.5],
];

function BatCircleBody({ word, banned, swipeItem }: DecorBodyProps) {
  const uid = useUid();
  return (
    <Body look="batCircle">
      {/* The word sits in the middle of the bats, which take whatever room the list leaves. */}
      <div className={styles.batRing}>
        <Room view={[0, 100, 372, 390]} align="xMidYMid" grow className={styles.batArt}>
          <Glow
            uid={uid}
            cx={186}
            cy={300}
            r={210}
            stops={[
              [0, '#E3C878', 0.25],
              [0.7, '#E3C878', 0],
            ]}
          />
          <Moon uid={uid} cx={305} cy={145} r={35} light="#F7E6AE" mid="#E3C878" dark="#C9A44F" glow="#E3C87866" />
          {BATS.map(([left, top, w]) => (
            <BatAt key={left} left={left} top={top} w={w} color={BAT} />
          ))}
        </Room>
        <Text className={styles.batWord}>{swipeItem(word)}</Text>
      </div>
      <Text className={cx(styles.batList, styles.tiles)}>{swipeItem(banned)}</Text>
    </Body>
  );
}

function BatCircleBackdrop() {
  return (
    <BoardArt>
      <Stars stars={STARS} color="#FFFFFF" />
    </BoardArt>
  );
}

export const batCircle: LookDecor = { Body: BatCircleBody, Backdrop: BatCircleBackdrop };
