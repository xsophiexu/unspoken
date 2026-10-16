import { layout, radius, space, textStyles, type RegionColors } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { fittedSize, useWidth } from './fit';
import { Press } from './Press';
import { Txt } from './Txt';

type Props = {
  title: string;
  detail?: string;
  colors: RegionColors;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  // Smallest tile height (mode tiles, level tiles); longer text makes the tile taller.
  height?: number;
  // Center a one-line title (level tiles on the sheet).
  centered?: boolean;
  accessibilityLabel?: string;
};

// A selectable tile: difficulties on Setup and the sheets, modes on Modes. Long names (Grandmaster)
// shrink to stay on one line.
export function Tile({ title, detail, colors, selected, onPress, disabled, height, centered, accessibilityLabel }: Props) {
  const [width, onLayout] = useWidth();
  // Centered titles (narrow level tiles) may run nearly to the edges.
  const padX = centered ? space[1] : space[3.5];
  const size = fittedSize(title, width - 2 * padX, { variant: 'optionTitle', max: textStyles.optionTitle.size, min: textStyles.small.size, maxLines: 1 });
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? (detail ? `${title}, ${detail}` : title)}
      style={[
        styles.tile,
        { backgroundColor: selected ? colors.accent : colors.chip, padding: space[3.5], paddingHorizontal: padX },
        height !== undefined && { minHeight: height },
        centered && styles.centered,
      ]}
    >
      <View onLayout={onLayout} style={styles.fill} />
      <Txt variant="optionTitle" size={size} color={selected ? colors.onAccent : colors.chipInk} numberOfLines={1}>
        {title}
      </Txt>
      {detail ? (
        <Txt variant="small" color={selected ? colors.onAccent : colors.muted}>
          {detail}
        </Txt>
      ) : null}
    </Press>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.xl, gap: space[1.5], minHeight: layout.minTouch },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 0 },
  // Measures the tile's width without affecting its layout.
  fill: { ...StyleSheet.absoluteFill },
});
