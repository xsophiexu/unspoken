import { serve } from '@hono/node-server';

import { createApp } from './app';
import { loadConfig, type FirebaseConfig } from './config';
import type { Firestore } from './routes/feedback';

// Firestore through the Firebase Admin SDK, loaded only when a Firebase project is configured. With no
// service account key it uses Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS, or the
// Cloud Run service account); FIRESTORE_EMULATOR_HOST points it at the local emulator.
async function connectFirestore({ projectId, serviceAccount }: FirebaseConfig): Promise<Firestore> {
  const { cert, initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  return getFirestore(initializeApp({ projectId, ...(serviceAccount && { credential: cert(serviceAccount) }) }));
}

// When a write fails (say, the credentials are wrong) the Firestore client also leaves a rejected
// promise behind. The request has already answered 500, so log it rather than let Node exit.
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

const config = loadConfig();
const firestore = config.firebase && (await connectFirestore(config.firebase));
const app = createApp(config, { firestore });

const server = serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  const feedback = config.firebase ? `stored in Firestore (${config.firebase.projectId})` : 'off: no Firebase project configured';
  console.log(`Unspoken API listening on port ${port}. Feedback ${feedback}.`);
});

// Cloud Run sends SIGTERM before stopping an instance: finish in-flight requests, then exit.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
