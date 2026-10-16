import { clientConfigSchema, createApiClient, type ApiClient } from '@unspoken/api-contract';
import type { FeedbackPlatform } from '@unspoken/core';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Deployment values come from EXPO_PUBLIC_* env vars (.env.local locally, EAS or CI variables for
// builds; see .env.example). Expo inlines only literal process.env.EXPO_PUBLIC_* reads, so each is
// read by its full name here and nowhere else. A missing or invalid value is left out: the app
// still plays offline, and sending feedback shows an error.

type ClientField = keyof typeof clientConfigSchema.shape;

function valid(key: ClientField, value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = clientConfigSchema.shape[key].safeParse(value);
  if (parsed.success) return parsed.data;
  console.warn(`Ignoring ${key}: ${parsed.error.issues[0]?.message ?? 'invalid'}`);
  return undefined;
}

export type AppConfig = {
  apiBaseUrl?: string;
  gaMeasurementId?: string;
  appVersion?: string;
  platform: FeedbackPlatform;
};

export function appConfig(): AppConfig {
  return {
    apiBaseUrl: valid('apiBaseUrl', process.env.EXPO_PUBLIC_API_URL),
    gaMeasurementId: valid('gaMeasurementId', process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID),
    appVersion: Constants.expoConfig?.version,
    platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
  };
}

// The typed API client, or null when no API URL is configured.
export function apiClient(): ApiClient | null {
  const { apiBaseUrl } = appConfig();
  return apiBaseUrl ? createApiClient({ baseUrl: apiBaseUrl }) : null;
}
