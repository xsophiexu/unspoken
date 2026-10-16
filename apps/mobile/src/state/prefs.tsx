import type { GameSettings, PlayKind } from '@unspoken/core';
import { DEFAULT_THEME, resolveTheme, type Theme, type ThemeSelection } from '@unspoken/design-tokens';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';

import { loadPrefs, parsePrefs, savePrefs, type SavedPrefs } from './storage';

// App-wide state: the player's look and settings (saved on the device), the current game's id
// (a new id starts a new round), and the How to play tour.

type Prefs = {
  theme: Theme;
  selection: ThemeSelection;
  settings: GameSettings;
  gameId: number;
  tourOpen: boolean;
  setLook: (patch: Partial<ThemeSelection>) => void;
  // Save these settings and start a new round with them.
  startGame: (settings: GameSettings) => void;
  // A new round with the same settings.
  restart: () => void;
  openTour: () => void;
  closeTour: () => void;
  // Reverse and Mind Reader show their how-it-works card once per app session.
  introSeen: (kind: PlayKind) => boolean;
  markIntroSeen: (kind: PlayKind) => void;
};

const PrefsContext = createContext<Prefs | null>(null);

export function usePrefs(): Prefs {
  const prefs = use(PrefsContext);
  if (!prefs) throw new Error('usePrefs needs a PrefsProvider');
  return prefs;
}

// A first launch follows the device's light or dark setting.
function firstLaunch(): SavedPrefs {
  const prefs = parsePrefs(null);
  return { ...prefs, theme: { ...DEFAULT_THEME, mode: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light' } };
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedPrefs | null>(null);
  const [gameId, setGameId] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const intros = useRef(new Set<PlayKind>());

  useEffect(() => {
    let live = true;
    loadPrefs().then((loaded) => {
      if (!live) return;
      const prefs = loaded ?? firstLaunch();
      setSaved(prefs);
      setTourOpen(!prefs.tourSeen);
    });
    return () => {
      live = false;
    };
  }, []);

  const update = useCallback((change: (prefs: SavedPrefs) => SavedPrefs) => {
    setSaved((current) => {
      if (!current) return current;
      const next = change(current);
      void savePrefs(next);
      return next;
    });
  }, []);

  const value = useMemo<Prefs | null>(() => {
    if (!saved) return null;
    return {
      theme: resolveTheme(saved.theme),
      selection: saved.theme,
      settings: saved.settings,
      gameId,
      tourOpen,
      setLook: (patch) => update((p) => ({ ...p, theme: { ...p.theme, ...patch } })),
      startGame: (settings) => {
        update((p) => ({ ...p, settings }));
        setGameId((id) => id + 1);
      },
      restart: () => setGameId((id) => id + 1),
      openTour: () => setTourOpen(true),
      closeTour: () => {
        setTourOpen(false);
        update((p) => ({ ...p, tourSeen: true }));
      },
      introSeen: (kind) => intros.current.has(kind),
      markIntroSeen: (kind) => {
        intros.current.add(kind);
      },
    };
  }, [saved, gameId, tourOpen, update]);

  // Nothing renders until the saved look is read, so the first frame is already themed.
  if (!value) return null;
  return <PrefsContext value={value}>{children}</PrefsContext>;
}
