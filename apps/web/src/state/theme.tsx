'use client';

import { parseThemeSelection, type ThemeSelection } from '@unspoken/design-tokens';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { readStored, writeStored } from '@/lib/storage';
import { THEME_STORAGE_KEY, themeAttributes } from '@/theme/boot';

type ThemeContextValue = {
  selection: ThemeSelection;
  // Change the style, color or mode; the rest stays.
  update: (change: Partial<ThemeSelection>) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The player's style, color and light/dark choice. Saved in localStorage and applied as data
// attributes on <html>, which switch the CSS variables every component reads.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState(() => parseThemeSelection(readStored(THEME_STORAGE_KEY)));

  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(themeAttributes(selection))) root.setAttribute(name, value);
    writeStored(THEME_STORAGE_KEY, selection);
  }, [selection]);

  const update = useCallback((change: Partial<ThemeSelection>) => setSelection((current) => ({ ...current, ...change })), []);
  const value = useMemo(() => ({ selection, update }), [selection, update]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const value = use(ThemeContext);
  if (!value) throw new Error('useTheme needs a ThemeProvider');
  return value;
}
