import { FEEDBACK_ENTRY_POINTS, type EditionId, type FeedbackEntryPoint, type GameConfig, type ModeId } from '@unspoken/core';

import { config as unspokenConfig } from './catalog';

// Every screen's URL in one place. Trailing slashes match the static export (trailingSlash: true).
export const routes = {
  // Home: the edition switch, Quick Play, and the Modes, Customize and How to play links.
  home: '/',
  // UnspokenMD's own link (unspokengame.web.app/md/): Home, switched to UnspokenMD.
  md: '/md/',
  // The game. Quick Play opens it with the last settings; ?tour=1 opens How to play over it.
  play: '/play/',
  howToPlay: '/play/?tour=1',
  modes: '/modes/',
  setup: (mode: ModeId) => `/setup/?mode=${mode}`,
  // Mind Reader: its start screen, then a Custom game's steps (players, lineup, game settings).
  mindReader: '/mind-reader/',
  mindReaderPlayers: '/mind-reader/players/',
  mindReaderLineup: '/mind-reader/lineup/',
  mindReaderSettings: '/setup/?mode=mindReader&custom=1',
  // Versus: who's playing, Individual or Teams, then game settings.
  versus: '/versus/',
  versusLineup: '/versus/lineup/',
  versusSettings: '/setup/?mode=versus',
  customize: '/customize/',
  feedback: (from: FeedbackEntryPoint) => `/feedback/?from=${from}`,
  thanks: (from: FeedbackEntryPoint) => `/thanks/?from=${from}`,
} as const;

// The editions with a link of their own, opening Home in that edition.
export const editionHomes: Partial<Record<EditionId, string>> = { md: routes.md };

// The edition whose own link this path is (with or without its trailing slash), or undefined.
export function editionForPath(pathname: string, basePath = ''): EditionId | undefined {
  const path = pathname.replace(/\/+$/, '');
  return (Object.keys(editionHomes) as EditionId[]).find((id) => `${basePath}${editionHomes[id]}`.replace(/\/+$/, '') === path);
}

// Where each feedback entry point's Back link and Done button return to.
export const feedbackReturn: Record<FeedbackEntryPoint, string> = {
  customize: routes.customize,
  modes: routes.modes,
  menu: routes.play,
};

// ?from= on Send feedback and Thanks. Anything unknown counts as the game menu.
export function parseEntryPoint(value: string | null): FeedbackEntryPoint {
  return FEEDBACK_ENTRY_POINTS.find((id) => id === value) ?? 'menu';
}

// ?mode= on setup: a mode the edition's config offers and can play, or null.
export function parseMode(value: string | null, config: GameConfig = unspokenConfig): ModeId | null {
  return config.modes.find((m) => m.id === value && m.available)?.id ?? null;
}
