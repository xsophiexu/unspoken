'use client';

import { en } from '@unspoken/content';
import { blankCellSize, format, plural, reverseCard, wordShape, type ReverseRoundState } from '@unspoken/core';
import { space, type LayoutStyle } from '@unspoken/design-tokens';
import { useRef, type CSSProperties } from 'react';

import { Controls } from '@/components/play/Controls';
import { useSwipe, type SwipeAnswer } from '@/components/play/useSwipe';
import { Button, IconButton } from '@/components/ui/Button';
import { FittedText } from '@/components/ui/FittedText';
import { useElementSize } from '@/lib/hooks';
import { cx, text } from '@/lib/ui';
import { useGame } from '@/state/game';

import { HowTo, ModeFrame } from './ModeFrame';
import styles from './rounds.module.css';
import type { RoundScreenProps } from './types';
import { useAnswerKeys } from './useAnswerKeys';

type ReverseRoundProps = RoundScreenProps & { round: ReverseRoundState; layoutStyle: LayoutStyle };

const labels = { skip: en.reverse.missed, correct: en.reverse.got, skipLink: en.reverse.missedLink, correctLink: en.reverse.gotLink };

// Reverse: read the clues, guess the hidden word, then swipe Got it or Missed.
export function ReverseRound({ round, layoutStyle: s, blocked, onMenu, onHeader }: ReverseRoundProps) {
  const { dispatch } = useGame();
  const frameRef = useRef<HTMLDivElement>(null);
  const view = reverseCard(round);
  const answering = round.phase === 'answer' && !blocked && view !== null;
  const cardKey = `${round.deck.seed}:${round.deck.index}`;
  const { surface, answer } = useSwipe({
    frameRef,
    can: { correct: answering, skip: answering },
    onAnswer: (kind: SwipeAnswer) => dispatch({ type: kind === 'correct' ? 'got' : 'missed' }),
    cardKey: round.phase === 'answer' ? cardKey : null,
  });
  useAnswerKeys(answering, answer);

  const frame = { layoutStyle: s, round, onMenu, onHeader, frameRef };

  if (round.phase === 'intro' || !view) {
    return (
      <ModeFrame
        {...frame}
        card={<HowTo {...en.reverse.howTo} />}
        footer={
          <Button size="large" onClick={() => dispatch({ type: 'start' })}>
            {en.reverse.howTo.start}
          </Button>
        }
      />
    );
  }

  const clues = (
    <ul className={styles.chips}>
      {view.clues.map((clue, i) =>
        clue.revealed ? (
          <li key={i} className={cx(styles.chip, text('chip'))}>
            {clue.text}
          </li>
        ) : round.phase === 'answer' ? (
          <li key={i} className={cx(styles.chip, styles.unused, text('chip'))}>
            {clue.text}
          </li>
        ) : (
          <li key={i} className={cx(styles.chip, styles.hiddenChip, text('chip'))} aria-label={en.reverse.hiddenWord}>
            ?
          </li>
        ),
      )}
    </ul>
  );

  if (round.phase === 'guess') {
    const shape = wordShape(view.card.word);
    return (
      <ModeFrame
        {...frame}
        cardKey={cardKey}
        card={
          <>
            <div className={styles.row}>
              <p className={cx(styles.kicker, text('label'))}>{en.reverse.hiddenWord}</p>
              <span className={cx(styles.worth, text('label'))}>{format(en.reverse.worth, { points: plural(view.worth, en.units.points) })}</span>
            </div>
            <div className={styles.wordRow}>
              {round.peek ? (
                <FittedText as="h1" text={view.card.word} max={s.word.size} min={s.word.minSize} maxLines={s.word.maxLines} className={cx(styles.peek, text('word'))} />
              ) : (
                <Blanks word={view.card.word} />
              )}
              <IconButton
                icon={round.peek ? 'eyeOff' : 'eye'}
                label={round.peek ? en.reverse.hideWordA11y : en.reverse.showWordA11y}
                onClick={() => dispatch({ type: 'togglePeek' })}
                aria-pressed={round.peek}
              />
            </div>
            <p className={cx(styles.muted, text('hint'))}>
              {format(en.reverse.shape, { words: plural(shape.words, en.units.words), letters: plural(shape.letters, en.units.letters) })}
            </p>
            <div className={styles.bottom}>
              <h2 className={cx(styles.kicker, text('overline'))}>{en.reverse.clues}</h2>
              {clues}
              <Button variant="secondary" disabled={!view.canReveal} onClick={() => dispatch({ type: 'revealClue' })}>
                {view.canReveal ? en.reverse.reveal : en.reverse.allShowing}
              </Button>
            </div>
          </>
        }
        footer={
          <Button size="large" onClick={() => dispatch({ type: 'showAnswer' })}>
            {en.reverse.showWord}
          </Button>
        }
      />
    );
  }

  return (
    <ModeFrame
      {...frame}
      swipeable
      surface={surface}
      cardKey={cardKey}
      card={
        <>
          <p className={cx(styles.kicker, text('label'))}>{en.reverse.theWordWas}</p>
          <FittedText as="h1" text={view.card.word} max={s.word.size} min={s.word.minSize} maxLines={s.word.maxLines} className={text('word')} />
          <p className={cx(styles.muted, text('hint'))}>{en.reverse.question}</p>
          <div className={styles.bottom}>
            <h2 className={cx(styles.kicker, text('overline'))}>{format(en.reverse.cluesUsed, { revealed: view.revealed, total: view.total })}</h2>
            {clues}
          </div>
        </>
      }
      footer={
        <Controls
          slot={s.controls}
          regions={s.regions}
          canSkip={answering}
          canCorrect={answering}
          onSkip={() => answer('skip')}
          onCorrect={() => answer('correct')}
          showHint
          labels={labels}
        />
      }
    />
  );
}

// One underline per letter, each word on its own line, sized so the longest word fits.
function Blanks({ word }: { word: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(ref, { width: 0, height: 0 });
  const gap = space[1.5];
  const cell = blankCellSize(word, { room: width, gap });
  return (
    <div ref={ref} className={styles.blanks} style={{ '--cell': `${cell}px`, '--gap': `${gap}px` } as CSSProperties} aria-label={en.reverse.hiddenWord} role="img">
      {word
        .trim()
        .split(/\s+/)
        .map((part, i) => (
          <span key={i} className={styles.blankWord}>
            {[...part].map((ch, j) =>
              /[\p{L}\p{N}]/u.test(ch) ? (
                <span key={j} className={styles.dash} />
              ) : (
                <span key={j} className={cx(styles.mark, text('chip'))}>
                  {ch}
                </span>
              ),
            )}
          </span>
        ))}
    </div>
  );
}
