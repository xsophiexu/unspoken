import { FEEDBACK_ENTRY_POINTS, MODE_IDS, modeRules, type FeedbackEntryPoint, type ModeId } from '@unspoken/core';

// Every screen's URL in one place. Trailing slashes match the static export (trailingSlash: true).
export const routes = {
  play: '/',
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

// ?mode= on setup: a mode that can be played, or null.
export function parseMode(value: string | null): ModeId | null {
  const mode = MODE_IDS.find((id) => id === value);
  return mode && modeRules(mode).available ? mode : null;
}
