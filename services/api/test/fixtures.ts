import { PGlite } from '@electric-sql/pglite';
import { createApiClient } from '@unspoken/api-contract';

import { createApp, type Dependencies } from '../src/app';
import { loadConfig } from '../src/config';
import { migrate, type Database } from '../src/db';

// The app built as main.ts builds it, from environment variables, behind one proxy so tests choose the
// caller's address with X-Forwarded-For. `api` is the typed client apps use; it checks every response
// against the contract.
export function testApp(env: Record<string, string> = {}, dependencies: Dependencies = {}) {
  const app = createApp(loadConfig({ TRUST_PROXY_HOPS: '1', ...env }), dependencies);
  const api = createApiClient({ baseUrl: 'http://api.test', fetch: async (input, init) => app.request(input, init) });
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    app.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  return { app, api, post };
}

// A real Postgres, in memory and in process (PGlite), migrated as the service does on start. One takes
// a few seconds to start, so a test file shares one and empties it before each test.
export async function testDatabase() {
  const db = new PGlite();
  await migrate(db);
  return {
    db,
    storedFeedback: async () => (await db.query('select * from feedback order by received_at')).rows,
    empty: () => db.exec('truncate feedback'),
  };
}

// A database that is down: every query fails as an unreachable server does.
export const unreachableDatabase: Database = {
  query: async () => {
    throw new Error('connect ECONNREFUSED 10.0.0.5:5432');
  },
};

// The error body's code and the paths of its issues, for comparing failures at a glance.
export async function failure(response: Response) {
  const { error } = (await response.json()) as { error: { code: string; issues?: { path: unknown[] }[] } };
  return { status: response.status, code: error.code, paths: error.issues?.map((i) => i.path) };
}
