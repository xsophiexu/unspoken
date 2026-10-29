import type { FirebaseAdapter } from './adapter';

const pending = new WeakMap<FirebaseAdapter, Promise<string>>();

// The current user's id, signing in anonymously first when nobody is signed in. Calls made while a
// sign-in is under way share it, so a double tap creates one anonymous user, not two.
export function signInAnonymously(adapter: FirebaseAdapter): Promise<string> {
  const uid = adapter.currentUid();
  if (uid) return Promise.resolve(uid);
  const inFlight = pending.get(adapter);
  if (inFlight) return inFlight;
  const signIn = adapter.signInAnonymously().finally(() => pending.delete(adapter));
  pending.set(adapter, signIn);
  return signIn;
}
