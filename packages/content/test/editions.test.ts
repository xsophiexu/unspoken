import { describe, expect, it } from 'vitest';

import { en } from '../src';

describe('How to play in UnspokenMD', () => {
  it('tours the same steps, opening on its own first step', () => {
    const [first, ...rest] = en.md.howToPlay.steps;
    const [unspokenFirst, ...unspokenRest] = en.howToPlay.steps;
    expect(rest).toEqual(unspokenRest);
    expect(first).toEqual({
      ...unspokenFirst,
      text: 'Get someone to guess a medical term without saying any of the banned jargon.',
      note: 'Talk the way you would to a patient.',
    });
  });
});
