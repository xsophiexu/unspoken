import type { Category, Difficulty, FeedbackEntryPoint, FeedbackTopic, ModeId, RoundCopy } from '@unspoken/core';

// English copy for every screen. Keys follow the ids in @unspoken/core (modes, difficulties, themes,
// feedback topics) and the style and color ids in @unspoken/design-tokens, so a platform never
// writes user-facing text itself. Placeholders in braces are filled with format() / plural() from
// @unspoken/core.

const modes: Record<ModeId, { name: string; sub: string }> = {
  classic: { name: 'Classic', sub: 'Timed round, score what you can' },
  endless: { name: 'Endless', sub: 'No clock, no limits, go until you stop' },
  teams: { name: 'Teams', sub: 'Two teams, pass the phone' },
  timeAttack: { name: 'Time attack', sub: 'Correct answers add time' },
  escalate: { name: 'Escalate', sub: 'One more banned word every time you are correct' },
  hotPotato: { name: 'Hot potato', sub: 'Hidden timer, pass it on' },
  reverse: { name: 'Reverse', sub: 'Guess the word from its clues' },
  mindReader: { name: 'Mind Reader', sub: 'Predict the clues before they’re said' },
};

const difficulties: Record<Difficulty, { name: string; badge: string }> = {
  Normal: { name: 'Normal', badge: 'NORMAL' },
  Harder: { name: 'Harder', badge: 'HARDER' },
  'Expert 1': { name: 'Expert 1', badge: 'EXPERT 1' },
  'Expert 2': { name: 'Expert 2', badge: 'EXPERT 2' },
  'Master 1': { name: 'Master 1', badge: 'MASTER 1' },
  'Master 2': { name: 'Master 2', badge: 'MASTER 2' },
  'Master 3': { name: 'Master 3', badge: 'MASTER 3' },
  Grandmaster: { name: 'Grandmaster', badge: 'GRANDMASTER' },
};

// Theme ids are already English; translations map them here.
const categories: Record<Category, string> = {
  'Inner World': 'Inner World',
  'Literature and Language': 'Literature and Language',
  'Pop Culture': 'Pop Culture',
  'Arts and Entertainment': 'Arts and Entertainment',
  'Science and Nature': 'Science and Nature',
  'Health and Body': 'Health and Body',
  Technology: 'Technology',
  'Computer Science': 'Computer Science',
  Society: 'Society',
  'Law and Diplomacy': 'Law and Diplomacy',
  Business: 'Business',
  'Love and Relationships': 'Love and Relationships',
  'Everyday Life': 'Everyday Life',
  'Culture and Travel': 'Culture and Travel',
  'Sports and Games': 'Sports and Games',
  'History and Myth': 'History and Myth',
  'Fantasy and Sci-Fi': 'Fantasy and Sci-Fi',
};

const feedbackTopics: Record<FeedbackTopic, string> = {
  styles: 'Styles and colors',
  modes: 'Game modes',
  words: 'Words and cards',
  other: 'Something else',
};

// Where the player came from, as the Back link and the "Picked for you" note name it.
const feedbackPlaces: Record<FeedbackEntryPoint, string> = {
  customize: 'Customize',
  modes: 'Modes',
  menu: 'Game',
};

// Anchors a How to play step can spotlight. Each platform maps them to the matching element.
export type SpotlightTarget = 'word' | 'banned' | 'difficulty' | 'menu' | 'play';

export type SpotlightStep = {
  id: string;
  // The element to cut out of the dark overlay, or null for a caption over the whole screen.
  target: SpotlightTarget | null;
  // 'logo' shows the wordmark above the text; 'mic' shows the speaking icon.
  art?: 'logo' | 'mic';
  text: string;
  // Short rules listed under the text.
  rules?: string[];
};

