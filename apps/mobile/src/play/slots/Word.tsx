import { en } from '@unspoken/content';
import { layout, space, tightLeading, type RegionColors, type WordSlot } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { fittedSize, useWidth } from '../../ui/fit';
import { Txt } from '../../ui/Txt';
import { Target } from '../spotlight';

// The word to describe, at the largest size that fits its box in the style's line limit. Short
// and narrow screens lower the largest size; narrow screens also set a wrapped word's lines closer.
export function Word({ slot, colors, word, short = false, narrow = false }: { slot: WordSlot; colors: RegionColors; word: string; short?: boolean; narrow?: boolean }) {
  const [width, onLayout] = useWidth();
  const scale = Math.min(short ? layout.shortScreen.wordScale : 1, narrow ? layout.narrowScreen.wordScale : 1);
  const max = Math.max(slot.minSize, Math.round(slot.size * scale));
  const size = fittedSize(word, width, { variant: 'word', max, min: slot.minSize, maxLines: slot.maxLines });
  const { wordLineHeight } = layout.narrowScreen;
  const leading = narrow ? { lineHeight: Math.ceil(size * wordLineHeight), ...tightLeading(wordLineHeight, size) } : undefined;
  return (
    <Target name="word">
      <View onLayout={onLayout} style={styles.block}>
        {slot.label ? (
          <Txt variant="subline" color={colors.muted}>
            {en.play.yourWord}
          </Txt>
        ) : null}
        <Txt variant="word" size={size} color={colors[slot.color]} accessibilityRole="header" style={leading}>
          {word}
        </Txt>
      </View>
    </Target>
  );
}

const styles = StyleSheet.create({
  block: { gap: space[0.5] },
});
