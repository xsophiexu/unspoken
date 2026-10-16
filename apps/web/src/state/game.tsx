'use client';

import { bank } from '@unspoken/content';
import {
  cardsFor,
  createRound,
  modeRules,
  newSeed,
  roundReducer,
  withDifficulty,
  type Difficulty,
  type GameSettings,
  type PlayKind,
  type Random,
  type RoundAction,
  type RoundState,
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
};

type GameAction = { type: 'play'; action: RoundAction } | { type: 'newGame'; settings: GameSettings; seed: number };

function startRound(settings: GameSettings, seed: number, introSeen: GameState['introSeen']): RoundState {
  return createRound(settings, {
    cards: cardsFor(bank, settings.difficulty, settings.categories),
    seed,
    showIntro: !introSeen[modeRules(settings.mode).play],
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
    case 'newGame':
      return { ...state, settings: action.settings, round: startRound(action.settings, action.seed, state.introSeen) };
  }
}

type GameContextValue = {
  settings: GameSettings;
  round: RoundState;
  dispatch: (action: RoundAction) => void;
  // A fresh round with these settings (new words, score back to 0).
  newGame: (settings: GameSettings) => void;
  // A fresh round with the same settings.
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
    const settings = parseSettings(readStored(SETTINGS_STORAGE_KEY));
    return { settings, round: startRound(settings, newSeed(random), {}), introSeen: {} };
  });

  useEffect(() => writeStored(SETTINGS_STORAGE_KEY, state.settings), [state.settings]);

  // Stable across renders, so timers and listeners that dispatch don't restart on every tick.
  const dispatch = useCallback((action: RoundAction) => send({ type: 'play', action }), []);
  const newGame = useCallback((settings: GameSettings) => send({ type: 'newGame', settings, seed: newSeed(random) }), [random]);

  const value = useMemo(
    (): GameContextValue => ({
      settings: state.settings,
      round: state.round,
      dispatch,
      newGame,
      restart: () => newGame(state.settings),
      changeDifficulty: (difficulty) => newGame(withDifficulty(state.settings, difficulty)),
    }),
    [state.settings, state.round, dispatch, newGame],
  );

  return <GameContext value={value}>{children}</GameContext>;
}

export function useGame(): GameContextValue {
  const value = use(GameContext);
  if (!value) throw new Error('useGame needs a GameProvider');
  return value;
}
