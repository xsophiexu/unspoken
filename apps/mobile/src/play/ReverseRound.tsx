import { en } from '@unspoken/content';
import { blankCellSize, format, plural, reverseCard, wordShape, type ReverseRoundState, type RoundAction } from '@unspoken/core';
import { cardSwipes, layout, radius, space, type RegionColors } from '@unspoken/design-tokens';
import type { Dispatch } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { usePrefs } from '../state/prefs';
import { Button } from '../ui/Button';
import { useWidth } from '../ui/fit';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Txt } from '../ui/Txt';
import type { Chrome } from './Game';
import { headerModel } from './model';
import { cardColors, GameCard, HowToCard, roundStyles, RoundFrame, WordChips } from './RoundFrame';
import { Controls, halvesFor } from './slots/Controls';
import { Word } from './slots/Word';
import { useSwipe } from './useSwipe';

const answerLabels = { skip: en.reverse.missed, correct: en.reverse.got, skipLink: en.reverse.missedLink, correctLink: en.reverse.gotLink };

// Reverse: read the clues, guess the hidden word, reveal it and swipe Got it or Missed.
export function ReverseRound({ state, dispatch, chrome }: { state: ReverseRoundState; dispatch: Dispatch<RoundAction>; chrome: Chrome }) {
  const { markIntroSeen } = usePrefs();
  const view = reverseCard(state);
  const colors = cardColors(chrome);
  const { page, theme } = chrome;
  const r = en.reverse;
  const swipe = useSwipe({
    can: () => true,
    onAnswer: (kind) => dispatch({ type: kind === 'correct' ? 'got' : 'missed' }),
    active: state.phase === 'answer',
    drag: cardSwipes(chrome.theme.style),
  });

  let card = null;
  let footer = null;
  if (state.phase === 'intro') {
    card = <HowToCard kicker={r.howTo.kicker} title={r.howTo.title} steps={r.howTo.steps} colors={colors} />;
    footer = (
      <Button
        kind="primary"
        label={r.howTo.start}
        colors={page}
        onPress={() => {
          markIntroSeen('reverse');
          dispatch({ type: 'start' });
        }}
      />
    );
  } else if (view && state.phase === 'guess') {
    card = (
      <GameCard colors={colors}>
        <View style={styles.spread}>
          <Txt variant="subline" color={colors.muted}>
            {r.hiddenWord}
          </Txt>
          <View style={[styles.pill, { backgroundColor: colors.chip }]}>
            <Txt variant="label" color={colors.accentText}>
              {format(r.worth, { points: plural(view.worth, en.units.points) })}
            </Txt>
          </View>
        </View>
        <HiddenWord word={view.card.word} peek={state.peek} colors={colors} onToggle={() => dispatch({ type: 'togglePeek' })} />
        <View style={roundStyles.bottom}>
          <Txt variant="overline" color={colors.muted}>
            {r.clues}
          </Txt>
          <View style={styles.clues}>
            {view.clues.map((clue, i) =>
              clue.revealed ? (
                <WordChips key={i} words={[clue.text]} colors={colors} />
              ) : (
                <View key={i} style={[styles.hiddenClue, { borderColor: colors.outline }]}>
                  <Txt variant="chip" color={colors.outline}>
                    ?
                  </Txt>
                </View>
              ),
            )}
          </View>
          <Button label={view.canReveal ? r.reveal : r.allShowing} colors={colors} disabled={!view.canReveal} onPress={() => dispatch({ type: 'revealClue' })} />
        </View>
      </GameCard>
    );
    footer = <Button kind="primary" label={r.showWord} colors={page} onPress={() => dispatch({ type: 'showAnswer' })} />;
  } else if (view && state.phase === 'answer') {
    card = (
      <Animated.View style={[styles.moving, swipe.cardStyle]} {...swipe.panHandlers}>
        <GameCard colors={colors}>
          <Txt variant="subline" color={colors.muted}>
            {r.theWordWas}
          </Txt>
          <Word slot={{ ...theme.style.word, label: false, color: 'ink' }} colors={colors} word={view.card.word} />
          <Txt variant="hint" color={colors.muted}>
            {r.question}
          </Txt>
          <View style={roundStyles.bottom}>
            <Txt variant="overline" color={colors.muted}>
              {format(r.cluesUsed, { revealed: view.revealed, total: view.total })}
            </Txt>
            <WordChips words={view.clues.map((c) => c.text)} colors={colors} dim={(i) => !view.clues[i]?.revealed} />
          </View>
        </GameCard>
      </Animated.View>
    );
    footer = (
      <Controls
        slot={theme.style.controls}
        colors={page}
        halves={halvesFor(theme, page)}
        labels={answerLabels}
        canSkip
        canCorrect
        onAnswer={swipe.answer}
        dx={swipe.dx}
      />
    );
  }

  return (
    <RoundFrame chrome={chrome} model={headerModel(state)} footer={footer}>
      {card}
    </RoundFrame>
  );
}

