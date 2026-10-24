import { BatAt, Moon, Stars, type Star } from '../art';
import { BoardArt, Body, Room, StatLines, Text, TopRow, useUid, type DecorBodyProps, type DecorTopProps, type LookDecor } from '../frame';
import styles from '../Decor.module.css';
import { Header, MenuButton } from '../../Header';
import { ClockChip } from '../../Timer';

// Witch hat (N22-c04, PU4): purple and gold. The clock big in the middle of the top row with the mode
// and level under it, the score at the left; a big gold moon and bats, and the word on a tilted
// purple card with a witch hat on its corner and the banned words as gold-outlined chips.

const STARS: readonly Star[] = [
  [249, 258, 1, 0.3],
  [34, 327, 2, 0.7],
  [92, 208, 2, 0.5],
  [17, 366, 2, 0.5],
  [48, 720, 2, 0.9],
  [263, 354, 1, 0.5],
  [157, 107, 2, 0.7],
  [264, 299, 2, 0.9],
  [86, 338, 2, 0.7],
  [26, 183, 1, 0.9],
  [78, 300, 1, 0.9],
  [145, 288, 2, 0.9],
  [55, 163, 1, 0.7],
  [302, 730, 1, 0.3],
  [173, 281, 2, 0.9],
  [17, 143, 2, 0.3],
  [321, 179, 2, 0.5],
  [73, 356, 2, 0.5],
];

function WitchHatTop({ layoutStyle: s, model, actions }: DecorTopProps) {
  return (
    <TopRow className={styles.witchTop}>
      <StatLines stats={model.stats} className={styles.witchStats} />
      <div className={styles.witchCenter}>
        {model.clock && <ClockChip clock={model.clock} onPause={actions?.onPause} fill="none" className={styles.witchClock} />}
        <Header slot={{ ...s.header, size: 13 }} at="top" model={model} withSubline={false} onOpen={actions?.onHeader} />
      </div>
      <MenuButton slot={s.header} onMenu={actions?.onMenu} />
    </TopRow>
  );
}

function WitchHatBody({ word, banned, swipeCard }: DecorBodyProps) {
  const uid = useUid();
  return (
    <Body look="witchHat">
      <Room view={[0, 100, 372, 300]} align="xMinYMax">
        <Moon uid={uid} cx={48} cy={230} r={118} light="#F6E2A4" mid="#E3C878" dark="#C9A44F" at={[40, 38]} glow="#E3C87850" glowSpread={18} />
        <BatAt left={166} top={173} w={120} color="#0C0618" />
        <BatAt left={283} top={260.7} w={66} color="#0C0618" />
      </Room>
      <Text className={styles.witchText}>
        {swipeCard(
          <div className={styles.witchCard}>
            <svg className={styles.witchHat} viewBox="0 0 100 90" aria-hidden="true">
              <path d="M44 4 Q52 2 56 10 L68 62 L32 62 Q40 30 30 22 Q40 22 44 4Z" fill="#0C0618" />
              <ellipse cx={50} cy={68} rx={48} ry={11} fill="#0C0618" />
              <path d="M33 56 L67 56 L69 64 L31 64Z" fill="#E3C878" />
            </svg>
            {word}
            {banned}
          </div>,
        )}
      </Text>
    </Body>
  );
}

function WitchHatBackdrop() {
  return (
    <BoardArt>
      <Stars stars={STARS} color="#F6E7B8" />
    </BoardArt>
  );
}

export const witchHat: LookDecor = { Body: WitchHatBody, Top: WitchHatTop, Backdrop: WitchHatBackdrop };
