// Status lines and end-of-round summaries, composed once here so every platform says the same thing.
// Wording comes from a copy catalog that satisfies RoundCopy (see @unspoken/content); this module only
// decides which message applies and fills it in.

import { formatClock, format, plural, type Plural } from './text';
import type { Category, ModeId } from './types';
import { isSwipeOver, isSwipeWon, skipsLeft, swipeEscalate, type SwipeRoundState } from './round/swipe';
import type { ReverseRoundState } from './round/reverse';
import type { RoundState } from './round';

// The catalog slots these lines read. Placeholders ({points}, {skips}, ...) are filled with format()
// and plural(); see the English catalog in @unspoken/content for every string.
export type RoundCopy = {
  modes: Readonly<Record<ModeId, { name: string }>>;
  units: Record<'points' | 'pointsLabel' | 'skips' | 'words' | 'cardsLabel' | 'bannedWords', Plural>;
  themes: { all: string; many: Plural };
  status: Record<
    | 'skipsLeft'
    | 'tally'
    | 'scoreAndSkips'
    | 'escalateClimbing'
    | 'escalateTop'
    | 'hotPotato'
    | 'skipsUsedOf'
    | 'passed'
    | 'mindReaderRound'
    | 'reverse'
    | 'withThemes'
    | 'clockLeft'
    | 'hiddenTimer'
    | 'round'
    | 'hiddenClock',
    string
  >;
  over: Record<'won' | 'timeUp' | 'hotPotatoTitle' | 'hotPotatoSub' | 'pointsSub' | 'escalateWonSub' | 'escalateLostSub', string>;
};

// "All cards", the theme's name, or "3 themes".
export function categoriesLabel(categories: readonly Category[], copy: Pick<RoundCopy, 'themes'>): string {
  if (categories.length === 0) return copy.themes.all;
  if (categories.length === 1) return categories[0] as string;
  return plural(categories.length, copy.themes.many);
}

function skipsText(state: SwipeRoundState, copy: RoundCopy): string {
  const left = skipsLeft(state);
  return left === null ? plural(state.skipped, copy.units.skips) : format(copy.status.skipsLeft, { skips: plural(left, copy.units.skips) });
}

function tally(state: SwipeRoundState, copy: RoundCopy): string {
  return format(copy.status.tally, { correct: state.correct, skipped: state.skipped });
}

// The line under the mode name in the header.
export function roundSubline(state: RoundState, copy: RoundCopy): string {
  switch (state.kind) {
    case 'reverse':
      return reverseStatus(state, copy);
    case 'mindReader':
      return format(copy.status.mindReaderRound, { round: state.round });
    case 'swipe': {
      if (state.rules.escalates) {
        const esc = swipeEscalate(state);
        const skips = skipsText(state, copy);
        return esc.atTop
          ? format(copy.status.escalateTop, { max: state.config.escalate.max, atMax: esc.atMax, winAt: state.config.escalate.winAtMax, skips })
          : format(copy.status.escalateClimbing, { banned: plural(esc.level, copy.units.bannedWords), skips });
      }
      if (state.rules.passAfterCorrect) return copy.status.hotPotato;
      if (state.rules.skipLimit) return format(copy.status.scoreAndSkips, { points: plural(state.correct, copy.units.points), skips: skipsText(state, copy) });
      // Modes without a skip limit just count, like the Endless wireframe.
      return tally(state, copy);
    }
  }
}

export type RoundStats = {
  // Points scored so far, for styles that show the score on its own ("7 pts" in bold); null when
  // the mode's status line has no score to pull out.
  points: number | null;
  // Everything else the status line says: skips left, the tally, Escalate's climb.
  detail: string;
};

// The header status split in two, for styles that place the score apart from the rest. Format the
// points with copy.units.points.
export function roundStats(state: RoundState, copy: RoundCopy): RoundStats {
  if (state.kind === 'reverse') return { points: state.score, detail: plural(state.played, copy.units.words) };
  if (state.kind === 'swipe' && state.rules.skipLimit && !state.rules.escalates) return { points: state.correct, detail: skipsText(state, copy) };
  return { points: null, detail: roundSubline(state, copy) };
}

function reverseStatus(state: ReverseRoundState, copy: RoundCopy): string {
  return format(copy.status.reverse, { points: plural(state.score, copy.units.points), words: plural(state.played, copy.units.words) });
}

// The status line on the ··· menu sheet.
export function menuStatus(state: RoundState, copy: RoundCopy): string {
  const themes = categoriesLabel(state.settings.categories, copy);
  const withThemes = (status: string) => format(copy.status.withThemes, { status, themes });
  switch (state.kind) {
    case 'reverse':
      return withThemes(reverseStatus(state, copy));
    case 'mindReader':
      return withThemes(format(copy.status.round, { round: state.round }));
    case 'swipe': {
      const points = plural(state.correct, copy.units.points);
      if (state.rules.clock === 'hidden') return withThemes(format(copy.status.hiddenTimer, { mode: copy.modes[state.settings.mode].name }));
      if (state.clock) return withThemes(format(copy.status.clockLeft, { clock: formatClock(state.clock.left), points }));
      return withThemes(state.rules.skipLimit ? points : tally(state, copy));
    }
  }
}

// The clock label on a swipe round: "2:30", or the hidden-clock word for Hot Potato. Null without a clock.
export function clockLabel(state: SwipeRoundState, copy: RoundCopy): string | null {
  if (!state.clock) return null;
  return state.rules.clock === 'hidden' ? copy.status.hiddenClock : formatClock(state.clock.left);
}

// The line under the clock on the Paused overlay.
export function pausedStatus(state: SwipeRoundState, copy: RoundCopy): string {
  if (state.rules.passAfterCorrect) return format(copy.status.passed, { words: plural(state.correct, copy.units.words) });
  if (!state.rules.skipLimit) return tally(state, copy);
  const points = plural(state.correct, copy.units.points);
  const skips =
    state.settings.skips === null
      ? plural(state.skipped, copy.units.skips)
      : format(copy.status.skipsUsedOf, { used: state.skipped, limit: plural(state.settings.skips, copy.units.skips) });
  return format(copy.status.scoreAndSkips, { points, skips });
}

export type RoundSummary = {
  // Small caps label: "YOU WIN" or "TIME'S UP".
  label: string;
  // The big number, when there is one.
  value: number | null;
  // A sentence in place of the number (Hot Potato).
  title: string | null;
  sub: string;
};

// What the end-of-round screen says, or null while the round is still going.
export function swipeSummary(state: SwipeRoundState, copy: RoundCopy): RoundSummary | null {
  if (!isSwipeOver(state)) return null;
  const won = isSwipeWon(state);
  const label = won ? copy.over.won : copy.over.timeUp;
  const skips = plural(state.skipped, copy.units.skips);
  if (state.rules.escalates) {
    const played = state.correct + state.skipped;
    return won
      ? { label, value: played, title: null, sub: format(copy.over.escalateWonSub, { label: plural(played, copy.units.cardsLabel), correct: state.correct, skips }) }
      : { label, value: swipeEscalate(state).level, title: null, sub: format(copy.over.escalateLostSub, { correct: state.correct }) };
  }
  if (state.rules.passAfterCorrect) {
    return { label, value: null, title: copy.over.hotPotatoTitle, sub: format(copy.over.hotPotatoSub, { words: plural(state.correct, copy.units.words) }) };
  }
  return { label, value: state.correct, title: null, sub: format(copy.over.pointsSub, { label: plural(state.correct, copy.units.pointsLabel), skips }) };
}
