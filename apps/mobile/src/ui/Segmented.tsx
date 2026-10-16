import { layout, radius, space, type RegionColors } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';

type Option<T extends string> = { value: T; label: string; icon?: IconName };

// Two or three options in one track, one selected (Light / Dark).
export function Segmented<T extends string>({ options, value, onChange, colors }: { options: readonly Option<T>[]; value: T; onChange: (value: T) => void; colors: RegionColors }) {
  return (
    <View accessibilityRole="radiogroup" style={[styles.track, { backgroundColor: colors.chip }]}>
      {options.map((o) => {
        const on = o.value === value;
        const ink = on ? colors.onAccent : colors.chipInk;
        return (
          <Press
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.option, on && { backgroundColor: colors.accent }]}
          >
            {o.icon ? <Icon name={o.icon} size={layout.icon.sm} color={ink} /> : null}
            <Txt variant={on ? 'optionTitle' : 'label'} color={ink}>
              {o.label}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: layout.control.segmented.inset, borderRadius: radius.lg },
  option: {
    flex: 1,
    height: layout.control.segmented.height,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1.5],
  },
});
