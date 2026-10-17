import { en } from '@unspoken/content';
import { layout, maxWidth, motion, playMargins, radius, ringCardSize, screenClass, space, type PlayMargins, type RegionColors, type TimerBar as TimerBarSlot, type Theme } from '@unspoken/design-tokens';
import { useState, type ReactNode } from 'react';
import { Animated, ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';

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
// The header and controls always stay on screen. The middle takes the space between them, with
// elastic gaps, and scrolls only when its content can't fit (small phones, Escalate's ten words).
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
  // The size the screen is drawn at, when it isn't the window's (thumbnails).
  screen?: { width: number; height: number };
};

const NO_INSETS: Insets = { top: 0, bottom: 0, left: 0, right: 0 };

type Frame = {
  theme: Theme;
  model: PlayModel;
  h?: PlayHandlers;
  insets: Insets;
  labels?: ControlLabels;
  // A short screen (small phones): a smaller word, compact banned lists and less room under the
  // controls.
  short: boolean;
  // A narrow screen (small phones): a smaller word set tighter, and compact banned lists.
  narrow: boolean;
  // A large screen (big phones): a larger header title and the controls a little higher.
  large: boolean;
  // The play screen margins in this style. Panels, bands and bars that run edge to edge bleed out by
  // the side margin.
  margins: PlayMargins;
  page: RegionColors;
  word: RegionColors;
  lower: RegionColors;
  footer: RegionColors;
};

