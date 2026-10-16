'use client';

import { en } from '@unspoken/content';
import { COLOR_MODES, STYLE_IDS, layout, layoutStyleFor, type StyleId } from '@unspoken/design-tokens';
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

// Styles in pages of columns × rows; the last page ends with the "Want another style?" tile.
const pages: StyleId[][] = [];
for (let i = 0; i < STYLE_IDS.length; i += customizeColumns * customizeRows) pages.push(STYLE_IDS.slice(i, i + customizeColumns * customizeRows));
const lastPage = pages.length - 1;
const pageOf = (style: StyleId) => Math.max(0, pages.findIndex((ids) => ids.includes(style)));

const modeIcons = { light: 'sun', dark: 'moon' } as const;

// Customize: the style (live thumbnails of the play screen, swiped in pages), the color and light
// or dark. Every change applies at once and is saved.
export function CustomizeScreen() {
  const { selection, update } = useTheme();
  const reduced = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(() => pageOf(selection.style));
  const pinned = layoutStyleFor(selection.style, selection.mode).color.kind === 'pinned';

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
          {pages.map((ids, index) => (
            <div key={index} className={styles.page} style={{ '--columns': customizeColumns } as CSSProperties}>
              {ids.map((id) => (
                <label key={id} className={cx(styles.option, id === selection.style && styles.on)}>
                  <input type="radio" name="style" className="visually-hidden" checked={id === selection.style} onChange={() => update({ style: id })} />
                  <StyleThumbnail style={id} mode={selection.mode} />
                  <span className={text('label')}>{copy.styles[id]}</span>
                </label>
              ))}
              {index === lastPage && (
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
    </Screen>
  );
}
