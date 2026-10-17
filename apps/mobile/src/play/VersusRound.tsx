import { en, guesserButtons, passView, recapView, versusDetails, versusResultsView, versusRoleCards, versusScoresView, versusTitle, type RecapRow } from '@unspoken/content';
import {
  bannedCountFor,
  canVersusAnswer,
  formatClock,
  hardestDifficulty,
  needsGuesser,
  versusCard,
  versusClockProgress,
  type CardOutcome,
  type RoundAction,
  type VersusRoundState,
} from '@unspoken/core';
import { layout, radius, resolveTheme, space, type RegionColors, type Theme } from '@unspoken/design-tokens';
import { router } from 'expo-router';
import { useEffect, useMemo, useState, type Dispatch } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, mrStyles, Note, TeamDot } from '../mindReader/ui';
import { Button, LinkButton } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Txt } from '../ui/Txt';
import type { Chrome } from './Game';
import { Standings } from './MindReaderRound';
import { DetailsSheet, headerPlacement, MenuDots, MRFrame, TurnHeader } from './mindReaderParts';
import type { PlayModel } from './model';
import { PausedOverlay } from './overlays';
import { PlayView } from './PlayView';
import { Controls, halvesFor } from './slots/Controls';
import { useSwipe } from './useSwipe';

type Props = { state: VersusRoundState; dispatch: Dispatch<RoundAction>; chrome: Chrome; onSheet: (open: boolean) => void };

// The turn always uses Classic's Card layout (the timer ring around the word card), in the
// player's color, whatever style they picked for the other modes.
const TURN_STYLE = 'card';

// Versus: pass the phone to the Clue Giver, their timed turn, the recap, the scores after every
// round and the results after the last.
export function VersusRound({ state, dispatch, chrome, onSheet }: Props) {
  const [details, setDetails] = useState(false);
  const { page } = chrome;
  useEffect(() => onSheet(details), [details, onSheet]);
  const toSetup = () => router.push('/versus');

  let screen;
  switch (state.phase) {
    case 'pass': {
      const v = passView(state);
      const raised = chrome.theme.regions.raised;
      screen = (
        <MRFrame chrome={chrome} center footer={<Button kind="primary" label={v.button} colors={page} onPress={() => dispatch({ type: 'startTurn' })} />}>
          <View style={styles.centerHead}>
            <Txt variant="overline" color={page.muted}>
              {v.kicker}
            </Txt>
            <View style={mrStyles.row}>
              {v.color !== null ? <TeamDot color={v.color} size={space[3.5]} /> : null}
              <Txt variant="title" color={page.ink} accessibilityRole="header" style={styles.centerText}>
                {v.title}
              </Txt>
            </View>
            <Txt variant="hint" color={page.muted} style={styles.centerText}>
              {v.sub}
            </Txt>
          </View>
          <Card style={styles.list}>
            {v.rows.map((row, i) => (
              <View key={row.label} style={[styles.passRow, i > 0 && { borderTopWidth: layout.stroke.hairline, borderTopColor: raised.rule }]}>
                <Txt variant="overline" color={raised.muted}>
                  {row.label}
                </Txt>
                <Txt variant="optionTitle" color={raised.ink} style={styles.passValue}>
                  {row.value}
                </Txt>
              </View>
            ))}
          </Card>
          <Note text={v.note} colors={page} icon="eyeOff" />
          {v.nextTime ? (
            <Txt variant="small" color={page.muted} style={styles.centerText}>
              {v.nextTime}
            </Txt>
          ) : null}
        </MRFrame>
      );
      break;
    }
    case 'turn':
      screen = <Turn state={state} dispatch={dispatch} chrome={chrome} onDetails={() => setDetails(true)} />;
      break;
    case 'recap':
      screen = <Recap state={state} dispatch={dispatch} chrome={chrome} />;
      break;
    case 'scores': {
      const v = versusScoresView(state);
      screen = (
        <MRFrame
          chrome={chrome}
          footer={
            <>
              {v ? (
                <View style={[styles.nextBox, { backgroundColor: page.chip }]}>
                  <Txt variant="overline" color={page.muted}>
                    {en.versus.scores.next}
                  </Txt>
                  <View style={[mrStyles.row, styles.centerRow]}>
                    {v.nextColor !== null ? <TeamDot color={v.nextColor} size={space[2]} /> : null}
                    <Txt variant="label" color={page.ink} style={styles.nextLine}>
                      {v.next}
                    </Txt>
                  </View>
                  <Txt variant="small" color={page.muted} style={styles.centerText}>
                    {v.hand}
                  </Txt>
                </View>
              ) : null}
              <Button kind="primary" label={v?.button ?? ''} colors={page} onPress={() => dispatch({ type: 'next' })} />
            </>
          }
        >
          <View>
            <Txt variant="overline" color={page.muted}>
              {v?.kicker}
            </Txt>
            <Txt variant="title" color={page.ink} accessibilityRole="header">
              {en.versus.scores.title}
            </Txt>
          </View>
          <Standings rows={v?.rows ?? []} chrome={chrome} />
          <Txt variant="small" color={page.muted} style={styles.centerText}>
            {v?.left}
          </Txt>
        </MRFrame>
      );
      break;
    }
    case 'results': {
      const v = versusResultsView(state);
      screen = (
        <MRFrame
          chrome={chrome}
          footer={
            <>
              <Button kind="primary" label={en.versus.results.playAgain} colors={page} onPress={chrome.restart} />
              <View style={styles.link}>
                <LinkButton label={en.versus.results.newGame} colors={page} onPress={toSetup} />
              </View>
            </>
          }
        >
          <View style={styles.centerHead}>
            <Txt variant="overline" color={page.muted}>
              {v.kicker}
            </Txt>
            <Txt variant="headline" color={page.ink} accessibilityRole="header" style={styles.centerText}>
              {v.title}
            </Txt>
            <Txt variant="hint" color={page.muted} style={styles.centerText}>
              {v.sub}
            </Txt>
          </View>
          <Standings rows={v.rows} chrome={chrome} />
        </MRFrame>
      );
      break;
    }
  }

  const sheet = versusDetails(state);
  return (
    <>
      {screen}
      <DetailsSheet visible={details} onClose={() => setDetails(false)} sections={sheet.sections} footer={sheet.footer} />
    </>
  );
}