export function PlayView({ theme, model, handlers, insets = NO_INSETS, labels, screen }: Props) {
  const window = useWindowDimensions();
  const size = screenClass((screen ?? window).width, (screen ?? window).height);
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
    ...size,
    margins: playMargins(style),
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
// right the header stats, the timer chip or dial and the menu. A dial beside the mode label comes
// before the menu; in a row of buttons alone it sits at the far right. Reverse and Mind Reader
// share this header.
// titleScale: Card's mode name at this much its style's size (layout.largeScreen).
export function PlayHeader({ theme, model, clock, handlers: h, titleScale = 1 }: { theme: Theme; model: HeaderModel; clock: Clock | null; handlers?: HeaderHandlers; titleScale?: number }) {
  const { header, timer, stats } = theme.style;
  const colors = theme.regions[theme.style.regions.page];
  const top = header.position === 'top';
  const chip = clock && timer.variant === 'chip' ? <TimerChip slot={timer} clock={clock} colors={colors} onPause={h?.onPause} /> : null;
  const dial = clock && timer.variant === 'dial' ? <TimerDial slot={timer} clock={clock} colors={colors} onPause={h?.onPause} /> : null;
  const left =
    header.variant === 'titleBadge' ? (
      <TitleBadge slot={titleScale === 1 ? header : { ...header, size: Math.round(header.size * titleScale) }} colors={colors} model={model} onBadge={h?.onBadge} />
    ) : top ? (
      <ModeLabel slot={header} colors={colors} model={model} onPress={h?.onModeLabel} />
    ) : (
      chip
    );
  return (
    <View style={[styles.topRow, { alignItems: header.variant === 'titleBadge' ? 'flex-start' : 'center' }]}>
      <View style={styles.topLeft}>{left}</View>
      <View style={styles.topRight}>
        {stats.placement === 'header' ? <Stats slot={stats} colors={colors} stats={model.stats} /> : null}
        {top ? chip : null}
        {top ? dial : null}
        <MenuButton slot={header} colors={colors} onPress={h?.onMenu} pageColor={colors.bg} />
        {top ? null : dial}
      </View>
    </View>
  );
}

// --- Zones ---------------------------------------------------------------------------------

function header(f: Frame) {
  return <PlayHeader theme={f.theme} model={f.model} clock={f.model.clock} handlers={f.h} titleScale={f.large ? layout.largeScreen.titleScale : 1} />;
}

function statsAt(f: Frame, placement: 'belowHeader' | 'aboveWord' | 'underWord' | 'footer', colors: RegionColors) {
  const slot = f.theme.style.stats;
  return slot.placement === placement ? <Stats slot={slot} colors={colors} stats={f.model.stats} /> : null;
}

// Where the clock and its bar go. A bar or big clock without a bar sits under the header. A bleeding
// bar runs out past the side margins (bleed 0 when it is already full width).
function clockAt(f: Frame, place: TimerBarSlot['placement'], colors: RegionColors, bleed = f.margins.paddingX): ReactNode {
  const { timer } = f.theme.style;
  const clock = f.model.clock;
  const own = timer.bar?.placement ?? (timer.variant === 'bar' || timer.variant === 'bigClock' ? 'belowHeader' : null);
  if (!clock || own !== place) return null;
  const onPause = f.h?.onPause;
  const line = <TimerBar slot={timer} progress={clock.progress} colors={colors} bleed={bleed} />;
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

// The line along the top edge of the lower panel, in the page's timer colors.
function panelLine(f: Frame) {
  const { timer } = f.theme.style;
  const clock = f.model.clock;
  return clock && timer.bar?.placement === 'panelTop' ? <TimerBar slot={timer} progress={clock.progress} colors={f.page} /> : null;
}

function banned(f: Frame, colors: RegionColors) {
  const card = f.model.card;
  if (!card) return null;
  return <Banned slot={f.theme.style.banned} colors={colors} words={card.banned} freshIndex={card.freshIndex} ramp={f.theme.colors.ramp} bleed={f.margins.paddingX} small={f.short || f.narrow} />;
}

// The mode label above the word (when the style puts it there), the word, and what follows it:
// the clock bar under the word and the stats. On a card, stats above the word sit outside it.
function WordBlock({ f, colors, moving = false, onCard = false }: { f: Frame; colors: RegionColors; moving?: boolean; onCard?: boolean }) {
  const card = f.model.card;
  const slot = f.theme.style.header;
  const label = slot.position === 'aboveWord' && slot.variant !== 'titleBadge' ? <ModeLabel slot={slot} colors={colors} model={f.model} onPress={f.h?.onModeLabel} /> : null;
  const word = card ? <Word slot={f.theme.style.word} colors={colors} word={card.card.word} short={f.short} narrow={f.narrow} /> : null;
  return (
    <View style={styles.wordBlock}>
      {onCard ? null : statsAt(f, 'aboveWord', colors)}
      <View style={styles.labelled}>
        {label}
        {moving ? <Moving f={f}>{word}</Moving> : word}
      </View>
      {clockAt(f, 'belowWord', colors)}
      {statsAt(f, 'underWord', colors)}
    </View>
  );
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

// Space that grows from `min` up to `max` when the screen has room and closes up when it doesn't.
function Gap({ min = 0, max }: { min?: number; max?: number }) {
  return <View style={[styles.fill, { minHeight: min }, max !== undefined && { maxHeight: max }]} />;
}

// A frame's middle: fills the space it is given, takes the swipe, and scrolls when its content is
// taller than that space. It spans the side margins (and pads its content by them instead), so
// lists that run edge to edge aren't clipped by the scroll view.
function Middle({ f, style, children }: { f: Frame; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <ScrollView
      style={[styles.fill, { marginHorizontal: -f.margins.paddingX }]}
      contentContainerStyle={[styles.grow, { paddingHorizontal: f.margins.paddingX }]}
      scrollEnabled={!!f.h}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.grow, style]} {...f.h?.swipe.panHandlers}>
        {children}
      </View>
    </ScrollView>
  );
}

// The word above the banned list on a card or tile, scrolling inside when both can't fit.
function CardBody({ f, colors }: { f: Frame; colors: RegionColors }) {
  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.cardBody} scrollEnabled={!!f.h} bounces={false} showsVerticalScrollIndicator={false}>
      <WordBlock f={f} colors={colors} onCard />
      {banned(f, colors)}
    </ScrollView>
  );
}

// "› SWIPE" under the card's left edge, shown while the swipe hint slides the card away. It is drawn
// before the card so the card covers it until it moves.
function SwipeHint({ f, colors }: { f: Frame; colors: RegionColors }) {
  if (!f.h) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.hint, { left: f.margins.paddingX + motion.hint.labelInsetPx, opacity: f.h.swipe.hint }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
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
      <View style={[styles.column, { paddingHorizontal: f.margins.paddingX }, inner]}>{children}</View>
    </View>
  );
}

function Top({ f, children }: { f: Frame; children: ReactNode }) {
  return (
    <Band colors={f.page} f={f} inner={[styles.zone, { paddingTop: f.insets.top + f.margins.paddingTop }]}>
      {children}
    </Band>
  );
}

