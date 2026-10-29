import { readFileSync } from 'node:fs';

import { FEEDBACK_ENTRY_POINTS, FEEDBACK_PLATFORMS, FEEDBACK_TOPIC_IDS, feedbackRules } from '@unspoken/core';
import { describe, expect, it } from 'vitest';

import { FEEDBACK_COLLECTION, FEEDBACK_LIMITS_COLLECTION } from '../src';

// firestore.rules cannot import the shared rules, so it repeats them. These checks fail when the
// two drift apart (a new topic, a longer limit), before the rules start refusing real messages.
const rules = readFileSync(new URL('../../../firestore.rules', import.meta.url), 'utf8');

function listAfter(field: string): string[] {
  const match = new RegExp(`data\\.${field} in \\[([^\\]]*)\\]`).exec(rules);
  if (!match?.[1]) throw new Error(`No enum for ${field} in firestore.rules`);
  return match[1].split(',').map((item) => item.trim().replace(/^'|'$/g, ''));
}

describe('firestore.rules', () => {
  it('allows the same topics, entry points and platforms as the clients send', () => {
    expect(listAfter('topic')).toEqual([...FEEDBACK_TOPIC_IDS]);
    expect(listAfter('entryPoint')).toEqual([...FEEDBACK_ENTRY_POINTS]);
    expect(listAfter('platform')).toEqual([...FEEDBACK_PLATFORMS]);
  });

  it('allows the same message and app version lengths', () => {
    expect(rules).toContain(`data.message.size() <= ${feedbackRules.maxLength}`);
    expect(rules).toContain(`data.appVersion.size() <= ${feedbackRules.appVersionMaxLength}`);
  });

  it('allows the same number of ideas per window, and the same window length', () => {
    const { perWindow, windowDays } = feedbackRules.sendLimit;
    expect(rules).toContain(`before.count < ${perWindow}`);
    expect(rules).toContain(`after.count <= ${perWindow}`);
    expect(rules).toContain(`before.since + duration.value(${windowDays}, 'd')`);
  });

  it('guards the collections the client writes to', () => {
    expect(rules).toContain(`match /${FEEDBACK_COLLECTION}/{id}`);
    expect(rules).toContain(`match /${FEEDBACK_LIMITS_COLLECTION}/{uid}`);
    expect(rules).toContain(`documents/${FEEDBACK_LIMITS_COLLECTION}/$(request.auth.uid)`);
  });
});