// --- The turn ----------------------------------------------------------------------------------

function turnModel(state: VersusRoundState): PlayModel {
  const card = versusCard(state);
  const shown = bannedCountFor(hardestDifficulty(state.settings.difficulties, state.config), state.config);
  return {
    mode: en.modes.versus.name,
    level: '',
    badge: '',
    subline: versusTitle(state),
    stats: { points: null, detail: '' },
    clock: state.clock ? { label: formatClock(state.clock.left), progress: versusClockProgress(state) } : null,
    card: card ? { card, banned: card.banned.slice(0, shown), freshIndex: null } : null,
    canCorrect: canVersusAnswer(state, 'correct'),
    canSkip: canVersusAnswer(state, 'skip'),
    note: null,
  };
}

function Turn({ state, dispatch, chrome, onDetails }: { state: VersusRoundState; dispatch: Dispatch<RoundAction>; chrome: Chrome; onDetails: () => void }) {
  const selection = chrome.theme.selection;
  const theme = useMemo(() => resolveTheme({ ...selection, style: TURN_STYLE }), [selection]);
  const page = theme.regions[theme.style.regions.page];
  const pick = needsGuesser(state);
  // The Paused overlay shows for the pause button; a sheet or the menu pauses without it.
  const [userPaused, setUserPaused] = useState(false);
  const model = turnModel(state);
  const swipe = useSwipe({
    // With 3 or more players, Correct names who got it, so the card only swipes to Skip.
    can: (kind) => canVersusAnswer(state, kind) && !(kind === 'correct' && pick),
    onAnswer: (kind) => dispatch({ type: kind }),
    active: canVersusAnswer(state, 'skip') || (canVersusAnswer(state, 'correct') && !pick),
    drag: true,
  });
  const turnChrome: Chrome = { ...chrome, theme, page };
  // The header sits on the play screen's margins; its role cards on the setup screens', like
  // Mind Reader's.
  const place = headerPlacement(turnChrome);
  const header = (
    <View style={{ marginHorizontal: -place.inset }}>
      <TurnHeader chrome={turnChrome} title={versusTitle(state)} cards={versusRoleCards(state)} onDetails={onDetails} />
    </View>
  );
  const controls = pick ? (
    <GuesserControls state={state} colors={page} onSkip={() => dispatch({ type: 'skip' })} onGot={(guesser) => dispatch({ type: 'correct', guesser })} />
  ) : (
    <Controls
      slot={theme.style.controls}
      colors={page}
      halves={halvesFor(theme, page)}
      canSkip={model.canSkip}
      canCorrect={model.canCorrect}
      onAnswer={swipe.answer}
      dx={swipe.dx}
      bottomInset={chrome.insets.bottom}
    />
  );
  return (
    <View style={styles.fill}>
      <PlayView
        theme={theme}
        model={model}
        insets={chrome.insets}
        header={header}
        controls={
          state.clock ? (
            controls
          ) : (
            // No time limit: the Clue Giver ends the turn.
            <View style={styles.endTurn}>
              {controls}
              <LinkButton label={en.versus.turn.endTurn} colors={page} onPress={() => dispatch({ type: 'endTurn' })} />
            </View>
          )
        }
        handlers={{
          ...chrome.handlers,
          onPause: () => {
            setUserPaused(true);
            dispatch({ type: 'pause' });
          },
          swipe,
        }}
      />
      {state.paused && userPaused ? (
        <PausedOverlay
          colors={page}
          insets={chrome.insets}
          clock={model.clock?.label ?? null}
          status={versusTitle(state)}
          onResume={() => {
            setUserPaused(false);
            dispatch({ type: 'resume' });
          }}
          onSettings={chrome.changeSettings}
          onNewGame={chrome.restart}
        />
      ) : null}
    </View>
  );
}

