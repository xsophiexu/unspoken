import { en } from '@unspoken/content';
import { format, type TeamPreset } from '@unspoken/core';
import { layout, maxWidth, popoverColors, radius, space, teamColor, teamColorOrder, type RegionColors } from '@unspoken/design-tokens';
import { useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, useWindowDimensions, View, type LayoutRectangle } from 'react-native';

import { usePrefs } from '../state/prefs';
import { Button, LinkButton } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Press, slopFor } from '../ui/Press';
import { ScreenTop } from '../ui/Screen';
import { Sheet, SheetHeader } from '../ui/Sheet';
import { Txt } from '../ui/Txt';

// Pieces the Mind Reader setup and turn screens share.

// Team names from the copy catalog with the token colors, in the order teams are added.
export function teamPresets(): TeamPreset[] {
  return en.mindReader.teamNames.map((name, i) => ({ name, color: teamColorOrder[i] ?? i }));
}

export const defaultPlayerName = (n: number) => format(en.mindReader.players.defaultName, { n });

// A team's colored dot.
export function TeamDot({ color, size = space[2.5] }: { color: number; size?: number }) {
  const { selection } = usePrefs();
  return <View style={{ width: size, height: size, borderRadius: radius.pill, backgroundColor: teamColor(color, selection.mode) }} />;
}

// The colored letter badge before a team's name on setup.
export function TeamBadge({ name, color }: { name: string; color: number }) {
  const { selection, theme } = usePrefs();
  return (
    <View style={[styles.badge, { backgroundColor: teamColor(color, selection.mode) }]}>
      <Txt variant="pill" color={selection.mode === 'light' ? theme.colors.onAccent : theme.colors.bg}>
        {name.slice(0, 1).toUpperCase()}
      </Txt>
    </View>
  );
}

// Back link and step count, the title, and a bar for each step with the steps done filled in.
export function StepTop({ step, total, title, colors, onBack, back = en.mindReader.back }: { step: number; total: number; title: string; colors: RegionColors; onBack: () => void; back?: string }) {
  return (
    <View style={styles.stepTop}>
      <ScreenTop
        left={<LinkButton label={back} colors={colors} onPress={onBack} />}
        right={
          <Txt variant="subline" color={colors.muted}>
            {format(en.mindReader.step, { n: step, total })}
          </Txt>
        }
      />
      <Txt variant="title" color={colors.ink} accessibilityRole="header">
        {title}
      </Txt>
      <View style={styles.bars}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i < step ? colors.accent : colors.track }]} />
        ))}
      </View>
    </View>
  );
}

// − value + on a row: Number of players, Number of teams, Rounds, Correct predictions.
export function Stepper({
  label,
  sub,
  value,
  onChange,
  min,
  max,
  colors,
  fill,
}: {
  label: string;
  sub?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  colors: RegionColors;
  // The row's background; the buttons take the other fill.
  fill: 'raised' | 'chip';
}) {
  const { theme } = usePrefs();
  const raised = theme.regions.raised;
  const bg = fill === 'raised' ? raised.bg : colors.chip;
  const button = fill === 'raised' ? colors.chip : raised.bg;
  const step = (delta: number, icon: 'minus' | 'plus', a11y: string) => (
    <Press
      onPress={() => onChange(value + delta)}
      disabled={delta < 0 ? value <= min : value >= max}
      accessibilityLabel={format(a11y, { label })}
      hitSlop={slopFor(layout.control.iconBadge)}
      style={[styles.stepButton, { backgroundColor: button }]}
    >
      <Txt variant="optionTitle" color={colors.ink}>
        {icon === 'minus' ? '−' : '+'}
      </Txt>
    </Press>
  );
  return (
    <View style={[styles.stepper, { backgroundColor: bg }]}>
      <View style={styles.grow}>
        <Txt variant="optionTitle" color={colors.ink}>
          {label}
        </Txt>
        {sub ? (
          <Txt variant="small" color={colors.muted}>
            {sub}
          </Txt>
        ) : null}
      </View>
      {step(-1, 'minus', en.a11y.fewer)}
      <Txt variant="sheetTitle" color={colors.ink} style={styles.stepValue} accessibilityLiveRegion="polite">
        {value}
      </Txt>
      {step(1, 'plus', en.a11y.more)}
    </View>
  );
}

