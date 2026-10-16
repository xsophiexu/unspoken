import { buttonPair, layout, radius, space, type RegionColors } from '@unspoken/design-tokens';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from './Icon';
import { Press, slopFor } from './Press';
import { Txt } from './Txt';

type Props = {
  label: string;
  colors: RegionColors;
  onPress?: () => void;
  // primary: filled accent. secondary: outlined. tonal: the region's chip fill.
  kind?: 'primary' | 'secondary' | 'tonal';
  // compact: a small pill for a sheet's header, with the full touch target around it.
  size?: 'regular' | 'compact';
  icon?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, colors, onPress, kind = 'secondary', size = 'regular', icon, disabled, accessibilityLabel, style }: Props) {
  const primary = kind === 'primary';
  const compact = size === 'compact';
  const ink = primary ? colors.onAccent : kind === 'tonal' ? colors.chipInk : colors.ink;
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={compact ? slopFor(layout.control.iconBadge) : undefined}
      style={[
        styles.button,
        primary
          ? { backgroundColor: colors.accent, minHeight: layout.button.primaryHeight }
          : kind === 'tonal'
            ? { backgroundColor: colors.chip }
            : { borderWidth: layout.stroke.outline, borderColor: colors.outline },
        compact && styles.compact,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={compact ? layout.icon.sm : layout.icon.md} color={ink} /> : null}
      <Txt variant={primary ? 'buttonStrong' : 'button'} color={ink} numberOfLines={1}>
        {label}
      </Txt>
    </Press>
  );
}

// A text link in the accent color ("‹ Back", "Done", "← Modes").
// quiet: small ink text instead of the accent link (Customize's "Swipe for more →").
export function LinkButton({
  label,
  colors,
  onPress,
  accessibilityLabel,
  quiet = false,
}: {
  label: string;
  colors: RegionColors;
  onPress: () => void;
  accessibilityLabel?: string;
  quiet?: boolean;
}) {
  return (
    <Press onPress={onPress} accessibilityLabel={accessibilityLabel} accessibilityRole="link" hitSlop={slopFor(layout.icon.lg)}>
      <Txt variant={quiet ? 'subline' : 'link'} color={quiet ? colors.ink : colors.accentText}>
        {label}
      </Txt>
    </Press>
  );
}

type PairButton = Omit<Props, 'kind' | 'size' | 'style'>;

// A secondary button beside the primary one, sharing the row in the buttonPair ratio so the primary
// on the right is the larger. The secondary never shrinks below its label, and the primary moves
// under it when both no longer fit side by side.
export function ButtonPair({ secondary, primary, style }: { secondary: PairButton; primary: PairButton; style?: StyleProp<ViewStyle> }) {
  const [width, setWidth] = useState(0);
  const share = width ? ((width - space[2.5]) * buttonPair.secondary) / (buttonPair.secondary + buttonPair.primary) : 0;
  return (
    <View style={[styles.pair, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={[styles.pairSecondary, { minWidth: share }]}>
        <Button {...secondary} kind="secondary" style={styles.pairButton} />
      </View>
      <View style={styles.pairPrimary}>
        <Button {...primary} kind="primary" style={styles.pairButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: layout.button.height,
    borderRadius: layout.button.radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2.5],
    paddingHorizontal: space[4],
  },
  compact: { minHeight: layout.control.iconBadge, borderRadius: radius.pill, gap: space[1.5], paddingHorizontal: space[3] },
  pair: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2.5] },
  pairSecondary: { flexShrink: 0 },
  // Wide enough to stay a real button beside a long secondary label; otherwise it wraps under it.
  pairPrimary: { flexGrow: 1, flexBasis: 0, minWidth: '40%' },
  // Both fill their slot's height, so the outlined button matches the taller primary.
  pairButton: { flexGrow: 1, paddingHorizontal: space[3], gap: space[2] },
});
