import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import type { ServiceConfig } from './config';
import type { Database } from './db';
import { fail, handleError, type AppEnv } from './http';
import { feedbackRoutes } from './routes/feedback';
import { gameRoutes } from './routes/game';

// The longest preflight cache browsers honor (Chromium caps it at two hours).
const PREFLIGHT_MAX_AGE_SECONDS = 7200;

// External services the app talks to. The database is absent when DATABASE_URL isn't set.
export type Dependencies = { db?: Database };

// The whole HTTP API as a Hono app: main.ts serves it, tests call app.request. Each feature is a route
// module mounted here; realtime rooms will be one more.
export function createApp(config: ServiceConfig, { db }: Dependencies = {}) {
  return new Hono<AppEnv>()
    .use(secureHeaders())
    .use(cors({ origin: config.corsOrigins, allowMethods: ['GET', 'POST'], allowHeaders: ['content-type'], maxAge: PREFLIGHT_MAX_AGE_SECONDS }))
    .use(bodyLimit({ maxSize: config.bodyLimitBytes, onError: (c) => fail(c, 'payload_too_large', `Send at most ${config.bodyLimitBytes} bytes`) }))
    .get('/health', (c) => c.json({ status: 'ok' }))
    .route('/', gameRoutes)
    .route('/', feedbackRoutes(config, db))
    .notFound((c) => fail(c, 'not_found', `No endpoint at ${c.req.method} ${c.req.path}`))
    .onError(handleError);
}
