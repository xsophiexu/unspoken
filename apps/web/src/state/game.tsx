'use client';

import {
  canPlayVersus,
  cardsByDifficulty,
  cardsForSettings,
  createRound,
  EDITION_IDS,
  defaultVersusSetup,
  emptyLineup,
  modeRules,
  newSeed,
  resumableSettings,
  roundReducer,
  withDifficulty,
  type Difficulty,
  type EditionId,
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

import { catalogs, type Catalog } from '@/lib/catalog';
import { parseSettings } from '@/lib/settings';
import { readStored, writeStored } from '@/lib/storage';

import { useEdition } from './edition';

// How the game in progress was started: Home's Quick Play or Deep dive, or Start on New game (also
// Home's Custom game). The header says Quick Play or Deep dive for the first two (like Mind
// Reader's Quick Play), and the mode's name otherwise.
export type GameStart = 'quickPlay' | 'deepDive' | 'setup';
export const GAME_STARTS = ['quickPlay', 'deepDive', 'setup'] as const satisfies readonly GameStart[];

// The game in progress: the settings it was started with and the round state from @unspoken/core.
// Rules live entirely in core's reducers; this only starts rounds and forwards actions. Each
// edition (Unspoken, UnspokenMD) has its own game, settings and setups, so switching editions on
// Home keeps the other one as it was.

type GameState = {
  settings: GameSettings;
  round: RoundState;
  // Reverse and Mind Reader show their how-to card once per visit.
  introSeen: Partial<Record<PlayKind, true>>;
  // How the Mind Reader game is played (Quick Play, Custom, Practice), and the Custom game being
  // set up (players, teams, rounds), kept for this visit.
  play: MindReaderPlay;
  // Saved with the settings, so a reload keeps the game's title.
  start: GameStart;
  mindReader: MindReaderSetup;
  // The Versus game being set up (players, teams, rounds, turn time, skips, penalty), kept for
  // this visit; a Versus game plays it.
  versus: VersusSetup;
};

type GameAction =
  | { type: 'play'; action: RoundAction }
  | { type: 'newGame'; settings: GameSettings; seed: number; play: MindReaderPlay; start?: GameStart }
  | { type: 'setMindReader'; change: (setup: MindReaderSetup) => MindReaderSetup }
  | { type: 'setVersus'; change: (setup: VersusSetup) => VersusSetup }
  | { type: 'saveSettings'; settings: GameSettings };

// A Versus game whose lineup can't play (none set up this visit) opens the default mode instead.
function playable(settings: GameSettings, versus: VersusSetup, { config }: Catalog): GameSettings {
  return modeRules(settings.mode, config).play === 'versus' && !canPlayVersus(versus.lineup) ? resumableSettings(settings, config) : settings;
}

function startRound(wanted: GameSettings, seed: number, state: Pick<GameState, 'introSeen' | 'play' | 'mindReader' | 'versus'>, catalog: Catalog): RoundState {
  const { bank, config } = catalog;
  const settings = playable(wanted, state.versus, catalog);
  // Deep dive's Easiest first deals the cards a difficulty at a time, easiest first.
  const groups = settings.easiestFirst ? cardsByDifficulty(bank, settings, config) : undefined;
  return createRound(settings, {
    cards: groups ? groups.flat() : cardsForSettings(bank, settings, config),
    groups,
    seed,
    config,
    showIntro: !state.introSeen[modeRules(settings.mode, config).play],
    mindReader: { play: state.play, setup: state.mindReader },
    versus: state.versus,
  });
}

function gameReducer(state: GameState, action: GameAction, catalog: Catalog): GameState {
  switch (action.type) {
    case 'play': {
      const round = roundReducer(state.round, action.action);
      if (round === state.round) return state;
      const introSeen = action.action.type === 'start' ? { ...state.introSeen, [state.round.kind]: true } : state.introSeen;
      return { ...state, round, introSeen };
    }
    case 'newGame': {
      const next = { ...state, settings: action.settings, play: action.play, start: action.start ?? state.start };
      return { ...next, round: startRound(action.settings, action.seed, next, catalog) };
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

type Games = Record<EditionId, GameState>;

function gamesReducer(games: Games, { edition, action }: { edition: EditionId; action: GameAction }): Games {
  const next = gameReducer(games[edition], action, catalogs[edition]);
  return next === games[edition] ? games : { ...games, [edition]: next };
}

// An edition's game when the page opens: its saved settings and a fresh round.
function initialGame(catalog: Catalog, random: Random): GameState {
  const { config, settingsKey, startKey } = catalog;
  const savedStart = readStored(startKey);
  // A Versus lineup lasts one visit, so a saved Versus game opens the default mode.
  const settings = resumableSettings(parseSettings(readStored(settingsKey), config), config);
  const fresh = {
    introSeen: {},
    play: 'quick' as const,
    // Nothing saved: the saved settings came from New game (or are the defaults).
    start: GAME_STARTS.find((s) => s === savedStart) ?? 'setup',
    mindReader: { lineup: emptyLineup(), rounds: config.mindReader.rounds.default },
    versus: defaultVersusSetup(emptyLineup()),
  };
  return { ...fresh, settings, round: startRound(settings, newSeed(random), fresh, catalog) };
}

type GameContextValue = {
  settings: GameSettings;
  round: RoundState;
  dispatch: (action: RoundAction) => void;
  // How the game in progress was started (Quick Play, Deep dive or New game).
  start: GameStart;
  // A fresh round with these settings (new words, score back to 0). Mind Reader also takes how to
  // play; a Custom game plays the mindReader setup. `start` says where it was started from; left
  // out, the new game keeps the last one's (Restart, a new difficulty, the chip's Apply).
  newGame: (settings: GameSettings, play?: MindReaderPlay, start?: GameStart) => void;
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
  const { edition } = useEdition();
  const [games, send] = useReducer(gamesReducer, undefined, () => Object.fromEntries(EDITION_IDS.map((id) => [id, initialGame(catalogs[id], random)])) as Games);
  const state = games[edition];
  const { config } = catalogs[edition];

  useEffect(() => writeStored(catalogs.unspoken.settingsKey, games.unspoken.settings), [games.unspoken.settings]);
  useEffect(() => writeStored(catalogs.md.settingsKey, games.md.settings), [games.md.settings]);
  useEffect(() => writeStored(catalogs.unspoken.startKey, games.unspoken.start), [games.unspoken.start]);
  useEffect(() => writeStored(catalogs.md.startKey, games.md.start), [games.md.start]);

  // Stable across renders (per edition), so timers and listeners that dispatch don't restart on every tick.
  const dispatch = useCallback((action: RoundAction) => send({ edition, action: { type: 'play', action } }), [edition]);
  const newGame = useCallback(
    (settings: GameSettings, play: MindReaderPlay = 'quick', start?: GameStart) => send({ edition, action: { type: 'newGame', settings, seed: newSeed(random), play, start } }),
    [edition, random],
  );
  const setMindReader = useCallback((change: (setup: MindReaderSetup) => MindReaderSetup) => send({ edition, action: { type: 'setMindReader', change } }), [edition]);
  const setVersus = useCallback((change: (setup: VersusSetup) => VersusSetup) => send({ edition, action: { type: 'setVersus', change } }), [edition]);
  const saveSettings = useCallback((settings: GameSettings) => send({ edition, action: { type: 'saveSettings', settings } }), [edition]);

  const value = useMemo(
    (): GameContextValue => ({
      settings: state.settings,
      round: state.round,
      start: state.start,
      dispatch,
      newGame,
      mindReader: state.mindReader,
      setMindReader,
      versus: state.versus,
      setVersus,
      saveSettings,
      restart: () => newGame(state.settings, state.play),
      changeDifficulty: (difficulty) => newGame(withDifficulty(state.settings, difficulty, config), state.play),
    }),
    [state.settings, state.round, state.play, state.start, state.mindReader, state.versus, config, dispatch, newGame, setMindReader, setVersus, saveSettings],
  );

  return <GameContext value={value}>{children}</GameContext>;
}

export function useGame(): GameContextValue {
  const value = use(GameContext);
  if (!value) throw new Error('useGame needs a GameProvider');
  return value;
}
