import type { FeedbackEntryPoint, ModeId } from '@unspoken/core';

// Every screen's URL in one place. Trailing slashes match the static export (trailingSlash: true).
export const routes = {
  play: '/',
  modes: '/modes/',
  setup: (mode: ModeId) => `/setup/?mode=${mode}`,
  customize: '/customize/',
  feedback: (from: FeedbackEntryPoint) => `/feedback/?from=${from}`,
} as const;

// Where each feedback entry point's Back link and Done button return to.
export const feedbackReturn: Record<FeedbackEntryPoint, string> = {
  customize: routes.customize,
  modes: routes.modes,
  menu: routes.play,
};
