import { en } from '@unspoken/content';
import { layout, maxWidth, radius, space, type RegionColors, type TimerBar as TimerBarSlot, type Theme } from '@unspoken/design-tokens';
import { useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '../ui/Icon';
import { Txt } from '../ui/Txt';
import type { HeaderModel, PlayModel } from './model';
import { Banned, pinsToFooter } from './slots/Banned';
import { Controls, fillsBottom, halvesFor, type ControlLabels } from './slots/Controls';
import { MenuButton, ModeLabel, TitleBadge } from './slots/Header';
import { Stats } from './slots/Stats';
import { BigClock, ClockRow, InlineBar, RingClock, TimerBar, TimerChip, TimerDial, TimerRing, type Clock } from './slots/Timer';
import { Word } from './slots/Word';
import type { Swipe } from './useSwipe';

// The play screen for any layout style, assembled from the style's data: one frame per
// arrangement places the zones, and each zone renders the slot variant the style names. Nothing
// here knows a style by name, so a new style is a new entry in the design-tokens catalog.
//
// Without handlers it is a still picture of the model (Customize thumbnails).

export type Insets = { top: number; bottom: number; left: number; right: number };

export type HeaderHandlers = {
  // Card's level badge (difficulty picker) and the other styles' mode pill (mode sheet).
  onBadge?: () => void;
  onModeLabel?: () => void;
  onMenu?: () => void;
  onPause?: () => void;
};

export type PlayHandlers = HeaderHandlers & { swipe: Swipe };

type Props = {
  theme: Theme;
  model: PlayModel;
  handlers?: PlayHandlers;
  insets?: Insets;
  labels?: ControlLabels;
};

const PAD = layout.screen.paddingX;
const NO_INSETS: Insets = { top: 0, bottom: 0, left: 0, right: 0 };

type Frame = {
  theme: Theme;
  model: PlayModel;
  h?: PlayHandlers;
  insets: Insets;
  labels?: ControlLabels;
  page: RegionColors;
  word: RegionColors;
  lower: RegionColors;
  footer: RegionColors;
};

export function PlayView({ theme, model, handlers, insets = NO_INSETS, labels }: Props) {
  const { regions: r, style } = theme;
  const page = r[style.regions.page];
  const panel = style.arrangement === 'lowerPanel' || style.arrangement === 'sheet';
  const lower = style.regions.lower ? r[style.regions.lower] : page;
  const f: Frame = {
    theme,
    model,
    h: handlers,
    insets,
    labels,
    page,
    word: style.regions.word ? r[style.regions.word] : page,
    lower,
    footer: style.regions.controls ? r[style.regions.controls] : panel ? lower : page,
  };
  switch (style.arrangement) {
    case 'ringCard':
      return <RingCardFrame f={f} />;
    case 'floatingCard':
      return <FloatingCardFrame f={f} />;
    case 'stack':
      return <StackFrame f={f} />;
    case 'lowerPanel':
    case 'sheet':
      return <PanelFrame f={f} />;
  }
}

// The top row: the mode and level (or a timer chip when they sit above the word), and at the
// right the header stats, the timer chip or dial and the menu. Reverse and Mind Reader share it.
export function PlayHeader({ theme, model, clock, handlers: h }: { theme: Theme; model: HeaderModel; clock: Clock | null; handlers?: HeaderHandlers }) {
  const { header, timer, stats } = theme.style;
  const colors = theme.regions[theme.style.regions.page];
  const chip = clock && timer.variant === 'chip' ? <TimerChip slot={timer} clock={clock} colors={colors} onPause={h?.onPause} /> : null;
  const dial = clock && timer.variant === 'dial' ? <TimerDial slot={timer} clock={clock} colors={colors} onPause={h?.onPause} /> : null;
  const left =
    header.variant === 'titleBadge' ? (
      <TitleBadge slot={header} colors={colors} model={model} onBadge={h?.onBadge} />
    ) : header.position === 'top' ? (
      <ModeLabel slot={header} colors={colors} model={model} onPress={h?.onModeLabel} />
    ) : (
      chip
    );
  return (
    <View style={styles.topRow}>
      <View style={styles.topLeft}>{left}</View>
      <View style={styles.topRight}>
        {stats.placement === 'header' ? <Stats slot={stats} colors={colors} stats={model.stats} /> : null}
        {header.position === 'top' ? chip : null}
        <MenuButton slot={header} colors={colors} onPress={h?.onMenu} pageColor={colors.bg} />
        {dial}
      </View>
    </View>
  );
}

// --- Zones ---------------------------------------------------------------------------------

function header(f: Frame) {
  return <PlayHeader theme={f.theme} model={f.model} clock={f.model.clock} handlers={f.h} />;
}

function labelAboveWord(f: Frame, colors: RegionColors) {
  const slot = f.theme.style.header;
  if (slot.position !== 'aboveWord' || slot.variant === 'titleBadge') return null;
  return <ModeLabel slot={slot} colors={colors} model={f.model} onPress={f.h?.onModeLabel} />;
}

function statsAt(f: Frame, placement: 'belowHeader' | 'aboveWord' | 'underWord' | 'footer', colors: RegionColors) {
  const slot = f.theme.style.stats;
  return slot.placement === placement ? <Stats slot={slot} colors={colors} stats={f.model.stats} /> : null;
}

// Where the clock and its bar go. A bar or big clock without a bar sits under the header.
function clockAt(f: Frame, place: TimerBarSlot['placement'], colors: RegionColors): ReactNode {
  const { timer } = f.theme.style;
  const clock = f.model.clock;
  const own = timer.bar?.placement ?? (timer.variant === 'bar' || timer.variant === 'bigClock' ? 'belowHeader' : null);
  if (!clock || own !== place) return null;
  const onPause = f.h?.onPause;
  const line = timer.bar ? <TimerBar bar={timer.bar} progress={clock.progress} colors={colors} bleed={PAD} /> : null;
  const row =
    timer.variant === 'bigClock' ? (
      <BigClock slot={timer} clock={clock} colors={colors} onPause={onPause} />
    ) : timer.variant === 'bar' ? (
      <ClockRow slot={timer} clock={clock} colors={colors} onPause={onPause} />
    ) : null;
  switch (place) {
    case 'belowHeader':
      return (
        <View style={styles.zone}>
          {line}
          {row}
        </View>
      );
    case 'belowClock':
      return (
        <View style={styles.zone}>
          {row}
          {line}
        </View>
      );
    case 'belowWord':
      return <InlineBar slot={timer} clock={clock} colors={colors} onPause={onPause} />;
    // The clock stays on the page; the line runs along the panel's top edge (panelLine).
    case 'panelTop':
      return row;
    case 'aboveControls':
      return line;
  }
}

function panelLine(f: Frame, colors: RegionColors) {
  const { bar } = f.theme.style.timer;
  const clock = f.model.clock;
  return clock && bar?.placement === 'panelTop' ? <TimerBar bar={bar} progress={clock.progress} colors={colors} bleed={PAD} /> : null;
}

function word(f: Frame, colors: RegionColors) {
  const card = f.model.card;
  return card ? <Word slot={f.theme.style.word} colors={colors} word={card.card.word} /> : null;
}

function banned(f: Frame, colors: RegionColors) {
  const card = f.model.card;
  if (!card) return null;
  return <Banned slot={f.theme.style.banned} colors={colors} words={card.banned} freshIndex={card.freshIndex} ramp={f.theme.colors.ramp} bleed={PAD} />;
}

// --- Building blocks -----------------------------------------------------------------------

// Whatever moves with the card: it follows the drag, flies out and springs back in.
function Moving({ f, style, pan = false, children }: { f: Frame; style?: StyleProp<ViewStyle>; pan?: boolean; children: ReactNode }) {
  if (!f.h) return <View style={style}>{children}</View>;
  return (
    <Animated.View style={[style, f.h.swipe.cardStyle]} {...(pan ? f.h.swipe.panHandlers : undefined)}>
      {children}
    </Animated.View>
  );
}

// The "› SWIPE" nudge at the right of the card area.
function SwipeHint({ f, colors }: { f: Frame; colors: RegionColors }) {
  if (!f.h) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.hint, { opacity: f.h.swipe.hint }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Icon name="chevronRight" size={layout.icon.md} color={colors.accentText} />
      <Txt variant="badge" color={colors.accentText}>
        {en.play.swipeHint}
      </Txt>
    </Animated.View>
  );
}

