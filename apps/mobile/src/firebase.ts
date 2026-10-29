import AsyncStorage from '@react-native-async-storage/async-storage';
import { createFeedbackClient, type FeedbackClient, type FirebaseOptions } from '@unspoken/firebase';
import { firebaseAdapter } from '@unspoken/firebase/sdk';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Persistence, type ReactNativeAsyncStorage } from 'firebase/auth';
import { Platform } from 'react-native';

// Metro loads Firebase Auth's React Native build, which has getReactNativePersistence, but the
// package's types describe the browser build only, so the function is declared here.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}

// The app's only link to the Firebase SDK (tests replace this module). On iOS and Android the
// anonymous user is kept in device storage, so the two-ideas-a-day limit survives a restart; the
// web build keeps it in the browser as usual.
function auth(app: FirebaseApp) {
  return Platform.OS === 'web' ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

export function firebaseFeedbackClient(options: FirebaseOptions): FeedbackClient {
  return createFeedbackClient(firebaseAdapter(options, { auth }));
}