// A calm note: muted ink on a soft grey row with a small info icon. Never red.
export function Note({ text, colors, icon = 'info' }: { text: string; colors: RegionColors; icon?: 'info' | 'eyeOff' }) {
  return (
    <View style={[styles.note, { backgroundColor: colors.chip }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name={icon} size={layout.icon.md} color={colors.muted} />
      <Txt variant="subline" color={colors.muted} style={styles.grow}>
        {text}
      </Txt>
    </View>
  );
}

// A grey name pill.
export function NamePill({ name, colors, onPress, selected, accessibilityLabel }: { name: string; colors: RegionColors; onPress?: () => void; selected?: boolean; accessibilityLabel?: string }) {
  const style = [styles.pill, { backgroundColor: colors.chip }, selected && { borderColor: colors.accent, backgroundColor: 'transparent' }];
  const label = (
    <Txt variant="topicChip" color={colors.chipInk} numberOfLines={1}>
      {name}
    </Txt>
  );
  return onPress ? (
    <Press onPress={onPress} accessibilityLabel={accessibilityLabel ?? name} style={style}>
      {label}
    </Press>
  ) : (
    <View style={style}>{label}</View>
  );
}

// An outlined pill that adds something ("+ Add player", "+ Maya").
export function AddPill({ label, colors, onPress }: { label: string; colors: RegionColors; onPress: () => void }) {
  return (
    <Press onPress={onPress} accessibilityLabel={label} style={[styles.pill, styles.addPill, { borderColor: colors.outline }]}>
      <Txt variant="label" color={colors.accentText}>
        {label}
      </Txt>
    </Press>
  );
}

// A one-line text field that commits on Return (a new player's name, a rename).
export function NameField({ placeholder, colors, onSubmit, initial = '', autoFocus = false, clearOnSubmit = true }: { placeholder: string; colors: RegionColors; onSubmit: (name: string) => void; initial?: string; autoFocus?: boolean; clearOnSubmit?: boolean }) {
  const { theme } = usePrefs();
  const field = theme.regions.raised;
  const [text, setText] = useState(initial);
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={text}
      onChangeText={setText}
      placeholder={placeholder}
      placeholderTextColor={field.muted}
      accessibilityLabel={placeholder}
      autoFocus={autoFocus}
      autoCapitalize="words"
      autoCorrect={false}
      returnKeyType="done"
      submitBehavior="submit"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onSubmitEditing={() => {
        if (!text.trim()) return;
        onSubmit(text);
        if (clearOnSubmit) setText('');
      }}
      style={[styles.input, { color: field.ink, backgroundColor: field.bg, borderColor: focused ? colors.accent : colors.rule }]}
    />
  );
}

export type MenuItem = { label: string; onPress: () => void; danger?: boolean; submenu?: boolean };

// The menu on a player, opened from their row or chip and placed under it: Rename, Move to ›
// (opens the team list in its place, headed MOVE TO) and Remove from game. A pale popover in light
// mode, a dark one in dark mode.
export function PlayerMenu({ anchor, items, moveTo, onClose }: { anchor: LayoutRectangle | null; items: readonly MenuItem[]; moveTo?: { label: string; dot: number; onPress: () => void }[]; onClose: () => void }) {
  const { theme, selection } = usePrefs();
  const c = popoverColors(theme.colors, selection.mode);
  const window = useWindowDimensions();
  const [moving, setMoving] = useState(false);
  if (!anchor) return null;
  const width = Math.min(layout.mindReader.menuWidth, window.width - 2 * layout.screen.paddingX);
  const left = Math.max(layout.screen.paddingX, Math.min(anchor.x + anchor.width - width, window.width - width - layout.screen.paddingX));
  const top = anchor.y + anchor.height + space[1];
  const close = () => {
    setMoving(false);
    onClose();
  };
  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel={en.a11y.closeMenu} />
      <View style={[styles.menu, { left, top, width, backgroundColor: c.bg, borderColor: c.border, boxShadow: theme.shadow.raised }]} accessibilityViewIsModal>
        {moving && moveTo ? (
          <>
            <View style={styles.menuHead}>
              <Txt variant="overline" color={c.muted}>
                {en.mindReader.lineup.menu.moveHeader}
              </Txt>
            </View>
            {moveTo.map((t) => (
              <Press
                key={t.label}
                onPress={() => {
                  t.onPress();
                  close();
                }}
                style={styles.menuRow}
              >
                <TeamDot color={t.dot} size={space[2]} />
                <Txt variant="label" color={c.ink}>
                  {t.label}
                </Txt>
              </Press>
            ))}
          </>
        ) : (
          items.map((item, i) => (
            <Press
              key={item.label}
              onPress={() => {
                if (item.submenu) setMoving(true);
                else {
                  item.onPress();
                  close();
                }
              }}
              style={[styles.menuRow, i > 0 && { borderTopWidth: layout.stroke.hairline, borderTopColor: c.border }]}
            >
              <Txt variant="label" color={item.danger ? c.danger : c.ink} style={styles.grow}>
                {item.label}
              </Txt>
              {item.submenu ? <Icon name="chevronRight" size={layout.icon.sm} color={c.muted} /> : null}
            </Press>
          ))
        )}
      </View>
    </Modal>
  );
}

// Measures a view in the window so a menu can open under it.
export function useAnchor() {
  const refs = useRef(new Map<string, View | null>());
  const [anchor, setAnchor] = useState<{ id: string; rect: LayoutRectangle } | null>(null);
  return {
    anchor,
    ref: (id: string) => (el: View | null) => {
      refs.current.set(id, el);
    },
    open: (id: string) => refs.current.get(id)?.measureInWindow((x, y, width, height) => setAnchor({ id, rect: { x, y, width, height } })),
    close: () => setAnchor(null),
  };
}

