import { layout, radius, space, type RegionColors } from '@unspoken/design-tokens';
import { StyleSheet } from 'react-native';

import { Press } from './Press';
import { Txt } from './Txt';

type Props = {
  label: string;
  colors: RegionColors;
  selected: boolean;
  onPress: () => void;
  // A number after the label, such as the cards in a theme.
  count?: number;
  // radio: one of a set (All cards, a feedback topic). checkbox: toggles on its own.
  role?: 'radio' | 'checkbox';
};

// A selectable pill: themes on Setup, topics on Send feedback.
export function Chip({ label, colors, selected, onPress, count, role = 'radio' }: Props) {
  const ink = selected ? colors.onAccent : colors.chipInk;
  return (
    <Press
      onPress={onPress}
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { selected } : { checked: selected }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
      style={[styles.chip, { backgroundColor: selected ? colors.accent : colors.chip }]}
    >
      <Txt variant="topicChip" color={ink}>
        {label}
      </Txt>
      {count === undefined ? null : (
        <Txt variant="label" color={selected ? colors.onAccent : colors.muted}>
          {count}
        </Txt>
      )}
    </Press>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: layout.header.pillHeight,
    borderRadius: radius.pill,
    paddingHorizontal: space[3.5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1.5],
  },
});
