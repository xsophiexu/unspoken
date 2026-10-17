import { describe, expect, it } from 'vitest';

import {
  DIFFICULTY_IDS,
  MODE_IDS,
  bannedCountFor,
  canStart,
  defaultRoundSeconds,
  defaultSettings,
  gameConfig,
  hasSkipSetting,
  hasTimerSetting,
  hiddenRoundSeconds,
  hotPotatoRange,
  parseSettings,
  toDifficulty,
  toggleCategory,
  withDifficulty,
} from '../src';
import { settingsFor } from './fixtures';

describe('catalogs', () => {
  it('lists the modes in Modes-grid order, Teams and Time Attack coming soon and no Zen', () => {
    expect(MODE_IDS).toEqual(['classic', 'endless', 'teams', 'timeAttack', 'escalate', 'hotPotato', 'reverse', 'mindReader']);
    expect(gameConfig.modes.filter((m) => !m.available).map((m) => m.id)).toEqual(['teams', 'timeAttack']);
  });

  it('starts a fresh install on Endless at Normal with All cards, 1:30 and 3 skips', () => {
    expect(defaultSettings()).toEqual({ mode: 'endless', difficulty: 'Normal', categories: [], roundSeconds: 90, skips: 3 });
  });
});

describe('round timer', () => {
  it('defaults to 1:30 at Normal, 2:30 at Hard and 5:00 at Legend, growing with each level', () => {
    expect(defaultRoundSeconds('Normal')).toBe(90);
    expect(defaultRoundSeconds('Hard')).toBe(150);
    expect(defaultRoundSeconds('Legend')).toBe(300);
    const all = DIFFICULTY_IDS.map((d) => defaultRoundSeconds(d));
    expect(all).toEqual([...all].sort((a, b) => a - b));
  });

  it('follows a new difficulty while it is on the default', () => {
    const next = withDifficulty(settingsFor('classic', { difficulty: 'Hard', roundSeconds: 150 }), 'Legend');
    expect(next).toMatchObject({ difficulty: 'Legend', roundSeconds: 300 });
  });

  it('keeps a typed time when the difficulty changes', () => {
    const next = withDifficulty(settingsFor('classic', { difficulty: 'Hard', roundSeconds: 75 }), 'Normal');
    expect(next).toMatchObject({ difficulty: 'Normal', roundSeconds: 75 });
  });

  it('is set in setup only for modes with a visible clock', () => {
    expect(MODE_IDS.filter((m) => hasTimerSetting(m))).toEqual(['classic', 'teams', 'timeAttack']);
  });
});

describe('banned words', () => {
  it('shows 5 at Normal and Tricky and 6 at every other level', () => {
    expect(DIFFICULTY_IDS.map((d) => bannedCountFor(d))).toEqual([5, 5, 6, 6, 6, 6, 6, 6]);
  });
});

describe('skips', () => {
  it('are limited only in Classic, Teams, Time Attack and Escalate', () => {
    expect(MODE_IDS.filter((m) => hasSkipSetting(m))).toEqual(['classic', 'teams', 'timeAttack', 'escalate']);
  });
});

describe('Hot Potato hidden length', () => {
  it('runs from 0:45–1:30 at Normal up to 2:30–5:00 at Legend', () => {
    expect(hotPotatoRange('Normal')).toEqual({ min: 45, max: 90 });
    expect(hotPotatoRange('Hard')).toEqual({ min: 75, max: 150 });
    expect(hotPotatoRange('Legend')).toEqual({ min: 150, max: 300 });
  });

  it('uses the extremes of the range for the extremes of randomness', () => {
    expect(hiddenRoundSeconds('Tricky', () => 0)).toBe(60);
    expect(hiddenRoundSeconds('Tricky', () => 0.999999)).toBe(120);
  });
});

describe('canStart', () => {
  it('needs at least 0:10 on a visible clock', () => {
    expect(canStart(settingsFor('classic', { roundSeconds: 9 }))).toBe(false);
    expect(canStart(settingsFor('classic', { roundSeconds: 10 }))).toBe(true);
  });

  it('ignores the round timer for modes without one', () => {
    expect(canStart(settingsFor('hotPotato', { roundSeconds: 0 }))).toBe(true);
    expect(canStart(settingsFor('endless', { roundSeconds: 0 }))).toBe(true);
  });

  it('refuses modes that are not available yet', () => {
    expect(canStart(settingsFor('teams'))).toBe(false);
  });
});

describe('toggleCategory', () => {
  it('makes All cards exclusive and falls back to it when the last theme is cleared', () => {
    const one = toggleCategory([], 'Technology');
    expect(one).toEqual(['Technology']);
    expect(toggleCategory(one, null)).toEqual([]);
    expect(toggleCategory(one, 'Technology')).toEqual([]);
  });

  it('keeps chosen themes in catalog order', () => {
    expect(toggleCategory(['Technology'], 'Inner World')).toEqual(['Inner World', 'Technology']);
  });
});

describe('parseSettings', () => {
  it('reads back settings that were saved', () => {
    const saved = { mode: 'classic', difficulty: 'Elite', categories: ['Society', 'Business'], roundSeconds: 95, skips: null };
    expect(parseSettings(JSON.parse(JSON.stringify(saved)))).toEqual(saved);
  });

  it('defaults fields that are missing, unknown or out of range, and never starts an unavailable mode', () => {
    expect(parseSettings({ mode: 'teams', difficulty: 'Impossible', categories: ['Society', 'Nope', 'Society'], roundSeconds: 5, skips: 99 })).toEqual({
      ...defaultSettings(),
      categories: ['Society'],
    });
    expect(parseSettings({ difficulty: 'Legend' }).roundSeconds).toBe(defaultRoundSeconds('Legend'));
    expect(parseSettings('garbage')).toEqual(defaultSettings());
  });

  it('moves a level saved under its old name to the level that replaced it', () => {
    const saved = { mode: 'classic', difficulty: 'Master 1', categories: [], roundSeconds: 95, skips: 2 };
    expect(parseSettings(saved)).toEqual({ ...saved, difficulty: 'Expert' });
    // Without a typed time, the round follows the new level's default.
    expect(parseSettings({ difficulty: 'Grandmaster' })).toMatchObject({ difficulty: 'Legend', roundSeconds: defaultRoundSeconds('Legend') });
  });
});

describe('toDifficulty', () => {
  it('maps each old level name to the new level in the same place', () => {
    const old = ['Normal', 'Harder', 'Expert 1', 'Expert 2', 'Master 1', 'Master 2', 'Master 3', 'Grandmaster'];
    expect(old.map((name) => toDifficulty(name))).toEqual([...DIFFICULTY_IDS]);
  });

  it('keeps current ids and rejects anything else', () => {
    for (const id of DIFFICULTY_IDS) expect(toDifficulty(id)).toBe(id);
    expect(toDifficulty('Expert 4')).toBeUndefined();
    expect(toDifficulty('toString')).toBeUndefined();
    expect(toDifficulty(3)).toBeUndefined();
  });
});
