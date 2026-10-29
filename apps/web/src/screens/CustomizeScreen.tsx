'use client';

import { en } from '@unspoken/content';
import { CHARACTER_IDS, type CharacterId } from '@unspoken/core';
import {
  COLOR_MODES,
  LOOK_IDS,
  STYLE_GROUPS,
  editionLooks,
  layout,
  layoutStyles,
  type ColorMode,
  type PaletteId,
  type StyleGroup,
  type StyleId,
} from '@unspoken/design-tokens';
import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

import { StyleThumbnail } from '@/components/customize/StyleThumbnail';
import { SheetHead } from '@/components/sheets/SheetHead';
import { Button } from '@/components/ui/Button';
import { Screen, TextLink } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { SuggestCard } from '@/components/ui/SuggestCard';
import { Swatches } from '@/components/ui/Swatches';
import { characterSrc } from '@/lib/art';
import { useReducedMotion } from '@/lib/hooks';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useEdition } from '@/state/edition';
import { useTheme } from '@/state/theme';

import styles from './CustomizeScreen.module.css';

const copy = en.customize;
const mdCopy = en.md.customize;
const { customizeColumns, customizeRows } = layout.grid;

// Styles in pages of columns × rows, each group (STYLE_GROUPS) starting on a page of its own, under
// its heading when it has one (Halloween). The everyday styles end with the "Want another style?"
// tile.
type StylePage = { ids: readonly StyleId[]; group: StyleGroup['id']; suggest: boolean };
const perPage = customizeColumns * customizeRows;

function stylePages(groups: readonly StyleGroup['id'][]): StylePage[] {
  const pages: StylePage[] = STYLE_GROUPS.filter((g) => groups.includes(g.id)).flatMap(({ id: group, styles }) => {
    const chunks: StylePage[] = [];
    for (let i = 0; i < styles.length; i += perPage) chunks.push({ ids: styles.slice(i, i + perPage), group, suggest: false });
    return chunks;
  });
  const suggestPage = pages.map((p) => p.group).lastIndexOf('everyday');
  if (pages[suggestPage]) pages[suggestPage].suggest = true;
  return pages;
}

const groupHeading = (group: StyleGroup['id']) => (group === 'everyday' ? null : copy.groups[group]);

const modeIcons = { light: 'sun', dark: 'moon' } as const;

// Customize. Unspoken: the style (live thumbnails of the play screen, swiped in pages), the color
// and light or dark. UnspokenMD (home-v4, screen 6): the layout, its own Look (light, dark or the
// phone's setting), a note that its blue is fixed, and the player's character. Every change applies
// at once and is saved.
export function CustomizeScreen() {
  const { edition } = useEdition();
  return (
    <Screen
      tone="canvas"
      width="page"
      back={{ href: routes.home, label: copy.back }}
      action={<TextLink href={routes.home}>{copy.done}</TextLink>}
      title={copy.title}
      sub={edition === 'md' ? mdCopy.sub : copy.sub}
    >
      {edition === 'md' ? <MdSections /> : <UnspokenSections />}
    </Screen>
  );
}

function UnspokenSections() {
  const { selection, update } = useTheme();
  const pinned = layoutStyles[selection.style].color.kind === 'pinned';
  // A Halloween look always draws in its own night colors, so there is no color or mode to pick
  // while one is selected. The saved color and mode stay, for when the player picks another style.
  const ownLook = layoutStyles[selection.style].mode !== undefined;

  return (
    <>
      <StyleCarousel label={copy.style} groups={editionLooks.unspoken.styleGroups} current={selection.style} mode={selection.mode} />

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
    </>
  );
}

