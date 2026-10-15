import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { DifficultyPicker } from '../components/DifficultyPicker';
import { GameHeader } from '../components/GameHeader';
import { GameMenu } from '../components/GameMenu';
import { fitWordSize } from '../fitWord';
import { cardsFor, dealDeck, difficultyOf, themeLabel } from '../game';
import { font, type Theme } from '../theme';
import type { Card, Difficulty, GameSettings } from '../types';

type Props = {
  settings: GameSettings;
  theme: Theme;
  onRestart: () => void;
  onChangeSettings: () => void;
  onChangeDifficulty: (difficulty: Difficulty) => void;
  onChangeTheme: (index: number) => void;
};

// rules → predict (Mind Reader) → handOff → clues (Clue Giver) → reveal → next word's predict
type Phase = 'rules' | 'predict' | 'handOff' | 'clues' | 'reveal';

const PREDICTIONS = 5;

const RULES: [string, string][] = [
  ['Guesser, look away', 'Only the Mind Reader and Clue Giver see the word.'],
  ['Mind Reader, predict', 'Write 5 words the Clue Giver might say.'],
  ['Hand over the phone', 'The Clue Giver sees only the word.'],
  ['Clue Giver, give clues', 'Help the Guesser get the word.'],
  ['Mind Reader, count', 'Keep track of how many of your words get said.'],
];

// The rules show once per app session.
let seenRules = false;

