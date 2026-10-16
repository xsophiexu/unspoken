import { createApiClient } from '@unspoken/api-contract';

import { createApp, type Dependencies } from '../src/app';
import { loadConfig } from '../src/config';
import type { FeedbackDocument, Firestore } from '../src/routes/feedback';

// The app built as main.ts builds it, from environment variables, behind one proxy (like Cloud Run) so
// tests choose the caller's address with X-Forwarded-For. `api` is the typed client apps use; it checks
// every response against the contract.
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

// Stands in for Firestore: records each document added and where, or fails like an outage.
export function fakeFirestore({ down = false } = {}) {
  const added: { collection: string; document: FeedbackDocument }[] = [];
  const firestore: Firestore = {
    collection: (collection) => ({
      add: async (document) => {
        if (down) throw new Error('14 UNAVAILABLE: Firestore is down');
        added.push({ collection, document });
        return { id: `doc-${added.length}` };
      },
    }),
  };
  return { firestore, added };
}

// The error body's code and the paths of its issues, for comparing failures at a glance.
export async function failure(response: Response) {
  const { error } = (await response.json()) as { error: { code: string; issues?: { path: unknown[] }[] } };
  return { status: response.status, code: error.code, paths: error.issues?.map((i) => i.path) };
}
