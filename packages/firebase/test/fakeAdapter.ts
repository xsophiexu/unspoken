import type { BatchWrite, FirebaseAdapter, ReadData } from '../src';

// A stand-in for the Firebase SDK boundary: it signs in users with predictable ids, serves the
// documents in docs (by path) and records the batches it is asked to commit. commitError,
// getError and signInError make the next calls fail like the SDK does.
export function fakeAdapter({
  uid = null as string | null,
  docs = {} as Record<string, ReadData>,
  commitError = undefined as unknown,
  getError = undefined as unknown,
  signInError = undefined as unknown,
} = {}) {
  const state = { uid, signIns: 0, docs, batches: [] as BatchWrite[][], commitError, getError, signInError };
  const adapter: FirebaseAdapter = {
    currentUid: () => state.uid,
    signInAnonymously: async () => {
      state.signIns += 1;
      if (state.signInError) throw state.signInError;
      state.uid = `anon-${state.signIns}`;
      return state.uid;
    },
    get: async (path) => {
      if (state.getError) throw state.getError;
      return state.docs[path] ?? null;
    },
    commit: async (writes) => {
      if (state.commitError) throw state.commitError;
      state.batches.push([...writes]);
    },
  };
  return { adapter, state };
}

// What the SDK rejects with: a FirebaseError carries a string code.
export const sdkError = (code: string) => Object.assign(new Error(`Firebase: ${code}`), { code });
