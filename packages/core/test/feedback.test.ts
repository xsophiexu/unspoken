import { describe, expect, it } from 'vitest';

import { canSendFeedback, defaultFeedbackTopic, feedbackLength, nextFeedback } from '../src';

describe('feedback topic', () => {
  it('is picked from where the form was opened', () => {
    expect(defaultFeedbackTopic('customize')).toBe('styles');
    expect(defaultFeedbackTopic('modes')).toBe('modes');
    expect(defaultFeedbackTopic('menu')).toBe('other');
  });

  it('falls back to Something else without an entry point', () => {
    expect(defaultFeedbackTopic(undefined)).toBe('other');
  });
});

describe('feedback message', () => {
  it('can be sent with up to 500 characters', () => {
    expect(canSendFeedback('A team mode where each side gets its own color')).toBe(true);
    expect(canSendFeedback('x'.repeat(500))).toBe(true);
    expect(canSendFeedback('x'.repeat(501))).toBe(false);
  });

  it('needs more than spaces', () => {
    expect(canSendFeedback('')).toBe(false);
    expect(canSendFeedback('   \n ')).toBe(false);
  });

  it('counts what the player sees: trimmed, one per emoji', () => {
    expect(feedbackLength('  idea  ')).toBe(4);
    expect(feedbackLength('👍👍')).toBe(2);
    expect(canSendFeedback(`${'x'.repeat(499)}👍`)).toBe(true);
  });
});

describe('feedback send limit', () => {
  const day = 24 * 60 * 60 * 1000;
  const since = Date.UTC(2026, 9, 29, 9);

  it('opens a window with the first idea', () => {
    expect(nextFeedback(null, since)).toEqual({ kind: 'open' });
  });

  it('lets a second idea in the same day add to the window', () => {
    expect(nextFeedback({ count: 1, since }, since + 1000)).toEqual({ kind: 'add', count: 2 });
  });

  it('refuses a third idea until a day after the first', () => {
    expect(nextFeedback({ count: 2, since }, since + day - 1)).toEqual({ kind: 'full', until: since + day });
    expect(nextFeedback({ count: 2, since }, since + day)).toEqual({ kind: 'full', until: since + day });
  });

  it('opens a new window once the day is over', () => {
    expect(nextFeedback({ count: 2, since }, since + day + 1)).toEqual({ kind: 'open' });
    expect(nextFeedback({ count: 1, since }, since + 3 * day)).toEqual({ kind: 'open' });
  });
});
