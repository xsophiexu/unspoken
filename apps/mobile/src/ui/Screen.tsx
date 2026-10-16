import { layout, maxWidth, space, type RegionColors, type RegionTone } from '@unspoken/design-tokens';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePrefs } from '../state/prefs';
import { Txt } from './Txt';

// Status bar text that reads on the top region: light on dark pages and on an accent page.
export function useBarStyle(tone: RegionTone): 'light' | 'dark' {
  const { selection } = usePrefs();
  return selection.mode === 'dark' || tone === 'accent' ? 'light' : 'dark';
}

// On web, paint the page behind the centered column in the screen's background.
export function usePageBackground(color: string) {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.body.style.backgroundColor = color;
  }, [color]);
}

type Props = {
  // canvas for Customize, Send feedback and Thanks; base for Modes and Setup.
  tone: RegionTone;
  // How wide the content may grow: the game column or a full-page form.
  width: keyof typeof maxWidth;
  children: (colors: RegionColors) => ReactNode;
  // Pinned under the scrolling content (Start game, Send feedback, Done).
  footer?: (colors: RegionColors) => ReactNode;
  scroll?: boolean;
};

// A full-page screen: safe areas, a centered column capped at a max width, the region's colors.
export function Screen({ tone, width, children, footer, scroll = true }: Props) {
  const { theme } = usePrefs();
  const colors = theme.regions[tone];
  const insets = useSafeAreaInsets();
  const barStyle = useBarStyle(tone);
  usePageBackground(colors.bg);
  const body = children(colors);
  return (
    <View style={[styles.page, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <StatusBar style={barStyle} />
      <KeyboardAvoidingView behavior="padding" style={[styles.column, { maxWidth: maxWidth[width] }]}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {body}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.fill]}>{body}</View>
        )}
        <View style={[styles.footer, { paddingBottom: (footer ? layout.screen.paddingBottom : 0) + insets.bottom }]}>{footer?.(colors)}</View>
      </KeyboardAvoidingView>
    </View>
  );
}

// A section label (DIFFICULTY, COLOR) with an optional note at the right.
export function SectionLabel({ label, aside, colors }: { label: string; aside?: string; colors: RegionColors }) {
  return (
    <View style={styles.section}>
      <Txt variant="overline" color={colors.muted} accessibilityRole="header">
        {label}
      </Txt>
      {aside ? (
        <Txt variant="subline" color={colors.muted} style={styles.aside}>
          {aside}
        </Txt>
      ) : null}
    </View>
  );
}

// The row above a screen title: a back link at the left and a link or note at the right.
export function ScreenTop({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.top}>
      <View>{left}</View>
      <View>{right}</View>
    </View>
  );
}

// A screen title with an optional line under it.
export function ScreenTitle({ title, sub, colors }: { title: string; sub?: string; colors: RegionColors }) {
  return (
    <View style={styles.titleBlock}>
      <Txt variant="title" color={colors.ink} accessibilityRole="header">
        {title}
      </Txt>
      {sub ? (
        <Txt variant="hint" color={colors.muted}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  column: { flex: 1, width: '100%', alignSelf: 'center' },
  content: { paddingHorizontal: layout.screen.paddingX, paddingTop: layout.screen.paddingTop, paddingBottom: space[5], gap: space[5] },
  fill: { flex: 1 },
  footer: { paddingHorizontal: layout.screen.paddingX },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space[3] },
  aside: { flexShrink: 1, textAlign: 'right' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: layout.minTouch },
  titleBlock: { gap: space[1], marginBottom: space[2] },
});
