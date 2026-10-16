import { feedbackRequestSchema, paths, type FeedbackReceipt } from '@unspoken/api-contract';
import { Hono } from 'hono';
import type { z } from 'zod';

import type { ServiceConfig } from '../config';
import { fail, validJson, type AppEnv } from '../http';
import { clientAddress, rateLimit } from '../rate-limit';

// What each stored document holds: the validated request plus when it arrived (a Firestore timestamp).
export type FeedbackDocument = z.output<typeof feedbackRequestSchema> & { receivedAt: Date };

// The part of the Firebase Admin Firestore client the service uses, so tests can pass a fake.
export type Firestore = {
  collection(path: string): { add(document: FeedbackDocument): Promise<{ id: string }> };
};

// POST /v1/feedback: ideas from Send feedback, stored in Firestore. Answers 503 unavailable when the
// server has no Firebase project.
export function feedbackRoutes(config: ServiceConfig, firestore: Firestore | undefined) {
  const routes = new Hono<AppEnv>();
  if (!firestore) return routes.post(paths.feedback, (c) => fail(c, 'unavailable', 'Feedback is not set up on this server'));

  const { collection, rateLimit: limit, rateWindowSeconds } = config.feedback;
  const perCaller = rateLimit({ limit, windowSeconds: rateWindowSeconds, key: (c) => clientAddress(c, config.trustProxyHops) });
  return routes.post(paths.feedback, perCaller, validJson(feedbackRequestSchema), async (c) => {
    const receivedAt = new Date();
    const { id } = await firestore.collection(collection).add({ ...c.req.valid('json'), receivedAt });
    return c.json<FeedbackReceipt>({ id, receivedAt: receivedAt.toISOString() }, 201);
  });
}
