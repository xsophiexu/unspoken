import { en, mdEn } from '@unspoken/content';
import {
  canAnswer,
  categoriesLabel,
  difficultyLabel,
  difficultySpan,
  format,
  plural,
  singlePick,
  type DeepDivePick,
  type Specialty,
  type BankEntry,
  type GameConfig,
  type GameSettings,
  clockLabel,
  clockProgress,
  isClockRunning,
  picksLabel,
  roundStats,
  roundSubline,
  swipeCard,
  type Difficulty,
  type RoundState,
  type RoundStats,
  type SwipeRoundState,
} from '@unspoken/core';

import { catalogFor } from '@/lib/catalog';
import type { GameStart } from '@/state/game';

// What the play screen shows, read from the round through core's selectors and the copy catalog.
// Slot components take this and their slot config; they never look at the round or the rules.

export type HeaderModel = {
  modeName: string;
  // label: what screen readers hear for the badge, when it says more than the difficulty (UnspokenMD).
  difficulty: { name: string; badge: string; label?: string };
  // The badge names more than the difficulty (UnspokenMD's word bank): it sits beside the title
  // when it fits and moves whole onto the line under it when it doesn't.
  longBadge?: boolean;
  subline: string;
  stats: RoundStats;
};

// progress: the share of time left, 0 to 1 (0 while the clock is hidden). hidden: the round hides
// its clock (the label says so instead of the time).
export type ClockModel = { label: string; progress: number; running: boolean; hidden: boolean };

// label: the line over the word in place of "Your word" (a card from search), or undefined.
export type CardModel = { key: string; word: string; banned: readonly string[]; freshIndex: number | null; label?: string };

export type PlayModel = HeaderModel & {
  clock: ClockModel | null;
  card: CardModel | null;
  canCorrect: boolean;
  canSkip: boolean;
  // No answer yet this round (the "swipe the card" hint shows until the first one).
  firstCard: boolean;
  // A line under the controls (Hot Potato's rule), or null.
  note: string | null;
  // The label over the banned list in place of DON'T SAY (UnspokenMD's BANNED JARGON), or undefined.
  bannedLabel?: string;
};

function difficultyText(config: GameConfig, pick: 'name' | 'badge'): Record<Difficulty, string> {
  return Object.fromEntries(config.difficulties.map((d) => [d.id, en.difficulties[d.id][pick]])) as Record<Difficulty, string>;
}

// The difficulties as a span: "Normal–Hard" for screen readers and pill headers, "NORMAL–HARD" on
// the chip (within config.badgeMaxChars), "Normal to Legend" in a line of text.
function spanText(difficulties: readonly Difficulty[], config: GameConfig, kind: 'name' | 'badge' | 'line'): string {
  const names = difficultyText(config, kind === 'badge' ? 'badge' : 'name');
  const span = kind === 'line' ? en.difficultySpan.long : en.difficultySpan.short;
  return difficultySpan(difficulties, { names, span, mixed: en.difficultyMix }, config, kind === 'badge' ? config.badgeMaxChars : Infinity);
}

// What the game draws from, before the score on the line under the title: All cards, one
// specialty's short name ("Cardio") or one category, or how many ("3 specialties").
function picksText(settings: GameSettings, config: GameConfig): string {
  if (!config.specialties) return categoriesLabel(settings.categories, en);
  const picks = settings.specialties ?? [];
  const [only] = picks;
  if (picks.length === 0 || picks.length === config.specialties.length) return en.themes.all;
  return picks.length === 1 && only ? mdEn.specialtyShort[only] : plural(picks.length, mdEn.specialtyPicks.many);
}

// A Deep dive's one specialty or category, as the chip shows it ("CARDIO") and by its full name.
// Short names only shorten a name; one that can't be shortened stays whole and the chip wraps.
function deepDivePick(settings: GameSettings, config: GameConfig): { badge: string; name: string } | undefined {
  const pick = singlePick(settings, config);
  if (pick === undefined) return undefined;
  const isSpecialty = (id: DeepDivePick): id is Specialty => (config.specialties ?? []).includes(id as Specialty);
  const [badge, name] = isSpecialty(pick) ? [mdEn.specialtyBadge[pick], mdEn.specialties[pick]] : [en.categoryBadge[pick], en.categories[pick]];
  return { badge: badge.toUpperCase(), name };
}

function mdBadgeLabel(name: string, state: RoundState): string {
  return format(mdEn.a11y.picks, { difficulty: name, specialties: picksLabel(state, catalogFor(state.config).copy) });
}

