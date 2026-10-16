import { en } from '@unspoken/content';
import { layout, maxWidth, radius, space, type RegionColors } from '@unspoken/design-tokens';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePrefs } from '../state/prefs';
import { Icon, type IconName } from './Icon';
import { Press, slopFor } from './Press';
import { Txt } from './Txt';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: (colors: RegionColors) => ReactNode;
};

// A bottom sheet over the theme's scrim, in the base region's colors, capped at maxWidth.sheet so
// it stays readable on tablets and web.
export function Sheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = usePrefs();
  const colors = theme.regions.base;
  const scrim = theme.colors.scrim;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: scrim }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={en.a11y.closeSheet}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: colors.bg, paddingBottom: layout.sheet.paddingBottom + insets.bottom }]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.outline }]} />
          <ScrollView bounces={false} contentContainerStyle={styles.content}>
            {children(colors)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// The sheet's title, a line under it or a note beside it, and an optional close button.
export function SheetHeader({ title, sub, note, colors, onClose }: { title: string; sub?: string; note?: string; colors: RegionColors; onClose?: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <View style={styles.titleRow}>
          <Txt variant="sheetTitle" color={colors.ink} accessibilityRole="header" style={styles.title}>
            {title}
          </Txt>
          {note ? (
            <Txt variant="subline" color={colors.muted} style={styles.note}>
              {note}
            </Txt>
          ) : null}
        </View>
        {sub ? (
          <Txt variant="subline" color={colors.muted}>
            {sub}
          </Txt>
        ) : null}
      </View>
      {onClose ? (
        <Press onPress={onClose} accessibilityLabel={en.a11y.closeMenu} hitSlop={slopFor(layout.control.iconBadge)} style={[styles.close, { backgroundColor: colors.chip }]}>
          <Icon name="cross" size={layout.icon.sm} color={colors.chipInk} />
        </Press>
      ) : null}
    </View>
  );
}

type RowProps = { title: string; detail: string; colors: RegionColors; onPress: () => void; icon?: IconName; chevron?: boolean };

// A row on a sheet: an icon, title, a detail line, and a chevron when it leads somewhere.
export function SheetRow({ title, detail, colors, onPress, icon, chevron }: RowProps) {
  return (
    <Press onPress={onPress} accessibilityLabel={title} accessibilityHint={detail} style={[styles.row, { backgroundColor: colors.chip }]}>
      {icon ? (
        <View style={[styles.badge, { backgroundColor: colors.rule }]}>
          <Icon name={icon} size={layout.icon.md} color={colors.chipInk} />
        </View>
      ) : null}
      <View style={styles.rowText}>
        <Txt variant="optionTitle" color={colors.chipInk}>
          {title}
        </Txt>
        <Txt variant="subline" color={colors.muted}>
          {detail}
        </Txt>
      </View>
      {chevron ? <Icon name="chevronRight" size={layout.icon.md} color={colors.muted} /> : null}
    </Press>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    maxWidth: maxWidth.sheet,
    maxHeight: '92%',
    alignSelf: 'center',
    borderTopLeftRadius: layout.sheet.radius,
    borderTopRightRadius: layout.sheet.radius,
    paddingTop: layout.sheet.paddingTop,
  },
  grabber: {
    alignSelf: 'center',
    width: layout.sheet.grabberWidth,
    height: layout.sheet.grabberHeight,
    borderRadius: radius.pill,
    marginBottom: space[3],
  },
  content: { paddingHorizontal: layout.sheet.paddingX, gap: space[1.5] },
  row: {
    minHeight: layout.button.height + space[2.5],
    borderRadius: radius.xl,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  rowText: { flex: 1, gap: space[0.5] },
  badge: { width: layout.control.iconBadge, height: layout.control.iconBadge, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3], marginBottom: space[2] },
  headerText: { flex: 1, gap: space[0.5] },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: space[3], rowGap: space[0.5] },
  title: { flexShrink: 1 },
  note: { flexShrink: 1, marginLeft: 'auto' },
  close: { width: layout.control.iconBadge, height: layout.control.iconBadge, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
