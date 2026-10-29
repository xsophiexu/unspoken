// The boundary between Unspoken and the Firebase SDK. Everything above it (sign-in reuse, feedback,
// later lobbies) talks to a FirebaseAdapter, so tests replace only this boundary with a fake.
// firebaseAdapter() in ./sdk is the real one.

// Stands for "the server's clock at commit" in written data; the real adapter turns it into
// serverTimestamp(), and firestore.rules compares such fields with request.time.
export const SERVER_TIME: unique symbol = Symbol('serverTime');
export type ServerTime = typeof SERVER_TIME;

export type DocValue = string | number | boolean | null | ServerTime | readonly DocValue[] | { readonly [key: string]: DocValue };
export type DocData = { readonly [key: string]: DocValue };

// One write in an atomic batch: add a document with a new id to a collection, or set (replace) the
// document at a path such as 'feedbackLimits/{uid}'.
export type BatchWrite = { kind: 'add'; collection: string; data: DocData } | { kind: 'set'; path: string; data: DocData };

export type FirebaseAdapter = {
  // The signed-in user's id, or null before sign-in.
  currentUid(): string | null;
  // Signs in as a new anonymous user and returns its id.
  signInAnonymously(): Promise<string>;
  // Applies every write or none. Rejects with the SDK's error, whose code is e.g. 'permission-denied'.
  commit(writes: readonly BatchWrite[]): Promise<void>;
};

// The error code an SDK failure carries ('permission-denied', 'unavailable', 'auth/network-request-failed'), if any.
export function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
}
