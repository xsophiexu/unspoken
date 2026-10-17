import { composite, readableOn, withAlpha } from './color';
import type { ColorMode, ColorRoles } from './palettes';

// Mind Reader team colors: the dot beside a team's name and the swatches on Customize team. The
// same six hues in every app color, a shade lighter in dark mode so the dots stand out on a dark
// page. Teams take them in teamColorOrder (Sharks teal, Owls lilac, Foxes mustard, ...).
export const teamColors: Readonly<Record<ColorMode, readonly string[]>> = {
  light: ['#3F7470', '#5E8C4E', '#A9634B', '#7E6385', '#9C7A36', '#586E83'],
  dark: ['#6FA8A3', '#8DB97C', '#D08E74', '#AE93B5', '#C9A55E', '#8AA1B8'],
};

export const teamColorOrder: readonly number[] = [0, 3, 4, 1, 5, 2];

// The color for a team's color index, wrapping past the end.
export function teamColor(index: number, mode: ColorMode): string {
  const list = teamColors[mode];
  return list[((index % list.length) + list.length) % list.length]!;
}

// The menu that opens on a player (Rename, Move to, Remove from game): a pale raised popover in
// light mode (between the page and white, hairline border), a dark raised one in dark mode. sub is
// the highlighted row and the Move to list; danger is Remove from game, kept readable on bg.
export type PopoverColors = { bg: string; ink: string; muted: string; border: string; sub: string; danger: string };

const DANGER_HUE = '#A4482C';

export function popoverColors(colors: ColorRoles, mode: ColorMode): PopoverColors {
  const bg = mode === 'light' ? composite(withAlpha(colors.surfaceRaised, 0.8), colors.bg) : colors.surfaceRaised;
  const sub = mode === 'light' ? composite(withAlpha(colors.surface, 0.35), bg) : composite(withAlpha(colors.ink, 0.08), bg);
  return {
    bg,
    ink: colors.ink,
    muted: readableOn(colors.muted, bg),
    border: colors.rule,
    sub,
    danger: readableOn(DANGER_HUE, bg),
  };
}
