'use client';

import { en } from '@unspoken/content';
import { layout, playMargins, ringCardSize, type LayoutStyle } from '@unspoken/design-tokens';
import { useRef, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';

import { useElementSize } from '@/lib/hooks';
import { Icon } from '@/components/ui/Icon';
import { cx, text } from '@/lib/ui';

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
  const note = model.note && <p className={cx(styles.note, text('small'))}>{model.note}</p>;
  const aboveControls = (
    <>
      <Stats slot={s.stats} at="footer" stats={model.stats} />
      {timer('aboveControls')}
    </>
  );
  // The split bar runs to the window's edges; a footer in its own color (Ombre) does too, and holds
  // the footer stats with the controls.
  const footer =
    s.controls.variant === 'splitBar' ? (
      <>
        {aboveControls}
        {note}
        <div className={styles.edge}>{controls}</div>
      </>
    ) : regions.controls ? (
      <div className={cx(styles.edge, styles.controlsRegion)} data-region={regions.controls}>
        {aboveControls}
        {controls}
        {note}
      </div>
    ) : (
      <>
        {aboveControls}
        {controls}
        {note}
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
      // The panel fills the space under the word, or wraps its content at the bottom with rounded
      // top corners (panel.size 'content', Bottom). A panelTop timer line sits on its top edge.
      body = (
        <>
          {upper}
          <div className={cx(styles.lowerGroup, s.panel?.size === 'content' && styles.lowerContent)}>
            {timer('panelTop')}
            <div className={styles.lowerWrap}>
              <div
                className={cx(styles.lower, arrangement === 'sheet' && styles.lowerSheet)}
                style={s.panel && ({ '--panel-radius': `var(--un-radius-${s.panel.radius})` } as CSSProperties)}
                data-region={regions.lower ?? 'panel'}
              >
                {arrangement === 'sheet' && <span className={styles.grabber} aria-hidden="true" />}
                {swipeable(banned)}
                <div className={styles.pushDown}>
                  <Stats slot={s.stats} at="footer" stats={model.stats} />
                  {s.controls.variant !== 'splitBar' && controls}
                  {note}
                </div>
              </div>
              {s.controls.variant === 'splitBar' && controls}
            </div>
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
          {!preview && <SwipeHint />}
          {children}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
      {overlay}
    </div>
  );
}

// "› SWIPE", shown from under the card while the swipe hint plays (useSwipe sets data-drag="hint").
function SwipeHint() {
  return (
    <span className={cx(styles.swipeHint, text('badge'))} aria-hidden="true">
      <Icon name="chevronRight" />
      {en.play.swipeHint}
    </span>
  );
}

type FrameTopProps = {
  layoutStyle: LayoutStyle;
  model: HeaderModel;
  actions?: Pick<PlayActions, 'onMenu' | 'onHeader'>;
  timer?: ReactNode;
};

// The top row: mode and level (when the style puts them at the top), stats or a clock, and the menu.
// It takes the style's header tone when that differs from the page (Sheet), and the page's otherwise.
export function FrameTop({ layoutStyle: s, model, actions, timer }: FrameTopProps) {
  return (
    <div className={styles.top} data-header={s.header.variant} data-region={s.regions.header}>
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

// On a short screen (a laptop) the height runs out first and the ring would sit right on Skip and
// Correct: shrink it a little, width and height alike, to leave layout.card.shortScreenClearance.
function keepCardShape({ width, height }: { width: number; height: number }) {
  const { maxWidth, maxHeight, shortScreenClearance } = layout.card;
  if (height >= (width * maxHeight) / maxWidth || height <= shortScreenClearance) return { width, height };
  const scale = (height - shortScreenClearance) / height;
  return { width: width * scale, height: height * scale };
}

type RingCardProps = { layoutStyle: LayoutStyle; model: PlayModel; actions?: PlayActions; word: ReactNode; banned: ReactNode };

// Card: the word tile inside the timer ring. The ring takes the space between the header and the
// controls, up to the board's size and keeping its shape (ringCardSize). It is drawn to the measured
// card box, which grows past that size only when the word and list need more room.
function RingCard({ layoutStyle: s, model, actions, word, banned }: RingCardProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const area = useElementSize(areaRef, { width: layout.card.maxWidth, height: layout.card.maxHeight });
  const size = keepCardShape(ringCardSize(area.width, area.height));
  const box = useElementSize(cardRef, size);
  const ringed = model.clock !== null && s.timer.variant === 'ring';
  return (
    <div ref={areaRef} className={styles.ringArea}>
      <div ref={cardRef} className={styles.swipeCard} style={size} data-swipe>
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
