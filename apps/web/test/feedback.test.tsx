import { en } from '@unspoken/content';
import { format } from '@unspoken/core';
import { SERVER_TIME, createFeedbackClient, type BatchWrite, type FirebaseAdapter } from '@unspoken/firebase';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { FeedbackScreen } from '@/screens/FeedbackScreen';

import { renderApp } from './app';

// A client over a stand-in for the Firebase SDK: sign-in gives a fixed user and commits are
// recorded, or rejected with this SDK error code.
function clientWith(rejectCode?: string) {
  const batches: BatchWrite[][] = [];
  const adapter: FirebaseAdapter = {
    currentUid: () => null,
    signInAnonymously: async () => 'anon-1',
    commit: async (writes) => {
      if (rejectCode) throw Object.assign(new Error(rejectCode), { code: rejectCode });
      batches.push([...writes]);
    },
  };
  return { batches, client: createFeedbackClient(adapter) };
}

describe('Send feedback', () => {
  it('preselects the topic for where it was opened, and Back returns there', () => {
    renderApp(<FeedbackScreen from="modes" client={null} />);
    expect(screen.getByRole('radio', { name: en.feedback.topics.modes })).toBeChecked();
    expect(screen.getByRole('radio', { name: en.feedback.topics.styles })).not.toBeChecked();
    expect(screen.getByText(format(en.feedback.pickedFor, { place: en.feedback.places.modes }))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: format(en.feedback.back, { place: en.feedback.places.modes }) })).toHaveAttribute('href', '/modes/');
  });

  it('opened from Customize, picks Styles and colors', () => {
    renderApp(<FeedbackScreen from="customize" client={null} />);
    expect(screen.getByRole('radio', { name: en.feedback.topics.styles })).toBeChecked();
  });

  it('sends only once there is something to send, and counts what the player sees', async () => {
    const user = userEvent.setup();
    renderApp(<FeedbackScreen from="menu" client={null} />);
    const send = screen.getByRole('button', { name: en.feedback.send });
    expect(send).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: en.feedback.ideaLabel }), '  More words ');
    expect(send).toBeEnabled();
    expect(screen.getByText('10 / 500')).toBeInTheDocument();
  });

  it('sends the idea with its topic and entry point to Firestore, then opens Thanks', async () => {
    const user = userEvent.setup();
    const { batches, client } = clientWith();
    const { router } = renderApp(<FeedbackScreen from="modes" client={client} />);
    await user.click(screen.getByRole('radio', { name: en.feedback.topics.words }));
    await user.type(screen.getByRole('textbox', { name: en.feedback.ideaLabel }), ' A team mode ');
    await user.click(screen.getByRole('button', { name: en.feedback.send }));

    expect(batches).toHaveLength(1);
    expect(batches[0]?.[0]).toMatchObject({
      kind: 'add',
      collection: 'feedback',
      data: { topic: 'words', message: 'A team mode', entryPoint: 'modes', platform: 'web', uid: 'anon-1', receivedAt: SERVER_TIME },
    });
    expect(router.push).toHaveBeenCalledWith('/thanks/?from=modes');
  });

  it('shows an inline error and keeps the text when sending fails', async () => {
    const user = userEvent.setup();
    const { client } = clientWith('unavailable');
    const { router } = renderApp(<FeedbackScreen from="customize" client={client} />);
    const box = screen.getByRole('textbox', { name: en.feedback.ideaLabel });
    await user.type(box, 'A warm sand color');
    await user.click(screen.getByRole('button', { name: en.feedback.send }));

    expect(await screen.findByRole('alert')).toHaveTextContent(en.feedback.failed);
    expect(box).toHaveValue('A warm sand color');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('asks the player to wait a minute when Firestore refuses a second idea', async () => {
    const user = userEvent.setup();
    const { client } = clientWith('permission-denied');
    const { router } = renderApp(<FeedbackScreen from="menu" client={client} />);
    const box = screen.getByRole('textbox', { name: en.feedback.ideaLabel });
    await user.type(box, 'Another idea');
    await user.click(screen.getByRole('button', { name: en.feedback.send }));

    expect(await screen.findByRole('alert')).toHaveTextContent(en.feedback.rateLimited);
    expect(box).toHaveValue('Another idea');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('shows the same error when Firebase is not configured', async () => {
    const user = userEvent.setup();
    renderApp(<FeedbackScreen from="menu" client={null} />);
    await user.type(screen.getByRole('textbox', { name: en.feedback.ideaLabel }), 'Hello');
    await user.click(screen.getByRole('button', { name: en.feedback.send }));
    expect(await screen.findByRole('alert')).toHaveTextContent(en.feedback.failed);
  });
});
