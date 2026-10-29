import type { EditionId } from '@unspoken/core';

import type { ColorMode, PaletteId } from './palettes';
import { DEFAULT_STYLE, STYLE_GROUPS, type StyleGroup, type StyleId } from './styles';
import { resolveTheme, type Theme, type ThemeSelection } from './theme';

// The Look choice in an edition that has one of its own (UnspokenMD's Customize): light, dark, or
// whatever the phone or computer is set to.
export const LOOK_IDS = ['light', 'dark', 'system'] as const;
export type LookId = (typeof LOOK_IDS)[number];

export type EditionLook = {
  // The palette every screen uses, or null for the player's color (Customize shows the swatches).
  palette: PaletteId | null;
  // The style groups (STYLE_GROUPS) Customize offers. A saved style outside them plays as
  // DEFAULT_STYLE while the edition is on, and comes back when the player switches back.
  styleGroups: readonly StyleGroup['id'][];
  // The light or dark choice: the player's mode from the theme (null), or the edition's own Look
  // (LOOK_IDS), saved apart and starting at `defaultLook`.
  defaultLook: LookId | null;
};

// UnspokenMD always uses its blue, has no holiday looks, and starts in light (its dark isn't
// designed yet; see the md palette).
export const editionLooks: Readonly<Record<EditionId, EditionLook>> = {
  unspoken: { palette: null, styleGroups: ['everyday', 'halloween'], defaultLook: null },
  md: { palette: 'md', styleGroups: ['everyday'], defaultLook: 'light' },
};

// The styles an edition offers, in Customize order.
export function editionStyles(edition: EditionId): readonly StyleId[] {
  const groups = editionLooks[edition].styleGroups;
  return STYLE_GROUPS.filter((g) => groups.includes(g.id)).flatMap((g) => g.styles);
}

// The mode a Look draws in; 'system' follows what the device prefers.
export function lookMode(look: LookId, systemMode: ColorMode): ColorMode {
  return look === 'system' ? systemMode : look;
}

// The theme as an edition draws it: the saved selection with the style kept only if the edition
// offers it, the edition's own Look (when it has one) in place of the saved mode, and the
// edition's palette over any color.
export function resolveEditionTheme(selection: ThemeSelection, edition: EditionId, look: { look: LookId; systemMode: ColorMode }): Theme {
  const { palette, defaultLook } = editionLooks[edition];
  const style = editionStyles(edition).includes(selection.style) ? selection.style : DEFAULT_STYLE;
  const mode = defaultLook === null ? selection.mode : lookMode(look.look, look.systemMode);
  return resolveTheme({ ...selection, style, mode }, palette ?? undefined);
}
