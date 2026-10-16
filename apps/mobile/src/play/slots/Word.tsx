import { en } from '@unspoken/content';
import { layout, space, type RegionColors, type WordSlot } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { fittedSize, useWidth } from '../../ui/fit';
import { Txt } from '../../ui/Txt';
import { Target } from '../spotlight';

// The word to describe, at the largest size that fits its box in the style's line limit. Short
// screens lower the largest size.
export function Word({ slot, colors, word, short = false }: { slot: WordSlot; colors: RegionColors; word: string; short?: boolean }) {
  const [width, onLayout] = useWidth();
  const max = short ? Math.max(slot.minSize, Math.round(slot.size * layout.shortScreen.wordScale)) : slot.size;
  const size = fittedSize(word, width, { variant: 'word', max, min: slot.minSize, maxLines: slot.maxLines });
  return (
    <Target name="word">
      <View onLayout={onLayout} style={styles.block}>
        {slot.label ? (
          <Txt variant="subline" color={colors.muted}>
            {en.play.yourWord}
          </Txt>
        ) : null}
        <Txt variant="word" size={size} color={colors[slot.color]} accessibilityRole="header">
          {word}
        </Txt>
      </View>
    </Target>
  );
}

const styles = StyleSheet.create({
  block: { gap: space[0.5] },
});
