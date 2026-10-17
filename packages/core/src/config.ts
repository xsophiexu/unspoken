import { CATEGORY_IDS, type Category, type Difficulty, type GameSettings, type ModeId } from './types';

// Everything tunable about the rules lives in this one JSON-serializable object, so the service can
// serve it (GET /v1/config) and clients can run on a served copy. Display text lives in the copy
// catalog in @unspoken/content, keyed by the ids used here.

export type DifficultyRules = {
  id: Difficulty;
  // Default round length; the setup timer follows it until the player types a time.
  roundSeconds: number;
  // Banned words shown on each card (and clues in Reverse).
  bannedCount: number;
  // Hot Potato: the shortest hidden round. The longest is hotPotato.maxFactor times this.
  hotPotatoMinSeconds: number;
};

// How a mode's clock behaves: a visible countdown, a hidden random countdown, or none.
export const CLOCK_KINDS = ['visible', 'hidden', 'none'] as const;
export type ClockKind = (typeof CLOCK_KINDS)[number];

// Which round state machine and screen family a mode uses.
export const PLAY_KINDS = ['swipe', 'reverse', 'mindReader'] as const;
export type PlayKind = (typeof PLAY_KINDS)[number];

export type ModeRules = {
  id: ModeId;
  play: PlayKind;
  clock: ClockKind;
  // Whether correct answers score points (Hot Potato and Mind Reader keep no score).
  scored: boolean;
  // Whether setup offers a skip limit. Without one, skips are unlimited and only counted.
  skipLimit: boolean;
  // Seconds added to the clock for each correct answer.
  bonusSeconds: number;
  // Whether banned words grow with correct answers (Escalate).
  escalates: boolean;
  // Whether the phone is handed on after each correct answer (Hot Potato); a skip keeps it with the same player.
  passAfterCorrect: boolean;
  available: boolean;
};

export type GameConfig = {
  difficulties: readonly DifficultyRules[];
  categories: readonly Category[];
  modes: readonly ModeRules[];
  defaults: Omit<GameSettings, 'roundSeconds'>;
  // Choices on the "Skips per round" grid; null is unlimited (∞).
  skipOptions: readonly (number | null)[];
  // The shortest round a player can type.
  minRoundSeconds: number;
  // The longest round a player can type (four digits on the microwave-style input: 99:59).
  maxRoundSeconds: number;
  // Setup warns that words will repeat below this many cards.
  smallDeckCards: number;
  escalate: {
    start: number;
    max: number;
    // Correct answers needed with every banned word showing to win.
    winAtMax: number;
    // Escalate draws only cards with `max` banned words when at least this many exist.
    minFullCards: number;
  };
  hotPotato: { maxFactor: number };
  reverse: { firstClues: number };
  mindReader: { predictions: number };
};

const swipe = { play: 'swipe', escalates: false, passAfterCorrect: false, bonusSeconds: 0 } as const;

export const gameConfig: GameConfig = {
  // Default round length grows with difficulty: 1:30 at Normal to 5:00 at Legend, 2:30 at Hard.
  // Cards show 5 banned words at Normal and Tricky, 6 at the other levels.
  // Hot Potato's shortest round grows from 0:45 at Normal to 2:30 at Legend.
  difficulties: [
    { id: 'Normal', roundSeconds: 90, bannedCount: 5, hotPotatoMinSeconds: 45 },
    { id: 'Tricky', roundSeconds: 120, bannedCount: 5, hotPotatoMinSeconds: 60 },
    { id: 'Hard', roundSeconds: 150, bannedCount: 6, hotPotatoMinSeconds: 75 },
    { id: 'Tough', roundSeconds: 180, bannedCount: 6, hotPotatoMinSeconds: 90 },
    { id: 'Expert', roundSeconds: 210, bannedCount: 6, hotPotatoMinSeconds: 105 },
    { id: 'Elite', roundSeconds: 240, bannedCount: 6, hotPotatoMinSeconds: 120 },
    { id: 'Master', roundSeconds: 270, bannedCount: 6, hotPotatoMinSeconds: 135 },
    { id: 'Legend', roundSeconds: 300, bannedCount: 6, hotPotatoMinSeconds: 150 },
  ],
  categories: CATEGORY_IDS,
  modes: [
    { ...swipe, id: 'classic', clock: 'visible', scored: true, skipLimit: true, available: true },
    // Endless: no clock and no skip limit; the header counts correct and skipped words.
    { ...swipe, id: 'endless', clock: 'none', scored: true, skipLimit: false, available: true },
    { ...swipe, id: 'teams', clock: 'visible', scored: true, skipLimit: true, available: false },
    { ...swipe, id: 'timeAttack', clock: 'visible', scored: true, skipLimit: true, bonusSeconds: 5, available: false },
    // Escalate has no clock.
    { ...swipe, id: 'escalate', clock: 'none', scored: true, skipLimit: true, escalates: true, available: true },
    // Hot Potato: no timer to set; the hidden clock runs a random length.
    { ...swipe, id: 'hotPotato', clock: 'hidden', scored: false, skipLimit: false, passAfterCorrect: true, available: true },
    { ...swipe, id: 'reverse', play: 'reverse', clock: 'none', scored: true, skipLimit: false, available: true },
    { ...swipe, id: 'mindReader', play: 'mindReader', clock: 'none', scored: false, skipLimit: false, available: true },
  ],
  // The app opens straight into an Endless game at Normal with All cards.
  defaults: { mode: 'endless', difficulty: 'Normal', categories: [], skips: 3 },
  skipOptions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null],
  minRoundSeconds: 10,
  maxRoundSeconds: 99 * 60 + 59,
  smallDeckCards: 20,
  // Escalate starts with 4 banned words and adds one per correct answer. Three correct at 10 wins.
  escalate: { start: 4, max: 10, winAtMax: 3, minFullCards: 20 },
  hotPotato: { maxFactor: 2 },
  // Three clues show to start; each extra clue makes the word worth a point less.
  reverse: { firstClues: 3 },
  // The Mind Reader writes 5 words they think the Clue Giver will say.
  mindReader: { predictions: 5 },
};
