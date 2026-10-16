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
  // The topic preselected for each entry point. The player can still pick another.
  topicFor: Readonly<Record<FeedbackEntryPoint, FeedbackTopic>>;
};

export const feedbackRules: FeedbackRules = {
  maxLength: 500,
  topicFor: { customize: 'styles', modes: 'modes', menu: 'other' },
};

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
