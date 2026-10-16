import { createApiClient } from '@unspoken/api-contract';
import { en } from '@unspoken/content';
import { format } from '@unspoken/core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FeedbackScreen } from '@/screens/FeedbackScreen';

import { renderApp } from './app';

const API = 'https://api.example.test';

// A client whose network answers with this status and body.
function clientAnswering(status: number, body: unknown) {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
  return { fetch, client: createApiClient({ baseUrl: API, fetch }) };
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

  it('posts the idea with its topic and entry point, then opens Thanks', async () => {
    const user = userEvent.setup();
    const { fetch, client } = clientAnswering(201, { id: 'fb_1', receivedAt: '2026-10-16T00:00:00.000Z' });
    const { router } = renderApp(<FeedbackScreen from="modes" client={client} />);
    await user.click(screen.getByRole('radio', { name: en.feedback.topics.words }));
    await user.type(screen.getByRole('textbox', { name: en.feedback.ideaLabel }), 'A team mode');
    await user.click(screen.getByRole('button', { name: en.feedback.send }));

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(`${API}/v1/feedback`);
    expect(JSON.parse(String(init?.body))).toMatchObject({ topic: 'words', message: 'A team mode', entryPoint: 'modes', platform: 'web' });
    expect(router.push).toHaveBeenCalledWith('/thanks/?from=modes');
  });

  it('shows an inline error and keeps the text when the API fails', async () => {
    const user = userEvent.setup();
    const { client } = clientAnswering(500, { error: { code: 'internal', message: 'Something broke' } });
    const { router } = renderApp(<FeedbackScreen from="customize" client={client} />);
    const box = screen.getByRole('textbox', { name: en.feedback.ideaLabel });
    await user.type(box, 'A warm sand color');
    await user.click(screen.getByRole('button', { name: en.feedback.send }));

    expect(await screen.findByRole('alert')).toHaveTextContent(en.feedback.failed);
    expect(box).toHaveValue('A warm sand color');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('shows the same error when no API is configured', async () => {
    const user = userEvent.setup();
    renderApp(<FeedbackScreen from="menu" client={null} />);
    await user.type(screen.getByRole('textbox', { name: en.feedback.ideaLabel }), 'Hello');
    await user.click(screen.getByRole('button', { name: en.feedback.send }));
    expect(await screen.findByRole('alert')).toHaveTextContent(en.feedback.failed);
  });
});