// Individual with 3 or more players: "← Skip" at the left, and at the right a button for each
// guesser under "Correct? Tap who got it".
function GuesserControls({ state, colors, onSkip, onGot }: { state: VersusRoundState; colors: RegionColors; onSkip: () => void; onGot: (id: string) => void }) {
  const canCorrect = canVersusAnswer(state, 'correct');
  return (
    <View style={styles.guessRow}>
      <Press onPress={onSkip} disabled={!canVersusAnswer(state, 'skip')} accessibilityLabel={en.play.skip} style={styles.skip}>
        <Txt variant="link" color={colors.muted}>
          {en.play.skipLink}
        </Txt>
        <View style={[styles.bar, { backgroundColor: colors.track }]} />
      </Press>
      <View style={styles.who}>
        <Txt variant="overline" color={colors.muted} style={styles.end}>
          {en.versus.turn.tapWho}
        </Txt>
        <View style={styles.whoButtons}>
          {guesserButtons(state).map((g) => (
            <Press
              key={g.id}
              onPress={() => onGot(g.id)}
              disabled={!canCorrect}
              accessibilityLabel={g.label}
              style={[styles.whoButton, { backgroundColor: colors.accent }]}
            >
              <Txt variant="label" color={colors.onAccent} numberOfLines={1}>
                {g.name}
              </Txt>
            </Press>
          ))}
        </View>
      </View>
    </View>
  );
}

// --- Turn recap ----------------------------------------------------------------------------------

function Recap({ state, dispatch, chrome }: { state: VersusRoundState; dispatch: Dispatch<RoundAction>; chrome: Chrome }) {
  const { page, theme } = chrome;
  const raised = theme.regions.raised;
  const v = recapView(state);
  const place = headerPlacement(chrome);
  if (!v) return null;
  const dot: Record<CardOutcome, string> = { correct: raised.accent, notGuessed: raised.track, banned: raised.ink };
  return (
    <MRFrame
      chrome={chrome}
      header={
        <View style={[styles.recapHead, { marginHorizontal: place.inset }]}>
          <View style={styles.shrink}>
            <Txt variant="overline" color={page.muted} numberOfLines={1}>
              {v.kicker}
            </Txt>
            <Txt variant="modeName" size={place.size} color={page.ink} accessibilityRole="header">
              {v.title}
            </Txt>
          </View>
          <MenuDots colors={page} onPress={chrome.handlers.onMenu ?? (() => undefined)} />
        </View>
      }
      footer={<Button kind="primary" label={v.button} colors={page} onPress={() => dispatch({ type: 'next' })} />}
    >
      <Card style={styles.summary}>
        <View style={styles.grow}>
          <Txt variant="optionTitle" color={raised.ink}>
            {v.scored}
          </Txt>
          <View style={styles.counts}>
            {v.counts.map((c) => (
              <View key={c.outcome} style={styles.count}>
                <View style={[styles.dot, { backgroundColor: dot[c.outcome] }]} />
                <Txt variant="small" color={raised.muted}>
                  {c.label}
                </Txt>
              </View>
            ))}
          </View>
        </View>
        <Txt variant="score" size={layout.versus.totalSize} color={raised.accentText} style={styles.tabular}>
          {v.total}
        </Txt>
      </Card>
      <View style={styles.hint}>
        <Icon name="restart" size={layout.icon.sm} color={page.muted} />
        <Txt variant="small" color={page.muted}>
          {v.hint}
        </Txt>
      </View>
      <Card style={styles.list}>
        {v.rows.map((row, i) => (
          <RecapRowView key={row.index} row={row} first={i === 0} theme={theme} onPress={() => dispatch({ type: 'cycleCard', index: row.index })} />
        ))}
      </Card>
    </MRFrame>
  );
}

