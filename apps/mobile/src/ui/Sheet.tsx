import { en } from '@unspoken/content';
import { layout, maxWidth, motion, radius, space, type RegionColors } from '@unspoken/design-tokens';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePrefs } from '../state/prefs';
import { Icon, type IconName } from './Icon';
import { Press, slopFor } from './Press';
import { Txt } from './Txt';
import { useReduceMotion } from './useReduceMotion';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: (colors: RegionColors) => ReactNode;
};

const { duration } = motion;
const enterEasing = Easing.out(Easing.cubic);
const exitEasing = Easing.in(Easing.cubic);

// A bottom sheet over the theme's scrim, in the base region's colors, capped at maxWidth.sheet so
// it stays readable on tablets and web. The scrim fades in place while only the sheet slides up;
// closing slides the sheet down and fades the scrim, and the Modal stays up until that finishes.
// With reduced motion the sheet just shows and hides.
export function Sheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = usePrefs();
  const reduceMotion = useReduceMotion();
  const { height: windowHeight } = useWindowDimensions();
  const colors = theme.regions.base;
  const scrim = theme.colors.scrim;

  // 0 hidden, 1 shown: drives the scrim's opacity and the sheet's offset.
  const [progress] = useState(() => new Animated.Value(0));
  // The Modal stays mounted while the sheet slides out.
  const [mounted, setMounted] = useState(visible);
  // The sheet's measured height: how far it slides. Until it is measured it waits below the window.
  const [height, setHeight] = useState(0);
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    const hide = () => {
      setMounted(false);
      setHeight(0);
    };
    if (reduceMotion) {
      progress.setValue(visible ? 1 : 0);
      if (!visible) hide();
      return;
    }
    // Slide in only once the sheet knows how far to travel.
    if (visible && height === 0) return;
    const anim = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? duration.slow : duration.base,
      easing: visible ? enterEasing : exitEasing,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished && !visible) hide();
    });
    return () => anim.stop();
  }, [visible, mounted, height, reduceMotion, progress]);

  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [height || windowHeight, 0] });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: scrim, opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={en.a11y.closeSheet} />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            { backgroundColor: colors.bg, paddingBottom: layout.sheet.paddingBottom + insets.bottom, transform: [{ translateY: offset }] },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.outline }]} />
          <ScrollView bounces={false} contentContainerStyle={styles.content}>
            {children(colors)}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// The sheet's title with an optional control beside it, a line under it or a note beside it, and
// an optional close button.
export function SheetHeader({
  title,
  sub,
  note,
  action,
  colors,
  onClose,
}: {
  title: string;
  sub?: string;
  note?: string;
  action?: ReactNode;
  colors: RegionColors;
  onClose?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            <Txt variant="sheetTitle" color={colors.ink} accessibilityRole="header" style={styles.title}>
              {title}
            </Txt>
            {action}
          </View>
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
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: space[2], flexShrink: 1 },
  title: { flexShrink: 1 },
  note: { flexShrink: 1, marginLeft: 'auto' },
  close: { width: layout.control.iconBadge, height: layout.control.iconBadge, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