// A full-width block in a region's color with the content in the centered game column.
function Band({ colors, f, style, inner, children }: { colors: RegionColors; f: Frame; style?: StyleProp<ViewStyle>; inner?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <View style={[{ backgroundColor: colors.bg, paddingLeft: f.insets.left, paddingRight: f.insets.right }, style]}>
      <View style={[styles.column, inner]}>{children}</View>
    </View>
  );
}

function Top({ f, children }: { f: Frame; children: ReactNode }) {
  return (
    <Band colors={f.page} f={f} inner={[styles.zone, { paddingTop: f.insets.top + layout.screen.paddingTop }]}>
      {children}
    </Band>
  );
}

function Footer({ f, separate }: { f: Frame; separate: boolean }) {
  const { controls } = f.theme.style;
  const colors = f.footer;
  const fills = fillsBottom(controls);
  const card = f.model;
  const note = card.note ? (
    <Txt variant="small" color={colors.muted} style={styles.note}>
      {card.note}
    </Txt>
  ) : null;
  return (
    <Band
      colors={colors}
      f={f}
      inner={[
        styles.zone,
        { paddingTop: separate ? layout.screen.paddingTop : space[3], paddingBottom: fills ? 0 : f.insets.bottom + layout.screen.paddingBottom },
      ]}
    >
      {clockAt(f, 'aboveControls', colors)}
      {statsAt(f, 'footer', colors)}
      {fills ? note : null}
      <Controls
        slot={controls}
        colors={colors}
        halves={halvesFor(f.theme, colors)}
        labels={f.labels}
        canSkip={card.canSkip}
        canCorrect={card.canCorrect}
        onAnswer={f.h?.swipe.answer}
        dx={f.h?.swipe.dx}
        bleed={PAD}
        bottomInset={f.insets.bottom}
      />
      {fills ? null : note}
    </Band>
  );
}

