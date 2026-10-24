'use client';

import { en } from '@unspoken/content';
import { COLOR_MODES, STYLE_GROUPS, layout, layoutStyles, type StyleGroup, type StyleId } from '@unspoken/design-tokens';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

import { StyleThumbnail } from '@/components/customize/StyleThumbnail';
import { Screen, TextLink } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { Segmented } from '@/components/ui/Segmented';
import { SuggestCard } from '@/components/ui/SuggestCard';
import { Swatches } from '@/components/ui/Swatches';
import { useReducedMotion } from '@/lib/hooks';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useTheme } from '@/state/theme';

import styles from './CustomizeScreen.module.css';

const copy = en.customize;
const { customizeColumns, customizeRows } = layout.grid;

// Styles in pages of columns × rows, each group (STYLE_GROUPS) starting on a page of its own, under
// its heading when it has one (Halloween). The everyday styles end with the "Want another style?"
// tile.
type StylePage = { ids: readonly StyleId[]; group: StyleGroup['id']; suggest: boolean };
const perPage = customizeColumns * customizeRows;
const pages: StylePage[] = STYLE_GROUPS.flatMap(({ id: group, styles }) => {
  const chunks: StylePage[] = [];
  for (let i = 0; i < styles.length; i += perPage) chunks.push({ ids: styles.slice(i, i + perPage), group, suggest: false });
  return chunks;
});
const suggestPage = pages.map((p) => p.group).lastIndexOf('everyday');
if (pages[suggestPage]) pages[suggestPage].suggest = true;
const lastPage = pages.length - 1;
const pageOf = (style: StyleId) => Math.max(0, pages.findIndex((p) => p.ids.includes(style)));
const groupHeading = (group: StyleGroup['id']) => (group === 'everyday' ? null : copy.groups[group]);

const modeIcons = { light: 'sun', dark: 'moon' } as const;

// Customize: the style (live thumbnails of the play screen, swiped in pages), the color and light
// or dark. Every change applies at once and is saved.
export function CustomizeScreen() {
  const { selection, update } = useTheme();
  const reduced = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(() => pageOf(selection.style));
  const pinned = layoutStyles[selection.style].color.kind === 'pinned';
  // A Halloween look always draws in its own night colors, so there is no color or mode to pick
  // while one is selected. The saved color and mode stay, for when the player picks another style.
  const ownLook = layoutStyles[selection.style].scene !== undefined;

  const goTo = (index: number, smooth = !reduced) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    setPage(index);
  };

  // Open on the page with the current style.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = pageOf(selection.style) * el.clientWidth;
    // Only on arrival; later picks keep the page the player is on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen
      tone="canvas"
      width="page"
      back={{ href: routes.play, label: copy.back }}
      action={<TextLink href={routes.play}>{copy.done}</TextLink>}
      title={copy.title}
      sub={copy.sub}
    >
      <Section
        label={copy.style}
        aside={
          <button type="button" className={cx(styles.pager, text('label'))} onClick={() => goTo(page < lastPage ? page + 1 : 0)}>
            {page < lastPage ? copy.swipeMore : copy.swipeBack}
          </button>
        }
      >
        <div
          ref={scroller}
          className={styles.carousel}
          role="radiogroup"
          aria-label={copy.style}
          onScroll={(event) => {
            const el = event.currentTarget;
            const index = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
            if (index !== page) setPage(index);
          }}
        >
          {pages.map(({ ids, group, suggest }, index) => (
            <div key={index} className={styles.page} style={{ '--columns': customizeColumns } as CSSProperties} role={groupHeading(group) ? 'group' : undefined} aria-label={groupHeading(group) ?? undefined}>
              {groupHeading(group) && <h3 className={cx(styles.groupHeading, text('overline'))}>{groupHeading(group)}</h3>}
              {ids.map((id) => (
                <label key={id} className={cx(styles.option, id === selection.style && styles.on)}>
                  <input type="radio" name="style" className="visually-hidden" checked={id === selection.style} onChange={() => update({ style: id })} />
                  <StyleThumbnail style={id} mode={selection.mode} />
                  <span className={text('label')}>{copy.styles[id]}</span>
                </label>
              ))}
              {suggest && (
                <div className={styles.option}>
                  <span className={styles.suggest}>
                    <SuggestCard look="tile" title={copy.suggest.title} action={copy.suggest.action} href={routes.feedback('customize')} />
                  </span>
                  <span className={cx(styles.muted, text('label'))}>{copy.suggest.label}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className={styles.dots} aria-hidden="true">
          {pages.map((_, index) => (
            <span key={index} className={cx(styles.dot, index === page && styles.active)} />
          ))}
        </div>
      </Section>

      {!ownLook && (
        <>
          <Section label={copy.color} aside={pinned ? copy.pinnedColor : undefined}>
            <Swatches label={copy.color} value={selection.color} onChange={(color) => update({ color })} />
          </Section>

          <Segmented
            name="mode"
            label={COLOR_MODES.map((mode) => copy[mode]).join(' / ')}
            value={selection.mode}
            options={COLOR_MODES.map((mode) => ({ value: mode, label: copy[mode], icon: modeIcons[mode] }))}
            onChange={(mode) => update({ mode })}
          />
        </>
      )}
    </Screen>
  );
}
