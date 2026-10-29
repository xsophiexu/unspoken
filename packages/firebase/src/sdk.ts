import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { collection, doc, getFirestore, serverTimestamp, writeBatch, type Firestore } from 'firebase/firestore';

import { SERVER_TIME, type BatchWrite, type DocValue, type FirebaseAdapter } from './adapter';
import type { FirebaseOptions } from './options';

// The real Firebase SDK (the modular JS SDK). Nothing else in the package imports 'firebase/*'.

export type FirebaseServices = { app: FirebaseApp; auth: Auth; firestore: Firestore };

export type FirebaseSetup = {
  // How to create Auth; getAuth by default. React Native can pass initializeAuth with a persistence.
  auth?: (app: FirebaseApp) => Auth;
};

let services: FirebaseServices | undefined;

// The app, Auth and Firestore, created on first call and reused after that (later options are
// ignored: one app per page or process).
export function getFirebase(options: FirebaseOptions, setup: FirebaseSetup = {}): FirebaseServices {
  if (services) return services;
  const app = getApps().length > 0 ? getApp() : initializeApp(options);
  services = { app, auth: (setup.auth ?? getAuth)(app), firestore: getFirestore(app) };
  return services;
}

function toFirestore(value: DocValue): unknown {
  if (value === SERVER_TIME) return serverTimestamp();
  if (Array.isArray(value)) return value.map(toFirestore);
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, toFirestore(v as DocValue)]));
  return value;
}

// A FirebaseAdapter over the SDK. Firebase starts only when the adapter is first used.
export function firebaseAdapter(options: FirebaseOptions, setup?: FirebaseSetup): FirebaseAdapter {
  const firebase = () => getFirebase(options, setup);
  return {
    currentUid: () => firebase().auth.currentUser?.uid ?? null,
    signInAnonymously: async () => (await signInAnonymously(firebase().auth)).user.uid,
    commit: async (writes: readonly BatchWrite[]) => {
      const { firestore } = firebase();
      const batch = writeBatch(firestore);
      for (const write of writes) {
        const data = toFirestore(write.data) as Record<string, unknown>;
        if (write.kind === 'add') batch.set(doc(collection(firestore, write.collection)), data);
        else batch.set(doc(firestore, write.path), data);
      }
      await batch.commit();
    },
  };
}