// The footer stats, the note and the controls. A timer line above the controls sits right on them.
// A footer in its own color (Ombre) leaves footerTop above its contents. A split bar spans the whole
// window, down through the bottom safe area.
function Footer({ f, separate }: { f: Frame; separate: boolean }) {
  const { controls: slot } = f.theme.style;
  const colors = f.footer;
  const fills = fillsBottom(slot);
  const { model } = f;
  const note = model.note ? (
    <Txt variant="small" color={colors.muted}>
      {model.note}
    </Txt>
  ) : null;
  const controls = (
    <Controls
      slot={slot}
      colors={colors}
      halves={halvesFor(f.theme, colors)}
      labels={f.labels}
      canSkip={model.canSkip}
      canCorrect={model.canCorrect}
      onAnswer={f.h?.swipe.answer}
      dx={f.h?.swipe.dx}
      bottomInset={f.insets.bottom}
    />
  );
  const stats = statsAt(f, 'footer', colors);
  const line = (bleed?: number) => clockAt(f, 'aboveControls', colors, bleed);
  const under = f.margins.paddingBottom + (f.large ? layout.largeScreen.controlsLift : 0);
  const pad = { paddingTop: separate ? f.margins.footerTop : space[3], paddingBottom: f.insets.bottom + (f.short ? Math.min(under, space[3]) : under) };
  if (!fills) {
    return (
      <Band colors={colors} f={f} inner={[styles.zone, pad]}>
        {stats}
        <View>
          {line()}
          {controls}
        </View>
        {note}
      </Band>
    );
  }
  return (
    <View style={{ backgroundColor: colors.bg }}>
      {stats || note ? (
        <Band colors={colors} f={f} inner={[styles.zone, { paddingTop: pad.paddingTop, paddingBottom: space[3] }]}>
          {stats}
          {note}
        </Band>
      ) : null}
      {line(0)}
      {controls}
    </View>
  );
}

// --- Frames --------------------------------------------------------------------------------

// Card: the word tile inside the timer ring, centered between the header and the swipe links.
function RingCardFrame({ f }: { f: Frame }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const clock = f.model.clock;
  const { width: w, height: h } = ringCardSize(box.w, box.h);
  const inset = clock ? layout.card.ringInset : 0;
  return (
    <View style={[styles.page, { backgroundColor: f.page.bg }]}>
      <Top f={f}>{header(f)}</Top>
      <Band colors={f.page} f={f} style={styles.fill} inner={[styles.fill, styles.middle]}>
        <View style={[styles.measure, { marginHorizontal: f.margins.paddingX }]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} />
        <SwipeHint f={f} colors={f.page} />
        {h > 0 ? (
          <Moving f={f} pan style={{ width: w, height: h }}>
            {clock ? (
              <>
                <TimerRing width={w} height={h} progress={clock.progress} colors={f.page} />
                <RingClock slot={f.theme.style.timer} clock={clock} colors={f.page} onPause={f.h?.onPause} />
              </>
            ) : null}
            <View style={[styles.tile, { top: inset, left: inset, right: inset, bottom: inset, backgroundColor: f.word.bg }]}>
              <CardBody f={f} colors={f.word} />
            </View>
          </Moving>
        ) : null}
      </Band>
      <Footer f={f} separate={false} />
    </View>
  );
}

// Deck: a raised card floats between the header and the controls, shrinking on short screens.
function FloatingCardFrame({ f }: { f: Frame }) {
  return (
    <View style={[styles.page, { backgroundColor: f.page.bg }]}>
      <Top f={f}>
        {header(f)}
        {clockAt(f, 'belowHeader', f.page)}
        {statsAt(f, 'belowHeader', f.page)}
      </Top>
      <Band colors={f.page} f={f} style={styles.fill} inner={[styles.fill, styles.center, styles.floating]}>
        <SwipeHint f={f} colors={f.page} />
        {statsAt(f, 'aboveWord', f.page)}
        <Moving f={f} pan style={[styles.card, { backgroundColor: f.word.bg, boxShadow: f.theme.shadow.card }]}>
          <CardBody f={f} colors={f.word} />
        </Moving>
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
      <Band colors={f.page} f={f} style={styles.fill} inner={styles.fill}>
        <SwipeHint f={f} colors={f.page} />
        <Middle f={f} style={!pins && styles.stack}>
          <Gap min={space[3]} max={space[10]} />
          <WordBlock f={f} colors={f.page} moving />
          <Gap min={space[3]} max={space[5]} />
          {pins ? <Gap /> : null}
          <Moving f={f}>{banned(f, f.page)}</Moving>
        </Middle>
      </Band>
      <Footer f={f} separate={f.footer.bg !== f.page.bg} />
    </View>
  );
}

