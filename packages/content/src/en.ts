import type { Category, Difficulty, FeedbackEntryPoint, FeedbackTopic, ModeId, RoundCopy } from '@unspoken/core';

// English copy for every screen. Keys follow the ids in @unspoken/core (modes, difficulties, categories,
// feedback topics) and the style and color ids in @unspoken/design-tokens, so a platform never
// writes user-facing text itself. Placeholders in braces are filled with format() / plural() from
// @unspoken/core.

const modes: Record<ModeId, { name: string; sub: string }> = {
  classic: { name: 'Classic', sub: 'Timed round, score what you can' },
  endless: { name: 'Endless', sub: 'No clock, no limits, go until you stop' },
  teams: { name: 'Teams', sub: 'Two teams, pass the phone' },
  timeAttack: { name: 'Time Attack', sub: 'Correct answers add time' },
  escalate: { name: 'Escalate', sub: 'One more banned word every time you are correct' },
  hotPotato: { name: 'Hot Potato', sub: 'Hidden timer, pass it on' },
  reverse: { name: 'Reverse', sub: 'Guess the word from its clues' },
  mindReader: { name: 'Mind Reader', sub: 'Predict the clues before they’re said' },
};

const difficulties: Record<Difficulty, { name: string; badge: string }> = {
  Normal: { name: 'Normal', badge: 'NORMAL' },
  Tricky: { name: 'Tricky', badge: 'TRICKY' },
  Hard: { name: 'Hard', badge: 'HARD' },
  Tough: { name: 'Tough', badge: 'TOUGH' },
  Expert: { name: 'Expert', badge: 'EXPERT' },
  Elite: { name: 'Elite', badge: 'ELITE' },
  Master: { name: 'Master', badge: 'MASTER' },
  Legend: { name: 'Legend', badge: 'LEGEND' },
};

// Several difficulties picked: the easiest one's name or badge, then "+" ("HARD+", "Hard+").
const difficultyMixed = '{easiest}+';

// The Difficulty info sheet on New game: the same category at each difficulty, every word from the
// word bank at that difficulty.
const difficultyExamples: { category: string; words: Record<Difficulty, string> }[] = [
  {
    category: 'FOOD',
    words: { Normal: 'Leftovers', Tricky: 'Appetizer', Hard: 'Al dente', Tough: 'Umami', Expert: 'Fermentation', Elite: 'Sous vide', Master: 'Mise en place', Legend: 'Roux' },
  },
  {
    category: 'BOOKS',
    words: { Normal: 'Rhyme', Tricky: 'Cliffhanger', Hard: 'Prologue', Tough: 'Cliché', Expert: 'Pseudonym', Elite: 'Loanword', Master: 'Allusion', Legend: 'In medias res' },
  },
  {
    category: 'WEATHER',
    words: { Normal: 'Cloud', Tricky: 'Humidity', Hard: 'Typhoon', Tough: 'Cold front', Expert: 'Trade winds', Elite: 'Wind shear', Master: 'Rain shadow', Legend: 'Katabatic wind' },
  },
];

