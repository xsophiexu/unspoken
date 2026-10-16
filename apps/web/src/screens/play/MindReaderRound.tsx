'use client';

import { en } from '@unspoken/content';
import { filledPredictions, format, mindReaderCard, predictionsNeeded, type MindReaderRoundState } from '@unspoken/core';
import type { LayoutStyle } from '@unspoken/design-tokens';
import { useId } from 'react';

import { Overlay } from '@/components/play/Overlay';
import { Button } from '@/components/ui/Button';
import { FittedText } from '@/components/ui/FittedText';
import { cx, text } from '@/lib/ui';
import { useGame } from '@/state/game';

import { HowTo, ModeFrame } from './ModeFrame';
import styles from './rounds.module.css';
import type { RoundScreenProps } from './types';

type MindReaderRoundProps = RoundScreenProps & { round: MindReaderRoundState; layoutStyle: LayoutStyle };

// Mind Reader: predict the clues, hand the phone over, give clues, then count the matches.
export function MindReaderRound({ round, layoutStyle: s, onMenu, onHeader }: MindReaderRoundProps) {
  const { dispatch } = useGame();
  const labelId = useId();
  const card = mindReaderCard(round);
  const frame = { layoutStyle: s, round, onMenu, onHeader, cardKey: `${round.deck.seed}:${round.deck.index}:${round.phase}` };
  const word = card && <FittedText as="h1" text={card.word} max={s.word.size} min={s.word.minSize} maxLines={s.word.maxLines} className={text('word')} />;
  const total = round.config.mindReader.predictions;

  switch (round.phase) {
    case 'intro':
    case 'handOff': {
      const intro = round.phase === 'intro';
      return (
        <ModeFrame
          {...frame}
          card={intro ? <HowTo {...en.mindReader.howTo} /> : null}
          footer={
            intro && (
              <Button size="large" onClick={() => dispatch({ type: 'start' })}>
                {en.mindReader.howTo.start}
              </Button>
            )
          }
          overlay={
            !intro && (
              <Overlay
                tone={s.regions.page}
                label={en.mindReader.passLabel}
                title={en.mindReader.passTitle}
                sub={format(en.mindReader.remember, { n: total })}
                actions={
                  <Button size="large" onClick={() => dispatch({ type: 'takeOver' })}>
                    {en.mindReader.takeOver}
                  </Button>
                }
              />
            )
          }
        />
      );
    }
    case 'predict': {
      const needed = predictionsNeeded(round);
      return (
        <ModeFrame
          {...frame}
          cardKey={`${round.deck.seed}:${round.deck.index}`}
          card={
            <>
              <p className={cx(styles.kicker, text('label'))}>{en.mindReader.predictKicker}</p>
              {word}
              <div className={styles.bottom}>
                <div>
                  <h2 id={labelId} className={text('overline')}>
                    {format(en.mindReader.predictionsLabel, { n: total })}
                  </h2>
                  <p className={cx(styles.muted, text('hint'))}>{en.mindReader.predictionsHint}</p>
                </div>
                <div className={styles.inputs} role="group" aria-labelledby={labelId}>
                  {round.predictions.map((value, index) => {
                    const placeholder = format(en.mindReader.placeholder, { n: index + 1 });
                    return (
                      <input
                        key={index}
                        className={cx(styles.input, text('input'))}
                        value={value}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        autoComplete="off"
                        enterKeyHint="next"
                        onChange={(event) => dispatch({ type: 'predict', index, text: event.target.value })}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          }
          footer={
            <Button size="large" disabled={needed > 0} onClick={() => dispatch({ type: 'handOff' })}>
              {needed > 0 ? format(en.mindReader.writeMore, { n: needed }) : en.mindReader.handOff}
            </Button>
          }
        />
      );
    }
    case 'clues':
      return (
        <ModeFrame
          {...frame}
          card={
            <>
              <p className={cx(styles.kicker, text('label'))}>{en.mindReader.clueKicker}</p>
              {word}
              <p className={cx(styles.muted, text('hint'))}>{en.mindReader.clueHint}</p>
            </>
          }
          footer={
            <div className={styles.buttons}>
              <Button size="large" variant="secondary" onClick={() => dispatch({ type: 'finishClues', guessed: false })}>
                {en.mindReader.pass}
              </Button>
              <Button size="large" onClick={() => dispatch({ type: 'finishClues', guessed: true })}>
                {en.mindReader.gotIt}
              </Button>
            </div>
          }
        />
      );
    case 'reveal':
      return (
        <ModeFrame
          {...frame}
          card={
            <>
              {word}
              <span className={cx(styles.status, text('label'))} data-passed={round.guessed ? undefined : ''}>
                {round.guessed ? en.mindReader.guessed : en.mindReader.passed}
              </span>
              <div className={styles.bottom}>
                <h2 className={cx(styles.kicker, text('overline'))}>{en.mindReader.predicted}</h2>
                <ol className={cx(styles.predictions, text('chip'))}>
                  {filledPredictions(round).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
                <p className={cx(styles.muted, text('hint'))}>{en.mindReader.howMany}</p>
              </div>
            </>
          }
          footer={
            <Button size="large" onClick={() => dispatch({ type: 'nextWord' })}>
              {en.mindReader.nextWord}
            </Button>
          }
        />
      );
  }
}

