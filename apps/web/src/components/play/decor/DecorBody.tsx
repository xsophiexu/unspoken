'use client';

import type { DecorSlot, FavouriteLook } from '@unspoken/design-tokens';
import type { ReactElement } from 'react';

import styles from './Decor.module.css';
import type { DecorBodyProps, DecorTopProps, LookDecor } from './frame';
import { batCircle } from './looks/batCircle';
import { candles } from './looks/candles';
import { glowingChips } from './looks/glowingChips';
import { graveyard, harvestMoon } from './looks/graveyards';
import { hauntedHouse } from './looks/hauntedHouse';
import { littleGhosts } from './looks/littleGhosts';
import { silverMoon } from './looks/silverMoon';
import { tarot } from './looks/tarot';
import { twoSpiders } from './looks/twoSpiders';
import { vampire } from './looks/vampire';
import { witchHat } from './looks/witchHat';

// Kurt's favourite Halloween looks (website only; DecorSlot in @unspoken/design-tokens). Each look is
// the regular play screen (header, clock, stats, swipe controls, the card's word and banned words)
// with the art, word and banned-word treatment of its design, one module per look. The designs are
// still, so the looks have no ambient motion.
export const decorLooks: Readonly<Record<FavouriteLook, LookDecor>> = {
  graveyard,
  twoSpiders,
  witchHat,
  glowingChips,
  batCircle,
  silverMoon,
  vampire,
  candles,
  tarot,
  littleGhosts,
  harvestMoon,
  hauntedHouse,
};

export { decorLabel } from './frame';

// The class the frame takes in a favourite look (Decor.module.css styles its header and controls).
export const decorFrameClass = styles.frame;

// Whether the look lays out its own top row.
export function hasDecorTop(slot: DecorSlot): boolean {
  return decorLooks[slot.look].Top !== undefined;
}

export function DecorBody(props: DecorBodyProps): ReactElement {
  const { Body } = decorLooks[props.slot.look];
  return <Body {...props} />;
}

// The look's own top row (looks with hasDecorTop).
export function DecorTop(props: DecorTopProps): ReactElement | null {
  const { Top } = decorLooks[props.slot.look];
  return Top ? <Top {...props} /> : null;
}

// Art behind the whole column (stars), when the look has any.
export function DecorBackdrop({ slot }: { slot: DecorSlot }) {
  const { Backdrop } = decorLooks[slot.look];
  if (!Backdrop) return null;
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <Backdrop />
    </div>
  );
}
