'use client';

import { quickPlaySettings, type MindReaderPlay } from '@unspoken/core';
import { useRouter } from 'next/navigation';

import { routes } from '@/lib/routes';
import { useGame } from '@/state/game';

// Starts a Mind Reader game with the saved word settings and goes to it; Quick Play starts at its
// own difficulty.
export function useStartMindReader() {
  const game = useGame();
  const router = useRouter();
  return (play: MindReaderPlay) => {
    game.newGame(play === 'quick' ? quickPlaySettings(game.settings) : { ...game.settings, mode: 'mindReader' }, play);
    router.push(routes.play);
  };
}
