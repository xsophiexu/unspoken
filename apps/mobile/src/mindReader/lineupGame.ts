import { en } from '@unspoken/content';
import { gameConfig, versusLineupConfig, type GameConfig, type Lineup } from '@unspoken/core';
import type { Href } from 'expo-router';

import { usePrefs } from '../state/prefs';

// The games set up with players and teams: Mind Reader's Custom game and Versus. Both use the same
// setup screens (Who's playing?, How do you want to play?, the team sheet and player menu); this
// says which lineup they edit, the limits it plays by, where Next goes and the lines that differ.
export type LineupGame = 'mindReader' | 'versus';

export type LineupSetup = {
  game: LineupGame;
  lineup: Lineup;
  edit: (change: (l: Lineup) => Lineup) => void;
  // Pass to the lineup functions in core: its mindReader limits are this game's.
  config: GameConfig;
  copy: {
    step: string;
    // Step 1's back link.
    startBack: string;
    tooFew: { one: string; other: string };
    // A line under the names on step 1, or null.
    playersHint: string | null;
    individualHint: string;
    teamsHint: string;
    first: string;
  };
  next: { players: Href; lineup: Href };
};

export function useLineupSetup(game: LineupGame): LineupSetup {
  const prefs = usePrefs();
  const mr = en.mindReader;
  if (game === 'versus') {
    const v = en.versus.setup;
    const config = versusLineupConfig();
    return {
      game,
      lineup: prefs.versus.lineup,
      edit: (change) => prefs.setVersus((s) => ({ ...s, lineup: change(s.lineup) })),
      config,
      copy: {
        step: v.step,
        startBack: v.back,
        tooFew: v.tooFew,
        playersHint: v.playersHint,
        individualHint: v.individualHint,
        teamsHint: v.teamsHint,
        first: v.first,
      },
      next: { players: '/versus/lineup', lineup: { pathname: '/setup', params: { mode: 'versus' } } },
    };
  }
  return {
    game,
    lineup: prefs.mindReader.lineup,
    edit: (change) => prefs.setMindReader((m) => ({ ...m, lineup: change(m.lineup) })),
    config: gameConfig,
    copy: {
      step: mr.step,
      startBack: mr.start.back,
      tooFew: mr.players.tooFew,
      playersHint: null,
      individualHint: mr.lineup.individualHint,
      teamsHint: mr.lineup.teamsHint,
      first: mr.lineup.first,
    },
    next: { players: '/mind-reader/lineup', lineup: { pathname: '/setup', params: { mode: 'mindReader', custom: '1' } } },
  };
}
