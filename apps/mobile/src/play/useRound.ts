import { bank } from '@unspoken/content';
import { cardsFor, createRound, isClockRunning, modeRules, newSeed, roundReducer, type GameSettings, type RoundState } from '@unspoken/core';
import { useEffect, useReducer } from 'react';

import { usePrefs } from '../state/prefs';

// One round of any mode: core's reducer in a useReducer, and the platform's 1-second tick while
// the clock runs. A new round is a new component (keyed by the game id).
export function useRound(settings: GameSettings) {
  const { introSeen } = usePrefs();
  const [state, dispatch] = useReducer(roundReducer, settings, (s): RoundState => {
    const cards = cardsFor(bank, s.difficulties, s.categories);
    return createRound(s, { cards, seed: newSeed(), showIntro: !introSeen(modeRules(s.mode).play) });
  });

  const running = state.kind === 'swipe' && isClockRunning(state);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => dispatch({ type: 'tick', seconds: 1 }), 1000);
    return () => clearInterval(id);
  }, [running]);

  return [state, dispatch] as const;
}

