import { layout, radius } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { Press, slopFor } from './Press';

type Props = { color: string; label: string; selected: boolean; onPress: () => void; ring: string; gap: string };

// A color dot on Customize. The selected one has a ring (ring color) separated by a gap (page color).
export function Swatch({ color, label, selected, onPress, ring, gap }: Props) {
  const { size, ring: width, gap: space } = layout.swatch;
  const outer = size + 2 * (width + space);
  return (
    <Press
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={slopFor(outer)}
      style={[styles.outer, { width: outer, height: outer, borderWidth: width, borderColor: selected ? ring : 'transparent' }]}
    >
      <View style={{ width: size + 2 * space, height: size + 2 * space, borderRadius: radius.pill, borderWidth: space, borderColor: gap, backgroundColor: color }} />
    </Press>
  );
}

const styles = StyleSheet.create({
  outer: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