// Split, Ink, Bottom (lower panel) and Sheet (rounded sheet): the word on the page above, the
// banned list and the controls on a panel below. The panel takes the space under the word, or for
// a 'content' panel wraps its list and controls at the bottom.
function PanelFrame({ f }: { f: Frame }) {
  const { style } = f.theme;
  const sheet = style.arrangement === 'sheet';
  const fit = style.panel?.size === 'content';
  const corner = sheet ? layout.sheet.radius : style.panel ? radius[style.panel.radius] : 0;
  const upper = (
    <>
      <Gap min={space[3]} max={space[8]} />
      <WordBlock f={f} colors={f.page} moving />
      {clockAt(f, 'panelTop', f.page)}
    </>
  );
  return (
    <View style={[styles.page, { backgroundColor: f.page.bg }]}>
      <Band colors={f.page} f={f} style={fit && styles.fill} inner={[styles.zone, fit && styles.fill, { paddingTop: f.insets.top + f.margins.paddingTop }]}>
        <SwipeHint f={f} colors={f.page} />
        {header(f)}
        {clockAt(f, 'belowHeader', f.page)}
        {clockAt(f, 'belowClock', f.page)}
        {statsAt(f, 'belowHeader', f.page)}
        {fit ? (
          <Middle f={f} style={styles.stack}>
            {upper}
          </Middle>
        ) : (
          <View style={styles.stack} {...f.h?.swipe.panHandlers}>
            {upper}
          </View>
        )}
      </Band>
      <View style={[!fit && styles.fill, styles.panel, { backgroundColor: f.lower.bg, borderTopLeftRadius: corner, borderTopRightRadius: corner }]}>
        {panelLine(f)}
        {sheet ? <View style={[styles.grabber, { backgroundColor: f.lower.rule }]} /> : null}
        <Band colors={f.lower} f={f} style={!fit && styles.fill} inner={[!fit && styles.fill, styles.panelContent]}>
          {fit ? (
            <View {...f.h?.swipe.panHandlers}>
              <Moving f={f}>{banned(f, f.lower)}</Moving>
            </View>
          ) : (
            <Middle f={f}>
              <Moving f={f}>{banned(f, f.lower)}</Moving>
            </Middle>
          )}
        </Band>
        <Footer f={f} separate={f.footer.bg !== f.lower.bg} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, overflow: 'hidden' },
  fill: { flex: 1, minHeight: 0 },
  grow: { flexGrow: 1 },
  column: { width: '100%', maxWidth: maxWidth.column, alignSelf: 'center' },
  zone: { gap: space[3] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3], minHeight: layout.header.menuButton },
  topLeft: { flexShrink: 1, flexGrow: 1, alignItems: 'flex-start' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  middle: { alignItems: 'center', justifyContent: 'center', paddingVertical: space[3] },
  // The space the ring can take (inside the side margins, which an absolute fill would ignore), with
  // room above and below for the clock on its top edge.
  measure: { ...StyleSheet.absoluteFill, marginVertical: space[3] },
  center: { justifyContent: 'center' },
  floating: { gap: space[2.5], paddingVertical: space[4] },
  tile: { position: 'absolute', borderRadius: radius.card, overflow: 'hidden' },
  card: { height: layout.card.floatingHeight, flexShrink: 1, borderRadius: radius.cardLarge },
  cardBody: { flexGrow: 1, justifyContent: 'space-between', gap: space[6], paddingHorizontal: layout.card.paddingX, paddingVertical: layout.card.paddingY },
  wordBlock: { gap: space[4] },
  labelled: { gap: space[1] },
  stack: { paddingBottom: space[3] },
  panel: { overflow: 'hidden' },
  panelContent: { paddingTop: space[5] },
  grabber: {
    alignSelf: 'center',
    width: layout.sheet.grabberWidth,
    height: layout.sheet.grabberHeight,
    borderRadius: radius.pill,
    marginTop: layout.sheet.paddingTop,
  },
  hint: { position: 'absolute', top: 0, bottom: 0, width: motion.hint.labelWidthPx, alignItems: 'center', justifyContent: 'center', gap: motion.hint.labelGapPx },
});