// One blank per letter, grouped by word, beside the show/hide button; or the word itself.
function HiddenWord({ word, peek, colors, onToggle }: { word: string; peek: boolean; colors: RegionColors; onToggle: () => void }) {
  const [width, onLayout] = useWidth();
  const size = blankCellSize(word, { room: width - layout.minTouch - space[2] });
  const shape = wordShape(word);
  const letters = plural(shape.letters, en.units.letters);
  return (
    <View style={styles.hidden}>
      <View style={styles.wordRow} onLayout={onLayout}>
        <View style={roundStyles.grow}>
          {peek ? (
            <Txt variant="title" color={colors.ink}>
              {word}
            </Txt>
          ) : (
            <View style={styles.blankWords} accessibilityLabel={letters}>
              {word
                .trim()
                .split(/\s+/)
                .map((w, wi) => (
                  <View key={wi} style={styles.blankRow}>
                    {[...w].map((ch, i) =>
                      /[\p{L}\p{N}]/u.test(ch) ? (
                        <View key={i} style={{ width: size, height: size + space[2], borderBottomWidth: layout.stroke.heavy, borderBottomColor: colors.accent }} />
                      ) : (
                        <Txt key={i} variant="title" color={colors.accent}>
                          {ch}
                        </Txt>
                      ),
                    )}
                  </View>
                ))}
            </View>
          )}
        </View>
        <Press
          onPress={onToggle}
          accessibilityLabel={peek ? en.reverse.hideWordA11y : en.reverse.showWordA11y}
          style={[styles.eye, { backgroundColor: colors.chip }]}
        >
          <Icon name={peek ? 'eyeOff' : 'eye'} size={layout.icon.lg} color={colors.chipInk} />
        </Press>
      </View>
      <Txt variant="subline" color={colors.muted}>
        {shape.words > 1 ? format(en.reverse.shape, { words: plural(shape.words, en.units.words), letters }) : letters}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  moving: { flexShrink: 1 },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { borderRadius: radius.pill, paddingHorizontal: space[2.5], paddingVertical: space[1] },
  hidden: { gap: space[2], marginTop: space[2] },
  wordRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space[2] },
  blankWords: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space[4.5], rowGap: space[1.5] },
  blankRow: { flexDirection: 'row', gap: space[1.5], alignItems: 'flex-end' },
  eye: { width: layout.minTouch, height: layout.minTouch, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  clues: { flexDirection: 'row', flexWrap: 'wrap', gap: layout.chip.gap },
  hiddenClue: {
    borderWidth: layout.stroke.focus,
    borderStyle: 'dashed',
    borderRadius: radius.sm,
    paddingVertical: layout.chip.paddingY - layout.stroke.focus,
    minWidth: space[16],
    alignItems: 'center',
  },
});
