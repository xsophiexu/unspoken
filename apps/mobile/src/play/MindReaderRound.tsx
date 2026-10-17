import { en } from '@unspoken/content';
import { filledPredictions, format, mindReaderCard, predictionsNeeded, type MindReaderRoundState, type RoundAction } from '@unspoken/core';
import { layout, nativeTextStyle, radius, space } from '@unspoken/design-tokens';
import { useRef, type Dispatch } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { usePrefs } from '../state/prefs';
import { Button } from '../ui/Button';
import { Txt } from '../ui/Txt';
import type { Chrome } from './Game';
import { headerModel } from './model';
import { cardColors, GameCard, HowToCard, roundStyles, RoundFrame, WordChips } from './RoundFrame';
import { Word } from './slots/Word';

// Mind Reader: predict five clues, hand the phone to the Clue Giver, then count the matches.
export function MindReaderRound({ state, dispatch, chrome }: { state: MindReaderRoundState; dispatch: Dispatch<RoundAction>; chrome: Chrome }) {
  const { markIntroSeen } = usePrefs();
  const inputs = useRef<(TextInput | null)[]>([]);
  const colors = cardColors(chrome);
  const { page, theme } = chrome;
  const m = en.mindReader;
  const card = mindReaderCard(state);
  const wordSlot = { ...theme.style.word, label: false, color: 'ink' } as const;
  const word = card ? <Word slot={wordSlot} colors={colors} word={card.word} /> : null;
  const total = state.config.mindReader.predictions;

  let body = null;
  let footer = null;
  switch (state.phase) {
    case 'intro':
      body = <HowToCard kicker={m.howTo.kicker} title={m.howTo.title} steps={m.howTo.steps} colors={colors} />;
      footer = (
        <Button
          kind="primary"
          label={m.howTo.start}
          colors={page}
          onPress={() => {
            markIntroSeen('mindReader');
            dispatch({ type: 'start' });
          }}
        />
      );
      break;
    case 'predict': {
      const needed = predictionsNeeded(state);
      body = (
        <GameCard colors={colors} scroll>
          <Txt variant="subline" color={colors.muted}>
            {m.predictKicker}
          </Txt>
          {word}
          <View style={styles.label}>
            <Txt variant="overline" color={colors.muted}>
              {format(m.predictionsLabel, { n: total })}
            </Txt>
            <Txt variant="hint" color={colors.muted}>
              {m.predictionsHint}
            </Txt>
          </View>
          {state.predictions.map((value, i) => {
            const last = i === state.predictions.length - 1;
            return (
              <TextInput
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={value}
                onChangeText={(text) => dispatch({ type: 'predict', index: i, text })}
                placeholder={format(m.placeholder, { n: i + 1 })}
                placeholderTextColor={colors.muted}
                accessibilityLabel={format(m.placeholder, { n: i + 1 })}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType={last ? 'done' : 'next'}
                submitBehavior={last ? 'blurAndSubmit' : 'submit'}
                onSubmitEditing={() => inputs.current[i + 1]?.focus()}
                style={[
                  styles.input,
                  nativeTextStyle('input'),
                  { color: colors.chipInk, backgroundColor: colors.chip, borderColor: value.trim() ? colors.accent : colors.chip },
                ]}
              />
            );
          })}
        </GameCard>
      );
      footer = (
        <Button
          kind="primary"
          label={needed > 0 ? format(m.writeMore, { n: needed }) : m.handOff}
          colors={page}
          disabled={needed > 0}
          onPress={() => dispatch({ type: 'handOff' })}
        />
      );
      break;
    }
    case 'handOff':
      body = (
        <View style={roundStyles.center}>
          <Txt variant="overline" color={page.muted}>
            {m.passLabel}
          </Txt>
          <Txt variant="headline" color={page.ink} style={roundStyles.centerText} accessibilityRole="header">
            {m.passTitle}
          </Txt>
          <Txt variant="hint" color={page.muted} style={roundStyles.centerText}>
            {format(m.remember, { n: total })}
          </Txt>
        </View>
      );
      footer = <Button kind="primary" label={m.takeOver} colors={page} onPress={() => dispatch({ type: 'takeOver' })} />;
      break;
    case 'clues':
      body = (
        <GameCard colors={colors} scroll>
          <Txt variant="subline" color={colors.muted}>
            {m.clueKicker}
          </Txt>
          {word}
          <View style={roundStyles.bottom}>
            <Txt variant="hint" color={colors.muted}>
              {m.clueHint}
            </Txt>
          </View>
        </GameCard>
      );
      footer = (
        <View style={roundStyles.row}>
          <Button label={m.pass} colors={page} onPress={() => dispatch({ type: 'finishClues', guessed: false })} style={roundStyles.grow} />
          <Button kind="primary" label={m.gotIt} colors={page} onPress={() => dispatch({ type: 'finishClues', guessed: true })} style={roundStyles.grow} />
        </View>
      );
      break;
    case 'reveal':
      body = (
        <GameCard colors={colors} scroll>
          <Txt variant="subline" color={colors.muted}>
            {state.guessed ? m.guessed : m.passed}
          </Txt>
          {word}
          <View style={roundStyles.bottom}>
            <Txt variant="overline" color={colors.muted}>
              {m.predicted}
            </Txt>
            <WordChips words={filledPredictions(state)} colors={colors} />
            <Txt variant="hint" color={colors.muted}>
              {m.howMany}
            </Txt>
          </View>
        </GameCard>
      );
      footer = <Button kind="primary" label={m.nextWord} colors={page} onPress={() => dispatch({ type: 'nextWord' })} />;
      break;
  }

  return (
    <RoundFrame chrome={chrome} model={headerModel(state)} footer={footer}>
      {body}
    </RoundFrame>
  );
}

const styles = StyleSheet.create({
  label: { gap: space[0.5], marginTop: space[4] },
  input: {
    minHeight: layout.control.input.height,
    borderRadius: radius.md,
    borderWidth: layout.stroke.outline,
    paddingHorizontal: space[4],
  },
});
