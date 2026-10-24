import { cx } from '@/lib/ui';

import { BatAt, Moon, Stars, Web, type Star } from '../art';
import { BoardArt, Body, Room, Text, useUid, type DecorBodyProps, type LookDecor } from '../frame';
import styles from '../Decor.module.css';

// Silver moon (N22-c06, PU6): midnight blue and silver. A cratered silver moon with a cobweb in the
// corner and a bat, the word centered in a double silver frame, the banned words in outlined tiles,
// and two buttons.

const STARS: readonly Star[] = [
  [297, 182, 2, 0.7],
  [22, 100, 1, 0.9],
  [15, 379, 2, 0.5],
  [280, 196, 1, 0.7],
  [343, 724, 1, 0.9],
  [175, 195, 2, 0.9],
  [362, 196, 1, 0.7],
  [53, 146, 1, 0.7],
  [253, 298, 1, 0.7],
  [129, 716, 2, 0.7],
  [186, 703, 1, 0.3],
  [105, 219, 2, 0.7],
  [74, 711, 1, 0.3],
  [100, 273, 1, 0.7],
  [289, 735, 2, 0.7],
  [31, 289, 2, 0.9],
  [129, 191, 2, 0.9],
  [198, 178, 2, 0.9],
  [47, 296, 2, 0.9],
  [253, 276, 1, 0.3],
  [279, 226, 2, 0.7],
  [219, 726, 2, 0.7],
  [255, 245, 2, 0.9],
  [341, 266, 2, 0.7],
  [253, 261, 2, 0.3],
  [33, 286, 1, 0.3],
];

function SilverMoonBody({ word, banned, swipeItem }: DecorBodyProps) {
  const uid = useUid();
  return (
    <Body look="silverMoon">
      <Room view={[0, 96, 372, 180]}>
        <Moon uid={uid} cx={186} cy={176} r={68} light="#F4F6FA" mid="#D5DCE6" dark="#AEB8C8" at={[40, 38]} glow="#D5DCE640" glowSpread={18}>
          <circle cx={202} cy={190} r={15} fill="#B9C3D266" />
          <circle cx={164} cy={165} r={8} fill="#B9C3D266" />
        </Moon>
        <Web x={372} y={96} size={140} spokes={6} rings={6} color="#D5DCE650" width={1.3} flip />
        <BatAt left={27} top={220.1} w={78} color="#060C1E" />
      </Room>
      <Text className={cx(styles.silverText, styles.tiles)}>
        {swipeItem(
          <div className={styles.silverFrame}>
            <div className={styles.silverFrameInner}>{word}</div>
          </div>,
        )}
        {swipeItem(banned)}
      </Text>
    </Body>
  );
}

function SilverMoonBackdrop() {
  return (
    <BoardArt>
      <Stars stars={STARS} color="#EEF2F7" />
    </BoardArt>
  );
}

export const silverMoon: LookDecor = { Body: SilverMoonBody, Backdrop: SilverMoonBackdrop };
