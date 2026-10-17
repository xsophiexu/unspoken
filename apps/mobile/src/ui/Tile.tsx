import { layout, radius, space, textStyles, type RegionColors } from '@unspoken/design-tokens';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { fittedSize, useWidth } from './fit';
import { Press } from './Press';
import { Txt } from './Txt';

type Props = {
  title: string;
  detail?: string;
  // A small outlined pill in place of the detail line (Coming soon).
  status?: string;
  colors: RegionColors;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  // Smallest tile height (mode tiles, level tiles); longer text makes the tile taller.
  height?: number;
  // Center a one-line title (level tiles on the sheet).
  centered?: boolean;
  accessibilityLabel?: string;
  // Reports the height the title and detail need (ignoring height), so a grid can give every tile
  // the tallest one's height (useEqualHeight).
  onNaturalHeight?: (height: number) => void;
};

const textHeight = (e: LayoutChangeEvent) => Math.ceil(e.nativeEvent.layout.height);

// A selectable tile: difficulties on Setup and the sheets, modes on Modes. Long names (Grandmaster)
// shrink to stay on one line.
export function Tile({ title, detail, status, colors, selected, onPress, disabled, height, centered, accessibilityLabel, onNaturalHeight }: Props) {
  const [width, onLayout] = useWidth();
  const [titleHeight, setTitleHeight] = useState(0);
  // The detail line or the status pill under the title.
  const [secondHeight, setSecondHeight] = useState(0);
  const hasSecond = !!(detail || status);
  const padY = space[3.5];
  useEffect(() => {
    if (!onNaturalHeight || titleHeight === 0 || (hasSecond && secondHeight === 0)) return;
    onNaturalHeight(2 * padY + titleHeight + (hasSecond ? space[1.5] + secondHeight : 0));
  }, [onNaturalHeight, titleHeight, secondHeight, hasSecond, padY]);
  // Coming soon tiles are faded (disabled: the chip at opacity.disabled over the page) with a muted
  // title and an accent pill, rather than a lighter shade of the color.
  const bg = selected ? colors.accent : disabled ? colors.disabled : colors.chip;
  const titleColor = selected ? colors.onAccent : disabled ? colors.disabledInk : colors.chipInk;
  const detailColor = selected ? colors.onAccent : disabled ? colors.disabledInk : colors.muted;
  // Centered titles (narrow level tiles) may run nearly to the edges and shrink a little further.
  const padX = centered ? space[0.5] : space[3.5];
  const min = centered ? textStyles.badge.size : textStyles.small.size;
  const size = fittedSize(title, width - 2 * padX, { variant: 'optionTitle', max: textStyles.optionTitle.size, min, maxLines: 1 });
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      fadeDisabled={false}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? [title, detail, status].filter(Boolean).join(', ')}
      style={[
        styles.tile,
        { backgroundColor: bg, padding: padY, paddingHorizontal: padX },
        height !== undefined && { minHeight: height },
        centered && styles.centered,
      ]}
    >
      <View onLayout={onLayout} style={styles.fill} />
      <Txt variant="optionTitle" size={size} color={titleColor} numberOfLines={1} onLayout={(e) => setTitleHeight(textHeight(e))}>
        {title}
      </Txt>
      {detail ? (
        <Txt variant="small" color={detailColor} onLayout={(e) => setSecondHeight(textHeight(e))}>
          {detail}
        </Txt>
      ) : null}
      {status ? (
        <View style={[styles.status, { borderColor: colors.disabledAccent }]} onLayout={(e) => setSecondHeight(textHeight(e))}>
          <Txt variant="pill" color={colors.disabledAccent}>
            {status}
          </Txt>
        </View>
      ) : null}
    </Press>
  );
}

const styles = StyleSheet.create({
  // Taller tiles (Modes) keep the detail right under the title, however many lines it takes.
  // flexGrow: a tile fills its grid cell, so the tiles in a row are the same height.
  tile: { flexGrow: 1, borderRadius: radius.xl, gap: space[1.5], minHeight: layout.minTouch, justifyContent: 'flex-start' },
  status: {
    alignSelf: 'flex-start',
    paddingVertical: space[0.5],
    paddingHorizontal: space[2],
    borderWidth: layout.stroke.hairline,
    borderRadius: radius.pill,
  },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 0 },
  // Measures the tile's width without affecting its layout.
  fill: { ...StyleSheet.absoluteFill },
});

// One height for a set of tiles (the Modes grid): the tallest tile's natural height, and at least
// `min`. Pass height as each tile's height and reporter(key) as its onNaturalHeight.
export function useEqualHeight(min: number): [height: number, reporter: (key: string) => (height: number) => void] {
  const heights = useRef(new Map<string, number>());
  const reporters = useRef(new Map<string, (height: number) => void>());
  const [tallest, setTallest] = useState(0);
  const reporter = useCallback((key: string) => {
    let report = reporters.current.get(key);
    if (!report) {
      report = (height: number) => {
        heights.current.set(key, height);
        setTallest(Math.max(...heights.current.values()));
      };
      reporters.current.set(key, report);
    }
    return report;
  }, []);
  return [Math.max(min, tallest), reporter];
}
