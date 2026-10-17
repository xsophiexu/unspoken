import { roundCopy } from '@unspoken/content';
import {
  canAnswer,
  menuStatus,
  pausedStatus,
  swipeSummary,
  withDifficulty,
  type Difficulty,
  type RoundAction,
  type SwipeRoundState,
} from '@unspoken/core';
import { cardSwipes, type RegionColors, type Theme } from '@unspoken/design-tokens';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type Dispatch, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePrefs } from '../state/prefs';
import { useBarStyle, usePageBackground } from '../ui/Screen';
import { HowToPlay } from './HowToPlay';
import { MindReaderRound } from './MindReaderRound';
import { playModel } from './model';
import { OverOverlay, PassOverlay, PausedOverlay } from './overlays';
import { PlayView, type HeaderHandlers, type Insets } from './PlayView';
import { ReverseRound } from './ReverseRound';
import { GameMenu, DifficultyPicker, ModeSheet } from './sheets';
import { TargetsProvider, useTargets } from './spotlight';
import { useRound } from './useRound';
import { useSwipe } from './useSwipe';

// The play screen: one round of the saved settings. Starting a game or restarting changes the
// game id, which remounts the round with fresh state.
export function Game() {
  const { settings, gameId } = usePrefs();
  return <Round key={gameId} settings={settings} />;
}

// What every mode's screen shares: the header buttons, the sheets they open, the tour, the
// navigation out, and the theme and safe areas.
export type Chrome = {
  theme: Theme;
  page: RegionColors;
  insets: Insets;
  handlers: HeaderHandlers;
  restart: () => void;
  changeSettings: () => void;
};

function Round({ settings }: { settings: Parameters<typeof useRound>[0] }) {
  const prefs = usePrefs();
  const { theme } = prefs;
  const [state, dispatch] = useRound(settings);
  const [sheet, setSheet] = useState<'menu' | 'mode' | 'level' | null>(null);
  const targets = useTargets();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const tone = theme.style.regions.page;
  const page = theme.regions[tone];
  const barStyle = useBarStyle(tone);
  usePageBackground(page.bg);

  // The clock stops while a sheet or the tour is open or another screen is on top, and starts
  // again when they close. A pause the player chose stays until they resume.
  const halted = sheet !== null || prefs.tourOpen || !focused;
  const pause = state.kind === 'swipe' ? state.pause : null;
  useEffect(() => {
    if (state.kind !== 'swipe') return;
    if (halted && pause === null) dispatch({ type: 'pause', reason: sheet === 'menu' ? 'menu' : 'sheet' });
    if (!halted && (pause === 'menu' || pause === 'sheet')) dispatch({ type: 'resume' });
  }, [state.kind, halted, pause, sheet, dispatch]);

  const close = () => setSheet(null);
  const changeSettings = () => {
    close();
    router.push('/modes');
  };
  const chrome: Chrome = {
    theme,
    page,
    insets,
    handlers: { onBadge: () => setSheet('level'), onModeLabel: () => setSheet('mode'), onMenu: () => setSheet('menu') },
    restart: () => {
      close();
      prefs.restart();
    },
    changeSettings,
  };
  const pick = (d: Difficulty) => {
    close();
    prefs.startGame(withDifficulty(settings, d));
  };

  let body: ReactNode;
  switch (state.kind) {
    case 'swipe':
      body = <SwipeRound state={state} dispatch={dispatch} chrome={chrome} />;
      break;
    case 'reverse':
      body = <ReverseRound state={state} dispatch={dispatch} chrome={chrome} />;
      break;
    case 'mindReader':
      body = <MindReaderRound state={state} dispatch={dispatch} chrome={chrome} />;
      break;
  }

  return (
    <View style={[styles.fill, { backgroundColor: page.bg }]}>
      <StatusBar style={barStyle} />
      <TargetsProvider targets={targets}>{body}</TargetsProvider>
      <GameMenu
        visible={sheet === 'menu'}
        onClose={close}
        status={menuStatus(state, roundCopy)}
        onRestart={chrome.restart}
        onSettings={changeSettings}
        onCustomize={() => {
          close();
          router.push('/customize');
        }}
        onFeedback={() => {
          close();
          router.push({ pathname: '/feedback', params: { from: 'menu' } });
        }}
        onHowToPlay={() => {
          close();
          prefs.openTour();
        }}
      />
      <ModeSheet
        visible={sheet === 'mode'}
        onClose={close}
        mode={settings.mode}
        difficulties={settings.difficulties}
        onPick={pick}
        onRestart={chrome.restart}
        onNewGame={changeSettings}
      />
      <DifficultyPicker visible={sheet === 'level'} onClose={close} difficulties={settings.difficulties} categories={settings.categories} onPick={pick} />
      {prefs.tourOpen ? <HowToPlay targets={targets} theme={theme} insets={insets} onClose={prefs.closeTour} /> : null}
    </View>
  );
}

type SwipeProps = { state: SwipeRoundState; dispatch: Dispatch<RoundAction>; chrome: Chrome };

// Classic, Endless, Time Attack, Escalate, Hot Potato.
function SwipeRound({ state, dispatch, chrome }: SwipeProps) {
  const model = playModel(state);
  const summary = swipeSummary(state, roundCopy);
  const swipe = useSwipe({
    can: (kind) => canAnswer(state, kind),
    onAnswer: (kind) => dispatch({ type: kind }),
    active: canAnswer(state, 'correct'),
    drag: cardSwipes(chrome.theme.style),
  });
  const { page, insets } = chrome;
  return (
    <View style={styles.fill}>
      <PlayView theme={chrome.theme} model={model} insets={insets} handlers={{ ...chrome.handlers, onPause: () => dispatch({ type: 'pause' }), swipe }} />
      {summary ? (
        <OverOverlay colors={page} insets={insets} summary={summary} onPlayAgain={chrome.restart} onSettings={chrome.changeSettings} />
      ) : state.passing ? (
        <PassOverlay colors={page} insets={insets} onReady={() => dispatch({ type: 'ready' })} />
      ) : state.pause === 'user' ? (
        <PausedOverlay
          colors={page}
          insets={insets}
          clock={model.clock?.label ?? null}
          status={pausedStatus(state, roundCopy)}
          onResume={() => dispatch({ type: 'resume' })}
          onSettings={chrome.changeSettings}
          onNewGame={chrome.restart}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
