import { en } from '@unspoken/content';
import { defaultVersusSetup, emptyLineup, gameConfig, resumableSettings, type GameSettings, type MindReaderPlay, type MindReaderSetup, type PlayKind, type VersusSetup } from '@unspoken/core';
import { DEFAULT_THEME, resolveTheme, type Theme, type ThemeSelection } from '@unspoken/design-tokens';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
  // Save these settings and start a new round with them. Mind Reader also takes how to play
  // (Quick Play, Custom or Practice); a Custom game plays the mindReader setup below.
  startGame: (settings: GameSettings, play?: MindReaderPlay) => void;
  // How the current Mind Reader game is played.
  mindReaderPlay: MindReaderPlay;
  // The Custom game being set up (players, teams, rounds), kept for this app session.
  mindReader: MindReaderSetup;
  setMindReader: (change: (setup: MindReaderSetup) => MindReaderSetup) => void;
  // The Versus game being set up (players, teams, rounds, turn time, skips, penalty), kept for
  // this app session; a Versus game plays it.
  versus: VersusSetup;
  setVersus: (change: (setup: VersusSetup) => VersusSetup) => void;
  // Save these settings for the next round, leaving the round in progress as it is.
  saveSettings: (settings: GameSettings) => void;
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
  const [mindReaderPlay, setMindReaderPlay] = useState<MindReaderPlay>('quick');
  const [mindReader, setMindReaderState] = useState<MindReaderSetup>(() => ({ lineup: emptyLineup(), rounds: gameConfig.mindReader.rounds.default }));
  const [versus, setVersus] = useState<VersusSetup>(() => defaultVersusSetup(emptyLineup()));
  // Which how-it-works cards were seen this session; kept in memory only.
  const [intros] = useState(() => new Set<PlayKind>());

  useEffect(() => {
    let live = true;
    loadPrefs().then((loaded) => {
      if (!live) return;
      const prefs = loaded ?? firstLaunch();
      // A Versus lineup lasts one app session, so a saved Versus game opens the default mode.
      setSaved({ ...prefs, settings: resumableSettings(prefs.settings) });
      // The tour opens by itself on the first game, and once more whenever it changes.
      setTourOpen(prefs.tourVersion !== en.howToPlay.version);
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
      startGame: (settings, play = 'quick') => {
        update((p) => ({ ...p, settings }));
        setMindReaderPlay(play);
        setGameId((id) => id + 1);
      },
      saveSettings: (settings) => update((p) => ({ ...p, settings })),
      restart: () => setGameId((id) => id + 1),
      mindReaderPlay,
      mindReader,
      setMindReader: setMindReaderState,
      versus,
      setVersus,
      openTour: () => setTourOpen(true),
      closeTour: () => {
        setTourOpen(false);
        update((p) => ({ ...p, tourVersion: en.howToPlay.version }));
      },
      introSeen: (kind) => intros.has(kind),
      markIntroSeen: (kind) => {
        intros.add(kind);
      },
    };
  }, [saved, gameId, tourOpen, update, intros, mindReaderPlay, mindReader, versus]);

  // Nothing renders until the saved look is read, so the first frame is already themed.
  if (!value) return null;
  return <PrefsContext value={value}>{children}</PrefsContext>;
}