// `start`: how the game was started. A swipe game from Home's Quick Play says Quick Play, with only
// the difficulty on the chip ("NORMAL–HARD") and the word bank before the score under it ("All
// cards · 2 correct · 1 skipped"); UnspokenMD's other one-card games (Zen and Ladder from New game)
// show the chip and line the same way under the mode's name. A Deep dive says Deep dive, with its
// specialty or category on the chip ("CARDIO") and its difficulties before the score ("Normal to
// Legend · 6 correct · 1 skipped"). Every other game shows the mode with its difficulty badge.
export function headerModel(state: RoundState, start: GameStart = 'setup'): HeaderModel {
  const { mode, difficulties } = state.settings;
  const { config, copy } = catalogFor(state.config);
  const md = config.edition === 'md';
  const subline = roundSubline(state, copy);
  const stats = roundStats(state, copy);
  const swipe = state.kind === 'swipe';
  const dive = swipe && start === 'deepDive' ? deepDivePick(state.settings, config) : undefined;
  if (dive) {
    const span = spanText(difficulties, config, 'line');
    return {
      modeName: en.deepDive.title,
      difficulty: { name: dive.name, badge: dive.badge, label: format(en.a11y.deepDive, { pick: dive.name, difficulties: span }) },
      longBadge: true,
      subline: format(en.deepDive.status, { difficulties: span, status: subline }),
      stats,
    };
  }
  if (swipe && (start === 'quickPlay' || md)) {
    const name = spanText(difficulties, config, 'name');
    return {
      modeName: start === 'quickPlay' ? en.home.quickPlay.title : copy.modes[mode].name,
      difficulty: { name, badge: spanText(difficulties, config, 'badge'), label: md ? mdBadgeLabel(name, state) : undefined },
      longBadge: true,
      subline: format(en.play.picksStatus, { picks: picksText(state.settings, config), status: subline }),
      stats,
    };
  }
  // One difficulty by name; several as the easiest one and "+" (Hard+, HARD+).
  const label = (pick: 'name' | 'badge') => difficultyLabel(difficulties, { names: difficultyText(config, pick), mixed: en.difficultyMix }, config);
  return { modeName: copy.modes[mode].name, difficulty: { name: label('name'), badge: label('badge') }, subline, stats };
}

// Over the word in a Deep dive: "Your word · Hard", with the card's difficulty; undefined otherwise.
export function deepDiveLabel(state: SwipeRoundState, bank: readonly BankEntry[], start: GameStart): string | undefined {
  if (start !== 'deepDive') return undefined;
  const card = swipeCard(state)?.card;
  const entry = card && bank.find((c) => c.id === card.id);
  return entry && format(en.play.yourWordAt, { label: en.play.yourWord, difficulty: en.difficulties[entry.difficulty].name });
}

// "From search · Tough · Respiratory" over a card picked from search; undefined otherwise.
export function searchLabel(state: SwipeRoundState, bank: readonly BankEntry[]): string | undefined {
  if (!state.fromSearch) return undefined;
  const card = swipeCard(state)?.card;
  const entry = card && bank.find((c) => c.id === card.id);
  if (!entry) return undefined;
  return format(mdEn.play.fromSearch, { difficulty: en.difficulties[entry.difficulty].name, specialty: entry.specialty ? mdEn.specialties[entry.specialty] : '' });
}

// The banned list's label for a config's edition (UnspokenMD's BANNED JARGON), or undefined for DON'T SAY.
export function bannedLabelFor(config: GameConfig): string | undefined {
  return config.edition === 'md' ? mdEn.play.bannedLabel : undefined;
}

export function swipeModel(state: SwipeRoundState, start: GameStart = 'setup'): PlayModel {
  const { bank, copy } = catalogFor(state.config);
  const label = clockLabel(state, copy);
  const view = swipeCard(state);
  return {
    ...headerModel(state, start),
    clock: label === null ? null : { label, progress: clockProgress(state), running: isClockRunning(state), hidden: state.rules.clock === 'hidden' },
    card: view && {
      // The deal position, so the same word dealt again still animates in as a new card.
      key: `${state.deck.seed}:${state.deck.index}`,
      word: view.card.word,
      banned: view.banned,
      freshIndex: view.freshIndex,
      label: searchLabel(state, bank) ?? deepDiveLabel(state, bank, start),
    },
    canCorrect: canAnswer(state, 'correct'),
    canSkip: canAnswer(state, 'skip'),
    firstCard: state.correct + state.skipped === 0,
    note: state.rules.passAfterCorrect ? en.play.hotPotatoNote : null,
    bannedLabel: bannedLabelFor(state.config),
  };
}
