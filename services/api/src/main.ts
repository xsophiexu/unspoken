import { serve } from '@hono/node-server';
import { Pool } from 'pg';

import { createApp } from './app';
import { loadConfig } from './config';
import { migrate } from './db';

const config = loadConfig();

// Postgres when DATABASE_URL is set. The connect timeout turns an outage into a quick 500 rather than a
// hanging request. A bad URL or an unreachable database stops the start here, on the migration.
const db = config.databaseUrl ? new Pool({ connectionString: config.databaseUrl, max: 5, connectionTimeoutMillis: 5000 }) : undefined;
// An idle connection the server drops (say, Postgres restarting) is reported here, and the pool replaces it.
db?.on('error', (error) => console.error('Postgres connection lost:', error.message));
if (db) await migrate(db);

const app = createApp(config, { db });

const server = serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`Unspoken API listening on port ${port}. Feedback ${db ? 'stored in Postgres' : 'off: DATABASE_URL is not set'}. Browser origins allowed: ${config.corsOrigins.join(', ') || 'none (set CORS_ORIGINS)'}.`);
});

// Railway sends SIGTERM before stopping a deployment: finish in-flight requests, close the pool, exit.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () =>
    server.close(async () => {
      await db?.end();
      process.exit(0);
    }),
  );
}
