// Reverse: the guesser reads the banned words as clues and guesses the hidden word. Three clues
// show to start; each extra clue makes the word worth a point less. No timer.

import { gameConfig, type GameConfig } from '../config';
import { bannedCountFor, modeRules } from '../rules';
import type { Card, GameSettings } from '../types';
import { advance, currentCard, newDeck, type DeckState } from './deck';
import type { RoundOptions } from './swipe';

// intro: the "How it works" card (once per app session; the platform remembers it was seen).
// guess: clues showing, word hidden. answer: the word revealed; swipe Got it / Missed.
export type ReversePhase = 'intro' | 'guess' | 'answer';

export type ReverseRoundState = {
  kind: 'reverse';
  settings: GameSettings;
  config: GameConfig;
  deck: DeckState;
  phase: ReversePhase;
  revealed: number;
  // The eye button shows the hidden word in place of the blanks, for a quick check.
  peek: boolean;
  score: number;
  played: number;
};

export type ReverseAction =
  | { type: 'start' }
  | { type: 'revealClue' }
  | { type: 'togglePeek' }
  | { type: 'showAnswer' }
  | { type: 'got' }
  | { type: 'missed' };

export type IntroOption = {
  // Show the how-to first. Platforms pass false once the player has seen it this session.
  showIntro?: boolean;
};

export function createReverseRound(
  settings: GameSettings,
  { cards, seed, config = gameConfig, showIntro = true }: RoundOptions & IntroOption,
): ReverseRoundState {
  if (modeRules(settings.mode, config).play !== 'reverse') throw new Error(`${settings.mode} is not Reverse`);
  return {
    kind: 'reverse',
    settings,
    config,
    deck: newDeck(cards, seed),
    phase: showIntro ? 'intro' : 'guess',
    revealed: config.reverse.firstClues,
    peek: false,
    score: 0,
    played: 0,
  };
}

// --- Selectors -------------------------------------------------------------------------------

export type ReverseCardView = {
  card: Card;
  // Reverse uses as many clues as the banned words the level shows.
  clues: readonly { text: string; revealed: boolean }[];
  revealed: number;
  total: number;
  // All clues showing is still worth a point.
  worth: number;
  canReveal: boolean;
};

export function reverseCard(state: ReverseRoundState): ReverseCardView | null {
  const card = currentCard(state.deck);
  if (!card) return null;
  const clues = card.banned.slice(0, bannedCountFor(state.settings.difficulty, state.config));
  const revealed = Math.min(state.revealed, clues.length);
  return {
    card,
    clues: clues.map((text, i) => ({ text, revealed: i < revealed })),
    revealed,
    total: clues.length,
    worth: clues.length + 1 - revealed,
    canReveal: state.phase === 'guess' && revealed < clues.length,
  };
}

// --- Reducer ---------------------------------------------------------------------------------

function next(state: ReverseRoundState, got: boolean): ReverseRoundState {
  const view = reverseCard(state);
  return {
    ...state,
    score: state.score + (got && view ? view.worth : 0),
    played: state.played + 1,
    deck: advance(state.deck),
    revealed: state.config.reverse.firstClues,
    peek: false,
    phase: 'guess',
  };
}

export function reverseReducer(state: ReverseRoundState, action: ReverseAction): ReverseRoundState {
  switch (action.type) {
    case 'start':
      return state.phase === 'intro' ? { ...state, phase: 'guess' } : state;
    case 'revealClue': {
      const view = reverseCard(state);
      return view?.canReveal ? { ...state, revealed: view.revealed + 1 } : state;
    }
    case 'togglePeek':
      return state.phase === 'guess' ? { ...state, peek: !state.peek } : state;
    case 'showAnswer':
      return state.phase === 'guess' ? { ...state, phase: 'answer' } : state;
    case 'got':
    case 'missed':
      return state.phase === 'answer' ? next(state, action.type === 'got') : state;
  }
}
