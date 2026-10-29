// Feedback rules shared by every client and the service: what a message may be about, how long it
// may be, and which topic is picked for the player based on where they opened the form.
// Display text for topics and entry points lives in the copy catalog (@unspoken/content).

// Topic chips on the Send feedback screen, in display order.
export const FEEDBACK_TOPIC_IDS = ['styles', 'modes', 'words', 'other'] as const;
export type FeedbackTopic = (typeof FEEDBACK_TOPIC_IDS)[number];

// Where the form was opened from: the "Want another style?" tile on Customize, the "Want another
// mode?" card on Modes, or the game menu.
export const FEEDBACK_ENTRY_POINTS = ['customize', 'modes', 'menu'] as const;
export type FeedbackEntryPoint = (typeof FEEDBACK_ENTRY_POINTS)[number];

export const FEEDBACK_PLATFORMS = ['ios', 'android', 'web'] as const;
export type FeedbackPlatform = (typeof FEEDBACK_PLATFORMS)[number];

export type FeedbackRules = {
  maxLength: number;
  // The longest app version a message may carry (firestore.rules checks the same number).
  appVersionMaxLength: number;
  // The topic preselected for each entry point. The player can still pick another.
  topicFor: Readonly<Record<FeedbackEntryPoint, FeedbackTopic>>;
  // How many ideas a player may send (perWindow), counted from the first of them for windowDays
  // days. firestore.rules enforces the same numbers.
  sendLimit: { perWindow: number; windowDays: number };
};

export const feedbackRules: FeedbackRules = {
  maxLength: 500,
  appVersionMaxLength: 32,
  topicFor: { customize: 'styles', modes: 'modes', menu: 'other' },
  sendLimit: { perWindow: 2, windowDays: 1 },
};

const DAY_MS = 24 * 60 * 60 * 1000;

// A player's send window as stored in feedbackLimits/{uid}: ideas sent so far, and when the first
// of them was sent (milliseconds since the epoch).
export type FeedbackWindow = { count: number; since: number };

// What the next idea does to the window: opens a new one, adds to the current one (count is the
// new total), or is refused until the window ends.
export type NextFeedback = { kind: 'open' } | { kind: 'add'; count: number } | { kind: 'full'; until: number };

export function nextFeedback(window: FeedbackWindow | null, now: number, rules: FeedbackRules = feedbackRules): NextFeedback {
  const { perWindow, windowDays } = rules.sendLimit;
  const until = window ? window.since + windowDays * DAY_MS : 0;
  if (!window || now > until) return { kind: 'open' };
  if (window.count < perWindow) return { kind: 'add', count: window.count + 1 };
  return { kind: 'full', until };
}

// The topic the form opens with.
export function defaultFeedbackTopic(entryPoint: FeedbackEntryPoint | undefined, rules: FeedbackRules = feedbackRules): FeedbackTopic {
  return entryPoint ? rules.topicFor[entryPoint] : 'other';
}

// Characters typed so far against the limit ("74 / 500"), counting what the player sees once
// surrounding spaces are trimmed.
export function feedbackLength(message: string): number {
  return [...message.trim()].length;
}

// Whether a message can be sent: something besides spaces, within the limit.
export function canSendFeedback(message: string, rules: FeedbackRules = feedbackRules): boolean {
  const length = feedbackLength(message);
  return length > 0 && length <= rules.maxLength;
}
