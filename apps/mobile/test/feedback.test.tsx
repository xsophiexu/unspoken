import { en } from '@unspoken/content';
import { format } from '@unspoken/core';
import { SERVER_TIME, createFeedbackClient, type BatchWrite, type FirebaseOptions } from '@unspoken/firebase';
import { fireEvent, screen } from 'expo-router/testing-library';

import { openApp, resetDevice } from './helpers';

// test/setup.ts replaces src/firebase.ts, the app's only link to the Firebase SDK. Here it builds
// the real feedback client over a stand-in adapter that signs in a fixed user and records (or
// rejects) each batch.
const { firebaseFeedbackClient } = jest.requireMock<{ firebaseFeedbackClient: jest.Mock }>('../src/firebase');

const FIREBASE_ENV = {
  EXPO_PUBLIC_FIREBASE_API_KEY: 'test-key',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'unspoken-test.firebaseapp.com',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'unspoken-test',
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'unspoken-test.firebasestorage.app',
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123',
  EXPO_PUBLIC_FIREBASE_APP_ID: '1:123:web:abc',
};
const IDEA = 'A team mode where each side gets its own color';
let batches: BatchWrite[][];
let rejectCode: string | undefined;

beforeEach(async () => {
  await resetDevice();
  Object.assign(process.env, FIREBASE_ENV);
  batches = [];
  rejectCode = undefined;
  firebaseFeedbackClient.mockImplementation((_options: FirebaseOptions) =>
    createFeedbackClient({
      currentUid: () => null,
      signInAnonymously: async () => 'anon-1',
      commit: async (writes) => {
        if (rejectCode) throw Object.assign(new Error(rejectCode), { code: rejectCode });
        batches.push([...writes]);
      },
    }),
  );
});
afterEach(() => {
  for (const key of Object.keys(FIREBASE_ENV)) delete process.env[key];
  firebaseFeedbackClient.mockReset();
});

const topic = (id: keyof typeof en.feedback.topics) => screen.getByRole('radio', { name: en.feedback.topics[id] });

async function writeAndSend() {
  fireEvent.changeText(await screen.findByLabelText(en.feedback.ideaLabel), IDEA);
  fireEvent.press(screen.getByLabelText(en.feedback.send));
}

describe('Send feedback', () => {
  it('picks Game modes when opened from Modes', async () => {
    await openApp('/modes');
    fireEvent.press(await screen.findByLabelText(`${en.modesScreen.suggest.title} ${en.modesScreen.suggest.action}`));

    expect(await screen.findByText(format(en.feedback.pickedFor, { place: en.feedback.places.modes }))).toBeOnTheScreen();
    expect(topic('modes')).toBeSelected();
    expect(topic('styles')).not.toBeSelected();
  });

  it('picks Styles and colors when opened from Customize', async () => {
    await openApp('/customize');
    fireEvent(await screen.findByText(en.customize.style), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 350, height: 400 } } });
    fireEvent.press(await screen.findByLabelText(`${en.customize.suggest.title} ${en.customize.suggest.action}`));

    expect(await screen.findByText(format(en.feedback.pickedFor, { place: en.feedback.places.customize }))).toBeOnTheScreen();
    expect(topic('styles')).toBeSelected();
    expect(topic('modes')).not.toBeSelected();
  });

  it('writes the topic and text to Firestore with the configured project, then thanks the player', async () => {
    await openApp('/feedback?from=modes');
    await writeAndSend();

    expect(await screen.findByText(en.thanks.title)).toBeOnTheScreen();
    expect(firebaseFeedbackClient).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'unspoken-test', appId: '1:123:web:abc' }));
    expect(batches).toHaveLength(1);
    expect(batches[0]?.[0]).toMatchObject({
      kind: 'add',
      collection: 'feedback',
      data: { topic: 'modes', message: IDEA, entryPoint: 'modes', uid: 'anon-1', receivedAt: SERVER_TIME },
    });
  });

  it('shows an error and keeps the text when sending fails', async () => {
    rejectCode = 'unavailable';
    await openApp('/feedback?from=menu');
    await writeAndSend();

    expect(await screen.findByRole('alert')).toHaveTextContent(en.feedback.failed);
    expect(screen.getByDisplayValue(IDEA)).toBeOnTheScreen();
    expect(screen.queryByText(en.thanks.title)).not.toBeOnTheScreen();
  });

  it('asks the player to wait a minute when Firestore refuses a second idea', async () => {
    rejectCode = 'permission-denied';
    await openApp('/feedback?from=menu');
    await writeAndSend();

    expect(await screen.findByRole('alert')).toHaveTextContent(en.feedback.rateLimited);
    expect(screen.getByDisplayValue(IDEA)).toBeOnTheScreen();
    expect(screen.queryByText(en.thanks.title)).not.toBeOnTheScreen();
  });

  it('shows the same error without touching Firebase when it is not configured', async () => {
    delete process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
    await openApp('/feedback?from=menu');
    await writeAndSend();

    expect(await screen.findByRole('alert')).toHaveTextContent(en.feedback.failed);
    expect(screen.getByDisplayValue(IDEA)).toBeOnTheScreen();
    expect(firebaseFeedbackClient).not.toHaveBeenCalled();
  });
});
