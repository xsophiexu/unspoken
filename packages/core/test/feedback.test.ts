import { describe, expect, it } from 'vitest';

import { canSendFeedback, defaultFeedbackTopic, feedbackLength } from '../src';

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
