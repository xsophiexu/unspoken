import { quickPlaySettings, type MindReaderPlay } from '@unspoken/core';

import { backToGame } from '../nav';
import { usePrefs } from '../state/prefs';

// Starts a Mind Reader game with the saved word settings and goes to it; Quick Play starts at its
// own difficulty.
export function useStartMindReader() {
  const prefs = usePrefs();
  return (play: MindReaderPlay) => {
    prefs.startGame(play === 'quick' ? quickPlaySettings(prefs.settings) : { ...prefs.settings, mode: 'mindReader' }, play);
    backToGame();
  };
}
