import { gameConfig } from '../config';
import { modeRules } from '../rules';
import type { GameSettings } from '../types';
import { createMindReaderRound, mindReaderReducer, type MindReaderAction, type MindReaderRoundState, type MindReaderStart } from './mindReader';
import { createReverseRound, reverseReducer, type IntroOption, type ReverseAction, type ReverseRoundState } from './reverse';
import { createSwipeRound, swipeReducer, type RoundOptions, type SwipeAction, type SwipeRoundState } from './swipe';
import { createVersusRound, versusReducer, type VersusAction, type VersusRoundState } from './versus';
import type { VersusSetup } from '../versus/match';

export type RoundState = SwipeRoundState | ReverseRoundState | MindReaderRoundState | VersusRoundState;
export type RoundAction = SwipeAction | ReverseAction | MindReaderAction | VersusAction;

// Start a round for any available mode. Settings pick the state machine (config.modes[].play).
export function createRound(settings: GameSettings, options: RoundOptions & IntroOption & { mindReader?: MindReaderStart; versus?: VersusSetup }): RoundState {
  const rules = modeRules(settings.mode, options.config ?? gameConfig);
  if (!rules.available) throw new Error(`${settings.mode} is not available yet`);
  switch (rules.play) {
    case 'swipe':
      return createSwipeRound(settings, options);
    case 'reverse':
      return createReverseRound(settings, options);
    case 'mindReader':
      return createMindReaderRound(settings, options);
    case 'versus':
      return createVersusRound(settings, { ...options, setup: options.versus });
  }
}

// One reducer for every mode, for a single useReducer in the UI. Actions a mode doesn't know are ignored.
export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  switch (state.kind) {
    case 'swipe':
      return isSwipeAction(action) ? swipeReducer(state, action) : state;
    case 'reverse':
      return isReverseAction(action) ? reverseReducer(state, action) : state;
    case 'mindReader':
      return isMindReaderAction(action) ? mindReaderReducer(state, action) : state;
    case 'versus':
      return isVersusAction(action) ? versusReducer(state, action as VersusAction) : state;
  }
}

const SWIPE: readonly string[] = ['correct', 'skip', 'tick', 'pause', 'resume', 'ready', 'showCard'] satisfies SwipeAction['type'][];
const REVERSE: readonly string[] = ['start', 'revealClue', 'togglePeek', 'showAnswer', 'got', 'missed'] satisfies ReverseAction['type'][];
const MIND_READER: readonly string[] = [
  'showWord',
  'predict',
  'handOff',
  'startClues',
  'spoke',
  'unspoke',
  'tick',
  'pause',
  'resume',
  'finishClues',
  'dismissCoach',
  'fixTurn',
  'next',
] satisfies MindReaderAction['type'][];

const VERSUS: readonly string[] = ['startTurn', 'correct', 'skip', 'tick', 'pause', 'resume', 'endTurn', 'cycleCard', 'next'] satisfies VersusAction['type'][];

function isVersusAction(action: RoundAction): action is VersusAction {
  return VERSUS.includes(action.type);
}
function isSwipeAction(action: RoundAction): action is SwipeAction {
  return SWIPE.includes(action.type);
}
function isReverseAction(action: RoundAction): action is ReverseAction {
  return REVERSE.includes(action.type);
}
function isMindReaderAction(action: RoundAction): action is MindReaderAction {
  return MIND_READER.includes(action.type);
}
