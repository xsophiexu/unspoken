import { en } from '@unspoken/content';
import { space, type RegionColors, type WordSlot } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { fittedSize, useWidth } from '../../ui/fit';
import { Txt } from '../../ui/Txt';
import { Target } from '../spotlight';

// The word to describe, at the largest size that fits its box in the style's line limit.
export function Word({ slot, colors, word }: { slot: WordSlot; colors: RegionColors; word: string }) {
  const [width, onLayout] = useWidth();
  const size = fittedSize(word, width, { max: slot.size, min: slot.minSize, maxLines: slot.maxLines });
  return (
    <Target name="word">
      <View onLayout={onLayout} style={styles.block}>
        {slot.label ? (
          <Txt variant="subline" color={colors.muted}>
            {en.play.yourWord}
          </Txt>
        ) : null}
        <Txt variant="word" size={size} color={slot.color === 'accentText' ? colors.accentText : colors.ink} accessibilityRole="header">
          {word}
        </Txt>
      </View>
    </Target>
  );
}

const styles = StyleSheet.create({
  block: { gap: space[0.5] },
});
