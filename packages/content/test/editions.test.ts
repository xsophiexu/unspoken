import { describe, expect, it } from 'vitest';

import { gameConfig } from '@unspoken/core';

import { en, mdEn } from '../src';

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

describe('Chip names', () => {
  it('fits every category and specialty on the 11-character chip', () => {
    const names = [...Object.values(en.categoryBadge), ...Object.values(mdEn.specialtyBadge)];
    expect(names.filter((name) => name.length > gameConfig.badgeMaxChars)).toEqual([]);
  });
});
