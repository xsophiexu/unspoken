import { COLOR_IDS, COLOR_MODES, DEFAULT_THEME, STYLE_IDS, breakpoints, layoutStyles, resolveTheme, type ThemeSelection } from '@unspoken/design-tokens';

// Where the player's theme is saved. Read by the inline boot script before first paint and by the
// theme provider after hydration.
export const THEME_STORAGE_KEY = 'unspoken.theme';

// The attributes on <html> that pick the theme's CSS variables (see theme/css.ts). A pinned style
// (Split, Sheet) shows its own color whatever the player picked, and a style with its own mode (the
// Halloween looks, always dark) its own mode.
export function themeAttributes(selection: ThemeSelection) {
  const theme = resolveTheme(selection);
  return { 'data-style': selection.style, 'data-color': theme.color, 'data-mode': theme.mode } as const;
}

type BootData = {
  key: string;
  styles: readonly string[];
  colors: readonly string[];
  modes: readonly string[];
  fallback: ThemeSelection;
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
  let saved: Record<string, unknown> = {};
  try {
    saved = JSON.parse(localStorage.getItem(d.key) || '{}') || {};
  } catch {
    // Storage blocked or unreadable: keep the defaults.
  }
  const pick = (ids: readonly string[], value: unknown, fallback: string) => (ids.indexOf(value as string) >= 0 ? (value as string) : fallback);
  const style = pick(d.styles, saved.style, d.fallback.style);
  root.setAttribute('data-style', style);
  root.setAttribute('data-color', d.pinned[style] || pick(d.colors, saved.color, d.fallback.color));
  root.setAttribute('data-mode', d.pinnedMode[style] || pick(d.modes, saved.mode, d.fallback.mode));
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
  const data: BootData = {
    key: THEME_STORAGE_KEY,
    styles: STYLE_IDS,
    colors: COLOR_IDS,
    modes: COLOR_MODES,
    fallback: DEFAULT_THEME,
    pinned,
    pinnedMode,
    widths: Object.entries(breakpoints).sort((a, b) => a[1] - b[1]),
  };
  return `(${boot.toString()})(${JSON.stringify(data)})`;
}
