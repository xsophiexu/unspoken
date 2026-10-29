import { en, mdEn } from '@unspoken/content';
import {
  canAnswer,
  difficultyLabel,
  format,
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

// What the play screen shows, read from the round through core's selectors and the copy catalog.
// Slot components take this and their slot config; they never look at the round or the rules.

export type HeaderModel = {
  modeName: string;
  // label: what screen readers hear for the badge, when it says more than the difficulty (UnspokenMD).
  difficulty: { name: string; badge: string; label?: string };
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

// UnspokenMD's chip names the word bank too: "TRICKY · ALL", or "TRICKY · 2/13".
function mdBadge(badge: string, settings: GameSettings, config: GameConfig): string {
  const picked = settings.specialties?.length ?? 0;
  const total = config.specialties?.length ?? 0;
  const picks = picked === 0 ? mdEn.play.badgeAll : format(mdEn.play.badgePicked, { n: picked, total });
  return format(mdEn.play.badge, { difficulty: badge, picks });
}

function mdBadgeLabel(name: string, state: RoundState): string {
  return format(mdEn.a11y.picks, { difficulty: name, specialties: picksLabel(state, catalogFor(state.config).copy) });
}

export function headerModel(state: RoundState): HeaderModel {
  const { mode, difficulties } = state.settings;
  const { config, copy } = catalogFor(state.config);
  const md = config.edition === 'md';
  const name = difficultyLabel(difficulties, { names: difficultyText(config, 'name'), mixed: en.difficultyMix }, config);
  const badge = difficultyLabel(difficulties, { names: difficultyText(config, 'badge'), mixed: en.difficultyMix }, config);
  // UnspokenMD's Zen is its Quick Play: the header says so, and the line under it only counts.
  const zen = state.kind === 'swipe' && state.rules.optionalRules === true;
  return {
    modeName: zen ? mdEn.play.title : copy.modes[mode].name,
    // One difficulty by name; several as the easiest one and "+" (Hard+, HARD+).
    difficulty: md && state.kind === 'swipe' ? { name, badge: mdBadge(badge, state.settings, config), label: mdBadgeLabel(name, state) } : { name, badge },
    subline: roundSubline(state, copy),
    stats: roundStats(state, copy),
  };
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

export function swipeModel(state: SwipeRoundState): PlayModel {
  const { bank, copy } = catalogFor(state.config);
  const label = clockLabel(state, copy);
  const view = swipeCard(state);
  return {
    ...headerModel(state),
    clock: label === null ? null : { label, progress: clockProgress(state), running: isClockRunning(state), hidden: state.rules.clock === 'hidden' },
    card: view && {
      // The deal position, so the same word dealt again still animates in as a new card.
      key: `${state.deck.seed}:${state.deck.index}`,
      word: view.card.word,
      banned: view.banned,
      freshIndex: view.freshIndex,
      label: searchLabel(state, bank),
    },
    canCorrect: canAnswer(state, 'correct'),
    canSkip: canAnswer(state, 'skip'),
    firstCard: state.correct + state.skipped === 0,
    note: state.rules.passAfterCorrect ? en.play.hotPotatoNote : null,
    bannedLabel: bannedLabelFor(state.config),
  };
}
