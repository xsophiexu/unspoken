import { clientConfigSchema } from '@unspoken/api-contract';
import { firebaseOptions } from '@unspoken/firebase';

// Deployment settings from the environment, validated once. Next inlines only literal
// process.env.NEXT_PUBLIC_* reads, so each variable is read here by its full name.
// An unset or malformed value is left out: the site still works, without that service.

const fields = clientConfigSchema.shape;

function valid<T>(schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } }, value: string | undefined): T | undefined {
  if (!value) return undefined;
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export const config = {
  // The Firebase web config (public by design); null unless every value is set. Send feedback
  // shows an inline error while it is missing.
  firebase: firebaseOptions({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }),
  // Google Analytics loads only when this is set.
  gaMeasurementId: valid(fields.gaMeasurementId, process.env.NEXT_PUBLIC_GA_ID),
  // The path the site is served under (GitHub Pages: /unspoken), for URLs Next does not prefix itself.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
};
