import { en, type DetailsSection, type RoleCard, type SpokenRow } from '@unspoken/content';
import { format, type SpokenEntry } from '@unspoken/core';
import { layout, maxWidth, playMargins, radius, space, textStyles, type RegionColors } from '@unspoken/design-tokens';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';

import { Card, mrStyles, NamePill, SegmentSwitch, Stepper, TeamDot } from '../mindReader/ui';
import { usePrefs } from '../state/prefs';
import { Button, LinkButton } from '../ui/Button';
import { fittedSize, useWidth } from '../ui/fit';
import { Icon } from '../ui/Icon';
import { Press, slopFor } from '../ui/Press';
import { Sheet, SheetHeader } from '../ui/Sheet';
import { Txt } from '../ui/Txt';
import type { Chrome } from './Game';

// The pieces of a Mind Reader turn: the frame, the header with its role cards, the word, the
// spoken log, the coach card and the sheets.

// The page: an optional header, the content (scrolling when it runs long) and the buttons.
export function MRFrame({ chrome, header, children, footer, center = false }: { chrome: Chrome; header?: ReactNode; children: ReactNode; footer: ReactNode; center?: boolean }) {
  const { insets, page } = chrome;
  // A header sits where the play screen's does; a screen without one starts at the setup margin.
  const top = header ? headerPlacement(chrome).top : layout.screen.paddingTop;
  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.page, { backgroundColor: page.bg, paddingTop: insets.top + top }]}>
      <View style={[styles.column, { paddingBottom: insets.bottom + layout.screen.paddingBottom }]}>
        {header}
        <ScrollView style={styles.fill} contentContainerStyle={[styles.content, center && styles.center]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        <View style={styles.footer}>{footer}</View>
      </View>
    </KeyboardAvoidingView>
  );
}

// The header row placed as the play screen's is in the player's style (Classic's header): its side
// and top margins and title size. The content under it keeps the setup screens' side margin, so
// the row is inset by the difference.
export function headerPlacement(chrome: Chrome) {
  const { header } = chrome.theme.style;
  const margins = playMargins(chrome.theme.style);
  // Styles whose play header is a title (Card) set its size; pill headers have no title to match.
  const size = header.variant === 'titleBadge' ? header.size : layout.mindReader.titleSize;
  return { inset: margins.paddingX - layout.screen.paddingX, top: margins.paddingTop, size };
}

export function MenuDots({ colors, onPress }: { colors: RegionColors; onPress: () => void }) {
  const box = layout.header.menuButton;
  return (
    <Press onPress={onPress} accessibilityLabel={en.a11y.menu} hitSlop={slopFor(box)} style={[styles.menu, { width: box, height: box, backgroundColor: colors.chip }]}>
      <Icon name="dots" size={layout.icon.md} color={colors.chipInk} />
    </Press>
  );
}