// A white card on the page.
export function Card({ children, style }: { children: ReactNode; style?: object }) {
  const { theme } = usePrefs();
  return <View style={[styles.card, { backgroundColor: theme.regions.raised.bg }, style]}>{children}</View>;
}

// Two options side by side, the chosen one filled in the accent (Individual / Teams, Owls got it /
// Not guessed).
export function SegmentSwitch<T extends string>({ options, value, onChange, colors }: { options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void; colors: RegionColors }) {
  return (
    <View accessibilityRole="radiogroup" style={[styles.track, { backgroundColor: colors.chip }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Press
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on && { backgroundColor: colors.accent }]}
          >
            <Txt variant="label" color={on ? colors.onAccent : colors.chipInk} numberOfLines={1}>
              {o.label}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

// A sheet to type a new name; Save keeps it.
export function RenameSheet({ visible, title, initial, onSave, onClose }: { visible: boolean; title: string; initial: string; onSave: (name: string) => void; onClose: () => void }) {
  const { theme } = usePrefs();
  const field = theme.regions.raised;
  const [text, setText] = useState(initial);
  const [shown, setShown] = useState(initial);
  if (initial !== shown) {
    setShown(initial);
    setText(initial);
  }
  const save = () => {
    if (!text.trim()) return;
    onSave(text);
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <View style={styles.sheetBody}>
          <SheetHeader title={title} colors={colors} onClose={onClose} />
          <TextInput
            value={text}
            onChangeText={setText}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={save}
            accessibilityLabel={title}
            style={[styles.input, { color: field.ink, backgroundColor: field.bg, borderColor: colors.accent }]}
          />
          <Button kind="primary" label={en.mindReader.lineup.save} colors={colors} disabled={!text.trim()} onPress={save} />
        </View>
      )}
    </Sheet>
  );
}

// A centered pop-up over a scrim with a title, a line and two buttons.
export function Dialog({ visible, title, body, primary, secondary, onClose }: { visible: boolean; title: string; body: string; primary: { label: string; onPress: () => void }; secondary: { label: string; onPress: () => void }; onClose: () => void }) {
  const { theme } = usePrefs();
  const colors = theme.regions.base;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.dialogRoot, { backgroundColor: theme.colors.scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={en.a11y.closeSheet} />
        <View style={[styles.dialog, { backgroundColor: colors.bg, boxShadow: theme.shadow.card }]} accessibilityViewIsModal>
          <Txt variant="sheetTitle" color={colors.ink} accessibilityRole="header">
            {title}
          </Txt>
          <Txt variant="hint" color={colors.muted}>
            {body}
          </Txt>
          <Button kind="primary" label={primary.label} colors={colors} onPress={primary.onPress} />
          <Button label={secondary.label} colors={colors} onPress={secondary.onPress} />
        </View>
      </View>
    </Modal>
  );
}

export const mrStyles = StyleSheet.create({
  section: { gap: space[2.5] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2.5] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  grow: { flex: 1 },
});

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  badge: { width: space[6], height: space[6], borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  stepTop: { gap: space[1] },
  bars: { flexDirection: 'row', gap: space[1.5], marginTop: space[2] },
  bar: { flex: 1, height: layout.stroke.heavy, borderRadius: radius.pill },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space[2.5], borderRadius: radius.xl, paddingLeft: space[4], paddingRight: space[3], paddingVertical: space[3] },
  stepButton: { width: layout.control.iconBadge, height: layout.control.iconBadge, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: space[6], textAlign: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', gap: space[2.5], borderRadius: radius.lg, paddingHorizontal: space[4], paddingVertical: space[3] },
  pill: {
    minHeight: layout.mindReader.pillHeight,
    borderRadius: radius.pill,
    paddingHorizontal: space[3.5],
    justifyContent: 'center',
    borderWidth: layout.stroke.outline,
    borderColor: 'transparent',
    maxWidth: '100%',
  },
  addPill: { backgroundColor: 'transparent' },
  input: { minHeight: layout.control.input.height, borderRadius: radius.md, borderWidth: layout.stroke.outline, paddingHorizontal: space[4] },
  menu: { position: 'absolute', borderRadius: radius.lg, borderWidth: layout.stroke.hairline, overflow: 'hidden' },
  menuHead: { paddingHorizontal: space[3.5], paddingTop: space[3], paddingBottom: space[1] },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: layout.minTouch, paddingHorizontal: space[3.5] },
  track: { flexDirection: 'row', padding: layout.control.segmented.inset, borderRadius: radius.lg },
  segment: { flex: 1, minHeight: layout.button.height - space[2], borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[2] },
  sheetBody: { gap: space[3] },
  dialogRoot: { flex: 1, justifyContent: 'center', padding: space[6] },
  dialog: { width: '100%', maxWidth: maxWidth.prose, alignSelf: 'center', borderRadius: radius.sheet, padding: space[5], gap: space[3] },
  card: { borderRadius: radius.xl, paddingHorizontal: space[4], paddingVertical: space[3.5] },
});