// The walkthrough as drawn on the design canvas ("How to play · animated walkthrough").
const howToPlaySteps: SpotlightStep[] = [
  { id: 'intro', target: null, art: 'logo', text: 'Get someone to guess a given word without saying any of the banned words.' },
  { id: 'word', target: 'word', text: 'This is the word they need to guess.' },
  { id: 'banned', target: 'banned', text: 'These are the banned words. Don’t say any of them.' },
  {
    id: 'speak',
    target: null,
    art: 'mic',
    text: 'Describe it out loud.',
    rules: ['No saying part of the word, like “hang” or “over”', 'No rhymes or “sounds like”', 'No pointing or acting it out'],
  },
  { id: 'difficulty', target: 'difficulty', text: 'Tap here to change difficulty.' },
  { id: 'menu', target: 'menu', text: 'Tap here to change the game mode or the look.' },
  { id: 'play', target: 'play', text: 'Ready? Tap here to play.' },
];

// Raised whenever the walkthrough changes, so players who saw an older one see the new one once.
// 1: the first rebuild's tour. 2: the canvas's current wording, order and rules.
const howToPlayVersion = 3;

export const en = {
  app: {
    name: 'Unspoken',
    tagline: 'Describe the word so your team guesses it, without saying any of the banned words.',
  },
  modes,
  difficulties,
  categories,

  // --- Shared units and status lines (RoundCopy in @unspoken/core) ---------------------------
  units: {
    points: { one: '{n} pt', other: '{n} pts' },
    pointsLabel: { one: 'point', other: 'points' },
    skips: { one: '{n} skip', other: '{n} skips' },
    words: { one: '{n} word', other: '{n} words' },
    cards: { one: '{n} card', other: '{n} cards' },
    cardsLabel: { one: 'card', other: 'cards' },
    bannedWords: { one: '{n} banned word', other: '{n} banned words' },
    letters: { one: '{n} letter', other: '{n} letters' },
  },
  themes: { all: 'All cards', many: { one: '{n} theme', other: '{n} themes' } },
  status: {
    skipsLeft: '{skips} left',
    tally: '{correct} correct · {skipped} skipped',
    scoreAndSkips: '{points} · {skips}',
    escalateClimbing: '{banned} · {skips}',
    escalateTop: '{max} banned · {atMax} of {winAt} to win · {skips}',
    hotPotato: 'Pass after every word',
    skipsUsedOf: '{used} of {limit}',
    passed: '{words} passed',
    mindReaderRound: 'Round {round} · No timer',
    reverse: '{points} · {words}',
    withThemes: '{status} · {themes}',
    clockLeft: '{clock} left · {points}',
    hiddenTimer: '{mode} · timer hidden',
    round: 'Round {round}',
    hiddenClock: 'Hidden',
  },
  over: {
    won: 'YOU WIN',
    timeUp: 'TIME’S UP',
    hotPotatoTitle: 'Whoever is holding the phone loses a point',
    hotPotatoSub: '{words} guessed this round',
    pointsSub: '{label} · {skips}',
    escalateWonSub: '{label} played · {correct} correct · {skips}',
    escalateLostSub: 'banned words reached · {correct} correct',
    playAgain: 'Play again',
    changeSettings: 'Change settings',
  },

  // --- Play screen ---------------------------------------------------------------------------
  play: {
    yourWord: 'Your word',
    dontSay: 'DON’T SAY',
    skipLink: '← Skip',
    correctLink: 'Correct →',
    skip: 'Skip',
    correct: 'Correct',
    swipeHint: 'SWIPE',
    swipeTheCard: 'swipe the card',
    newTag: 'NEW',
    hotPotatoNote: 'Holding it when time runs out loses a point',
    // The mode and level in a header pill; the platform styles the level lighter.
    modeAndLevel: '{mode} · {difficulty}',
  },
  paused: {
    label: 'PAUSED',
    resume: 'Resume',
    changeSettings: 'Change settings',
    newGame: 'New game',
  },
  pass: {
    label: 'PASS THE PHONE',
    title: 'Next player,\nready?',
    ready: 'I’m ready',
    timerPaused: 'Timer paused',
  },

  // --- Sheets --------------------------------------------------------------------------------
  menu: {
    title: 'Game paused',
    // The i beside the title: its name and, on web, its tooltip.
    howToPlay: { title: 'How to play' },
    changeSettings: { title: 'Change settings', detail: 'Mode, difficulty and theme · starts a new game' },
    customize: { title: 'Customize', detail: 'Layout and color · {style} · {color}' },
    feedback: { title: 'Send feedback', detail: 'Ideas for styles, modes or words' },
    // The Restart button shows restartShort, beside Resume or in the header; restart is its name.
    restart: 'Restart game',
    restartShort: 'Restart',
    resume: 'Resume',
  },
  // The mode and difficulty sheet that opens from the header pill.
  modeSheet: {
    note: 'Picking a difficulty starts a new round',
    difficulty: 'DIFFICULTY',
    restart: { title: 'Restart', detail: 'Same mode and level' },
    newGame: { title: 'New game', detail: 'Choose a different mode' },
    keepPlaying: 'Keep playing',
  },
  // The difficulty picker that opens from the Card header's badge.
  difficultyPicker: {
    title: 'Difficulty',
    note: 'Picking a new level starts a new game',
    keepPlaying: 'Keep playing',
  },

  // --- Modes and setup -----------------------------------------------------------------------
  modesScreen: {
    back: '‹ Back',
    title: 'Modes',
    hint: 'Tap a mode to set up a game',
    comingSoon: 'Coming soon',
    suggest: { title: 'Want another mode?', body: 'Suggest one or tell us what to improve.', action: 'Suggest' },
  },
  setup: {
    back: '← Modes',
    title: 'New game',
    difficulty: 'DIFFICULTY',
    themes: 'THEMES',
    themesHint: 'Pick one or more',
    smallDeck: 'Only {cards}, words will repeat',
    timer: 'ROUND TIMER',
    timerMin: 'At least {min}',
    timerDefault: 'Default for {difficulty}',
    timerUnit: 'min : sec',
    skips: 'SKIPS PER ROUND',
    skipsHint: '∞ = unlimited',
    unlimited: '∞',
    start: 'Start game',
  },

  // --- Customize -----------------------------------------------------------------------------
  customize: {
    back: '‹ Back',
    done: 'Done',
    title: 'Customize',
    sub: 'Make the game look the way you like.',
    style: 'STYLE',
    swipeMore: 'Swipe for more →',
    swipeBack: '← Swipe back',
    color: 'COLOR',
    light: 'Light',
    dark: 'Dark',
    suggest: { title: 'Want another style?', action: 'Suggest', label: 'Feedback' },
    // Keyed by STYLE_IDS in @unspoken/design-tokens.
    styles: {
      card: 'Card',
      deck: 'Deck',
      lines: 'Lines',
      split: 'Split',
      ledger: 'Ledger',
      ink: 'Ink',
      bottom: 'Bottom',
      sheet: 'Sheet',
      bigTimer: 'Big timer',
      chips: 'Chips',
      ombre: 'Ombre',
    },
    // Keyed by COLOR_IDS in @unspoken/design-tokens.
    colors: {
      teal: 'Teal',
      clay: 'Clay',
      lilac: 'Lilac',
      sage: 'Sage',
      mustard: 'Mustard',
      slateBlue: 'Slate blue',
      rose: 'Rose',
    },
    pinnedColor: 'This style has its own colors',
  },

  // --- Feedback ------------------------------------------------------------------------------
  feedback: {
    back: '‹ {place}',
    title: 'Send feedback',
    sub: 'Suggest a style, a game mode or anything else. We read every idea.',
    topicLabel: 'WHAT IS IT ABOUT?',
    topics: feedbackTopics,
    places: feedbackPlaces,
    pickedFor: 'Picked for you because you came from {place}.',
    ideaLabel: 'YOUR IDEA',
    placeholder: 'Tell us your idea',
    counter: '{n} / {max}',
    send: 'Send feedback',
    sending: 'Sending…',
    failed: 'Couldn’t send that. Check your connection and try again.',
  },
  thanks: {
    title: 'Thanks for the idea!',
    body: 'We’ll look at it for a future update. Keep the ideas coming.',
    done: 'Done',
  },

  // --- How to play (dark spotlight walkthrough) ------------------------------------------------
  howToPlay: {
    play: 'Play',
    skip: 'Skip tour',
    steps: howToPlaySteps,
    version: howToPlayVersion,
  },

  // --- Reverse -------------------------------------------------------------------------------
  reverse: {
    howTo: {
      kicker: 'How it works',
      title: 'Clues first,\nword last',
      steps: [
        { title: 'The guesser holds the phone', body: 'Everyone else stays quiet.' },
        { title: 'Read the clues out loud', body: 'These are the words you would normally be banned from saying.' },
        { title: 'Guess the hidden word', body: 'Stuck? Reveal another clue, but the word is worth one point less.' },
        { title: 'Reveal and swipe', body: 'Right if you got it, left if you missed.' },
      ],
      start: 'Start',
    },
    hiddenWord: 'Hidden word',
    worth: 'Worth {points}',
    clues: 'CLUES',
    reveal: 'Reveal next clue · −1 pt',
    allShowing: 'Every clue is showing',
    showWord: 'Show the word',
    hideWordA11y: 'Hide the word',
    showWordA11y: 'Show the word',
    shape: '{words} · {letters}',
    theWordWas: 'The word was',
    question: 'Did you say it before the reveal?',
    cluesUsed: 'CLUES USED · {revealed} OF {total}',
    missedLink: '← Missed',
    gotLink: 'Got it →',
    // The same answers on button-style controls.
    missed: 'Missed',
    got: 'Got it',
  },

  // --- Mind Reader ---------------------------------------------------------------------------
  mindReader: {
    howTo: {
      kicker: 'How it works',
      title: 'Predict the clues',
      steps: [
        { title: 'Guesser, look away', body: 'Only the Mind Reader and Clue Giver see the word.' },
        { title: 'Mind Reader, predict', body: 'Write 5 words the Clue Giver might say.' },
        { title: 'Hand over the phone', body: 'The Clue Giver sees only the word.' },
        { title: 'Clue Giver, give clues', body: 'Help the Guesser get the word.' },
        { title: 'Mind Reader, count', body: 'Keep track of how many of your words get said.' },
      ],
      start: 'Start',
    },
    predictKicker: 'Mind Reader · the word is',
    predictionsLabel: 'YOUR {n} PREDICTIONS',
    predictionsHint: 'Words you think the Clue Giver will say',
    placeholder: 'Word {n}',
    writeMore: 'Write {n} more',
    handOff: 'Hand to the Clue Giver',
    passLabel: 'PASS THE PHONE',
    passTitle: 'Clue Giver,\nready?',
    remember: 'Mind Reader, remember your {n} words.',
    takeOver: 'I’m the Clue Giver',
    clueKicker: 'Clue Giver · your word',
    clueHint: 'Give clues until the Guesser gets it. Somewhere, the Mind Reader is counting.',
    pass: 'Pass',
    gotIt: 'Got it',
    guessed: 'Guessed it',
    passed: 'Passed',
    predicted: 'THE MIND READER PREDICTED',
    howMany: 'Mind Reader: how many did the Clue Giver say?',
    nextWord: 'Next word',
  },

  // --- Accessibility labels ------------------------------------------------------------------
  a11y: {
    menu: 'Menu',
    customize: 'Customize',
    pause: 'Pause',
    difficulty: 'Difficulty {badge}. Tap to change.',
    modeAndDifficulty: '{mode}, {difficulty}. Tap to change.',
    closeMenu: 'Close menu',
    closeSheet: 'Close',
    timer: 'Round timer {clock}. Tap to type a new time.',
    unlimitedSkips: 'Unlimited skips',
  },
};

export type CopyCatalog = typeof en;

// The slice of the catalog the shared status lines in @unspoken/core read. Typing it here makes the
// catalog fail to compile if it misses a slot they need.
export const roundCopy: RoundCopy = en;
