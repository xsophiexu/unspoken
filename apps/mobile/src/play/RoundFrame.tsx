import { layout, maxWidth, radius, space, type RegionColors } from '@unspoken/design-tokens';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';

import { Txt } from '../ui/Txt';
import type { Chrome } from './Game';
import type { HeaderModel } from './model';
import { PlayHeader } from './PlayView';

// Reverse and Mind Reader: the style's header on top, a card in the middle and the phase's buttons
// at the bottom, in the game column.
export function RoundFrame({ chrome, model, children, footer }: { chrome: Chrome; model: HeaderModel; children: ReactNode; footer: ReactNode }) {
  const { insets, page } = chrome;
  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.page, { backgroundColor: page.bg, paddingTop: insets.top + layout.screen.paddingTop, paddingBottom: insets.bottom + layout.screen.paddingBottom }]}
    >
      <View style={styles.column}>
        <PlayHeader theme={chrome.theme} model={model} clock={null} handlers={chrome.handlers} />
        <View style={styles.middle}>{children}</View>
        <View style={styles.footer}>{footer}</View>
      </View>
    </KeyboardAvoidingView>
  );
}

// The card the round's content sits on, in the style's word tone (or surface).
export function cardColors(chrome: Chrome): RegionColors {
  const { theme } = chrome;
  return theme.regions[theme.style.regions.word ?? 'surface'];
}

export function GameCard({ colors, children, scroll = false }: { colors: RegionColors; children: ReactNode; scroll?: boolean }) {
  const style = [styles.card, { backgroundColor: colors.bg }];
  return scroll ? (
    <ScrollView style={style} contentContainerStyle={styles.cardContent} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[style, styles.cardContent]}>{children}</View>
  );
}

// "How it works": a title and numbered steps, shown once per session before Reverse and Mind Reader.
export function HowToCard({ kicker, title, steps, colors }: { kicker: string; title: string; steps: readonly { title: string; body: string }[]; colors: RegionColors }) {
  return (
    <GameCard colors={colors} scroll>
      <Txt variant="subline" color={colors.muted}>
        {kicker}
      </Txt>
      <Txt variant="introTitle" color={colors.ink} accessibilityRole="header">
        {title}
      </Txt>
      <View>
        {steps.map((step, i) => (
          <View key={step.title} style={[styles.step, i > 0 && { borderTopWidth: layout.stroke.hairline, borderTopColor: colors.rule }]}>
            <View style={[styles.number, { backgroundColor: colors.accent }]}>
              <Txt variant="label" color={colors.onAccent}>
                {i + 1}
              </Txt>
            </View>
            <View style={styles.stepText}>
              <Txt variant="optionTitle" color={colors.ink}>
                {step.title}
              </Txt>
              <Txt variant="hint" color={colors.muted}>
                {step.body}
              </Txt>
            </View>
          </View>
        ))}
      </View>
    </GameCard>
  );
}

// Plain word chips on a card (Reverse clues, Mind Reader predictions).
export function WordChips({ words, colors, dim }: { words: readonly string[]; colors: RegionColors; dim?: (i: number) => boolean }) {
  return (
    <View style={styles.chips}>
      {words.map((w, i) => (
        <View key={`${w}-${i}`} style={[styles.chip, { backgroundColor: dim?.(i) ? colors.rule : colors.chip }]}>
          <Txt variant="chip" color={dim?.(i) ? colors.muted : colors.chipInk}>
            {w}
          </Txt>
        </View>
      ))}
    </View>
  );
}

export const roundStyles = StyleSheet.create({
  // Pushes what follows to the bottom of the card.
  bottom: { marginTop: 'auto', gap: space[3] },
  row: { flexDirection: 'row', gap: space[2.5] },
  grow: { flex: 1 },
  center: { alignItems: 'center', gap: space[2] },
  centerText: { textAlign: 'center' },
});

const styles = StyleSheet.create({
  page: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: maxWidth.column, alignSelf: 'center', paddingHorizontal: layout.screen.paddingX },
  middle: { flex: 1, justifyContent: 'center', paddingVertical: space[4] },
  footer: { gap: space[3] },
  card: { flexGrow: 0, flexShrink: 1, maxHeight: layout.card.maxHeight, borderRadius: radius.cardLarge },
  cardContent: { flexGrow: 1, paddingHorizontal: layout.card.paddingX, paddingVertical: layout.card.paddingY, gap: space[2] },
  step: { flexDirection: 'row', gap: space[3.5], paddingVertical: space[3] },
  number: { width: layout.control.stepNumber, height: layout.control.stepNumber, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, gap: space[0.5] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: layout.chip.gap },
  chip: { borderRadius: radius.sm, paddingHorizontal: layout.chip.paddingX, paddingVertical: layout.chip.paddingY },
});
