import { layout, opacity } from '@unspoken/design-tokens';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> };

// A Pressable with the shared pressed and disabled feedback, and a touch area of at least
// layout.minTouch even when the control is drawn smaller.
export function Press({ style, disabled, accessibilityState, hitSlop, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      disabled={disabled}
      accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
      hitSlop={hitSlop ?? { top: 0, bottom: 0, left: 0, right: 0 }}
      pressRetentionOffset={layout.minTouch / 2}
      style={({ pressed }) => [style, { opacity: disabled ? opacity.disabled : pressed ? opacity.pressed : 1 }]}
    />
  );
}

// Extra touch area around a control drawn at `size`, so the target reaches layout.minTouch.
export function slopFor(size: number) {
  const extra = Math.max(0, (layout.minTouch - size) / 2);
  return { top: extra, bottom: extra, left: extra, right: extra };
}
