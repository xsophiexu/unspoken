import { Pressable, StyleSheet, Text } from 'react-native';

import { font, type Theme } from '../theme';

type Props = { t: Theme; label: string; primary?: boolean; disabled?: boolean; onPress: () => void };

export function Button({ t, label, primary, disabled, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: t.accent, height: 58 }
          : { borderWidth: 1.5, borderColor: t.outline, backgroundColor: 'transparent' },
        { opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, font(700), { color: primary ? t.onAccent : t.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16 },
});