// Category ids are already English; translations map them here.
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
    rules: ['No saying part of the word, like “road” or “trip”', 'No rhymes or “sounds like”', 'No pointing or acting it out'],
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
  difficultyMix: difficultyMixed,
  categories,

  // --- Shared units and status lines (RoundCopy in @unspoken/core) ---------------------------
  units: {
    points: { one: '{n} pt', other: '{n} pts' },
    pointsLabel: { one: 'point', other: 'points' },
    skips: { one: '{n} skip', other: '{n} skips' },
    words: { one: '{n} word', other: '{n} words' },
    cards: { one: '{n} card', other: '{n} cards' },
    difficulties: { one: '{n} difficulty', other: '{n} difficulties' },
    cardsLabel: { one: 'card', other: 'cards' },
    bannedWords: { one: '{n} banned word', other: '{n} banned words' },
    letters: { one: '{n} letter', other: '{n} letters' },
    seconds: { one: '{n} second', other: '{n} seconds' },
  },
  themes: { all: 'All cards', many: { one: '{n} category', other: '{n} categories' } },
  status: {
    skipsLeft: '{skips} left',
    tally: '{correct} correct · {skipped} skipped',
    scoreAndSkips: '{points} · {skips}',
    escalateClimbing: '{banned} · {skips}',
    escalateTop: '{max} banned · {atMax} of {winAt} to win · {skips}',
    hotPotato: 'Pass after each correct word',
    skipsUsedOf: '{used} of {limit}',
    passed: '{words} passed',
    mindReaderRound: 'Round {round} of {rounds}',
    mindReaderWord: 'Word {word}',
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
    // The row above Resume that opens the time limit changer, with the next turn's time at the right
    // (or noLimit) and, once it differs from this turn's, startsNextTurn under the title.
    changeTimeLimit: 'Change time limit',
    noLimit: 'No limit',
    startsNextTurn: 'Starts next turn',
  },
  // The time limit changer on the Paused screen: the same rules and words as setup's TIME LIMIT
  // (0:30 to 10:00, typed min : sec, a calm note outside the range, the No limit switch on the title
  // row and No clock this game while it is on), with − and + beside the big time and a slider under
  // it. A saved change starts next turn; this turn keeps its time left.
  timeLimit: {
    title: 'Time limit',
    keepsClock: 'Starts next turn · this turn keeps its {clock}',
    startsNextTurn: 'Starts next turn',
    save: 'Save',
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
    changeSettings: { title: 'Change settings', detail: 'Mode, difficulty and categories · starts a new game' },
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
    restart: { title: 'Restart', detail: 'Same mode and difficulty' },
    newGame: { title: 'New game', detail: 'Choose a different mode' },
    keepPlaying: 'Keep playing',
  },
  // The difficulty picker that opens from the Card header's badge.
  difficultyPicker: {
    title: 'Difficulty',
    note: 'Picking a new difficulty starts a new game',
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
    // The Categories box above DIFFICULTY: its title, and the picks with their card count.
    categories: 'Categories',
    categoriesDetail: '{summary} · {cards}',
    difficulty: 'DIFFICULTY',
    // At the right of the DIFFICULTY label: the hint with one pick, the count and cards with more.
    difficultyHint: 'Pick one or more',
    difficultyPicked: '{difficulties} · {cards}',
    timer: 'TIME LIMIT',
    // Inside the box under min : sec: the times setup accepts.
    timerRange: '{min} to {max}',
    // Under the box when the typed time is outside that range; Start waits until it is fixed.
    timerOutOfRange: 'Choose between {min} and {max}.',
    timerUnit: 'min : sec',
    // The switch at the right of the TIME LIMIT label: the round has no clock and ends from the menu.
    // Screen readers hear a11y.noTimeLimit instead.
    noLimit: 'No limit',
    // Inside the greyed box while No limit is on.
    noClock: 'No clock this game',
    skips: 'SKIPS PER ROUND',
    skipsHint: '∞ = unlimited',
    unlimited: '∞',
    start: 'Start game',
  },

  // The pull-up sheet from the Categories box on New game.
  categoriesSheet: {
    title: 'Choose categories',
    hint: 'Double-tap All cards to highlight all',
    // While every category is highlighted.
    hintAll: 'Double-tap All cards to unhighlight all',
    done: 'Done',
  },
  // The (i) at the right of DIFFICULTY on New game.
  difficultyInfo: {
    title: 'Difficulty',
    body: 'Tap to select one or more difficulties. The examples below show the same category at each difficulty.',
    examples: difficultyExamples,
  },
  // Start game with few cards to draw from.
  smallDeck: {
    title: 'Only {cards} match',
    body: 'Cards are likely to repeat. Try adding categories or difficulties.',
    playAnyway: 'Play anyway',
    back: 'Go back',
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
    // The Mind Reader start screen, opened from its tile on Modes.
    start: {
      back: '← Modes',
      sub: 'Predict the clues before they’re said.',
      quick: { title: 'Quick play', body: 'Starts right away. No setup, no teams, no scores.', action: 'Play' },
      custom: { title: 'Custom game', body: 'Players, teams, rounds, time limit, words' },
      practice: { title: 'Practice', body: 'A guided practice turn and how scoring works' },
    },
    // Custom game setup: Who’s playing? → How do you want to play? → Game settings.
    step: 'Step {n} of {total}',
    back: '← Back',
    next: 'Next',
    players: {
      title: 'Who’s playing?',
      count: 'NUMBER OF PLAYERS',
      countAside: 'From the names',
      countLabel: 'Players',
      names: 'NAMES · {n}',
      namesAside: 'Optional',
      placeholder: 'Add a player name',
      // A player added by the count with no name typed.
      defaultName: 'Player {n}',
      tooFew: { one: 'Mind Reader needs at least {min} players. Add 1 more.', other: 'Mind Reader needs at least {min} players. Add {n} more.' },
    },
    lineup: {
      title: 'How do you want to play?',
      individual: 'Individual',
      teams: 'Teams',
      individualHint: 'Individual · {min} or more players. Roles rotate; everyone scores on their own.',
      teamsHint: 'Teams · {min} or more players. One team predicts while another gives clues and guesses.',
      order: 'PLAYERS · TURN ORDER',
      orderAside: 'Tap a name to edit',
      orderName: '{n} · {name}',
      first: 'Mind Reader first',
      addPlayer: '+ Add player',
      addPlaceholder: 'Player name',
      shuffleOrder: 'Shuffle order',
      teamSetup: 'TEAM SETUP',
      teamCount: 'Number of teams',
      shuffleTeams: 'Shuffle teammates',
      teamsLabel: 'TEAMS · {players}',
      teamsAside: 'Tap a team to edit it',
      players: { one: '{n} player', other: '{n} players' },
      smallTeam: '{team} has {size}. Each team needs at least {min} to continue.',
      tooManyTeams: 'Teams need at least {min} players each. Choose {max} teams or fewer, or add players below.',
      // The pop-up when Teams is tapped with too few players.
      needTeams: {
        title: 'Teams need {min} or more players',
        body: { one: 'You have {n} player. Add at least {missing} more to play in teams, or keep playing Individual.', other: 'You have {n} players. Add at least {missing} more to play in teams, or keep playing Individual.' },
        add: 'Add players',
        stay: 'Stay with Individual',
      },
      // The menu on a player: their row in Individual, their chip in Teams.
      menu: { rename: 'Rename', moveTo: 'Move to', remove: 'Remove from game', moveHeader: 'MOVE TO' },
      save: 'Save',
    },
    customize: {
      title: 'Customize team',
      name: 'NAME',
      color: 'COLOR',
      members: 'IN THIS TEAM',
      membersAside: 'Tap a name for options',
      addFrom: 'ADD FROM OTHER TEAMS',
      addFromAside: 'Tap to add',
      addFromName: '+ {name}',
      done: 'Done',
    },
    // Teams in the order they are added; players can rename them.
    teamNames: ['Sharks', 'Owls', 'Foxes', 'Bears', 'Wolves', 'Otters'],
    // Step 3 on Game settings, above the time limit.
    settings: {
      title: 'Game settings',
      rounds: 'ROUNDS',
      roundsLabel: 'Rounds',
      roundsTeams: 'Every team plays once a round',
      roundsIndividual: 'Everyone is the Mind Reader once a round',
      // Under the time limit when No limit is on: faster guesses can't score more.
      flatGuess: 'A correct guess is a flat {points}.',
    },

    // --- The header on a turn ---
    round: 'Round {round} of {rounds}',
    details: 'Details',
    cards: {
      readers: 'Mind Readers',
      reader: 'Mind Reader',
      clueGiver: 'Clue Giver',
      teamUp: '{team} are up',
      givesClues: '{name} gives clues',
    },
    detailsSheet: {
      title: 'Who’s playing this turn',
      readers: 'MIND READERS',
      reader: 'MIND READER',
      clueGiver: 'CLUE GIVER',
      guessers: 'GUESSERS',
      nextTeams: 'Next turn: {team} are the Mind Readers.',
      nextIndividual: 'Next turn: {name} is the Mind Reader.',
      last: 'This is the last turn of the game.',
    },

    // --- Roles, before anyone sees the word ---
    roles: {
      round: 'Round {round} of {rounds}',
      title: '{whose} turn',
      readers: 'MIND READERS',
      reader: 'MIND READER',
      clueGiver: 'CLUE GIVER',
      guessing: 'GUESSING',
      guessers: 'GUESSERS',
      readersDetail: '{names} · predict together',
      clueDetailTeams: 'From {team} · gives clues without the phone',
      guessingDetail: '{names} · guess out loud',
      readerDetail: { one: 'Predicts {n} word', other: 'Predicts {n} words' },
      clueDetail: 'Gives clues without the phone',
      guessersDetail: 'Guess out loud',
      noteTeams: 'The word appears on the next screen. Only the Mind Readers look.',
      noteOne: 'The word appears on the next screen. Only the Mind Reader looks.',
      showTeams: 'Show the Mind Readers the word',
      showIndividual: 'Show {name} the word',
      quick: {
        kicker: 'Quick play · Word {n}',
        title: 'Pick your roles',
        reader: 'Whoever holds the phone',
        clueGiver: 'Pick one player',
        guessers: 'Everyone else',
        show: 'I’m the Mind Reader · Show the word',
      },
    },

    // --- Predict ---
    predict: {
      kicker: '{name}, the word is',
      kickerQuick: 'Mind Reader, the word is',
      // The quiet label beside the menu on Quick play's Predict (no round heading there).
      quickLabel: 'Mind Reader · Quick play',
      kickerPractice: 'Mind Reader · the word is',
      label: '{n} PREDICTIONS',
      hint: 'Words {name} might say',
      hintQuick: 'Words the Clue Giver might say',
      placeholder: 'Word {n}',
      noteTeams: 'Don’t let {team} see or hear.',
      noteIndividual: 'Don’t let the others see or hear.',
      noteQuick: 'Don’t let the Clue Giver or Guessers see.',
      writeMore: 'Write {n} more',
      done: 'Show {name} the word',
      doneQuick: 'Show the Clue Giver the word',
    },

    // --- Show the Clue Giver the word ---
    show: {
      kicker: '{name} is the Clue Giver',
      title: 'Show {name} the word',
      titleQuick: 'Show the Clue Giver the word',
      guessers: { one: '{names} is guessing: don’t show them.', other: '{names} are guessing: don’t show them.' },
      guessersQuick: 'Don’t show the Guessers.',
      keep: 'Keep the phone in your hand.',
      givesClues: '{name} gives clues without the phone.',
      givesCluesQuick: 'The Clue Giver gives clues without the phone.',
      seen: '{name} has seen it and looked away',
      seenQuick: 'Clue Giver has seen it · Start',
    },

    // --- Clues ---
    clues: {
      theWord: 'The word',
      tapHint: 'Tap a word when the Clue Giver says it',
      guessNowTeam: '{team} guess now: {value}',
      guessNow: 'Guess now: {value}',
      // What a guess scores right now: 3 + 4 = 7 points, or a flat 3 points with no limit.
      value: '{base} + {bonus} = {points}',
      spoken: 'SPOKEN!',
      correct: { one: '{n} correct prediction', other: '{n} correct predictions' },
      entry: '{time} · {word}',
      countUp: 'Times count up from the start of the word. No time limit.',
      guessedTeam: '{team} guessed it!',
      guessed: 'Guessed it!',
      notGuessed: 'Not guessed',
    },

    // --- Turn over (Custom) ---
    over: {
      guessedWith: '{side} guessed it with {time} left',
      guessedSide: '{side} guessed it',
      guessedWithAnon: 'Guessed it with {time} left',
      guessedAnon: 'Guessed it',
      timeUp: 'Time’s up · not guessed',
      notGuessed: 'Not guessed',
      fastGuess: 'Fast guess',
      fastGuessDetail: '{base} + {per} per {every} s left',
      flatGuess: 'Guessed it',
      flatGuessDetail: 'No time limit',
      predictions: 'Correct predictions',
      predictionsDetail: { one: '{n} spoken', other: '{n} spoken' },
      notGuessedBonus: 'Not guessed',
      notGuessedDetail: 'Bonus to the Mind Readers',
      points: '+{n}',
      fix: 'Fix this turn',
      seeScores: 'See scores',
      seeResults: 'See results',
    },
    fix: {
      title: 'Fix this turn',
      outcome: 'OUTCOME',
      got: '{side} got it',
      notGuessed: 'Not guessed',
      predictions: 'Correct predictions',
      predictionsHint: 'Every time counts',
      spoken: 'SPOKEN! · {n}',
      removesOne: '× removes one',
      save: 'Save',
    },
    scores: {
      afterRound: 'After round {round} of {rounds}',
      duringRound: 'Round {round} of {rounds}',
      title: 'Scores',
      next: 'NEXT TURN',
      nextTeams: '{team} are the Mind Readers',
      nextClueTeams: '{name} ({team}) gives clues · {guessers} guess',
      nextIndividual: '{name} is the Mind Reader',
      nextClueIndividual: '{name} gives clues · {guessers} guess',
      hand: 'Hand the phone to {name}.',
      // whose: possessive(name), "Owls’" or "Leo’s".
      start: 'Start {whose} turn',
    },
    results: {
      kicker: { one: 'Game over · {n} round', other: 'Game over · {n} rounds' },
      winTeam: '{team} win',
      winPlayer: '{name} wins',
      tie: 'It’s a tie',
      sub: '{points} · {predictions}',
      points: { one: '{n} point', other: '{n} points' },
      predictions: { one: '{n} correct prediction', other: '{n} correct predictions' },
      playAgain: 'Play again',
      newGame: 'New game',
    },

    // --- Quick play: the word is over ---
    quickOver: {
      guessed: 'GUESSED IT',
      notGuessed: 'NOT GUESSED',
      pass: 'Pass the phone to someone new to be the next Mind Reader.',
      next: 'Next word',
      end: 'End quick play',
    },

    // --- Practice ---
    practice: {
      overline: 'Practice · {step} of {total}',
      title: 'Practice turn',
      skip: 'Skip',
      coach: [
        {
          label: 'Step 1 · Predict',
          body: 'Use the word at the top to make {n} predictions: words you think the Clue Giver will say. Don’t let the Clue Giver or Guessers see.',
          action: 'Got it',
        },
        { label: 'Step 2 · Show the Clue Giver', body: 'Keep the phone in your hand and show only the Clue Giver. They give clues without the phone.', action: 'Got it' },
        {
          label: 'Step 3 · Count every time',
          body: 'Tap a word whenever the Clue Giver says it, even again. × removes a mistake. Tap Guessed it! when they get it.',
          action: 'Try it',
        },
      ],
      scoring: {
        title: 'How scoring works',
        lead: 'Wrong guesses never cost anything.',
        fast: { title: 'Guessing it fast', detail: '{guess}, plus {bonus} for every {every} seconds left' },
        spoken: { title: 'Each prediction spoken', detail: 'To the Mind Readers, every time, repeats too' },
        notGuessed: { title: 'Not guessed in time', detail: 'Bonus to the Mind Readers' },
        individual: { title: 'Individual', detail: 'The Clue Giver scores the guess' },
        points: '+{n}',
        example: { title: 'Example', body: 'Guessed with {time} left: {sum}. One prediction said twice: +{twice}.' },
        // The guess in the example, in seconds left.
        exampleSecondsLeft: 42,
      },
      quick: 'Quick play',
      custom: 'Custom game',
      again: 'Practice again',
    },
  },

  // --- Accessibility labels ------------------------------------------------------------------
  a11y: {
    noTimeLimit: 'No time limit',
    fewer: 'Fewer {label}',
    more: 'More {label}',
    removePlayer: 'Remove {name}',
    playerOptions: '{name}: options',
    editTeam: 'Edit {team}',
    teamColor: 'Color {n}',
    spoke: '{word} was said',
    unspoke: 'Remove {word} at {time}',
    roundDetails: 'Who’s playing this turn',
    menu: 'Menu',
    customize: 'Customize',
    pause: 'Pause',
    difficulty: 'Difficulty {badge}. Tap to change.',
    modeAndDifficulty: '{mode}, {difficulty}. Tap to change.',
    closeMenu: 'Close menu',
    closeSheet: 'Close',
    timer: 'Time limit {clock}. Tap to type a new time.',
    // The time limit changer's − and +, and its slider.
    shorter: 'Shorter by {step}',
    longer: 'Longer by {step}',
    timeLimitSlider: 'Time limit',
    // The Paused screen's Change time limit row, with the next turn's time limit.
    changeTimeLimit: 'Change time limit, {value}',
    unlimitedSkips: 'Unlimited skips',
    difficultyInfo: 'About difficulties',
    categories: 'Categories: {summary}. Tap to choose.',
  },
};

export type CopyCatalog = typeof en;

// "Maya", "Maya and Sam", "Maya, Sam and Ava".
export function listNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// "Sharks’ turn", "Maya’s turn": the name with its possessive ending.
export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}’` : `${name}’s`;
}

// The slice of the catalog the shared status lines in @unspoken/core read. Typing it here makes the
// catalog fail to compile if it misses a slot they need.
export const roundCopy: RoundCopy = en;
