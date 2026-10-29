import { connectAuthEmulator, signOut } from 'firebase/auth';
import { collection, connectFirestoreEmulator, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { FeedbackError, createFeedbackClient, signInAnonymously } from '../../src';
import { firebaseAdapter, getFirebase } from '../../src/sdk';

// firestore.rules against the real Firestore and Auth emulators (started by `pnpm test:rules`).
// The real adapter and feedback client send the valid messages; hand-made batches try the rest.

const PROJECT = 'demo-unspoken';
const options = { apiKey: 'demo-key', authDomain: `${PROJECT}.firebaseapp.com`, projectId: PROJECT, storageBucket: '', messagingSenderId: '0', appId: 'demo' };
const { auth, firestore } = getFirebase(options);
const adapter = firebaseAdapter(options);
const feedback = createFeedbackClient(adapter);

beforeAll(() => {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
});

// Each test starts as a new anonymous user, so one test's rate limit never touches another.
beforeEach(async () => {
  await signOut(auth);
});

const user = () => signInAnonymously(adapter);

const goodDoc = (uid: string) => ({
  topic: 'modes',
  message: 'A team mode',
  entryPoint: 'modes',
  platform: 'web',
  appVersion: '1.0.0',
  uid,
  receivedAt: serverTimestamp(),
});

// One batch like the client's: a feedback doc plus the sender's stamp (or a different stamp).
async function sendBatch(data: Record<string, unknown>, limit: { uid: string; data: Record<string, unknown> } | null) {
  const batch = writeBatch(firestore);
  batch.set(doc(collection(firestore, 'feedback')), data);
  if (limit) batch.set(doc(firestore, 'feedbackLimits', limit.uid), limit.data);
  await batch.commit();
}

const denied = (promise: Promise<unknown>) => expect(promise).rejects.toMatchObject({ code: 'permission-denied' });

// Reads what was stored, bypassing the rules the way the console or admin credentials do.
async function storedFeedback(): Promise<Record<string, { stringValue?: string; nullValue?: null; timestampValue?: string }>[]> {
  const response = await fetch(`http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents/feedback?pageSize=500`, {
    headers: { Authorization: 'Bearer owner' },
  });
  const body = (await response.json()) as { documents?: { fields: Record<string, never> }[] };
  return (body.documents ?? []).map((d) => d.fields);
}

describe('feedback', () => {
  it('accepts a message from the feedback client and stores it with the sender and server time', async () => {
    await feedback.sendFeedback({ topic: 'words', message: '  More food words  ', entryPoint: 'menu', platform: 'android', appVersion: '1.2.3' });
    const uid = adapter.currentUid();
    const mine = (await storedFeedback()).find((f) => f.uid?.stringValue === uid);
    expect(mine).toMatchObject({
      topic: { stringValue: 'words' },
      message: { stringValue: 'More food words' },
      entryPoint: { stringValue: 'menu' },
      platform: { stringValue: 'android' },
      appVersion: { stringValue: '1.2.3' },
    });
    expect(mine?.receivedAt?.timestampValue).toEqual(expect.any(String));
  });

  it('accepts a message with no entry point or app version', async () => {
    await expect(feedback.sendFeedback({ topic: 'other', message: 'Hi', platform: 'ios' })).resolves.toBeUndefined();
  });

  it('refuses a second message from the same user within a minute', async () => {
    await feedback.sendFeedback({ topic: 'styles', message: 'A sand color', platform: 'web' });
    const error = await feedback.sendFeedback({ topic: 'styles', message: 'And a sea color', platform: 'web' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FeedbackError);
    expect((error as FeedbackError).code).toBe('rateLimited');
  });

  it('lets another user send in the same minute', async () => {
    await feedback.sendFeedback({ topic: 'styles', message: 'First', platform: 'web' });
    await signOut(auth);
    await expect(feedback.sendFeedback({ topic: 'styles', message: 'Second', platform: 'web' })).resolves.toBeUndefined();
  });

  it('refuses a message without the stamp in the same batch', async () => {
    const uid = await user();
    await denied(sendBatch(goodDoc(uid), null));
  });

  it('refuses a stamp that is not the server time', async () => {
    const uid = await user();
    await denied(sendBatch(goodDoc(uid), { uid, data: { last: Timestamp.fromMillis(Date.now()) } }));
  });

  it('refuses a message when signed out', async () => {
    await denied(sendBatch(goodDoc('nobody'), { uid: 'nobody', data: { last: serverTimestamp() } }));
  });

  it.each([
    ['an extra key', { extra: 'x' }],
    ['a missing key', { appVersion: undefined }],
    ['an unknown topic', { topic: 'colours' }],
    ['an unknown entry point', { entryPoint: 'settings' }],
    ['a null platform', { platform: null }],
    ['an unknown platform', { platform: 'desktop' }],
    ['an empty message', { message: '' }],
    ['a message over 500 characters', { message: 'x'.repeat(501) }],
    ['a message that is not a string', { message: 42 }],
    ['an app version over 32 characters', { appVersion: 'x'.repeat(33) }],
    ['a client-side time', { receivedAt: Timestamp.fromMillis(Date.now()) }],
  ])('refuses a message with %s', async (_, change) => {
    const uid = await user();
    const data: Record<string, unknown> = { ...goodDoc(uid), ...change };
    for (const key of Object.keys(data)) if (data[key] === undefined) delete data[key];
    await denied(sendBatch(data, { uid, data: { last: serverTimestamp() } }));
  });

  it('refuses a message signed with someone else’s uid', async () => {
    const uid = await user();
    await denied(sendBatch({ ...goodDoc(uid), uid: 'someone-else' }, { uid, data: { last: serverTimestamp() } }));
  });

  it('accepts the hand-made batch the rules describe (so the refusals above are about the change)', async () => {
    const uid = await user();
    await expect(sendBatch(goodDoc(uid), { uid, data: { last: serverTimestamp() } })).resolves.toBeUndefined();
  });

  it('cannot be read, changed or deleted', async () => {
    const uid = await user();
    const ref = doc(collection(firestore, 'feedback'));
    const batch = writeBatch(firestore);
    batch.set(ref, goodDoc(uid));
    batch.set(doc(firestore, 'feedbackLimits', uid), { last: serverTimestamp() });
    await batch.commit();

    await denied(getDoc(ref));
    await denied(updateDoc(ref, { message: 'Changed' }));
    const remove = writeBatch(firestore);
    remove.delete(ref);
    await denied(remove.commit());
  });
});

describe('feedbackLimits', () => {
  it('lets a user stamp their own doc with the server time, and nothing else', async () => {
    const uid = await user();
    await expect(setDoc(doc(firestore, 'feedbackLimits', uid), { last: serverTimestamp() })).resolves.toBeUndefined();
    await denied(setDoc(doc(firestore, 'feedbackLimits', uid), { last: serverTimestamp(), extra: true }));
    await denied(setDoc(doc(firestore, 'feedbackLimits', uid), { last: Timestamp.fromMillis(0) }));
    await denied(setDoc(doc(firestore, 'feedbackLimits', 'someone-else'), { last: serverTimestamp() }));
  });

  it('cannot be read, even by its owner', async () => {
    const uid = await user();
    await setDoc(doc(firestore, 'feedbackLimits', uid), { last: serverTimestamp() });
    await denied(getDoc(doc(firestore, 'feedbackLimits', uid)));
  });
});

describe('everything else', () => {
  it('is closed', async () => {
    await user();
    await denied(setDoc(doc(firestore, 'lobbies', 'x'), { a: 1 }));
    await denied(getDoc(doc(firestore, 'lobbies', 'x')));
  });
});
