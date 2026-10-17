import {
  cluesView,
  detailsSheet,
  en,
  fixLabels,
  overView,
  practiceStep,
  predictionChips,
  predictView,
  quickOverView,
  resultsView,
  roleCards,
  rolesView,
  scoresView,
  scoringRows,
  showView,
  spokenRows,
  turnTitle,
  type ScoreRow,
} from '@unspoken/content';
import { correctPredictions, format, lastTurn, mindReaderCard, mindReaderClockProgress, type MindReaderRoundState, type RoundAction } from '@unspoken/core';
import { layout, nativeTextStyle, radius, space } from '@unspoken/design-tokens';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type Dispatch } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Card, mrStyles, Note, TeamDot } from '../mindReader/ui';
import { usePrefs } from '../state/prefs';
import { Button, LinkButton } from '../ui/Button';
import { Press } from '../ui/Press';
import { Txt } from '../ui/Txt';
import type { Chrome } from './Game';
import { BigWord, CoachCard, DetailsSheet, FixSheet, LabelRow, MRFrame, PracticeHeader, SpokenList, TurnHeader, WordCard } from './mindReaderParts';

type Props = { state: MindReaderRoundState; dispatch: Dispatch<RoundAction>; chrome: Chrome; onSheet: (open: boolean) => void };

