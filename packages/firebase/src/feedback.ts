import {
  FEEDBACK_ENTRY_POINTS,
  FEEDBACK_PLATFORMS,
  FEEDBACK_TOPIC_IDS,
  canSendFeedback,
  feedbackRules,
  nextFeedback,
  type FeedbackWindow,
  type FeedbackEntryPoint,
  type FeedbackPlatform,
  type FeedbackTopic,
} from '@unspoken/core';

import { SERVER_TIME, errorCode, type BatchWrite, type FirebaseAdapter, type ReadData } from './adapter';
import { signInAnonymously } from './auth';

// Send feedback, written straight to Firestore. firestore.rules at the repo root checks the same
// shape and the same send limit (feedbackRules.sendLimit: 2 ideas, then nothing until a day after
// the first of them). Each player's window is feedbackLimits/{uid} = { count, since }: every idea
// opens a new window or adds one to the count in the same batch, and the rules refuse anything else.

export const FEEDBACK_COLLECTION = 'feedback';
export const FEEDBACK_LIMITS_COLLECTION = 'feedbackLimits';

export type FeedbackRequest = {
  topic: FeedbackTopic;
  message: string;
  entryPoint?: FeedbackEntryPoint | null;
  platform: FeedbackPlatform;
  appVersion?: string | null;
};

// invalid: the request breaks the shared rules and was not sent. rateLimited: the player's window is
// full, either seen before sending or because Firestore refused it (which for a valid request means
// the limit). failed: anything else (offline, sign-in failed, Firebase down).
export type FeedbackErrorCode = 'invalid' | 'rateLimited' | 'failed';

export class FeedbackError extends Error {
  constructor(
    readonly code: FeedbackErrorCode,
    options?: { cause?: unknown },
  ) {
    super(`Feedback not sent: ${code}`, options);
    this.name = 'FeedbackError';
  }
}

export type FeedbackClient = {
  sendFeedback(request: FeedbackRequest): Promise<void>;
};

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T => values.some((v) => v === value);

function validate({ topic, message, entryPoint, platform, appVersion }: FeedbackRequest) {
  const valid =
    isOneOf(FEEDBACK_TOPIC_IDS, topic) &&
    canSendFeedback(message) &&
    (entryPoint == null || isOneOf(FEEDBACK_ENTRY_POINTS, entryPoint)) &&
    isOneOf(FEEDBACK_PLATFORMS, platform);
  if (!valid) throw new FeedbackError('invalid');
  return {
    topic,
    message: message.trim(),
    entryPoint: entryPoint ?? null,
    platform,
    // The version only helps triage, so one that doesn't fit is left out rather than losing the idea.
    appVersion: appVersion && appVersion.length <= feedbackRules.appVersionMaxLength ? appVersion : null,
  };
}

// The stored window, or null when there is none or it predates the count (the old one-a-minute
// stamp, { last }), which the rules also treat as no window.
function storedWindow(data: ReadData | null): FeedbackWindow | null {
  if (!data || typeof data.count !== 'number' || !(data.since instanceof Date)) return null;
  return { count: data.count, since: data.since.getTime() };
}

export function createFeedbackClient(adapter: FirebaseAdapter): FeedbackClient {
  return {
    async sendFeedback(request) {
      const fields = validate(request);
      try {
        const uid = await signInAnonymously(adapter);
        const path = `${FEEDBACK_LIMITS_COLLECTION}/${uid}`;
        const next = nextFeedback(storedWindow(await adapter.get(path)), Date.now());
        if (next.kind === 'full') throw new FeedbackError('rateLimited');
        // A new window starts at the server's time; adding to one leaves its start as stored.
        const limit: BatchWrite = next.kind === 'open' ? { kind: 'set', path, data: { count: 1, since: SERVER_TIME } } : { kind: 'update', path, data: { count: next.count } };
        await adapter.commit([{ kind: 'add', collection: FEEDBACK_COLLECTION, data: { ...fields, uid, receivedAt: SERVER_TIME } }, limit]);
      } catch (error) {
        if (error instanceof FeedbackError) throw error;
        throw new FeedbackError(errorCode(error) === 'permission-denied' ? 'rateLimited' : 'failed', { cause: error });
      }
    },
  };
}
