import type { BatchWrite, FirebaseAdapter } from '../src';

// A stand-in for the Firebase SDK boundary: it signs in users with predictable ids and records the
// batches it is asked to commit. commitError makes the next commits fail like the SDK does.
export function fakeAdapter({ uid = null as string | null, commitError = undefined as unknown, signInError = undefined as unknown } = {}) {
  const state = { uid, signIns: 0, batches: [] as BatchWrite[][], commitError, signInError };
  const adapter: FirebaseAdapter = {
    currentUid: () => state.uid,
    signInAnonymously: async () => {
      state.signIns += 1;
      if (state.signInError) throw state.signInError;
      state.uid = `anon-${state.signIns}`;
      return state.uid;
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