// Mind Reader: roles, predict, show the Clue Giver, clues, then the turn's result, the scores and
// the winner (Custom); word after word in Quick play; one guided turn in Practice.
export function MindReaderRound({ state, dispatch, chrome, onSheet }: Props) {
  const prefs = usePrefs();
  const [sheet, setSheet] = useState<'details' | 'fix' | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);
  const { page, theme } = chrome;
  const raised = theme.regions.raised;
  const word = mindReaderCard(state)?.word ?? '';
  const custom = state.match !== null;
  const practice = state.play === 'practice';
  const step = practiceStep(state);

  useEffect(() => onSheet(sheet !== null), [sheet, onSheet]);
  const open = (kind: 'details' | 'fix') => setSheet(kind);
  const close = () => setSheet(null);
  const toStart = () => router.push('/mind-reader');
  const startHere = (play: 'quick' | 'practice') => prefs.startGame({ ...prefs.settings, mode: 'mindReader' }, play);

  const details = detailsSheet(state);
  // Custom turns: the round and Details, with the role cards where the board shows them.
  const turnHeader = (withCards: boolean) =>
    practice ? (
      <PracticeHeader chrome={chrome} overline={step.overline} title={en.mindReader.practice.title} onSkip={toStart} />
    ) : (
      <TurnHeader chrome={chrome} title={turnTitle(state)} cards={custom && withCards ? roleCards(state) : undefined} onDetails={custom ? () => open('details') : undefined} />
    );
  const coach = step.coach ? <CoachCard coach={step.coach} onDismiss={() => dispatch({ type: 'dismissCoach' })} /> : null;

  let screen;
  switch (state.phase) {
    case 'roles': {
      const v = rolesView(state);
      screen = (
        <MRFrame chrome={chrome} center footer={<Button kind="primary" label={v.button} colors={page} onPress={() => dispatch({ type: 'showWord' })} />}>
          <View style={styles.centerHead}>
            <Txt variant="overline" color={page.muted}>
              {v.kicker}
            </Txt>
            <Txt variant="title" color={page.ink} accessibilityRole="header" style={styles.centerText}>
              {v.title}
            </Txt>
          </View>
          {v.cards.map((card) => (
            <Card key={card.label} style={styles.roleCard}>
              <Txt variant="overline" color={raised.muted}>
                {card.label}
              </Txt>
              <View style={mrStyles.row}>
                {card.color !== null ? <TeamDot color={card.color} /> : null}
                <Txt variant="sheetTitle" size={layout.mindReader.titleSize - space[1]} color={raised.ink} style={mrStyles.grow}>
                  {card.title}
                </Txt>
              </View>
              <Txt variant="small" color={raised.muted}>
                {card.detail}
              </Txt>
            </Card>
          ))}
          <Note text={v.note} colors={page} icon="eyeOff" />
        </MRFrame>
      );
      break;
    }
    case 'predict': {
      const v = predictView(state);
      // Quick play's Predict has no round heading: a quiet label beside the menu.
      const header = practice || custom ? turnHeader(true) : <TurnHeader chrome={chrome} title={null} label={en.mindReader.predict.quickLabel} />;
      screen = (
        <MRFrame
          chrome={chrome}
          header={header}
          footer={
            <>
              {coach}
              <Button kind="primary" label={v.button} colors={page} disabled={!v.ready} onPress={() => dispatch({ type: 'handOff' })} />
            </>
          }
        >
          {/* The word block on a very light accent band (not a white card), text on its left edge. */}
          <View style={[styles.band, { backgroundColor: page.tint }]}>
            <Txt variant="subline" color={page.muted}>
              {v.kicker}
            </Txt>
            <BigWord word={word} colors={page} />
          </View>
          <View style={styles.section}>
            <LabelRow label={v.label} aside={v.hint ?? undefined} colors={page} />
            {state.predictions.map((value, i) => {
              const last = i === state.predictions.length - 1;
              const placeholder = format(en.mindReader.predict.placeholder, { n: i + 1 });
              return (
                <TextInput
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  value={value}
                  onChangeText={(text) => dispatch({ type: 'predict', index: i, text })}
                  placeholder={placeholder}
                  placeholderTextColor={raised.muted}
                  accessibilityLabel={placeholder}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType={last ? 'done' : 'next'}
                  submitBehavior={last ? 'blurAndSubmit' : 'submit'}
                  onSubmitEditing={() => inputs.current[i + 1]?.focus()}
                  style={[styles.input, nativeTextStyle('input'), { color: raised.ink, backgroundColor: raised.bg, borderColor: value.trim() ? page.accent : raised.bg }]}
                />
              );
            })}
            {v.note ? <Note text={v.note} colors={page} icon="eyeOff" /> : null}
          </View>
        </MRFrame>
      );
      break;
    }
    case 'show': {
      const v = showView(state);
      screen = (
        <MRFrame
          chrome={chrome}
          center
          header={practice || custom ? turnHeader(true) : <TurnHeader chrome={chrome} title={turnTitle(state)} />}
          footer={
            <>
              {coach}
              <Button kind="primary" label={v.button} colors={page} onPress={() => dispatch({ type: 'startClues' })} />
            </>
          }
        >
          <View style={styles.centerHead}>
            {v.kicker ? (
              <Txt variant="overline" color={page.muted}>
                {v.kicker}
              </Txt>
            ) : null}
            <Txt variant="sheetTitle" color={page.ink} style={styles.centerText}>
              {v.title}
            </Txt>
          </View>
          <WordCard word={word} />
          <Note text={v.guessers} colors={page} icon="eyeOff" />
          <Txt variant="hint" color={page.muted} style={styles.centerText}>
            {`${v.keep}\n${v.gives}`}
          </Txt>
        </MRFrame>
      );
      break;
    }
    case 'clues': {
      const v = cluesView(state);
      const progress = mindReaderClockProgress(state);
      screen = (
        <MRFrame
          chrome={chrome}
          header={practice ? turnHeader(false) : <TurnHeader chrome={chrome} title={turnTitle(state)} onDetails={custom ? () => open('details') : undefined} />}
          footer={
            <>
              {coach}
              {v.notGuessed ? (
                <View style={styles.pair}>
                  <Button label={v.notGuessed} colors={page} onPress={() => dispatch({ type: 'finishClues', guessed: false })} style={styles.pairSecondary} />
                  <Button kind="primary" label={v.guessed} colors={page} onPress={() => dispatch({ type: 'finishClues', guessed: true })} style={styles.grow} />
                </View>
              ) : (
                <Button kind="primary" label={v.guessed} colors={page} onPress={() => dispatch({ type: 'finishClues', guessed: true })} />
              )}
            </>
          }
        >
          <Card style={styles.cluesCard}>
            <Txt variant="subline" color={raised.muted}>
              {en.mindReader.clues.theWord}
            </Txt>
            <BigWord word={word} colors={raised} max={layout.mindReader.cardWordSize} />
            <View style={mrStyles.wrap}>
              {predictionChips(state).map((p) => (
                <Press key={p.index} onPress={() => dispatch({ type: 'spoke', prediction: p.index })} accessibilityLabel={format(en.a11y.spoke, { word: p.word })} style={[styles.predChip, { backgroundColor: raised.chip }]}>
                  <Txt variant="label" color={raised.chipInk}>
                    {p.word}
                  </Txt>
                  <View style={[styles.plus, { backgroundColor: raised.bg }]}>
                    <Txt variant="label" color={raised.accentText}>
                      +
                    </Txt>
                  </View>
                </Press>
              ))}
            </View>
            <Txt variant="small" color={raised.muted}>
              {en.mindReader.clues.tapHint}
            </Txt>
          </Card>
          {v.guessNow ? (
            <View style={[styles.clock, { backgroundColor: page.chip }]}>
              <Txt variant="score" size={layout.mindReader.clockSize} color={page.ink} style={styles.tabular}>
                {v.clock}
              </Txt>
              <View style={styles.grow}>
                <View style={[styles.track, { backgroundColor: page.track }]}>
                  <View style={[styles.progress, { backgroundColor: page.accent, width: `${Math.round(progress * 100)}%` }]} />
                </View>
                <Txt variant="small" color={page.muted}>
                  {v.guessNow}
                </Txt>
              </View>
            </View>
          ) : null}
          <View style={styles.section}>
            <LabelRow label={en.mindReader.clues.spoken} aside={v.correct} colors={page} />
            <SpokenList rows={v.spoken} onRemove={(i) => dispatch({ type: 'unspoke', entry: state.spoken.length - 1 - i })} />
            {v.countUp ? (
              <Txt variant="small" color={page.muted}>
                {v.countUp}
              </Txt>
            ) : null}
          </View>
        </MRFrame>
      );
      break;
    }
    case 'over': {
      if (!custom) {
        const v = quickOverView(state);
        screen = (
          <MRFrame
            chrome={chrome}
            center
            header={<TurnHeader chrome={chrome} title={turnTitle(state)} />}
            footer={
              <>
                <Button kind="primary" label={en.mindReader.quickOver.next} colors={page} onPress={() => dispatch({ type: 'next' })} />
                <View style={styles.link}>
                  <LinkButton label={en.mindReader.quickOver.end} colors={page} onPress={toStart} />
                </View>
              </>
            }
          >
            <View style={styles.centerHead}>
              <Txt variant="overline" color={page.muted}>
                {v.kicker}
              </Txt>
              <BigWord word={word} colors={page} center />
            </View>
            <Card style={styles.quickResult}>
              <Txt variant="optionTitle" color={raised.ink}>
                {v.correct}
              </Txt>
              {v.said ? (
                <Txt variant="small" color={raised.muted}>
                  {v.said}
                </Txt>
              ) : null}
            </Card>
            <Txt variant="hint" color={page.muted} style={styles.centerText}>
              {en.mindReader.quickOver.pass}
            </Txt>
          </MRFrame>
        );
        break;
      }
      const v = overView(state);
      const turn = lastTurn(state);
      const labels = fixLabels(state);
      screen = (
        <MRFrame
          chrome={chrome}
          header={<TurnHeader chrome={chrome} title={turnTitle(state)} />}
          footer={
            <>
              <Button label={en.mindReader.over.fix} colors={page} onPress={() => open('fix')} />
              <Button kind="primary" label={v?.button ?? ''} colors={page} onPress={() => dispatch({ type: 'next' })} />
            </>
          }
        >
          <View style={styles.kicker}>
            <Txt variant="overline" color={page.muted}>
              {v?.kicker}
            </Txt>
            <Txt variant="title" color={page.ink}>
              {v?.word}
            </Txt>
          </View>
          {v?.sides.map((side) => (
            <Card key={side.name} style={styles.sideCard}>
              <View style={mrStyles.row}>
                {side.color !== null ? <TeamDot color={side.color} /> : null}
                <Txt variant="optionTitle" color={raised.ink} style={mrStyles.grow}>
                  {side.name}
                </Txt>
                <Txt variant="sheetTitle" size={layout.mindReader.titleSize} color={raised.accentText}>
                  {side.total}
                </Txt>
              </View>
              {side.rows.map((row) => (
                <View key={row.title} style={[mrStyles.row, styles.pointsRow, { borderTopColor: raised.rule }]}>
                  <View style={mrStyles.grow}>
                    <Txt variant="label" color={raised.ink}>
                      {row.title}
                    </Txt>
                    <Txt variant="small" color={raised.muted}>
                      {row.detail}
                    </Txt>
                  </View>
                  <Txt variant="optionTitle" color={raised.ink}>
                    {row.points}
                  </Txt>
                </View>
              ))}
            </Card>
          ))}
          {turn && labels ? (
            <FixSheet
              visible={sheet === 'fix'}
              onClose={close}
              got={labels.got}
              guessed={turn.result.guessed}
              spoken={turn.result.spoken}
              predictions={correctPredictions(turn.result)}
              rows={(entries) => spokenRows(state, entries)}
              onSave={(fix) => dispatch({ type: 'fixTurn', ...fix })}
            />
          ) : null}
        </MRFrame>
      );
      break;
    }
    case 'scores': {
      const v = scoresView(state);
      screen = (
        <MRFrame
          chrome={chrome}
          footer={
            <>
              {v ? (
                <View style={[styles.nextBox, { backgroundColor: page.chip }]}>
                  <Txt variant="overline" color={page.muted}>
                    {en.mindReader.scores.next}
                  </Txt>
                  <View style={mrStyles.row}>
                    {v.nextColor !== null ? <TeamDot color={v.nextColor} size={space[2]} /> : null}
                    <Txt variant="label" color={page.ink} style={mrStyles.grow}>
                      {v.next}
                    </Txt>
                  </View>
                  <View style={mrStyles.row}>
                    {v.clueColor !== null ? <TeamDot color={v.clueColor} size={space[2]} /> : null}
                    <Txt variant="label" color={page.ink} style={mrStyles.grow}>
                      {v.nextClues}
                    </Txt>
                  </View>
                  <Txt variant="small" color={page.muted}>
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
              {en.mindReader.scores.title}
            </Txt>
          </View>
          <Standings rows={v?.rows ?? []} chrome={chrome} />
        </MRFrame>
      );
      break;
    }
    case 'results': {
      const v = resultsView(state);
      screen = (
        <MRFrame
          chrome={chrome}
          footer={
            <>
              <Button kind="primary" label={en.mindReader.results.playAgain} colors={page} onPress={chrome.restart} />
              <View style={styles.link}>
                <LinkButton label={en.mindReader.results.newGame} colors={page} onPress={toStart} />
              </View>
            </>
          }
        >
          <View style={styles.centerHead}>
            <Txt variant="overline" color={page.muted}>
              {v?.kicker}
            </Txt>
            <Txt variant="headline" color={page.ink} accessibilityRole="header" style={styles.centerText}>
              {v?.title}
            </Txt>
            <Txt variant="hint" color={page.muted}>
              {v?.sub}
            </Txt>
          </View>
          <Standings rows={v?.rows ?? []} chrome={chrome} />
        </MRFrame>
      );
      break;
    }
    case 'scoring': {
      const v = scoringRows(state);
      const sc = en.mindReader.practice;
      screen = (
        <MRFrame
          chrome={chrome}
          header={<PracticeHeader chrome={chrome} overline={step.overline} title={sc.scoring.title} onSkip={toStart} />}
          footer={
            <>
              <View style={styles.pair}>
                <Button kind="primary" label={sc.quick} colors={page} onPress={() => startHere('quick')} style={styles.grow} />
                <Button label={sc.custom} colors={page} onPress={() => router.push('/mind-reader/players')} style={styles.grow} />
              </View>
              <View style={styles.link}>
                <LinkButton label={sc.again} colors={page} onPress={() => startHere('practice')} />
              </View>
            </>
          }
        >
          <Txt variant="hint" color={page.muted}>
            {sc.scoring.lead}
          </Txt>
          <Card style={styles.list}>
            {v.rows.map((row, i) => (
              <View key={row.title} style={[mrStyles.row, styles.scoreRule, i > 0 && { borderTopWidth: layout.stroke.hairline, borderTopColor: raised.rule }]}>
                <View style={mrStyles.grow}>
                  <Txt variant="optionTitle" color={raised.ink}>
                    {row.title}
                  </Txt>
                  <Txt variant="small" color={raised.muted}>
                    {row.detail}
                  </Txt>
                </View>
                <Txt variant="sheetTitle" size={layout.mindReader.titleSize} color={raised.accentText}>
                  {row.points}
                </Txt>
              </View>
            ))}
          </Card>
          <View style={[styles.nextBox, { backgroundColor: page.chip }]}>
            <Txt variant="optionTitle" color={page.ink}>
              {sc.scoring.example.title}
            </Txt>
            <Txt variant="small" color={page.muted}>
              {v.example}
            </Txt>
          </View>
        </MRFrame>
      );
      break;
    }
  }

  return (
    <>
      {screen}
      {details ? <DetailsSheet visible={sheet === 'details'} onClose={close} sections={details.sections} footer={details.footer} /> : null}
    </>
  );
}

// Teams (or players) by total, the leader on a white row.
function Standings({ rows, chrome }: { rows: readonly ScoreRow[]; chrome: Chrome }) {
  const { page, theme } = chrome;
  const raised = theme.regions.raised;
  return (
    <View style={styles.section}>
      {rows.map((row, i) => {
        const c = i === 0 ? raised : page;
        return (
          <View key={`${row.name}-${row.rank}`} style={[styles.standing, { backgroundColor: i === 0 ? raised.bg : page.chip }]}>
            <Txt variant="label" color={c.muted}>
              {row.rank}
            </Txt>
            {row.color !== null ? <TeamDot color={row.color} /> : null}
            <Txt variant="optionTitle" color={c.ink} style={mrStyles.grow} numberOfLines={1}>
              {row.name}
            </Txt>
            {row.last ? (
              <Txt variant="small" color={c.muted}>
                {row.last}
              </Txt>
            ) : null}
            <Txt variant="sheetTitle" color={c.ink} style={styles.tabular}>
              {row.total}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  section: { gap: space[2.5] },
  kicker: { gap: space[1] },
  band: { gap: space[1], borderRadius: radius.xl, padding: space[5] },
  centerHead: { alignItems: 'center', gap: space[1] },
  centerText: { textAlign: 'center' },
  roleCard: { gap: space[1] },
  input: { minHeight: layout.control.input.height, borderRadius: radius.md, borderWidth: layout.stroke.outline, paddingHorizontal: space[4] },
  pair: { flexDirection: 'row', gap: space[2.5] },
  pairSecondary: { flexGrow: 0, flexShrink: 0, minWidth: '35%' },
  cluesCard: { gap: space[2], paddingVertical: space[5], paddingHorizontal: space[4.5] },
  predChip: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: layout.mindReader.pillHeight + space[1], borderRadius: radius.pill, paddingLeft: space[3.5], paddingRight: space[1] },
  plus: { width: space[7], height: space[7], borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  clock: { flexDirection: 'row', alignItems: 'center', gap: space[3.5], borderRadius: radius.xl, paddingHorizontal: space[4], paddingVertical: space[3] },
  tabular: { fontVariant: ['tabular-nums'] },
  track: { height: layout.mindReader.clockBar, borderRadius: radius.pill, overflow: 'hidden', marginBottom: space[1.5] },
  progress: { height: '100%', borderRadius: radius.pill },
  link: { alignItems: 'center' },
  quickResult: { alignItems: 'center', gap: space[0.5] },
  sideCard: { gap: space[2.5] },
  pointsRow: { borderTopWidth: layout.stroke.hairline, paddingTop: space[2.5] },
  nextBox: { borderRadius: radius.xl, padding: space[4], gap: space[1.5] },
  standing: { flexDirection: 'row', alignItems: 'center', gap: space[3], borderRadius: radius.xl, paddingHorizontal: space[4], minHeight: layout.button.height + space[2] },
  list: { paddingVertical: space[1] },
  scoreRule: { paddingVertical: space[2.5] },
});
