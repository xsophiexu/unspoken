import { en } from '@unspoken/content';
import { format, formatParts } from '@unspoken/core';
import { layout, radius, space, type HeaderSlot, type RegionColors } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { Icon } from '../../ui/Icon';
import { Press, slopFor } from '../../ui/Press';
import { Txt, TxtParts } from '../../ui/Txt';
import type { HeaderModel } from '../model';
import { Target } from '../spotlight';

type LabelProps = { slot: HeaderSlot; colors: RegionColors; model: HeaderModel; onPress?: () => void };

// The mode and level ("Classic · Expert 1 ▾") as a pill, small caps or plain text. Tapping it opens
// the mode and difficulty sheet.
export function ModeLabel({ slot, colors, model, onPress }: LabelProps) {
  const caps = slot.variant === 'caps';
  const name = caps ? colors.muted : colors.ink;
  const parts = formatParts(en.play.modeAndLevel, { mode: model.mode, difficulty: model.level });
  const boxed = slot.container !== 'none';
  return (
    <Target name="difficulty">
      <Press
        onPress={onPress}
        disabled={!onPress}
        accessibilityLabel={format(en.a11y.modeAndDifficulty, { mode: model.mode, difficulty: model.level })}
        hitSlop={slopFor(boxed ? layout.header.pillHeight : slot.size)}
        style={[
          styles.label,
          boxed && styles.pill,
          slot.container === 'filled' && { backgroundColor: colors.chip },
          slot.container === 'tinted' && { backgroundColor: colors.rule },
          slot.container === 'outlined' && { borderWidth: layout.stroke.outline, borderColor: colors.outline },
        ]}
      >
        <TxtParts
          variant={caps ? 'badge' : 'stats'}
          size={slot.size}
          color={colors.muted}
          numberOfLines={1}
          parts={parts}
          params={{
            mode: { variant: caps ? 'badge' : 'optionTitle', color: name, size: slot.size },
            difficulty: { variant: caps ? 'badge' : 'stats', color: colors.muted, size: slot.size },
          }}
        />
        <Icon name="chevronDown" size={Math.round(slot.size * layout.header.caretScale)} color={colors.muted} />
      </Press>
    </Target>
  );
}

// Card's header: the big mode name, the filled level badge (opens the difficulty picker) and the
// status line below.
export function TitleBadge({ slot, colors, model, onBadge }: { slot: HeaderSlot; colors: RegionColors; model: HeaderModel; onBadge?: () => void }) {
  return (
    <View style={styles.titleBlock}>
      <View style={styles.titleRow}>
        <Txt variant="modeName" size={slot.size} color={colors.ink} accessibilityRole="header" numberOfLines={1} style={styles.shrink}>
          {model.mode}
        </Txt>
        <Target name="difficulty">
          <Press
            onPress={onBadge}
            disabled={!onBadge}
            accessibilityLabel={format(en.a11y.difficulty, { badge: model.level })}
            hitSlop={slopFor(layout.icon.lg)}
            style={[styles.badge, { backgroundColor: colors.accent }]}
          >
            <Txt variant="badge" color={colors.onAccent} numberOfLines={1}>
              {model.badge}
            </Txt>
            <Icon name="chevronDown" size={layout.icon.sm * layout.header.caretScale} color={colors.onAccent} />
          </Press>
        </Target>
      </View>
      <Txt variant="subline" color={colors.muted} numberOfLines={2}>
        {model.subline}
      </Txt>
    </View>
  );
}

// The top-right button: dots or sliders, plain, filled or outlined. Opens the game menu.
export function MenuButton({ slot, colors, onPress, pageColor }: { slot: HeaderSlot; colors: RegionColors; onPress?: () => void; pageColor: string }) {
  const box = layout.header.menuButton;
  return (
    <Target name="menu">
      <Press
        onPress={onPress}
        disabled={!onPress}
        accessibilityLabel={en.a11y.menu}
        hitSlop={slopFor(box)}
        style={[
          styles.menu,
          { width: box, height: box },
          slot.menuContainer === 'filled' && { backgroundColor: colors.chip },
          slot.menuContainer === 'outlined' && { borderWidth: layout.stroke.outline, borderColor: colors.outline, borderRadius: radius.sm },
        ]}
      >
        {slot.menu === 'dots' ? (
          <Icon name="dots" size={layout.icon.md} color={slot.menuContainer === 'filled' ? colors.chipInk : colors.ink} />
        ) : (
          <Icon name="sliders" size={layout.icon.xl} color={colors.ink} background={pageColor} />
        )}
      </Press>
    </Target>
  );
}

const styles = StyleSheet.create({
  label: { flexDirection: 'row', alignItems: 'center', gap: space[1], alignSelf: 'flex-start', maxWidth: '100%' },
  pill: { height: layout.header.pillHeight, borderRadius: radius.pill, paddingLeft: space[4], paddingRight: space[3.5] },
  titleBlock: { alignSelf: 'stretch', gap: space[0.5] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  shrink: { flexShrink: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[0.5],
    borderRadius: layout.header.badgeRadius,
    paddingLeft: space[2],
    paddingRight: space[1.5],
    paddingVertical: space[0.5],
  },
  menu: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
