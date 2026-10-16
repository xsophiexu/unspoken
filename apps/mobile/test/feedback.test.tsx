import { en } from '@unspoken/content';
import { format } from '@unspoken/core';
import { fireEvent, screen, waitFor } from 'expo-router/testing-library';

import { openApp, resetDevice } from './helpers';

const API_URL = 'https://api.unspoken.test';
const IDEA = 'A team mode where each side gets its own color';
const realFetch = globalThis.fetch;
let fetchMock: jest.Mock;

beforeEach(async () => {
  await resetDevice();
  process.env.EXPO_PUBLIC_API_URL = API_URL;
  fetchMock = jest.fn();
  globalThis.fetch = fetchMock;
});
afterEach(() => {
  delete process.env.EXPO_PUBLIC_API_URL;
  globalThis.fetch = realFetch;
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

  it('posts the topic and text to the API, then thanks the player', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'fb_1', receivedAt: '2026-10-16T10:00:00.000Z' }), { status: 201 }));
    await openApp('/feedback?from=modes');
    await writeAndSend();

    expect(await screen.findByText(en.thanks.title)).toBeOnTheScreen();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/v1/feedback`);
    expect(JSON.parse(init.body)).toMatchObject({ topic: 'modes', message: IDEA, entryPoint: 'modes' });
  });

  it('shows an error and keeps the text when the API fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await openApp('/feedback?from=menu');
    await writeAndSend();

    expect(await screen.findByRole('alert')).toHaveTextContent(en.feedback.failed);
    expect(screen.getByDisplayValue(IDEA)).toBeOnTheScreen();
    expect(screen.queryByText(en.thanks.title)).not.toBeOnTheScreen();
  });

  it('shows the same error without calling anything when no API URL is configured', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    await openApp('/feedback?from=menu');
    await writeAndSend();

    expect(await screen.findByRole('alert')).toHaveTextContent(en.feedback.failed);
    expect(screen.getByDisplayValue(IDEA)).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
