import { en } from '@unspoken/content';
import { layout, maxWidth, radius, space, type RegionColors } from '@unspoken/design-tokens';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';

type Props = {
  visible: boolean;
  onClose: () => void;
  colors: RegionColors;
  scrim: string;
  children: ReactNode;
};

// A bottom sheet over a scrim, capped at maxWidth.sheet so it stays readable on tablets and web.
export function Sheet({ visible, onClose, colors, scrim, children }: Props) {
  const insets = useSafeAreaInsets();
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
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// A row on a sheet: title, a detail line, and a chevron when it leads somewhere.
export function SheetRow({ title, detail, colors, onPress, chevron }: { title: string; detail: string; colors: RegionColors; onPress: () => void; chevron?: boolean }) {
  return (
    <Press onPress={onPress} accessibilityLabel={title} accessibilityHint={detail} style={[styles.row, { backgroundColor: colors.chip }]}>
      <View style={styles.rowText}>
        <Txt variant="button" color={colors.chipInk}>
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
});
