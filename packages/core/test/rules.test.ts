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
  isTimeLimitInRange,
  parseSettings,
  stepTimeLimit,
  timeLimitDiffers,
  toDifficulty,
  allCategoriesPicked,
  categoriesSummary,
  difficultyLabel,
  hardestDifficulty,
  tapAllCards,
  toggleCategory,
  toggleDifficulty,
  withDifficulty,
  type AllCardsTap,
  type Category,
} from '../src';
import { settingsFor } from './fixtures';

describe('catalogs', () => {
  it('lists the modes in Modes-grid order, Teams and Time Attack coming soon and no Zen', () => {
    expect(MODE_IDS).toEqual(['classic', 'endless', 'teams', 'timeAttack', 'escalate', 'hotPotato', 'reverse', 'mindReader']);
    expect(gameConfig.modes.filter((m) => !m.available).map((m) => m.id)).toEqual(['teams', 'timeAttack']);
  });

  it('starts a fresh install on Endless at Normal with All cards, 1:30 and 3 skips', () => {
    expect(defaultSettings()).toEqual({ mode: 'endless', difficulties: ['Normal'], categories: [], roundSeconds: 90, skips: 3, noTimeLimit: false });
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
    const next = withDifficulty(settingsFor('classic', { difficulties: ['Hard'], roundSeconds: 150 }), 'Legend');
    expect(next).toMatchObject({ difficulties: ['Legend'], roundSeconds: 300 });
  });

  it('keeps a typed time when the difficulty changes', () => {
    const next = withDifficulty(settingsFor('classic', { difficulties: ['Hard'], roundSeconds: 75 }), 'Normal');
    expect(next).toMatchObject({ difficulties: ['Normal'], roundSeconds: 75 });
  });

  it('follows the hardest pick while it is on the default', () => {
    let s = settingsFor('classic', { difficulties: ['Normal'], roundSeconds: 90 });
    s = toggleDifficulty(s, 'Hard');
    expect(s.roundSeconds).toBe(defaultRoundSeconds('Hard'));
    s = toggleDifficulty(s, 'Tricky');
    expect(s.roundSeconds).toBe(defaultRoundSeconds('Hard'));
    s = toggleDifficulty(s, 'Hard');
    expect(s.roundSeconds).toBe(defaultRoundSeconds('Tricky'));
  });

  it('keeps a typed time while picks change', () => {
    let s = settingsFor('classic', { difficulties: ['Normal'], roundSeconds: 75 });
    s = toggleDifficulty(toggleDifficulty(s, 'Legend'), 'Normal');
    expect(s).toMatchObject({ difficulties: ['Legend'], roundSeconds: 75 });
  });

  it('is set in setup only for modes with a visible clock (Mind Reader’s Custom games have one)', () => {
    expect(MODE_IDS.filter((m) => hasTimerSetting(m))).toEqual(['classic', 'teams', 'timeAttack', 'mindReader']);
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
  it('needs a time limit from 0:30 to 10:00 on a visible clock', () => {
    expect(canStart(settingsFor('classic', { roundSeconds: 29 }))).toBe(false);
    expect(canStart(settingsFor('classic', { roundSeconds: 30 }))).toBe(true);
    expect(canStart(settingsFor('classic', { roundSeconds: 600 }))).toBe(true);
    expect(canStart(settingsFor('classic', { roundSeconds: 601 }))).toBe(false);
  });

  it('skips the time limit check when No time limit is on', () => {
    expect(canStart(settingsFor('classic', { roundSeconds: 5, noTimeLimit: true }))).toBe(true);
    expect(canStart(settingsFor('classic', { roundSeconds: 5, noTimeLimit: false }))).toBe(false);
  });

  it('takes its time limits from the config', () => {
    const config = { ...gameConfig, minRoundSeconds: 60, maxRoundSeconds: 120 };
    expect(isTimeLimitInRange(59, config)).toBe(false);
    expect(isTimeLimitInRange(120, config)).toBe(true);
    expect(canStart(settingsFor('classic', { roundSeconds: 45 }), config)).toBe(false);
  });

  it('ignores the round timer for modes without one', () => {
    expect(canStart(settingsFor('hotPotato', { roundSeconds: 0 }))).toBe(true);
    expect(canStart(settingsFor('endless', { roundSeconds: 0 }))).toBe(true);
  });

  it('refuses modes that are not available yet', () => {
    expect(canStart(settingsFor('teams'))).toBe(false);
  });
});

describe('toggleDifficulty', () => {
  it('adds and removes picks, keeping them easiest first', () => {
    let s = settingsFor('classic', { difficulties: ['Hard'] });
    s = toggleDifficulty(s, 'Expert');
    s = toggleDifficulty(s, 'Normal');
    expect(s.difficulties).toEqual(['Normal', 'Hard', 'Expert']);
    expect(toggleDifficulty(s, 'Hard').difficulties).toEqual(['Normal', 'Expert']);
  });

  it('never removes the last pick', () => {
    const s = settingsFor('classic', { difficulties: ['Tough'] });
    expect(toggleDifficulty(s, 'Tough').difficulties).toEqual(['Tough']);
  });

  it('names the hardest pick', () => {
    expect(hardestDifficulty(['Legend', 'Normal', 'Tough'])).toBe('Legend');
    expect(() => hardestDifficulty([])).toThrow();
  });
});

describe('difficultyLabel', () => {
  const badges = { Normal: 'NORMAL', Tricky: 'TRICKY', Hard: 'HARD', Tough: 'TOUGH', Expert: 'EXPERT', Elite: 'ELITE', Master: 'MASTER', Legend: 'LEGEND' };
  const copy = { names: badges, mixed: '{easiest}+' };

  it('names a single pick', () => {
    expect(difficultyLabel(['Hard'], copy)).toBe('HARD');
  });

  it('names the easiest of several picks with a plus, gaps or not', () => {
    expect(difficultyLabel(['Expert', 'Hard', 'Tough'], copy)).toBe('HARD+');
    expect(difficultyLabel(['Legend', 'Tricky', 'Expert'], copy)).toBe('TRICKY+');
    expect(difficultyLabel([...DIFFICULTY_IDS], copy)).toBe('NORMAL+');
  });

  it('never runs past the badge limit', () => {
    const long = { names: { ...badges, Hard: 'EXTRAORDINARILY HARD' }, mixed: '{easiest}+' };
    expect(difficultyLabel(['Hard'], long)).toHaveLength(gameConfig.badgeMaxChars);
    expect(difficultyLabel(['Hard', 'Legend'], long)).toHaveLength(gameConfig.badgeMaxChars);
  });
});

describe('All cards double-tap', () => {
  const available: Category[] = ['Inner World', 'Pop Culture', 'Technology'];
  const WINDOW = 300;
  const tap = (categories: readonly Category[], last: AllCardsTap, now: number) => tapAllCards(categories, last, now, available, WINDOW);

  it('a single tap picks All cards', () => {
    expect(tap(['Technology'], null, 1000).categories).toEqual([]);
  });

  it('a double-tap highlights every category', () => {
    const first = tap(['Technology'], null, 1000);
    const second = tap(first.categories, first.last, 1200);
    expect(second.categories).toEqual(available);
    expect(allCategoriesPicked(second.categories, available)).toBe(true);
  });

  it('a second double-tap goes back to All cards', () => {
    const first = tap(available, null, 5000);
    expect(tap(first.categories, first.last, 5100).categories).toEqual([]);
  });

  it('two taps further apart than the window are two single taps', () => {
    const first = tap(['Technology'], null, 1000);
    expect(tap(first.categories, first.last, 1000 + WINDOW + 1).categories).toEqual([]);
  });

  it('a third quick tap starts a new double-tap', () => {
    const first = tap([], null, 0);
    const second = tap(first.categories, first.last, 100);
    const third = tap(second.categories, second.last, 200);
    expect(third.categories).toEqual([]);
  });
});

describe('categoriesSummary', () => {
  const copy = { all: 'All cards', names: { 'Pop Culture': 'Pop Culture', 'Science and Nature': 'Science and Nature' } as Record<Category, string>, many: { one: '{n} category', other: '{n} categories' } };

  it('says All cards, the names of one or two, or a count', () => {
    expect(categoriesSummary([], copy)).toBe('All cards');
    expect(categoriesSummary(['Pop Culture', 'Science and Nature'], copy)).toBe('Pop Culture, Science and Nature');
    expect(categoriesSummary(['Pop Culture', 'Science and Nature', 'Society'], copy)).toBe('3 categories');
  });
});

describe('time limit changer', () => {
  it('moves the time 15 seconds a step and stops at 0:30 and 10:00', () => {
    expect(stepTimeLimit(150, 1)).toBe(165);
    expect(stepTimeLimit(150, -2)).toBe(120);
    expect(stepTimeLimit(40, -1)).toBe(30);
    expect(stepTimeLimit(595, 1)).toBe(600);
  });

  it('brings a typed time outside the range back to the nearest limit before stepping', () => {
    expect(stepTimeLimit(12 * 60, -1)).toBe(585);
    expect(stepTimeLimit(10, 1)).toBe(45);
  });

  it('takes its step and limits from the config', () => {
    const config = { ...gameConfig, timeLimitStepSeconds: 30, maxRoundSeconds: 200 };
    expect(stepTimeLimit(150, 1, config)).toBe(180);
    expect(stepTimeLimit(180, 1, config)).toBe(200);
  });

  it('tells when the next turn plays a different time limit', () => {
    const now = settingsFor('classic', { roundSeconds: 150 });
    expect(timeLimitDiffers(now, { ...now })).toBe(false);
    expect(timeLimitDiffers(now, { ...now, roundSeconds: 195 })).toBe(true);
    expect(timeLimitDiffers(now, { ...now, noTimeLimit: true })).toBe(true);
    // With no clock either way, the kept time does not matter.
    expect(timeLimitDiffers({ ...now, noTimeLimit: true }, { ...now, noTimeLimit: true, roundSeconds: 60 })).toBe(false);
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
    const saved = { mode: 'classic', difficulties: ['Tough', 'Elite'], categories: ['Society', 'Business'], roundSeconds: 95, skips: null, noTimeLimit: true };
    expect(parseSettings(JSON.parse(JSON.stringify(saved)))).toEqual(saved);
  });

  it('reads settings saved before No time limit existed as timed', () => {
    const saved = { mode: 'classic', difficulties: ['Elite'], categories: [], roundSeconds: 95, skips: 2 };
    expect(parseSettings(saved)).toEqual({ ...saved, noTimeLimit: false });
    expect(parseSettings({ ...saved, noTimeLimit: 'yes' }).noTimeLimit).toBe(false);
  });

  it('defaults fields that are missing, unknown or out of range, and never starts an unavailable mode', () => {
    expect(parseSettings({ mode: 'teams', difficulty: 'Impossible', categories: ['Society', 'Nope', 'Society'], roundSeconds: 'soon', skips: 99 })).toEqual({
      ...defaultSettings(),
      categories: ['Society'],
    });
    expect(parseSettings({ difficulties: ['Legend', 'Normal'] }).roundSeconds).toBe(defaultRoundSeconds('Legend'));
    expect(parseSettings({ difficulties: [] })).toEqual(defaultSettings());
    expect(parseSettings('garbage')).toEqual(defaultSettings());
  });

  it('sorts saved picks, drops unknown ones and keeps each once', () => {
    expect(parseSettings({ difficulties: ['Legend', 'Nope', 'Hard', 'Hard', 'Expert 1'] }).difficulties).toEqual(['Hard', 'Legend']);
  });

  it('moves a single difficulty saved before several could be picked into a one-item list', () => {
    const saved = { mode: 'classic', difficulty: 'Elite', categories: [], roundSeconds: 95, skips: 2 };
    expect(parseSettings(saved)).toEqual({ mode: 'classic', difficulties: ['Elite'], categories: [], roundSeconds: 95, skips: 2, noTimeLimit: false });
    expect(parseSettings({ difficulty: 'Legend' })).toMatchObject({ difficulties: ['Legend'], roundSeconds: defaultRoundSeconds('Legend') });
  });

  it('moves a time saved under the older, wider limits to the nearest limit', () => {
    expect(parseSettings({ mode: 'classic', roundSeconds: 15 }).roundSeconds).toBe(30);
    expect(parseSettings({ mode: 'classic', roundSeconds: 15 * 60 }).roundSeconds).toBe(600);
    expect(parseSettings({ mode: 'classic', roundSeconds: 0, difficulties: ['Hard'] }).roundSeconds).toBe(defaultRoundSeconds('Hard'));
  });

  it('moves a level saved under its old name to the level that replaced it', () => {
    const saved = { mode: 'classic', difficulty: 'Master 1', categories: [], roundSeconds: 95, skips: 2 };
    expect(parseSettings(saved)).toEqual({ mode: 'classic', difficulties: ['Expert'], categories: [], roundSeconds: 95, skips: 2, noTimeLimit: false });
    // Without a typed time, the round follows the new level's default.
    expect(parseSettings({ difficulty: 'Grandmaster' })).toMatchObject({ difficulties: ['Legend'], roundSeconds: defaultRoundSeconds('Legend') });
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
