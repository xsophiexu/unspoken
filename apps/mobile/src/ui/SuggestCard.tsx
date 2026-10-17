import { layout, radius, space, type RegionColors } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { Icon } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';

type Props = {
  title: string;
  body?: string;
  action: string;
  colors: RegionColors;
  onPress: () => void;
  // row: the card under the Modes grid. tile: a tile the size of a style thumbnail on Customize.
  shape: 'row' | 'tile';
  width?: number;
  height?: number;
};

// The dashed "Want another mode / style?" card that opens Send feedback. It has no fill, so the page
// shows through; the icon sits on a chip-colored badge.
export function SuggestCard({ title, body, action, colors, onPress, shape, width, height }: Props) {
  const row = shape === 'row';
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={`${title} ${action}`}
      style={[styles.card, row ? styles.row : styles.tile, { borderColor: colors.outline, width, height }]}
    >
      <View style={[styles.badge, { backgroundColor: colors.chip }]}>
        <Icon name="bubble" size={layout.icon.md} color={colors.accentText} />
      </View>
      <View style={row ? styles.text : styles.tileText}>
        <Txt variant={row ? 'optionTitle' : 'label'} color={colors.chipInk} style={!row && styles.center}>
          {title}
        </Txt>
        {body ? (
          <Txt variant="small" color={colors.muted}>
            {body}
          </Txt>
        ) : null}
      </View>
      <View style={[styles.action, { backgroundColor: colors.accent }]}>
        <Txt variant="topicChip" color={colors.onAccent}>
          {action}
        </Txt>
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: layout.stroke.hairline, borderStyle: 'dashed', borderRadius: radius.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3.5] },
  tile: { alignItems: 'center', justifyContent: 'center', gap: space[2.5], padding: space[2], borderRadius: layout.thumbnail.radius },
  badge: { width: layout.control.iconBadge, height: layout.control.iconBadge, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: space[0.5] },
  tileText: { alignItems: 'center' },
  center: { textAlign: 'center' },
  action: { paddingHorizontal: space[3.5], paddingVertical: space[2], borderRadius: radius.md },
});
