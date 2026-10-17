import { type MindReaderPlay } from '@unspoken/core';

import { backToGame } from '../nav';
import { usePrefs } from '../state/prefs';

// Starts a Mind Reader game with the saved word settings and goes to it.
export function useStartMindReader() {
  const prefs = usePrefs();
  return (play: MindReaderPlay) => {
    prefs.startGame({ ...prefs.settings, mode: 'mindReader' }, play);
    backToGame();
  };
}