// --- Frames --------------------------------------------------------------------------------

// Card: the word tile inside the timer ring, centered between the header and the swipe links.
function RingCardFrame({ f }: { f: Frame }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const clock = f.model.clock;
  const w = box.w ? Math.min(box.w, layout.card.maxWidth) : layout.card.maxWidth;
  const h = box.h ? Math.min(box.h, layout.card.maxHeight) : layout.card.maxHeight;
  const inset = clock ? layout.card.ringInset : 0;
  return (
    <View style={[styles.page, { backgroundColor: f.page.bg }]}>
      <Top f={f}>{header(f)}</Top>
      <Band colors={f.page} f={f} style={styles.grow} inner={[styles.grow, styles.middle]}>
        <View style={styles.measure} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} />
        <Moving f={f} pan style={{ width: w, height: h }}>
          {clock ? (
            <>
              <TimerRing width={w} height={h} progress={clock.progress} colors={f.page} />
              <RingClock clock={clock} colors={f.page} onPause={f.h?.onPause} />
            </>
          ) : null}
          <View style={[styles.tile, { top: inset, left: inset, right: inset, bottom: inset, backgroundColor: f.word.bg }]}>
            {word(f, f.word)}
            {banned(f, f.word)}
          </View>
        </Moving>
        <SwipeHint f={f} colors={f.page} />
      </Band>
      <Footer f={f} separate={false} />
    </View>
  );
}

// Deck: a raised card floats between the header and the controls.
function FloatingCardFrame({ f }: { f: Frame }) {
  return (
    <View style={[styles.page, { backgroundColor: f.page.bg }]}>
      <Top f={f}>
        {header(f)}
        {clockAt(f, 'belowHeader', f.page)}
        {statsAt(f, 'belowHeader', f.page)}
      </Top>
      <Band colors={f.page} f={f} style={styles.grow} inner={[styles.grow, styles.center, styles.zone]}>
        {statsAt(f, 'aboveWord', f.page)}
        <Moving f={f} pan style={[styles.card, { backgroundColor: f.word.bg, boxShadow: f.theme.shadow.card }]}>
          {labelAboveWord(f, f.word)}
          {word(f, f.word)}
          {banned(f, f.word)}
        </Moving>
        <SwipeHint f={f} colors={f.page} />
      </Band>
      <Footer f={f} separate={false} />
    </View>
  );
}

