import { layout, space, type RegionColors } from '@unspoken/design-tokens';
import type { ReactNode } from 'react';
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
  icon?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, colors, onPress, kind = 'secondary', icon, disabled, accessibilityLabel, style }: Props) {
  const primary = kind === 'primary';
  const ink = primary ? colors.onAccent : kind === 'tonal' ? colors.chipInk : colors.ink;
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.button,
        primary
          ? { backgroundColor: colors.accent, height: layout.button.primaryHeight }
          : kind === 'tonal'
            ? { backgroundColor: colors.chip }
            : { borderWidth: layout.stroke.outline, borderColor: colors.outline },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={layout.icon.md} color={ink} /> : null}
      <Txt variant={primary ? 'buttonStrong' : 'button'} color={ink} numberOfLines={1}>
        {label}
      </Txt>
    </Press>
  );
}

// A text link in the accent color ("‹ Back", "Done", "← Modes").
export function LinkButton({ label, colors, onPress, accessibilityLabel }: { label: string; colors: RegionColors; onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Press onPress={onPress} accessibilityLabel={accessibilityLabel} accessibilityRole="link" hitSlop={slopFor(layout.icon.lg)}>
      <Txt variant="link" color={colors.accentText}>
        {label}
      </Txt>
    </Press>
  );
}

// A row of buttons sharing the width.
export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    height: layout.button.height,
    borderRadius: layout.button.radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2.5],
    paddingHorizontal: space[4],
  },
  row: { flexDirection: 'row', gap: space[2.5] },
});
