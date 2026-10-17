'use client';

import { bank } from '@unspoken/content';
import {
  canPlayVersus,
  cardsFor,
  createRound,
  defaultVersusSetup,
  emptyLineup,
  gameConfig,
  modeRules,
  newSeed,
  resumableSettings,
  roundReducer,
  withDifficulty,
  type Difficulty,
  type GameSettings,
  type MindReaderPlay,
  type MindReaderSetup,
  type PlayKind,
  type Random,
  type RoundAction,
  type RoundState,
  type VersusSetup,
} from '@unspoken/core';
import { createContext, use, useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { parseSettings, SETTINGS_STORAGE_KEY } from '@/lib/settings';
import { readStored, writeStored } from '@/lib/storage';

// The game in progress: the settings it was started with and the round state from @unspoken/core.
// Rules live entirely in core's reducers; this only starts rounds and forwards actions.

type GameState = {
  settings: GameSettings;
  round: RoundState;
  // Reverse and Mind Reader show their how-to card once per visit.
  introSeen: Partial<Record<PlayKind, true>>;
  // How the Mind Reader game is played (Quick Play, Custom, Practice), and the Custom game being
  // set up (players, teams, rounds), kept for this visit.
  play: MindReaderPlay;
  mindReader: MindReaderSetup;
  // The Versus game being set up (players, teams, rounds, turn time, skips, penalty), kept for
  // this visit; a Versus game plays it.
  versus: VersusSetup;
};

type GameAction =
  | { type: 'play'; action: RoundAction }
  | { type: 'newGame'; settings: GameSettings; seed: number; play: MindReaderPlay }
  | { type: 'setMindReader'; change: (setup: MindReaderSetup) => MindReaderSetup }
  | { type: 'setVersus'; change: (setup: VersusSetup) => VersusSetup }
  | { type: 'saveSettings'; settings: GameSettings };

// A Versus game whose lineup can't play (none set up this visit) opens the default mode instead.
function playable(settings: GameSettings, versus: VersusSetup): GameSettings {
  return modeRules(settings.mode).play === 'versus' && !canPlayVersus(versus.lineup) ? resumableSettings(settings) : settings;
}

function startRound(wanted: GameSettings, seed: number, state: Pick<GameState, 'introSeen' | 'play' | 'mindReader' | 'versus'>): RoundState {
  const settings = playable(wanted, state.versus);
  return createRound(settings, {
    cards: cardsFor(bank, settings.difficulties, settings.categories),
    seed,
    showIntro: !state.introSeen[modeRules(settings.mode).play],
    mindReader: { play: state.play, setup: state.mindReader },
    versus: state.versus,
  });
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'play': {
      const round = roundReducer(state.round, action.action);
      if (round === state.round) return state;
      const introSeen = action.action.type === 'start' ? { ...state.introSeen, [state.round.kind]: true } : state.introSeen;
      return { ...state, round, introSeen };
    }
    case 'newGame': {
      const next = { ...state, settings: action.settings, play: action.play };
      return { ...next, round: startRound(action.settings, action.seed, next) };
    }
    case 'setMindReader':
      return { ...state, mindReader: action.change(state.mindReader) };
    case 'setVersus':
      return { ...state, versus: action.change(state.versus) };
    // The round in progress keeps the settings it started with; the next one plays these.
    case 'saveSettings':
      return { ...state, settings: action.settings };
  }
}

type GameContextValue = {
  settings: GameSettings;
  round: RoundState;
  dispatch: (action: RoundAction) => void;
  // A fresh round with these settings (new words, score back to 0). Mind Reader also takes how to
  // play; a Custom game plays the mindReader setup.
  newGame: (settings: GameSettings, play?: MindReaderPlay) => void;
  mindReader: MindReaderSetup;
  setMindReader: (change: (setup: MindReaderSetup) => MindReaderSetup) => void;
  versus: VersusSetup;
  setVersus: (change: (setup: VersusSetup) => VersusSetup) => void;
  // Save these settings for the next round, leaving the round in progress as it is.
  saveSettings: (settings: GameSettings) => void;
  // A fresh round with the same settings (and the same way of playing Mind Reader).
  restart: () => void;
  // A fresh round at another level; a timer still on its default follows the level.
  changeDifficulty: (difficulty: Difficulty) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

type GameProviderProps = {
  children: ReactNode;
  // Randomness for dealing. Tests pass a seeded source.
  random?: Random;
};

export function GameProvider({ children, random = Math.random }: GameProviderProps) {
  const [state, send] = useReducer(gameReducer, undefined, (): GameState => {
    // A Versus lineup lasts one visit, so a saved Versus game opens the default mode.
    const settings = resumableSettings(parseSettings(readStored(SETTINGS_STORAGE_KEY)));
    const fresh = {
      introSeen: {},
      play: 'quick' as const,
      mindReader: { lineup: emptyLineup(), rounds: gameConfig.mindReader.rounds.default },
      versus: defaultVersusSetup(emptyLineup()),
    };
    return { ...fresh, settings, round: startRound(settings, newSeed(random), fresh) };
  });

  useEffect(() => writeStored(SETTINGS_STORAGE_KEY, state.settings), [state.settings]);

  // Stable across renders, so timers and listeners that dispatch don't restart on every tick.
  const dispatch = useCallback((action: RoundAction) => send({ type: 'play', action }), []);
  const newGame = useCallback((settings: GameSettings, play: MindReaderPlay = 'quick') => send({ type: 'newGame', settings, seed: newSeed(random), play }), [random]);
  const setMindReader = useCallback((change: (setup: MindReaderSetup) => MindReaderSetup) => send({ type: 'setMindReader', change }), []);
  const setVersus = useCallback((change: (setup: VersusSetup) => VersusSetup) => send({ type: 'setVersus', change }), []);
  const saveSettings = useCallback((settings: GameSettings) => send({ type: 'saveSettings', settings }), []);

  const value = useMemo(
    (): GameContextValue => ({
      settings: state.settings,
      round: state.round,
      dispatch,
      newGame,
      mindReader: state.mindReader,
      setMindReader,
      versus: state.versus,
      setVersus,
      saveSettings,
      restart: () => newGame(state.settings, state.play),
      changeDifficulty: (difficulty) => newGame(withDifficulty(state.settings, difficulty), state.play),
    }),
    [state.settings, state.round, state.play, state.mindReader, state.versus, dispatch, newGame, setMindReader, setVersus, saveSettings],
  );

  return <GameContext value={value}>{children}</GameContext>;
}

export function useGame(): GameContextValue {
  const value = use(GameContext);
  if (!value) throw new Error('useGame needs a GameProvider');
  return value;
}
