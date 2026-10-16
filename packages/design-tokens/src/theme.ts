import { COLOR_IDS, COLOR_MODES, palettes, type ColorId, type ColorMode, type ColorRoles } from './palettes';
import { REGION_TONES, regionColors, type RegionColors, type RegionTone } from './regions';
import { elevation, radius, space } from './scales';
import { DEFAULT_STYLE, STYLE_IDS, layoutStyles, type LayoutStyle, type StyleId } from './styles';
import { fonts, textStyles, type TextStyleName, type TextStyleToken } from './typography';

// What the player picks on Customize.
export type ThemeSelection = { style: StyleId; color: ColorId; mode: ColorMode };

export const DEFAULT_THEME: ThemeSelection = { style: DEFAULT_STYLE, color: 'teal', mode: 'light' };

export type Theme = {
  selection: ThemeSelection;
  style: LayoutStyle;
  // The color in use: the player's pick, or the style's pinned color.
  color: ColorId;
  colors: ColorRoles;
  regions: Readonly<Record<RegionTone, RegionColors>>;
  shadow: (typeof elevation)[ColorMode];
};

export function resolveTheme(selection: ThemeSelection): Theme {
  const style = layoutStyles[selection.style];
  const color = style.color.kind === 'pinned' ? style.color.color : selection.color;
  const colors = palettes[color][selection.mode];
  const regions = Object.fromEntries(REGION_TONES.map((tone) => [tone, regionColors(colors, tone)]));
  return { selection, style, color, colors, regions: regions as Theme['regions'], shadow: elevation[selection.mode] };
}

function pick<T extends string>(ids: readonly T[], value: unknown, fallback: T): T {
  return ids.includes(value as T) ? (value as T) : fallback;
}

// Reads a stored selection, keeping each valid field and defaulting the rest.
export function parseThemeSelection(value: unknown): ThemeSelection {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Partial<Record<keyof ThemeSelection, unknown>>;
  return {
    style: pick(STYLE_IDS, v.style, DEFAULT_THEME.style),
    color: pick(COLOR_IDS, v.color, DEFAULT_THEME.color),
    mode: pick(COLOR_MODES, v.mode, DEFAULT_THEME.mode),
  };
}

// A text style as React Native style props, at its own size or another (the fitted word size).
// Native fonts register one family per weight, so the weight is in the family name.
export function nativeTextStyle(name: TextStyleName, size?: number) {
  const t: TextStyleToken = textStyles[name];
  const px = size ?? t.size;
  return {
    fontFamily: fonts.native[t.weight],
    fontSize: px,
    ...(t.lineHeight !== undefined && { lineHeight: Math.round(px * t.lineHeight) }),
    ...(t.letterSpacing !== undefined && { letterSpacing: px * t.letterSpacing }),
    ...(t.tabular && { fontVariant: ['tabular-nums' as const] }),
    ...(t.uppercase && { textTransform: 'uppercase' as const }),
  };
}

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace('.', '-');

// The theme as CSS custom properties for web, named --un-<group>-<name>: --un-color-surface-raised,
// --un-ramp-1-bg, --un-panel-ink (region tone slots), --un-shadow-card, --un-space-4,
// --un-radius-card, --un-text-word-size. Numbers are px; line heights are unitless.
export function cssVariables(theme: Theme): Record<string, string> {
  const vars: Record<string, string> = { '--un-font': fonts.webStack };
  const set = (name: string, value: string | number) => {
    vars[`--un-${kebab(name)}`] = typeof value === 'number' ? `${value}px` : value;
  };
  const { ramp, ...roles } = theme.colors;
  for (const [role, value] of Object.entries(roles)) set(`color-${role}`, value);
  ramp.forEach((band, i) => {
    set(`ramp-${i + 1}-bg`, band.bg);
    set(`ramp-${i + 1}-ink`, band.ink);
  });
  for (const [tone, slots] of Object.entries(theme.regions)) {
    for (const [slot, value] of Object.entries(slots)) set(`${tone}-${slot}`, value);
  }
  for (const [name, value] of Object.entries(theme.shadow)) set(`shadow-${name}`, value);
  for (const [name, value] of Object.entries(space)) set(`space-${name}`, value);
  for (const [name, value] of Object.entries(radius)) set(`radius-${name}`, value);
  for (const [name, t] of Object.entries(textStyles) as [string, TextStyleToken][]) {
    set(`text-${name}-size`, t.size);
    set(`text-${name}-weight`, String(t.weight));
    if (t.lineHeight !== undefined) set(`text-${name}-line-height`, String(t.lineHeight));
    if (t.letterSpacing !== undefined) set(`text-${name}-letter-spacing`, `${t.letterSpacing}em`);
  }
  return vars;
}

// The same variables as a CSS rule, for a <style> tag or a server-rendered page.
export function cssText(theme: Theme, selector = ':root'): string {
  const body = Object.entries(cssVariables(theme))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
  return `${selector} {\n${body}\n}`;
}
