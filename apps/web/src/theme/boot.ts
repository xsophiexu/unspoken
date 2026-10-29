import { DEFAULT_EDITION, EDITION_IDS } from '@unspoken/core';
import {
  COLOR_IDS,
  COLOR_MODES,
  DEFAULT_STYLE,
  DEFAULT_THEME,
  LOOK_IDS,
  STYLE_IDS,
  breakpoints,
  editionLooks,
  editionStyles,
  layoutStyles,
  type Theme,
  type ThemeSelection,
} from '@unspoken/design-tokens';

import { config } from '@/lib/config';
import { DEFAULT_EDITION_PREFS, EDITION_STORAGE_KEY } from '@/lib/edition';
import { editionHomes } from '@/lib/routes';

// Where the player's theme is saved. Read by the inline boot script before first paint and by the
// theme provider after hydration.
export const THEME_STORAGE_KEY = 'unspoken.theme';

// The attributes on <html> that pick the theme's CSS variables (see theme/css.ts): the style in use,
// and the palette and mode it draws in (a pinned style's own color, a Halloween look's own mode,
// UnspokenMD's blue).
export function themeAttributes(theme: Theme) {
  return { 'data-style': theme.selection.style, 'data-color': theme.color, 'data-mode': theme.mode } as const;
}

// What an edition changes before paint: its palette, the styles it offers, and whether it has its
// own Look (light, dark or the device's setting).
type BootEdition = { palette: string | null; styles: readonly string[]; ownLook: boolean };

type BootData = {
  key: string;
  editionKey: string;
  styles: readonly string[];
  colors: readonly string[];
  modes: readonly string[];
  looks: readonly string[];
  fallback: ThemeSelection;
  fallbackStyle: string;
  fallbackEdition: string;
  fallbackLook: string;
  editions: Record<string, BootEdition>;
  // An edition's own link (/md/), without its trailing slash: that page opens in that edition.
  paths: Record<string, string>;
  pinned: Record<string, string>;
  // Styles drawn in one mode whatever the player picked.
  pinnedMode: Record<string, string>;
  // Window width classes from narrowest to widest: [name, min width].
  widths: [string, number][];
};

// Runs inline in <head>, before the first paint, so a returning player never sees the default theme
// flash. Self-contained: it is serialized with toString(), so it may only use its argument.
function boot(d: BootData) {
  const root = document.documentElement;
  const read = (key: string): Record<string, unknown> => {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}') || {};
    } catch {
      // Storage blocked or unreadable: keep the defaults.
      return {};
    }
  };
  const saved = read(d.key);
  const savedEdition = read(d.editionKey);
  const pick = (ids: readonly string[], value: unknown, fallback: string) => (ids.indexOf(value as string) >= 0 ? (value as string) : fallback);
  const linked = d.paths[location.pathname.replace(/\/+$/, '')];
  const edition = d.editions[pick(Object.keys(d.editions), linked || savedEdition.edition, d.fallbackEdition)]!;
  const savedStyle = pick(d.styles, saved.style, d.fallback.style);
  const style = edition.styles.indexOf(savedStyle) >= 0 ? savedStyle : d.fallbackStyle;
  let mode = pick(d.modes, saved.mode, d.fallback.mode);
  if (edition.ownLook) {
    const look = pick(d.looks, savedEdition.look, d.fallbackLook);
    const dark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    mode = look === 'system' ? (dark ? 'dark' : 'light') : look;
  }
  root.setAttribute('data-style', style);
  root.setAttribute('data-color', edition.palette || d.pinned[style] || pick(d.colors, saved.color, d.fallback.color));
  root.setAttribute('data-mode', d.pinnedMode[style] || mode);
  const width = () => {
    let name = d.widths[0]?.[0] ?? '';
    for (const [n, min] of d.widths) if (window.innerWidth >= min) name = n;
    root.setAttribute('data-width', name);
  };
  width();
  window.addEventListener('resize', width);
}

export function bootScript(): string {
  const pinned: Record<string, string> = {};
  const pinnedMode: Record<string, string> = {};
  for (const id of STYLE_IDS) {
    const { color: policy, mode } = layoutStyles[id];
    if (policy.kind === 'pinned') pinned[id] = policy.color;
    if (mode) pinnedMode[id] = mode;
  }
  const editions = Object.fromEntries(
    EDITION_IDS.map((id) => [id, { palette: editionLooks[id].palette, styles: editionStyles(id), ownLook: editionLooks[id].defaultLook !== null }]),
  );
  const data: BootData = {
    key: THEME_STORAGE_KEY,
    editionKey: EDITION_STORAGE_KEY,
    styles: STYLE_IDS,
    colors: COLOR_IDS,
    modes: COLOR_MODES,
    looks: LOOK_IDS,
    fallback: DEFAULT_THEME,
    fallbackStyle: DEFAULT_STYLE,
    fallbackEdition: DEFAULT_EDITION,
    fallbackLook: DEFAULT_EDITION_PREFS.look,
    editions,
    paths: Object.fromEntries(Object.entries(editionHomes).map(([id, path]) => [`${config.basePath}${path}`.replace(/\/+$/, ''), id])),
    pinned,
    pinnedMode,
    widths: Object.entries(breakpoints).sort((a, b) => a[1] - b[1]),
  };
  return `(${boot.toString()})(${JSON.stringify(data)})`;
}
