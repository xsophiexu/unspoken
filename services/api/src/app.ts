import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import type { ServiceConfig } from './config';
import { fail, handleError, type AppEnv } from './http';
import { feedbackRoutes, type Firestore } from './routes/feedback';
import { gameRoutes } from './routes/game';

// The longest preflight cache browsers honor (Chromium caps it at two hours).
const PREFLIGHT_MAX_AGE_SECONDS = 7200;

// External services the app talks to. Firestore is absent when Firebase isn't configured.
export type Dependencies = { firestore?: Firestore };

// The whole HTTP API as a Hono app: main.ts serves it, tests call app.request. Each feature is a route
// module mounted here; realtime rooms will be one more.
export function createApp(config: ServiceConfig, { firestore }: Dependencies = {}) {
  return new Hono<AppEnv>()
    .use(secureHeaders())
    .use(cors({ origin: config.corsOrigins, allowMethods: ['GET', 'POST'], allowHeaders: ['content-type'], maxAge: PREFLIGHT_MAX_AGE_SECONDS }))
    .use(bodyLimit({ maxSize: config.bodyLimitBytes, onError: (c) => fail(c, 'payload_too_large', `Send at most ${config.bodyLimitBytes} bytes`) }))
    .get('/health', (c) => c.json({ status: 'ok' }))
    .route('/', gameRoutes)
    .route('/', feedbackRoutes(config, firestore))
    .notFound((c) => fail(c, 'not_found', `No endpoint at ${c.req.method} ${c.req.path}`))
    .onError(handleError);
}
