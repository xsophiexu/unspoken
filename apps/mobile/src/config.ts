import { clientConfigSchema } from '@unspoken/api-contract';
import type { FeedbackPlatform } from '@unspoken/core';
import { firebaseOptions, type FeedbackClient, type FirebaseOptions } from '@unspoken/firebase';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { firebaseFeedbackClient } from './firebase';

// Deployment values come from EXPO_PUBLIC_* env vars (.env, overridden by .env.local locally or by
// EAS or CI variables for builds; see .env.example). Expo inlines only literal
// process.env.EXPO_PUBLIC_* reads, so each is read by its full name here and nowhere else. A
// missing or invalid value is left out: the app still plays offline, and sending feedback shows an
// error.

function validGaMeasurementId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = clientConfigSchema.shape.gaMeasurementId.safeParse(value);
  if (parsed.success) return parsed.data;
  console.warn(`Ignoring gaMeasurementId: ${parsed.error.issues[0]?.message ?? 'invalid'}`);
  return undefined;
}

export type AppConfig = {
  // The Firebase web config (public by design); null unless every value is set.
  firebase: FirebaseOptions | null;
  gaMeasurementId?: string;
  appVersion?: string;
  platform: FeedbackPlatform;
};

export function appConfig(): AppConfig {
  return {
    firebase: firebaseOptions({
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    }),
    gaMeasurementId: validGaMeasurementId(process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID),
    appVersion: Constants.expoConfig?.version,
    platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
  };
}

// Sends feedback to Firestore, or null when the Firebase values are not all set.
export function feedbackClient(): FeedbackClient | null {
  const { firebase } = appConfig();
  return firebase ? firebaseFeedbackClient(firebase) : null;
}
