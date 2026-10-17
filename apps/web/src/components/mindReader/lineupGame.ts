'use client';

import { en } from '@unspoken/content';
import { gameConfig, versusLineupConfig, type GameConfig, type Lineup } from '@unspoken/core';

import { routes } from '@/lib/routes';
import { useGame } from '@/state/game';

// The games set up with players and teams: Mind Reader's Custom game and Versus. Both use the same
// setup screens (Who's playing?, How do you want to play?, the team sheet and player menu); this
// says which lineup they edit, the limits it plays by, where Back and Next go and the lines that
// differ.
export type LineupGame = 'mindReader' | 'versus';

export type LineupSetup = {
  lineup: Lineup;
  edit: (change: (l: Lineup) => Lineup) => void;
  // Pass to the lineup functions in core: its mindReader limits are this game's.
  config: GameConfig;
  copy: {
    step: string;
    startBack: string;
    tooFew: { one: string; other: string };
    // A line under the names on step 1, or null.
    playersHint: string | null;
    individualHint: string;
    teamsHint: string;
    first: string;
  };
  routes: { start: string; players: string; lineup: string; settings: string };
};

export function useLineupSetup(game: LineupGame): LineupSetup {
  const { mindReader, setMindReader, versus, setVersus } = useGame();
  const mr = en.mindReader;
  if (game === 'versus') {
    const v = en.versus.setup;
    return {
      lineup: versus.lineup,
      edit: (change) => setVersus((s) => ({ ...s, lineup: change(s.lineup) })),
      config: versusLineupConfig(),
      copy: { step: v.step, startBack: v.back, tooFew: v.tooFew, playersHint: v.playersHint, individualHint: v.individualHint, teamsHint: v.teamsHint, first: v.first },
      routes: { start: routes.modes, players: routes.versus, lineup: routes.versusLineup, settings: routes.versusSettings },
    };
  }
  return {
    lineup: mindReader.lineup,
    edit: (change) => setMindReader((m) => ({ ...m, lineup: change(m.lineup) })),
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
    routes: { start: routes.mindReader, players: routes.mindReaderPlayers, lineup: routes.mindReaderLineup, settings: routes.mindReaderSettings },
  };
}
