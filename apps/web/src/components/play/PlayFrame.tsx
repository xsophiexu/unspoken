'use client';

import { layout, playMargins, type LayoutStyle } from '@unspoken/design-tokens';
import { useRef, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';

import { useElementSize } from '@/lib/hooks';
import { cx } from '@/lib/ui';

import { BannedList } from './BannedList';
import { Controls } from './Controls';
import { Header, MenuButton } from './Header';
import type { HeaderModel, PlayModel } from './model';
import { Stats } from './Stats';
import { Timer } from './Timer';
import { Word } from './Word';
import styles from './PlayFrame.module.css';

export type PlayActions = {
  onCorrect: () => void;
  onSkip: () => void;
  onPause: () => void;
  onMenu: () => void;
  // The header's mode/level control: the sheet for pill styles, the difficulty picker for Card.
  onHeader: () => void;
};

type PlayFrameProps = {
  layoutStyle: LayoutStyle;
  model: PlayModel;
  // Absent for previews (Customize thumbnails), which render the same screen inert.
  actions?: PlayActions;
  // Pointer handlers for swiping, on the area that holds the card.
  surface?: HTMLAttributes<HTMLDivElement>;
  frameRef?: Ref<HTMLDivElement>;
  // Paused, Pass the phone and round-over screens, drawn over the frame.
  overlay?: ReactNode;
};

// The play screen for any layout style, assembled from the slot components. The arrangement decides
// how the regions stack; each slot decides what it shows at each anchor. Adding a style is adding
// data to @unspoken/design-tokens, not code here.
export function PlayFrame({ layoutStyle: s, model, actions, surface, frameRef, overlay }: PlayFrameProps) {
  const { arrangement, regions } = s;
  const card = model.card;
  const word = card && <Word slot={s.word} word={card.word} />;
  const banned = card && <BannedList slot={s.banned} words={card.banned} freshIndex={card.freshIndex} />;
  const timer = (at: Parameters<typeof Timer>[0]['at']) => <Timer slot={s.timer} at={at} clock={model.clock} onPause={actions?.onPause} />;
  const controls = (
    <Controls
      slot={s.controls}
      regions={regions}
      canSkip={model.canSkip}
      canCorrect={model.canCorrect}
      onSkip={actions?.onSkip}
      onCorrect={actions?.onCorrect}
      showHint={model.firstCard}
    />
  );
  // The split bar and a toned controls footer run to the window's edges.
  const edgeControls =
    s.controls.variant === 'splitBar' ? (
      <div className={styles.edge}>{controls}</div>
    ) : regions.controls ? (
      <div className={cx(styles.edge, styles.controlsRegion)} data-region={regions.controls}>
        {controls}
      </div>
    ) : (
      controls
    );
  const footer = (
    <>
      <Stats slot={s.stats} at="footer" stats={model.stats} />
      {timer('aboveControls')}
      {edgeControls}
    </>
  );
  // The word and list follow the finger while dragging (the swipe surface sets --drag-x).
  const swipeable = (content: ReactNode, className = styles.swipeItem) =>
    content && (
      <div className={className} data-swipe>
        <div key={card?.key} className={styles.enter}>
          {content}
        </div>
      </div>
    );
  const upper = (
    <div className={styles.upper}>
      <Header slot={s.header} at="aboveWord" model={model} withSubline={false} onOpen={actions?.onHeader} />
      <Stats slot={s.stats} at="aboveWord" stats={model.stats} />
      {swipeable(word)}
      {timer('belowWord')}
      <Stats slot={s.stats} at="underWord" stats={model.stats} />
    </div>
  );

  let body: ReactNode;
  switch (arrangement) {
    case 'ringCard':
      body = <RingCard layoutStyle={s} model={model} actions={actions} word={word} banned={banned} />;
      break;
    case 'floatingCard':
      body = (
        <>
          <Stats slot={s.stats} at="aboveWord" stats={model.stats} />
          {swipeable(
            <div className={cx(styles.container, styles[`container-${s.word.container}`])} data-region={regions.word}>
              {word}
              <div className={styles.pushDown}>{banned}</div>
            </div>,
            styles.swipeCard,
          )}
        </>
      );
      break;
    case 'stack':
      body = (
        <>
          {upper}
          <div className={cx(styles.list, s.banned.variant === 'bands' && styles.listAtBottom)}>{swipeable(banned)}</div>
        </>
      );
      break;
    case 'lowerPanel':
    case 'sheet':
      body = (
        <>
          {upper}
          {timer('panelTop')}
          <div className={styles.lowerWrap}>
            <div className={cx(styles.lower, arrangement === 'sheet' && styles.lowerSheet)} data-region={regions.lower ?? 'panel'}>
              {arrangement === 'sheet' && <span className={styles.grabber} aria-hidden="true" />}
              {swipeable(banned)}
              <div className={styles.pushDown}>
                <Stats slot={s.stats} at="footer" stats={model.stats} />
                {s.controls.variant !== 'splitBar' && controls}
              </div>
            </div>
            {s.controls.variant === 'splitBar' && controls}
          </div>
        </>
      );
      break;
  }

  const panelHoldsFooter = arrangement === 'lowerPanel' || arrangement === 'sheet';
  return (
    <FrameShell
      layoutStyle={s}
      preview={!actions}
      frameRef={frameRef}
      surface={surface}
      top={
        <>
          <FrameTop layoutStyle={s} model={model} actions={actions} timer={timer('header')} />
          {timer('top')}
          <Stats slot={s.stats} at="belowHeader" stats={model.stats} />
        </>
      }
      footer={panelHoldsFooter ? undefined : footer}
      overlay={overlay}
    >
      {body}
    </FrameShell>
  );
}

type FrameShellProps = {
  layoutStyle: LayoutStyle;
  preview?: boolean;
  frameRef?: Ref<HTMLDivElement>;
  surface?: HTMLAttributes<HTMLDivElement>;
  top: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
};

// The style's play screen margins (playMargins) for PlayFrame.module.css, which adds the safe areas.
function marginVars(s: LayoutStyle): CSSProperties {
  const m = playMargins(s);
  return { '--margin-x': `${m.paddingX}px`, '--margin-top': `${m.paddingTop}px`, '--margin-bottom': `${m.paddingBottom}px` } as CSSProperties;
}

// The page region across the window with the game in a centered column: top row, body, footer.
// Every round screen (swipe, Reverse, Mind Reader) is drawn in it.
export function FrameShell({ layoutStyle: s, preview = false, frameRef, surface, top, children, footer, overlay }: FrameShellProps) {
  return (
    <div
      ref={frameRef}
      className={cx(styles.frame, preview && styles.preview)}
      style={marginVars(s)}
      data-region={s.regions.page}
      data-arrangement={s.arrangement}
    >
      <div className={styles.column} inert={overlay ? true : undefined}>
        {top}
        <div className={styles.body} {...surface}>
          {children}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
      {overlay}
    </div>
  );
}

type FrameTopProps = {
  layoutStyle: LayoutStyle;
  model: HeaderModel;
  actions?: Pick<PlayActions, 'onMenu' | 'onHeader'>;
  timer?: ReactNode;
};

// The top row: mode and level (when the style puts them at the top), stats or a clock, and the menu.
export function FrameTop({ layoutStyle: s, model, actions, timer }: FrameTopProps) {
  return (
    <div className={styles.top} data-header={s.header.variant}>
      <div className={styles.topStart}>
        <Header slot={s.header} at="top" model={model} withSubline={s.stats.placement === 'subline'} onOpen={actions?.onHeader} />
      </div>
      <div className={styles.topEnd}>
        <Stats slot={s.stats} at="header" stats={model.stats} />
        {timer}
        <MenuButton slot={s.header} onMenu={actions?.onMenu} />
      </div>
    </div>
  );
}

type RingCardProps = { layoutStyle: LayoutStyle; model: PlayModel; actions?: PlayActions; word: ReactNode; banned: ReactNode };

// Card: the word tile inside the timer ring, as large as the screen allows up to the board's size.
// The ring is drawn to the measured card box.
function RingCard({ layoutStyle: s, model, actions, word, banned }: RingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const box = useElementSize(ref, { width: layout.card.maxWidth, height: layout.card.maxHeight });
  const ringed = model.clock !== null && s.timer.variant === 'ring';
  return (
    <div className={styles.ringArea}>
      <div ref={ref} className={styles.swipeCard} data-swipe>
        {model.card && (
          <div key={model.card.key} className={cx(styles.enter, styles.ringBox)}>
            <Timer slot={s.timer} at="ring" clock={model.clock} onPause={actions?.onPause} box={box} />
            <div className={cx(styles.container, styles[`container-${s.word.container}`], ringed && styles.inRing)} data-region={s.regions.word}>
              {word}
              <div className={styles.pushDown}>{banned}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
