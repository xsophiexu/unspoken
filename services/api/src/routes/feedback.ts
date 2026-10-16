import { feedbackRequestSchema, paths, type FeedbackReceipt } from '@unspoken/api-contract';
import { Hono } from 'hono';

import type { ServiceConfig } from '../config';
import type { Database } from '../db';
import { fail, validJson, type AppEnv } from '../http';
import { clientAddress, rateLimit } from '../rate-limit';

// POST /v1/feedback: ideas from Send feedback, stored in the feedback table. Answers 503 unavailable
// when the server has no database.
export function feedbackRoutes(config: ServiceConfig, db: Database | undefined) {
  const routes = new Hono<AppEnv>();
  if (!db) return routes.post(paths.feedback, (c) => fail(c, 'unavailable', 'Feedback is not set up on this server'));

  const { rateLimit: limit, rateWindowSeconds } = config.feedback;
  const perCaller = rateLimit({ limit, windowSeconds: rateWindowSeconds, key: (c) => clientAddress(c, config.trustProxyHops) });
  return routes.post(paths.feedback, perCaller, validJson(feedbackRequestSchema), async (c) => {
    const { topic, message, entryPoint = null, platform = null, appVersion = null } = c.req.valid('json');
    const receivedAt = new Date();
    const { rows } = await db.query(
      `insert into feedback (topic, message, entry_point, platform, app_version, received_at)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [topic, message, entryPoint, platform, appVersion, receivedAt],
    );
    return c.json<FeedbackReceipt>({ id: String(rows[0]?.id), receivedAt: receivedAt.toISOString() }, 201);
  });
}
