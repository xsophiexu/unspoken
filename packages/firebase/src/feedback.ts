import {
  FEEDBACK_ENTRY_POINTS,
  FEEDBACK_PLATFORMS,
  FEEDBACK_TOPIC_IDS,
  canSendFeedback,
  feedbackRules,
  type FeedbackEntryPoint,
  type FeedbackPlatform,
  type FeedbackTopic,
} from '@unspoken/core';

import { SERVER_TIME, errorCode, type FirebaseAdapter } from './adapter';
import { signInAnonymously } from './auth';

// Send feedback, written straight to Firestore. firestore.rules at the repo root checks the same
// shape and allows one message per user per minute: each message also stamps feedbackLimits/{uid}
// in the same batch, and the rules refuse a message within a minute of the last stamp.

export const FEEDBACK_COLLECTION = 'feedback';
export const FEEDBACK_LIMITS_COLLECTION = 'feedbackLimits';

export type FeedbackRequest = {
  topic: FeedbackTopic;
  message: string;
  entryPoint?: FeedbackEntryPoint | null;
  platform: FeedbackPlatform;
  appVersion?: string | null;
};

// invalid: the request breaks the shared rules and was not sent. rateLimited: Firestore refused it,
// which for a valid request means the last one was under a minute ago. failed: anything else
// (offline, sign-in failed, Firebase down).
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

export function createFeedbackClient(adapter: FirebaseAdapter): FeedbackClient {
  return {
    async sendFeedback(request) {
      const fields = validate(request);
      try {
        const uid = await signInAnonymously(adapter);
        await adapter.commit([
          { kind: 'add', collection: FEEDBACK_COLLECTION, data: { ...fields, uid, receivedAt: SERVER_TIME } },
          { kind: 'set', path: `${FEEDBACK_LIMITS_COLLECTION}/${uid}`, data: { last: SERVER_TIME } },
        ]);
      } catch (error) {
        throw new FeedbackError(errorCode(error) === 'permission-denied' ? 'rateLimited' : 'failed', { cause: error });
      }
    },
  };
}