function MdSections() {
  const { theme } = useTheme();
  const { look, setLook, character, setCharacter } = useEdition();
  const [picking, setPicking] = useState(false);
  const { palette, styleGroups } = editionLooks.md;

  return (
    <>
      <StyleCarousel label={mdCopy.layout} groups={styleGroups} current={theme.selection.style} mode={theme.mode} palette={palette ?? undefined} />

      <Section label={mdCopy.look}>
        <Segmented
          name="look"
          label={mdCopy.look}
          value={look}
          options={LOOK_IDS.map((id) => ({ value: id, label: mdCopy.looks[id] }))}
          onChange={setLook}
        />
        <p className={cx(styles.muted, text('small'))}>{mdCopy.noColor}</p>
      </Section>

      <Section label={mdCopy.character} aside={mdCopy.characterAside}>
        <div className={styles.characterRow}>
          <CharacterArt id={character} className={styles.characterArt} />
          <span className={styles.characterText}>
            <span className={text('optionTitle')}>{en.md.characters[character]}</span>
            <span className={cx(styles.muted, text('small'))}>{mdCopy.characterNote}</span>
          </span>
          <button type="button" className={cx(styles.change, text('link'))} onClick={() => setPicking(true)}>
            {mdCopy.change}
          </button>
        </div>
      </Section>

      {picking && (
        <CharacterSheet
          value={character}
          onPick={(id) => {
            setCharacter(id);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  );
}

// A character, bare (no circle). Decorative: its name is always written beside or under it.
function CharacterArt({ id, className }: { id: CharacterId; className?: string }) {
  // A static export serves public/ as is, so a plain img (next/image would need its optimizer).
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={characterSrc(id)} alt="" className={className} />;
}

function CharacterSheet({ value, onPick, onClose }: { value: CharacterId; onPick: (id: CharacterId) => void; onClose: () => void }) {
  const id = useId();
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={mdCopy.pickerTitle} note={mdCopy.pickerNote} />
      <div role="radiogroup" aria-labelledby={id} className={styles.characters}>
        {CHARACTER_IDS.map((c) => (
          <label key={c} className={cx(styles.character, c === value && styles.picked)}>
            <input type="radio" name="character" className="visually-hidden" checked={c === value} onChange={() => onPick(c)} />
            <CharacterArt id={c} className={styles.pickerArt} />
            <span className={cx(styles.characterName, text('small'))}>{en.md.characters[c]}</span>
          </label>
        ))}
      </div>
      <Button size="large" onClick={onClose}>
        {mdCopy.done}
      </Button>
    </Sheet>
  );
}

type StyleCarouselProps = {
  label: string;
  groups: readonly StyleGroup['id'][];
  // The style in use (UnspokenMD shows its default while a holiday look is saved).
  current: StyleId;
  mode: ColorMode;
  // An edition's own palette for the thumbnails (UnspokenMD's blue).
  palette?: PaletteId;
};

// The styles as live thumbnails, swiped (or scrolled) a page at a time, with dots under them.
function StyleCarousel({ label, groups, current, mode, palette }: StyleCarouselProps) {
  const { update } = useTheme();
  const reduced = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const [pages] = useState(() => stylePages(groups));
  const lastPage = pages.length - 1;
  const pageOf = (style: StyleId) => Math.max(0, pages.findIndex((p) => p.ids.includes(style)));
  const [page, setPage] = useState(() => pageOf(current));

  const goTo = (index: number, smooth = !reduced) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    setPage(index);
  };

  // Open on the page with the current style.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = pageOf(current) * el.clientWidth;
    // Only on arrival; later picks keep the page the player is on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Section
      label={label}
      aside={
        lastPage > 0 && (
          <button type="button" className={cx(styles.pager, text('label'))} onClick={() => goTo(page < lastPage ? page + 1 : 0)}>
            {page < lastPage ? copy.swipeMore : copy.swipeBack}
          </button>
        )
      }
    >
      <div
        ref={scroller}
        className={styles.carousel}
        role="radiogroup"
        aria-label={label}
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
              <label key={id} className={cx(styles.option, id === current && styles.on)}>
                <input type="radio" name="style" className="visually-hidden" checked={id === current} onChange={() => update({ style: id })} />
                <StyleThumbnail style={id} mode={mode} palette={palette} />
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
  );
}
