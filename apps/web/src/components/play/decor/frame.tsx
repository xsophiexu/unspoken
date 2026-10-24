'use client';

import { en } from '@unspoken/content';
import { plural, type RoundStats } from '@unspoken/core';
import type { DecorSlot, FavouriteLook, LayoutStyle } from '@unspoken/design-tokens';
import { useId, type CSSProperties, type ReactElement, type ReactNode } from 'react';

import { cx, text } from '@/lib/ui';

import type { CardModel, PlayModel } from '../model';
import styles from './Decor.module.css';

// The building blocks every favourite Halloween look is made of. Art is drawn in board px (the
// 372 × 826 play page of the designs) and scaled to the game column: CSS reads one board px as
// --bp (PlayFrame.module.css), so `calc(N * var(--bp))` is N px of the design at any width.

export type DecorBodyProps = {
  slot: DecorSlot;
  card: CardModel | null;
  // The frame's word and banned list (they come from the style's word and banned slots).
  word: ReactNode;
  banned: ReactNode;
  // Wrap a part so it follows the finger while dragging and springs in with each card: one item
  // (the word, the list) or a whole card (word and list together).
  swipeItem: (content: ReactNode) => ReactNode;
  swipeCard: (content: ReactNode) => ReactNode;
};

export type DecorTopProps = { slot: DecorSlot; layoutStyle: LayoutStyle; model: PlayModel; actions?: { onMenu: () => void; onHeader: () => void; onPause: () => void } };

export type LookDecor = {
  // Between the header and the controls.
  Body: (props: DecorBodyProps) => ReactElement;
  // The top row, for the looks whose header is laid out differently (the frame's otherwise).
  Top?: (props: DecorTopProps) => ReactElement;
  // Art behind the whole column (stars), in board px from the top.
  Backdrop?: () => ReactElement;
};

// The banned list's label in a look that words it its own way.
export function decorLabel(slot: DecorSlot | undefined): string | undefined {
  return slot?.label && en.play.dontSayLabels[slot.label];
}

// A unique prefix for gradient and filter ids (thumbnails draw the same art many times).
export function useUid(): string {
  return useId().replace(/[^a-zA-Z0-9_-]/g, '');
}

type RoomProps = {
  // The part of the board the art shows: [x, y, width, height] in board px. The room asks for its
  // height (in board px) and gives it up first when the word and list need the space; the art then
  // scales down to fit, placed by `align`.
  view: readonly [number, number, number, number];
  align?: string;
  // The room takes the space the word and list leave (instead of only asking for the art's height).
  grow?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

// Art in the flow of the page, across the column out to the window's edges. Its drawing may run
// past the room (overflow shows), under the text next to it.
export function Room({ view, align = 'xMidYMax', grow = false, className, style, children }: RoomProps) {
  return (
    <div className={cx(styles.room, grow && styles.grow, className)} style={{ '--room': view[3], ...style } as CSSProperties} aria-hidden="true">
      <svg className={styles.roomArt} viewBox={view.join(' ')} preserveAspectRatio={`${align} meet`}>
        {children}
      </svg>
    </div>
  );
}

// Art behind the column, in board px from the top of the page, scaled to the column's width.
export function BoardArt({ view = [0, 0, 372, 826], children }: { view?: readonly [number, number, number, number]; children: ReactNode }) {
  return (
    <svg className={styles.boardArt} viewBox={view.join(' ')} preserveAspectRatio="xMidYMin meet" aria-hidden="true">
      {children}
    </svg>
  );
}

// The body of a look: its rooms and text in a column that fills the space between header and
// controls. `look` keys the look's own CSS.
export function Body({ look, className, children }: { look: FavouriteLook; className?: string; children: ReactNode }) {
  return (
    <div className={cx(styles.body, className)} data-look={look}>
      {children}
    </div>
  );
}

// Text (the word, the list, a card) over the art.
export function Text({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx(styles.text, className)}>{children}</div>;
}

// A look's own top row (the frame's top row slot: above the art, mode and level, clock, menu).
export function TopRow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx(styles.top, className)} data-header="decor">
      {children}
    </div>
  );
}

// The score and the rest of the status line, one under the other ("3 pts", "2 skips left").
export function StatLines({ stats, className }: { stats: RoundStats; className?: string }) {
  return (
    <p className={cx(styles.statLines, text('stats'), className)}>
      {stats.points !== null && <span>{plural(stats.points, en.units.points)}</span>}
      <span>{stats.detail}</span>
    </p>
  );
}
