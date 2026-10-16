import { en } from '@unspoken/content';
import { COLOR_IDS, STYLE_IDS, layout, layoutStyles, palettes, radius, space, type RegionColors, type StyleId } from '@unspoken/design-tokens';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Thumbnail } from '../play/Thumbnail';
import { goBack } from '../nav';
import { usePrefs } from '../state/prefs';
import { LinkButton } from '../ui/Button';
import { useWidth } from '../ui/fit';
import { Grid } from '../ui/Grid';
import { Press } from '../ui/Press';
import { Screen, ScreenTitle, ScreenTop, SectionLabel } from '../ui/Screen';
import { Segmented } from '../ui/Segmented';
import { SuggestCard } from '../ui/SuggestCard';
import { Swatch } from '../ui/Swatch';
import { Txt } from '../ui/Txt';

const { customizeColumns: COLUMNS, customizeRows: ROWS } = layout.grid;
const GAP = space[3];
const PAGES = [STYLE_IDS.slice(0, COLUMNS * ROWS), STYLE_IDS.slice(COLUMNS * ROWS)] as const;
// On the reference screen a thumbnail is layout.thumbnail.scale of the screen; keep that share of
// its grid cell at any width.
const REFERENCE_CELL = (layout.referenceScreen.width - 2 * layout.screen.paddingX - (COLUMNS - 1) * GAP) / COLUMNS;
const THUMB_SHARE = (layout.thumbnail.scale * layout.referenceScreen.width) / REFERENCE_CELL;
// The selection ring and its gap around each thumbnail.
const FRAME = 2 * layout.stroke.focus;

// Customize: the layout style (two pages of live thumbnails), the color and light or dark.
export default function CustomizeScreen() {
  const { selection, theme, setLook } = usePrefs();
  const [width, onLayout] = useWidth();
  const [page, setPage] = useState(0);
  const pager = useRef<ScrollView>(null);
  const c = en.customize;
  const cell = (width - (COLUMNS - 1) * GAP) / COLUMNS;
  const thumb = Math.floor(cell * THUMB_SHARE);
  const pinned = theme.style.color.kind === 'pinned';

  const show = (next: number) => {
    setPage(next);
    pager.current?.scrollTo({ x: next * width, animated: true });
  };

  return (
    <Screen tone="canvas" width="page">
      {(colors) => (
        <>
          <ScreenTop left={<LinkButton label={c.back} colors={colors} onPress={goBack} />} right={<LinkButton label={c.done} colors={colors} onPress={goBack} />} />
          <ScreenTitle title={c.title} sub={c.sub} colors={colors} />

          <View style={styles.section} onLayout={onLayout}>
            <View style={styles.labelRow}>
              <SectionLabel label={c.style} colors={colors} />
              <LinkButton quiet label={page === 0 ? c.swipeMore : c.swipeBack} colors={colors} onPress={() => show(page === 0 ? 1 : 0)} />
            </View>
            {width > 0 ? (
              <ScrollView
                ref={pager}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
                onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
                scrollEventThrottle={64}
              >
                {PAGES.map((ids, p) => (
                  <View key={p} style={{ width }}>
                    <Grid columns={COLUMNS} gap={GAP}>
                      {ids.map((id) => (
                        <StyleCell key={id} id={id} thumb={thumb} colors={colors} selected={id === selection.style} onPress={() => setLook({ style: id })} />
                      ))}
                      {p === PAGES.length - 1 ? (
                        <View style={styles.cell}>
                          <SuggestCard
                            shape="tile"
                            title={c.suggest.title}
                            action={c.suggest.action}
                            colors={colors}
                            width={thumb + 2 * FRAME}
                            height={thumb * (layout.referenceScreen.height / layout.referenceScreen.width) + 2 * FRAME}
                            onPress={() => router.push({ pathname: '/feedback', params: { from: 'customize' } })}
                          />
                          <Txt variant="hint" color={colors.muted}>
                            {c.suggest.label}
                          </Txt>
                        </View>
                      ) : null}
                    </Grid>
                  </View>
                ))}
              </ScrollView>
            ) : null}
            <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {PAGES.map((_, p) => (
                <View key={p} style={[styles.dot, { backgroundColor: p === page ? colors.ink : colors.outline, width: p === page ? space[5] : space[2] }]} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel label={c.color} aside={pinned ? c.pinnedColor : undefined} colors={colors} />
            <View accessibilityRole="radiogroup" style={styles.swatches}>
              {COLOR_IDS.map((id) => (
                <Swatch
                  key={id}
                  color={palettes[id].swatch}
                  label={c.colors[id]}
                  selected={id === selection.color}
                  onPress={() => setLook({ color: id })}
                  ring={colors.ink}
                  gap={colors.bg}
                />
              ))}
            </View>
          </View>

          <Segmented
            options={[
              { value: 'light', label: c.light, icon: 'sun' },
              { value: 'dark', label: c.dark, icon: 'moon' },
            ]}
            value={selection.mode}
            onChange={(mode) => setLook({ mode })}
            colors={colors}
          />
        </>
      )}
    </Screen>
  );
}

function StyleCell({ id, thumb, colors, selected, onPress }: { id: StyleId; thumb: number; colors: RegionColors; selected: boolean; onPress: () => void }) {
  const { selection } = usePrefs();
  const look = selected ? selection : { style: id, color: layoutStyles[id].thumbnailColor, mode: selection.mode };
  return (
    <Press onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={en.customize.styles[id]} style={styles.cell}>
      <View style={[styles.ring, { borderColor: selected ? colors.ink : 'transparent' }]}>
        <Thumbnail selection={look} width={thumb} />
      </View>
      <Txt variant={selected ? 'topicChip' : 'hint'} color={selected ? colors.ink : colors.muted} numberOfLines={1}>
        {en.customize.styles[id]}
      </Txt>
    </Press>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[3] },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cell: { alignItems: 'center', gap: space[2] },
  ring: { borderRadius: layout.thumbnail.radius + FRAME, borderWidth: layout.stroke.focus, padding: layout.stroke.focus },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space[1.5] },
  dot: { height: space[1.5], borderRadius: radius.pill },
  swatches: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: space[2] },
});
