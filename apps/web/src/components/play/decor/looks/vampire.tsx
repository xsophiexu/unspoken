import { BatAt, Moon, Stars, type Star } from '../art';
import { BoardArt, Body, Room, StatLines, Text, TopRow, useUid, type DecorBodyProps, type DecorTopProps, type LookDecor } from '../frame';
import styles from '../Decor.module.css';
import { Header, MenuButton } from '../../Header';
import { ClockChip } from '../../Timer';

// Vampire (N22-c07, PU7): burgundy and bone. The clock in a pill at the left of the top row and the
// mode centered over its level badge; a bone-white moon with a bat across it, the word on a tilted
// bone card with the banned words as filled chips, and Skip and Correct joined in one outlined pill.

const BAT = '#1A0408';
const STARS: readonly Star[] = [
  [169, 254, 2, 0.3],
  [302, 159, 1, 0.3],
  [218, 171, 1, 0.3],
  [67, 328, 1, 0.9],
  [29, 326, 1, 0.5],
  [353, 285, 1, 0.5],
  [194, 199, 1, 0.3],
  [320, 310, 2, 0.9],
  [131, 284, 1, 0.3],
  [41, 220, 2, 0.5],
];

function VampireTop({ layoutStyle: s, model, actions }: DecorTopProps) {
  return (
    <TopRow className={styles.vampireTop}>
      <div className={styles.vampireStart}>
        {model.clock && (
          <span className={styles.vampireClock}>
            <svg viewBox="0 0 14 14" aria-hidden="true">
              <circle cx={7} cy={7} r={5.6} fill="none" stroke="currentColor" strokeWidth={1.8} />
              <path d="M7 4 V7.4 L9.2 8.6" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" />
            </svg>
            <ClockChip clock={model.clock} onPause={actions?.onPause} fill="none" />
          </span>
        )}
      </div>
      <div className={styles.vampireCenter}>
        <Header slot={{ ...s.header, size: 19 }} at="top" model={model} withSubline={false} onOpen={actions?.onHeader} />
        <StatLines stats={model.stats} className={styles.vampireStats} />
      </div>
      <div className={styles.vampireEnd}>
        <MenuButton slot={s.header} onMenu={actions?.onMenu} />
      </div>
    </TopRow>
  );
}

function VampireBody({ word, banned, swipeCard }: DecorBodyProps) {
  const uid = useUid();
  return (
    <Body look="vampire">
      <Room view={[0, 110, 372, 290]}>
        <Moon uid={uid} cx={261} cy={193} r={75} light="#F4ECDC" mid="#EADFC8" dark="#CDBE9E" at={[40, 38]} glow="#EADFC83A" glowSpread={18} />
        <BatAt left={189} top={200.3} w={114} color={BAT} />
        <BatAt left={92} top={251.4} w={72} color={BAT} />
        <BatAt left={300} top={330} scale={0.8} rotate={8} color={BAT} />
      </Room>
      <Text className={styles.vampireText}>
        {swipeCard(
          <div className={styles.vampireCard}>
            {word}
            {banned}
          </div>,
        )}
      </Text>
    </Body>
  );
}

function VampireBackdrop() {
  return (
    <BoardArt>
      <Stars stars={STARS} color="#EADFC8" />
    </BoardArt>
  );
}

export const vampire: LookDecor = { Body: VampireBody, Top: VampireTop, Backdrop: VampireBackdrop };
