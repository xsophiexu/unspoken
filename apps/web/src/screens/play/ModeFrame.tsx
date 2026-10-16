'use client';

import { headerModel } from '@/components/play/model';
import { Header } from '@/components/play/Header';
import { FrameShell, FrameTop } from '@/components/play/PlayFrame';
import { Stats } from '@/components/play/Stats';
import { cx, text } from '@/lib/ui';
import type { RoundState } from '@unspoken/core';
import type { LayoutStyle } from '@unspoken/design-tokens';
import type { HTMLAttributes, ReactNode, Ref } from 'react';

import styles from './rounds.module.css';

type ModeFrameProps = {
  layoutStyle: LayoutStyle;
  round: RoundState;
  onMenu: () => void;
  onHeader: () => void;
  // The card's contents; null shows no card (a pass-the-phone step).
  card: ReactNode;
  // Wraps the card so it can be swiped (Reverse's answer).
  swipeable?: boolean;
  cardKey?: string;
  footer: ReactNode;
  overlay?: ReactNode;
  frameRef?: Ref<HTMLDivElement>;
  surface?: HTMLAttributes<HTMLDivElement>;
};

// Reverse and Mind Reader in the player's style: the style's header and stats around one card.
export function ModeFrame({ layoutStyle: s, round, onMenu, onHeader, card, swipeable = false, cardKey, footer, overlay, frameRef, surface }: ModeFrameProps) {
  const model = headerModel(round);
  // The card takes the style's word tone, or stands off the page when the style has none.
  const tone = s.regions.word ?? (s.regions.page === 'surface' ? 'raised' : 'surface');
  const content = (
    <div key={cardKey} className={cx(styles.card, styles.enter)} data-region={tone}>
      {card}
    </div>
  );
  return (
    <FrameShell
      layoutStyle={s}
      frameRef={frameRef}
      surface={surface}
      overlay={overlay}
      top={
        <>
          <FrameTop layoutStyle={s} model={model} actions={{ onMenu, onHeader }} />
          <Stats slot={s.stats} at="belowHeader" stats={model.stats} />
        </>
      }
      footer={
        <>
          <Stats slot={s.stats} at="footer" stats={model.stats} />
          {footer}
        </>
      }
    >
      <Header slot={s.header} at="aboveWord" model={model} withSubline={false} onOpen={onHeader} />
      <Stats slot={s.stats} at="aboveWord" stats={model.stats} />
      {card !== null &&
        (swipeable ? (
          <div className={styles.swipe} data-swipe>
            {content}
          </div>
        ) : (
          content
        ))}
      <Stats slot={s.stats} at="underWord" stats={model.stats} />
    </FrameShell>
  );
}

type HowToProps = {
  kicker: string;
  title: string;
  steps: readonly { title: string; body: string }[];
};

// The "How it works" card Reverse and Mind Reader show before their first word.
export function HowTo({ kicker, title, steps }: HowToProps) {
  return (
    <>
      <p className={cx(styles.kicker, text('label'))}>{kicker}</p>
      <h2 className={cx(styles.preLine, text('introTitle'))}>{title}</h2>
      <ol className={styles.steps}>
        {steps.map((step, i) => (
          <li key={step.title} className={styles.step}>
            <span className={cx(styles.stepNumber, text('label'))} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.stepText}>
              <span className={text('optionTitle')}>{step.title}</span>
              <span className={cx(styles.muted, text('hint'))}>{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