// "Round 2 of 5" with a Details pill and the menu; the role cards under it when given. Cards in a
// row share the tallest card's height, one line each unless a name needs two.
// `chip` sits beside the title (Quick Play's difficulty).
export function TurnHeader({
  chrome,
  title,
  subtitle,
  chip,
  cards,
  onDetails,
}: {
  chrome: Chrome;
  title: string;
  // A small secondary line under the title (Quick Play names the game there).
  subtitle?: string;
  chip?: ReactNode;
  cards?: readonly RoleCard[];
  onDetails?: () => void;
}) {
  const { page } = chrome;
  const place = headerPlacement(chrome);
  return (
    <View style={styles.header}>
      <View style={{ marginHorizontal: place.inset }}>
        <View style={[styles.headerRow, styles.playRow]}>
          <View style={styles.titleRow}>
            <Txt variant="modeName" size={place.size} color={page.ink} accessibilityRole="header" numberOfLines={1} style={styles.shrink}>
              {title}
            </Txt>
            {chip}
            {onDetails ? (
              <Press onPress={onDetails} accessibilityLabel={en.a11y.roundDetails} hitSlop={slopFor(space[7.5])} style={[styles.details, { backgroundColor: page.chip }]}>
                <Txt variant="label" color={page.accentText}>
                  {en.mindReader.details}
                </Txt>
              </Press>
            ) : null}
          </View>
          <MenuDots colors={page} onPress={chrome.handlers.onMenu ?? (() => undefined)} />
        </View>
        {subtitle ? (
          <Txt variant="small" color={page.muted} numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {cards && cards.length > 0 ? (
        <View style={styles.cards}>
          {cards.map((card) => (
            <View key={card.label} style={[styles.roleCard, { backgroundColor: page.chip }]}>
              <Txt variant="overline" color={page.muted} numberOfLines={1}>
                {card.label}
              </Txt>
              <Txt variant="optionTitle" color={page.chipInk} numberOfLines={layout.mindReader.roleCardLines} ellipsizeMode="tail">
                {card.value}
              </Txt>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// Quick Play's difficulty chip ("NORMAL ⌄"): opens the difficulty sheet.
export function DifficultyChip({ label, colors, onPress }: { label: string; colors: RegionColors; onPress: () => void }) {
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={format(en.mindReader.quick.chip, { difficulty: label })}
      hitSlop={slopFor(space[6])}
      style={[styles.chip, { backgroundColor: colors.accent }]}
    >
      <Txt variant="badge" color={colors.onAccent}>
        {label}
      </Txt>
      <Icon name="chevronDown" size={layout.icon.sm} color={colors.onAccent} />
    </Press>
  );
}

// Practice: "Practice · 1 of 4", the step's title and Skip.
export function PracticeHeader({ chrome, overline, title, onSkip }: { chrome: Chrome; overline: string; title: string; onSkip: () => void }) {
  const { page } = chrome;
  const place = headerPlacement(chrome);
  return (
    <View style={[styles.headerRow, styles.header, { marginHorizontal: place.inset }]}>
      <View style={styles.shrink}>
        <Txt variant="overline" color={page.muted}>
          {overline}
        </Txt>
        <Txt variant="modeName" size={place.size} color={page.ink} accessibilityRole="header">
          {title}
        </Txt>
      </View>
      <LinkButton label={en.mindReader.practice.skip} colors={page} onPress={onSkip} />
    </View>
  );
}

// The word, as large as fits (two lines at most), its left edge on the kicker's.
export function BigWord({ word, colors, max = layout.mindReader.wordSize, center = false }: { word: string; colors: RegionColors; max?: number; center?: boolean }) {
  const [width, onLayout] = useWidth();
  const size = fittedSize(word, width, { variant: 'word', max, min: textStyles.title.size, maxLines: 2 });
  return (
    <View onLayout={onLayout} style={styles.stretch}>
      <Txt variant="word" size={size} color={colors.ink} accessibilityRole="header" style={center && styles.centerText}>
        {word}
      </Txt>
    </View>
  );
}

// The word on a white card (Show the Clue Giver).
export function WordCard({ word }: { word: string }) {
  const { theme } = usePrefs();
  return (
    <Card style={styles.wordCard}>
      <BigWord word={word} colors={theme.regions.raised} max={layout.mindReader.bigWordSize} center />
    </Card>
  );
}

// Predicted words said, in the order said, each with when and a × to take it back.
export function SpokenList({ rows, onRemove }: { rows: readonly SpokenRow[]; onRemove?: (i: number) => void }) {
  const { theme } = usePrefs();
  const raised = theme.regions.raised;
  if (rows.length === 0) return null;
  return (
    <Card style={styles.list}>
      {rows.map((row, i) => (
        <View key={`${row.label}-${i}`} style={[styles.logRow, i > 0 && { borderTopWidth: layout.stroke.hairline, borderTopColor: raised.rule }]}>
          <Txt variant="label" color={raised.ink} style={mrStyles.grow}>
            <Txt variant="clock" color={raised.accentText}>
              {row.time}
            </Txt>
            {` · ${row.word}`}
          </Txt>
          {onRemove ? (
            <Press
              onPress={() => onRemove(i)}
              accessibilityLabel={format(en.a11y.unspoke, { word: row.word, time: row.time })}
              hitSlop={slopFor(layout.mindReader.removeButton)}
              style={[styles.remove, { backgroundColor: raised.chip }]}
            >
              <Icon name="cross" size={layout.icon.sm} color={raised.muted} />
            </Press>
          ) : null}
        </View>
      ))}
    </Card>
  );
}

// A section label with a note at the right.
export function LabelRow({ label, aside, colors }: { label: string; aside?: string; colors: RegionColors }) {
  return (
    <View style={styles.labelRow}>
      <Txt variant="overline" color={colors.muted}>
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

// Practice: the dark card that explains the step, with its button at the bottom right.
export function CoachCard({ coach, onDismiss }: { coach: { label: string; body: string; action: string }; onDismiss: () => void }) {
  const { theme } = usePrefs();
  const panel = theme.regions.panel;
  return (
    <View style={[styles.coach, { backgroundColor: panel.bg }]} accessibilityLiveRegion="polite">
      <Txt variant="overline" color={panel.muted}>
        {coach.label}
      </Txt>
      <Txt variant="optionTitle" color={panel.ink}>
        {coach.body}
      </Txt>
      <View style={styles.coachAction}>
        <LinkButton label={coach.action} colors={panel} onPress={onDismiss} />
      </View>
    </View>
  );
}

// "Who's playing this turn": a section per role with names as grey pills and the team at the right.
export function DetailsSheet({ visible, onClose, sections, footer }: { visible: boolean; onClose: () => void; sections: readonly DetailsSection[]; footer: string }) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <View style={styles.sheetBody}>
          <SheetHeader title={en.mindReader.detailsSheet.title} colors={colors} onClose={onClose} />
          {sections.map((section, i) => (
            <View key={section.label} style={[styles.detailsSection, i > 0 && { borderTopWidth: layout.stroke.hairline, borderTopColor: colors.rule }]}>
              <View style={styles.labelRow}>
                <Txt variant="overline" color={colors.muted}>
                  {section.label}
                </Txt>
                {section.team ? (
                  <View style={mrStyles.row}>
                    <TeamDot color={section.team.color ?? 0} size={space[2]} />
                    <Txt variant="label" color={colors.ink}>
                      {section.team.name}
                    </Txt>
                  </View>
                ) : null}
              </View>
              <View style={mrStyles.wrap}>
                {section.names.map((name) => (
                  <NamePill key={name} name={name} colors={colors} />
                ))}
              </View>
            </View>
          ))}
          <Txt variant="subline" color={colors.muted}>
            {footer}
          </Txt>
        </View>
      )}
    </Sheet>
  );
}

type FixProps = {
  visible: boolean;
  onClose: () => void;
  got: string;
  guessed: boolean;
  spoken: readonly SpokenEntry[];
  predictions: number;
  rows: (entries: readonly SpokenEntry[]) => SpokenRow[];
  onSave: (fix: { guessed: boolean; spoken: readonly SpokenEntry[]; predictions: number }) => void;
};

// Fix this turn: the outcome, the correct predictions and the words logged (× takes one off).
export function FixSheet({ visible, onClose, got, guessed, spoken, predictions, rows, onSave }: FixProps) {
  const f = en.mindReader.fix;
  const [draft, setDraft] = useState({ guessed, spoken, predictions });
  const [open, setOpen] = useState(false);
  if (visible !== open) {
    setOpen(visible);
    if (visible) setDraft({ guessed, spoken, predictions });
  }
  // The list shows the order they were said in.
  const shown = rows(draft.spoken);
  return (
    <Sheet visible={visible} onClose={onClose}>
      {(colors) => (
        <View style={styles.sheetBody}>
          <SheetHeader title={f.title} colors={colors} onClose={onClose} />
          <LabelRow label={f.outcome} colors={colors} />
          <SegmentSwitch
            options={[
              { value: 'got', label: got },
              { value: 'not', label: f.notGuessed },
            ]}
            value={draft.guessed ? 'got' : 'not'}
            onChange={(v) => setDraft((d) => ({ ...d, guessed: v === 'got' }))}
            colors={colors}
          />
          <Stepper
            label={f.predictions}
            sub={f.predictionsHint}
            value={draft.predictions}
            min={0}
            max={Number.POSITIVE_INFINITY}
            onChange={(n) => setDraft((d) => ({ ...d, predictions: Math.max(0, n), spoken: d.spoken.slice(0, Math.max(0, n)) }))}
            colors={colors}
            fill="raised"
          />
          {shown.length > 0 ? (
            <>
              <LabelRow label={format(f.spoken, { n: draft.spoken.length })} aside={f.removesOne} colors={colors} />
              <SpokenList
                rows={shown}
                onRemove={(i) =>
                  setDraft((d) => {
                    return { ...d, spoken: d.spoken.filter((_, k) => k !== i), predictions: Math.max(0, d.predictions - 1) };
                  })
                }
              />
            </>
          ) : null}
          <Button
            kind="primary"
            label={f.save}
            colors={colors}
            onPress={() => {
              onSave(draft);
              onClose();
            }}
          />
        </View>
      )}
    </Sheet>
  );
}

export const partStyles = StyleSheet.create({
  section: { gap: space[2.5] },
  kicker: { gap: space[1] },
});

const styles = StyleSheet.create({
  page: { flex: 1 },
  fill: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: maxWidth.column, alignSelf: 'center', paddingHorizontal: layout.screen.paddingX },
  content: { flexGrow: 1, gap: space[4], paddingVertical: space[4] },
  center: { justifyContent: 'center' },
  footer: { gap: space[3] },
  header: { gap: space[3], paddingBottom: space[1] },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3], minHeight: layout.minTouch },
  // As tall as the menu button, as on the play screen, so its center sits at the same height.
  playRow: { minHeight: layout.header.menuButton },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], flexShrink: 1 },
  shrink: { flexShrink: 1 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: space[0.5], minHeight: space[6], borderRadius: radius.xs, paddingLeft: space[2], paddingRight: space[1] },
  details: { minHeight: space[7.5], borderRadius: radius.pill, paddingHorizontal: space[3], justifyContent: 'center' },
  menu: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  cards: { flexDirection: 'row', gap: space[1.5], alignItems: 'stretch' },
  roleCard: { flex: 1, minWidth: 0, borderRadius: radius.lg, paddingHorizontal: space[3], paddingVertical: space[2.5], gap: space[0.5] },
  centerText: { textAlign: 'center' },
  wordCard: { paddingVertical: space[6] },
  // The big word takes the full width it is fitted to, even inside a centered stack.
  stretch: { alignSelf: 'stretch' },
  list: { paddingVertical: space[0.5] },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: layout.mindReader.logRow },
  remove: { width: layout.mindReader.removeButton, height: layout.mindReader.removeButton, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space[3] },
  aside: { flexShrink: 1, textAlign: 'right' },
  coach: { borderRadius: radius.xl, padding: space[4], gap: space[1.5] },
  coachAction: { alignItems: 'flex-end' },
  sheetBody: { gap: space[3] },
  detailsSection: { gap: space[2.5], paddingTop: space[3] },
});