// A word with its outcome pill and points: Correct in teal, Not guessed in grey, Banned word as an
// ink outline with the word struck through.
function RecapRowView({ row, first, theme, onPress }: { row: RecapRow; first: boolean; theme: Theme; onPress: () => void }) {
  const raised = theme.regions.raised;
  const banned = row.outcome === 'banned';
  const pill =
    row.outcome === 'correct'
      ? { bg: raised.accent, ink: raised.onAccent, border: raised.accent }
      : row.outcome === 'notGuessed'
        ? { bg: raised.chip, ink: raised.muted, border: raised.chip }
        : { bg: raised.bg, ink: raised.ink, border: raised.ink };
  const points = row.outcome === 'correct' ? raised.accentText : row.outcome === 'banned' ? raised.ink : raised.muted;
  return (
    <Press onPress={onPress} accessibilityLabel={row.a11y} style={[styles.recapRow, !first && { borderTopWidth: layout.stroke.hairline, borderTopColor: raised.rule }]}>
      <View style={[styles.grow, styles.wordCell]}>
        <Txt variant="label" color={raised.ink} numberOfLines={1} style={[styles.shrink, banned && styles.struck]}>
          {row.word}
        </Txt>
        {row.who ? (
          <Txt variant="small" color={raised.muted} numberOfLines={1}>
            {row.who}
          </Txt>
        ) : null}
      </View>
      <View style={[styles.pill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
        {row.outcome === 'correct' ? <Icon name="check" size={layout.icon.sm} color={pill.ink} /> : null}
        <Txt variant="small" color={pill.ink}>
          {row.label}
        </Txt>
      </View>
      <Txt variant="label" color={points} style={[styles.points, styles.tabular]}>
        {row.points}
      </Txt>
    </Press>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  centerHead: { alignItems: 'center', gap: space[1] },
  centerText: { textAlign: 'center' },
  link: { alignItems: 'center' },
  list: { paddingVertical: space[0.5] },
  passRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3], minHeight: layout.mindReader.logRow },
  passValue: { flexShrink: 1, textAlign: 'right' },
  // Centred: the kicker, the next line with its dot, and who to hand the phone to.
  nextBox: { borderRadius: radius.xl, padding: space[4], gap: space[1.5], alignItems: 'center' },
  centerRow: { justifyContent: 'center' },
  nextLine: { flexShrink: 1, textAlign: 'center' },
  endTurn: { gap: space[1], alignItems: 'center' },
  guessRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space[4], minHeight: layout.minTouch },
  skip: { gap: space[1.5], minWidth: '25%' },
  bar: { height: layout.control.swipeBar, borderRadius: radius.pill },
  who: { flex: 1, alignItems: 'flex-end', gap: space[1.5] },
  end: { textAlign: 'right' },
  whoButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: space[1.5] },
  whoButton: { minHeight: layout.versus.guesserButton, borderRadius: radius.md, paddingHorizontal: space[3], justifyContent: 'center', maxWidth: '100%' },
  recapHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3], paddingBottom: space[1] },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  counts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space[3], rowGap: space[1], marginTop: space[1] },
  count: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
  dot: { width: layout.versus.countDot, height: layout.versus.countDot, borderRadius: radius.pill },
  tabular: { fontVariant: ['tabular-nums'] },
  hint: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: space[2.5], minHeight: layout.versus.recapRow },
  wordCell: { flexDirection: 'row', alignItems: 'baseline', gap: space[2] },
  struck: { textDecorationLine: 'line-through' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    minHeight: layout.versus.statusPill,
    borderRadius: radius.pill,
    borderWidth: layout.stroke.outline,
    paddingHorizontal: space[2.5],
  },
  points: { minWidth: space[6], textAlign: 'right' },
});