// Lines, Ledger, Big timer, Chips, Ombre: everything flows down one page.
function StackFrame({ f }: { f: Frame }) {
  const pins = pinsToFooter(f.theme.style.banned);
  return (
    <View style={[styles.page, { backgroundColor: f.page.bg }]}>
      <Top f={f}>
        {header(f)}
        {clockAt(f, 'belowHeader', f.page)}
        {clockAt(f, 'belowClock', f.page)}
        {statsAt(f, 'belowHeader', f.page)}
      </Top>
      <Band colors={f.page} f={f} style={styles.grow} inner={styles.grow}>
        <View style={[styles.grow, styles.content]} {...f.h?.swipe.panHandlers}>
          {labelAboveWord(f, f.page)}
          {statsAt(f, 'aboveWord', f.page)}
          <Moving f={f}>{word(f, f.page)}</Moving>
          {clockAt(f, 'belowWord', f.page)}
          {statsAt(f, 'underWord', f.page)}
          {pins ? <View style={styles.grow} /> : null}
          <Moving f={f}>{banned(f, f.page)}</Moving>
        </View>
        <SwipeHint f={f} colors={f.page} />
      </Band>
      <Footer f={f} separate={f.footer.bg !== f.page.bg} />
    </View>
  );
}

// Split, Ink, Bottom (lower panel) and Sheet (rounded sheet): the word on the page above, the
// banned list and the controls on a panel below.
function PanelFrame({ f }: { f: Frame }) {
  const sheet = f.theme.style.arrangement === 'sheet';
  const pins = pinsToFooter(f.theme.style.banned);
  return (
    <View style={[styles.page, { backgroundColor: f.page.bg }]}>
      <Band colors={f.page} f={f} style={styles.grow} inner={[styles.grow, styles.zone, { paddingTop: f.insets.top + layout.screen.paddingTop, paddingBottom: space[3] }]}>
        {header(f)}
        {clockAt(f, 'belowHeader', f.page)}
        {clockAt(f, 'belowClock', f.page)}
        {statsAt(f, 'belowHeader', f.page)}
        <View style={[styles.grow, styles.center, styles.content]} {...f.h?.swipe.panHandlers}>
          {labelAboveWord(f, f.page)}
          {statsAt(f, 'aboveWord', f.page)}
          <Moving f={f}>{word(f, f.page)}</Moving>
          {clockAt(f, 'belowWord', f.page)}
          {statsAt(f, 'underWord', f.page)}
          <SwipeHint f={f} colors={f.page} />
        </View>
        {clockAt(f, 'panelTop', f.page)}
      </Band>
      <Band colors={f.lower} f={f} style={[styles.grow, sheet && styles.sheet]} inner={styles.grow}>
        {panelLine(f, f.lower)}
        {sheet ? <View style={[styles.grabber, { backgroundColor: f.lower.rule }]} /> : null}
        <View style={[styles.grow, styles.panelContent]} {...f.h?.swipe.panHandlers}>
          {pins ? <View style={styles.grow} /> : null}
          <Moving f={f}>{banned(f, f.lower)}</Moving>
        </View>
      </Band>
      <Footer f={f} separate={f.footer.bg !== f.lower.bg} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, overflow: 'hidden' },
  grow: { flexGrow: 1 },
  column: { width: '100%', maxWidth: maxWidth.column, alignSelf: 'center', paddingHorizontal: PAD },
  zone: { gap: space[3] },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space[3], minHeight: layout.header.menuButton },
  topLeft: { flexShrink: 1, flexGrow: 1 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  middle: { alignItems: 'center', justifyContent: 'center', paddingVertical: space[3] },
  measure: { ...StyleSheet.absoluteFill, margin: space[3] },
  center: { justifyContent: 'center' },
  tile: {
    position: 'absolute',
    borderRadius: radius.card,
    paddingHorizontal: layout.card.paddingX,
    paddingVertical: layout.card.paddingY,
    justifyContent: 'space-between',
    gap: space[4],
    overflow: 'hidden',
  },
  card: { borderRadius: radius.cardLarge, paddingHorizontal: layout.card.paddingX, paddingVertical: layout.card.paddingY, gap: space[6] },
  content: { gap: space[4], paddingTop: space[4] },
  panelContent: { paddingTop: space[5] },
  sheet: { borderTopLeftRadius: layout.sheet.radius, borderTopRightRadius: layout.sheet.radius, marginTop: -layout.sheet.radius / 2 },
  grabber: {
    alignSelf: 'center',
    width: layout.sheet.grabberWidth,
    height: layout.sheet.grabberHeight,
    borderRadius: radius.pill,
    marginTop: layout.sheet.paddingTop,
  },
  hint: { position: 'absolute', right: 0, top: '50%', flexDirection: 'row', alignItems: 'center', gap: space[0.5] },
  note: { textAlign: 'center' },
});