// Mind Reader: one player predicts the clues, another gives them, a third guesses. No timer.
export function MindReaderScreen({ settings, theme: t, onRestart, onChangeSettings, onChangeDifficulty, onChangeTheme }: Props) {
  const difficulty = difficultyOf(settings.difficulty);
  const pool = useMemo(() => cardsFor(settings.difficulty, settings.categories), [settings.difficulty, settings.categories]);

  const [deck, setDeck] = useState<Card[]>(() => dealDeck(pool));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>(seenRules ? 'predict' : 'rules');
  const [words, setWords] = useState<string[]>(() => Array(PREDICTIONS).fill(''));
  const [guessed, setGuessed] = useState(false);
  const [round, setRound] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickingLevel, setPickingLevel] = useState(false);
  const [cardWidth, setCardWidth] = useState(342);
  const inputs = useRef<(TextInput | null)[]>([]);

  const card = deck[idx];
  const filled = words.filter((w) => w.trim()).length;
  const themeName = themeLabel(settings.categories);
  const wordStyle = card ? wordSize(card.word, cardWidth - 48) : undefined;

  const nextWord = () => {
    if (idx + 1 >= deck.length) {
      setDeck(dealDeck(pool));
      setIdx(0);
    } else {
      setIdx(idx + 1);
    }
    setWords(Array(PREDICTIONS).fill(''));
    setRound((r) => r + 1);
    setPhase('predict');
  };

  const finishClues = (got: boolean) => {
    setGuessed(got);
    setPhase('reveal');
  };

  const subline = `Round ${round} · No timer`;

  return (
    <KeyboardAvoidingView style={[styles.wrap, { backgroundColor: t.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GameHeader
        theme={t}
        title="Mind Reader"
        badge={difficulty.badge}
        subline={subline}
        onBadge={() => setPickingLevel(true)}
        onMenu={() => setMenuOpen(true)}
      />

      <View style={styles.middle}>
        {phase === 'rules' ? (
          <View style={[styles.card, { backgroundColor: t.tile }]}>
            <Text style={[styles.kicker, font(500), { color: t.ink }]}>How it works</Text>
            <Text style={[styles.title, font(800), { color: t.ink }]}>Predict the clues</Text>
            <ScrollView>
              {RULES.map(([title, body], i) => (
                <View key={title} style={[styles.step, i > 0 && { borderTopWidth: 1, borderTopColor: t.outline }]}>
                  <View style={[styles.stepNum, { backgroundColor: t.accent }]}>
                    <Text style={[styles.stepNumText, font(800), { color: t.onAccent }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.stepText}>
                    <Text style={[styles.stepTitle, font(700), { color: t.ink }]}>{title}</Text>
                    <Text style={[styles.stepBody, font(500), { color: t.muted }]}>{body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {phase === 'predict' && card ? (
          <View style={[styles.card, { backgroundColor: t.tile }]} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.kicker, font(500), { color: t.ink }]}>Mind Reader · the word is</Text>
              <Text style={[styles.word, font(800), { color: t.ink }, wordStyle]} numberOfLines={3}>
                {card.word}
              </Text>
              <Text style={[styles.section, font(700), { color: t.ink }]}>YOUR 5 PREDICTIONS</Text>
              <Text style={[styles.hint, font(500), { color: t.muted }]}>Words you think the Clue Giver will say</Text>
              <View style={styles.inputs}>
                {words.map((w, i) => (
                  <TextInput
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    value={w}
                    onChangeText={(v) => setWords((cur) => cur.map((x, j) => (j === i ? v : x)))}
                    placeholder={`Word ${i + 1}`}
                    placeholderTextColor={t.muted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType={i < PREDICTIONS - 1 ? 'next' : 'done'}
                    onSubmitEditing={() => inputs.current[i + 1]?.focus()}
                    submitBehavior={i < PREDICTIONS - 1 ? 'submit' : 'blurAndSubmit'}
                    style={[styles.input, font(500), { color: t.ink, borderColor: w.trim() ? t.accent : 'transparent' }]}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        {phase === 'handOff' ? (
          <View style={styles.center}>
            <Text style={[styles.label, font(700), { color: t.muted }]}>PASS THE PHONE</Text>
            <Text style={[styles.bigTitle, font(800), { color: t.ink }]}>{'Clue Giver,\nready?'}</Text>
            <Text style={[styles.centerSub, font(500), { color: t.muted }]}>Mind Reader, remember your 5 words.</Text>
          </View>
        ) : null}

        {phase === 'clues' && card ? (
          <View style={[styles.card, { backgroundColor: t.tile }]} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
            <Text style={[styles.kicker, font(500), { color: t.ink }]}>Clue Giver · your word</Text>
            <Text style={[styles.word, font(800), { color: t.ink }, wordStyle]} numberOfLines={3}>
              {card.word}
            </Text>
            <View style={styles.bottom}>
              <Text style={[styles.hint, font(500), { color: t.muted }]}>
                Give clues until the Guesser gets it. Somewhere, the Mind Reader is counting.
              </Text>
            </View>
          </View>
        ) : null}

        {phase === 'reveal' && card ? (
          <View style={[styles.card, { backgroundColor: t.tile }]}>
            <Text style={[styles.kicker, font(500), { color: t.ink }]}>{guessed ? 'Guessed it' : 'Passed'}</Text>
            <Text style={[styles.word, font(800), { color: t.ink }, wordStyle]} numberOfLines={3}>
              {card.word}
            </Text>
            <View style={styles.bottom}>
              <Text style={[styles.section, font(700), { color: t.ink }]}>THE MIND READER PREDICTED</Text>
              <View style={styles.chips}>
                {words
                  .map((w) => w.trim())
                  .filter(Boolean)
                  .map((w, i) => (
                    <View key={`${w}-${i}`} style={styles.chip}>
                      <Text style={[styles.chipText, font(500), { color: t.ink }]}>{w}</Text>
                    </View>
                  ))}
              </View>
              <Text style={[styles.hint, styles.revealHint, font(500), { color: t.muted }]}>
                Mind Reader: how many did the Clue Giver say?
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {phase === 'rules' ? (
        <Button
          t={t}
          primary
          label="Start"
          onPress={() => {
            seenRules = true;
            setPhase('predict');
          }}
        />
      ) : null}
      {phase === 'predict' ? (
        <Button
          t={t}
          primary
          disabled={filled < PREDICTIONS}
          label={filled < PREDICTIONS ? `Write ${PREDICTIONS - filled} more` : 'Hand to the Clue Giver'}
          onPress={() => setPhase('handOff')}
        />
      ) : null}
      {phase === 'handOff' ? <Button t={t} primary label="I'm the Clue Giver" onPress={() => setPhase('clues')} /> : null}
      {phase === 'clues' ? (
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Button t={t} label="Pass" onPress={() => finishClues(false)} />
          </View>
          <View style={styles.rowItem}>
            <Button t={t} primary label="Got it" onPress={() => finishClues(true)} />
          </View>
        </View>
      ) : null}
      {phase === 'reveal' ? <Button t={t} primary label="Next word" onPress={nextWord} /> : null}

      <DifficultyPicker
        visible={pickingLevel}
        theme={t}
        current={settings.difficulty}
        categories={settings.categories}
        onClose={() => setPickingLevel(false)}
        onPick={(d) => {
          setPickingLevel(false);
          onChangeDifficulty(d);
        }}
      />

      <GameMenu
        visible={menuOpen}
        theme={t}
        status={`Round ${round} · ${themeName}`}
        modeId={settings.mode}
        onResume={() => setMenuOpen(false)}
        onRestart={() => {
          setMenuOpen(false);
          onRestart();
        }}
        onChangeSettings={() => {
          setMenuOpen(false);
          onChangeSettings();
        }}
        onChangeTheme={onChangeTheme}
      />
    </KeyboardAvoidingView>
  );
}

function wordSize(word: string, width: number) {
  const size = fitWordSize(word, width, 44);
  return { fontSize: size, lineHeight: Math.round(size * 1.08), letterSpacing: -size * 0.02 };
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  middle: { flex: 1, justifyContent: 'center', paddingVertical: 16 },
  card: { flex: 1, maxHeight: 560, borderRadius: 26, paddingVertical: 28, paddingHorizontal: 24 },
  kicker: { fontSize: 13, opacity: 0.75 },
  title: { fontSize: 30, lineHeight: 34, letterSpacing: -0.8, marginTop: 2, marginBottom: 8 },
  step: { flexDirection: 'row', gap: 14, paddingVertical: 11 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 13 },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 16 },
  stepBody: { fontSize: 14, marginTop: 2 },
  word: { marginTop: 2 },
  section: { marginTop: 22, fontSize: 11, letterSpacing: 0.9 },
  hint: { fontSize: 14, marginTop: 4 },
  revealHint: { marginTop: 16 },
  inputs: { marginTop: 12, gap: 8 },
  input: { height: 48, borderRadius: 12, borderWidth: 2, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 17 },
  bottom: { marginTop: 'auto' },
  chips: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 15 },
  chipText: { fontSize: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  label: { fontSize: 13, letterSpacing: 1 },
  bigTitle: { fontSize: 40, lineHeight: 44, textAlign: 'center', letterSpacing: -0.8 },
  centerSub: { fontSize: 15, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
});
