// Mind Reader: three players, no timer. The Mind Reader sees the word and writes 5 words they think
// the Clue Giver will say, then hands the phone over. The Clue Giver sees only the word and gives
// clues to the Guesser; the Mind Reader counts how many of their words get said.

import { gameConfig, type GameConfig } from '../config';
import { modeRules } from '../rules';
import type { Card, GameSettings } from '../types';
import { advance, currentCard, newDeck, type DeckState } from './deck';
import type { IntroOption } from './reverse';
import type { RoundOptions } from './swipe';

// intro → predict (Mind Reader) → handOff → clues (Clue Giver) → reveal → next word's predict
export type MindReaderPhase = 'intro' | 'predict' | 'handOff' | 'clues' | 'reveal';

export type MindReaderRoundState = {
  kind: 'mindReader';
  settings: GameSettings;
  config: GameConfig;
  deck: DeckState;
  phase: MindReaderPhase;
  predictions: readonly string[];
  // Whether the Guesser got the last word (shown on the reveal).
  guessed: boolean;
  round: number;
};

export type MindReaderAction =
  | { type: 'start' }
  | { type: 'predict'; index: number; text: string }
  | { type: 'handOff' }
  | { type: 'takeOver' }
  | { type: 'finishClues'; guessed: boolean }
  | { type: 'nextWord' };

function emptyPredictions(config: GameConfig): string[] {
  return Array.from({ length: config.mindReader.predictions }, () => '');
}

export function createMindReaderRound(
  settings: GameSettings,
  { cards, seed, config = gameConfig, showIntro = true }: RoundOptions & IntroOption,
): MindReaderRoundState {
  if (modeRules(settings.mode, config).play !== 'mindReader') throw new Error(`${settings.mode} is not Mind Reader`);
  return {
    kind: 'mindReader',
    settings,
    config,
    deck: newDeck(cards, seed),
    phase: showIntro ? 'intro' : 'predict',
    predictions: emptyPredictions(config),
    guessed: false,
    round: 1,
  };
}

// --- Selectors -------------------------------------------------------------------------------

export function mindReaderCard(state: MindReaderRoundState): Card | null {
  return currentCard(state.deck) ?? null;
}

// The predictions with text, trimmed, in the order written.
export function filledPredictions(state: MindReaderRoundState): string[] {
  return state.predictions.map((p) => p.trim()).filter(Boolean);
}

// Predictions still to write before the phone can go to the Clue Giver.
export function predictionsNeeded(state: MindReaderRoundState): number {
  return Math.max(0, state.config.mindReader.predictions - filledPredictions(state).length);
}

// --- Reducer ---------------------------------------------------------------------------------

export function mindReaderReducer(state: MindReaderRoundState, action: MindReaderAction): MindReaderRoundState {
  switch (action.type) {
    case 'start':
      return state.phase === 'intro' ? { ...state, phase: 'predict' } : state;
    case 'predict':
      if (state.phase !== 'predict' || action.index < 0 || action.index >= state.predictions.length) return state;
      return { ...state, predictions: state.predictions.map((p, i) => (i === action.index ? action.text : p)) };
    case 'handOff':
      return state.phase === 'predict' && predictionsNeeded(state) === 0 ? { ...state, phase: 'handOff' } : state;
    case 'takeOver':
      return state.phase === 'handOff' ? { ...state, phase: 'clues' } : state;
    case 'finishClues':
      return state.phase === 'clues' ? { ...state, phase: 'reveal', guessed: action.guessed } : state;
    case 'nextWord':
      if (state.phase !== 'reveal') return state;
      return {
        ...state,
        deck: advance(state.deck),
        predictions: emptyPredictions(state.config),
        round: state.round + 1,
        phase: 'predict',
      };
  }
}
