import { Stars, type Star } from '../art';
import { BoardArt, Body, StatLines, Text, TopRow, type DecorBodyProps, type DecorTopProps, type LookDecor } from '../frame';
import styles from '../Decor.module.css';
import { Header, MenuButton } from '../../Header';
import { ClockChip } from '../../Timer';

// Tarot (N24-u05, PU14): heather and cream. The mode and level over a hairline with the score and the
// clock under it; the word on a cream tarot card with a gold double border, a crescent moon and
// sparkles, the banned words in centered ruled rows, two more cards fanned out behind it.

const STARS: readonly Star[] = [
  [18, 576, 1, 0.3],
  [10, 321, 2, 0.7],
  [4, 105, 1, 0.5],
  [357, 301, 2, 0.7],
  [15, 469, 2, 0.5],
  [304, 103, 2, 0.3],
  [360, 423, 1, 0.9],
  [15, 466, 2, 0.3],
  [300, 109, 2, 0.3],
  [366, 285, 1, 0.3],
  [355, 424, 2, 0.5],
  [356, 416, 2, 0.5],
  [357, 400, 2, 0.5],
  [358, 180, 2, 0.5],
];

const SPARKLE = 'M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0Z';

function TarotTop({ layoutStyle: s, model, actions }: DecorTopProps) {
  return (
    <TopRow className={styles.tarotTop}>
      <div className={styles.tarotRow}>
        <Header slot={{ ...s.header, size: 21 }} at="top" model={model} withSubline={false} onOpen={actions?.onHeader} />
        <MenuButton slot={s.header} onMenu={actions?.onMenu} />
      </div>
      <div className={styles.tarotRule} />
      <div className={styles.tarotRow}>
        <StatLines stats={model.stats} className={styles.tarotStats} />
        {model.clock && <ClockChip clock={model.clock} onPause={actions?.onPause} fill="none" />}
      </div>
    </TopRow>
  );
}

function TarotBody({ word, banned, swipeCard }: DecorBodyProps) {
  return (
    <Body look="tarot">
      <Text className={styles.tarotText}>
        <div className={styles.tarotFan} aria-hidden="true">
          <i className={styles.tarotFanLeft} />
          <i className={styles.tarotFanRight} />
        </div>
        {swipeCard(
          <div className={styles.tarotCard}>
            <div className={styles.tarotBorder}>
              <div className={styles.tarotFace}>
                <svg className={styles.tarotMoon} viewBox="0 0 100 40" aria-hidden="true">
                  <path d={SPARKLE} fill="#B39B6A" transform="translate(11 10) scale(0.65)" />
                  <path d="M26 4 A16 16 0 1 0 26 36 A9 16 0 0 1 26 4Z" fill="#8A7A8C" transform="translate(41 0) scale(0.9)" />
                  <path d={SPARKLE} fill="#B39B6A" transform="translate(88 16) scale(0.5)" />
                </svg>
                {word}
                {banned}
              </div>
            </div>
          </div>,
        )}
      </Text>
    </Body>
  );
}

function TarotBackdrop() {
  return (
    <BoardArt>
      <Stars stars={STARS} color="#EDE5D6" />
    </BoardArt>
  );
}

export const tarot: LookDecor = { Body: TarotBody, Top: TarotTop, Backdrop: TarotBackdrop };
