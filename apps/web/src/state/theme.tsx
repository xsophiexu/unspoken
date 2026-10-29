'use client';

import { parseThemeSelection, resolveEditionTheme, type Theme, type ThemeSelection } from '@unspoken/design-tokens';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useMediaQuery } from '@/lib/hooks';
import { readStored, writeStored } from '@/lib/storage';
import { THEME_STORAGE_KEY, themeAttributes } from '@/theme/boot';

import { useEdition } from './edition';

type ThemeContextValue = {
  // What the player saved on Unspoken's Customize.
  selection: ThemeSelection;
  // What every screen draws: the selection as the current edition shows it (UnspokenMD's blue, its
  // own Look, no holiday looks). theme.selection.style is the style in use.
  theme: Theme;
  // Change the style, color or mode; the rest stays.
  update: (change: Partial<ThemeSelection>) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The player's style, color and light/dark choice, drawn in the current edition. Saved in
// localStorage and applied as data attributes on <html>, which switch the CSS variables every
// component reads.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState(() => parseThemeSelection(readStored(THEME_STORAGE_KEY)));
  const { edition, look } = useEdition();
  const systemMode = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';
  const theme = useMemo(() => resolveEditionTheme(selection, edition, { look, systemMode }), [selection, edition, look, systemMode]);

  useEffect(() => writeStored(THEME_STORAGE_KEY, selection), [selection]);
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(themeAttributes(theme))) root.setAttribute(name, value);
  }, [theme]);

  const update = useCallback((change: Partial<ThemeSelection>) => setSelection((current) => ({ ...current, ...change })), []);
  const value = useMemo(() => ({ selection, theme, update }), [selection, theme, update]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const value = use(ThemeContext);
  if (!value) throw new Error('useTheme needs a ThemeProvider');
  return value;
}
