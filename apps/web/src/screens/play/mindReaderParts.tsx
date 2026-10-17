'use client';

import { en, type DetailsSection, type RoleCard, type SpokenRow } from '@unspoken/content';
import { format, type SpokenEntry } from '@unspoken/core';
import { layout, textStyles, type LayoutStyle } from '@unspoken/design-tokens';
import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';

import { Card, LabelRow, NamePill, SegmentSwitch, Stepper, TeamDot } from '@/components/mindReader/parts';
import { MenuButton } from '@/components/play/Header';
import { SheetHead } from '@/components/sheets/SheetHead';
import { Button } from '@/components/ui/Button';
import { FittedText } from '@/components/ui/FittedText';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { cx, text } from '@/lib/ui';

import styles from './mindReader.module.css';

// The pieces of a Mind Reader turn: the frame, the header with its role cards, the word, the
// spoken log, the coach card and the sheets.

// The page in the style's page tone: an optional header, the content and the buttons.
export function MRFrame({ layoutStyle, header, children, footer, center = false }: { layoutStyle: LayoutStyle; header?: ReactNode; children: ReactNode; footer: ReactNode; center?: boolean }) {
  return (
    <main className={styles.page} data-region={layoutStyle.regions.page}>
      <div className={styles.column}>
        {header}
        <div className={cx(styles.content, center && styles.center)}>{children}</div>
        <div className={styles.footer}>{footer}</div>
      </div>
    </main>
  );
}

// "Round 2 of 5" with a Details pill and the menu; the role cards under it when given. Cards in a
// row share the tallest card's height, two lines at most with an ellipsis. With no title, `label` is
// a small quiet line in its place (Quick play's Predict).
export function TurnHeader({ layoutStyle, title, label, cards, onDetails, onMenu }: { layoutStyle: LayoutStyle; title: string | null; label?: string; cards?: readonly RoleCard[]; onDetails?: () => void; onMenu: () => void }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerRow}>
        <div className={styles.titleRow}>
          {title ? <h1 className={cx(styles.title, styles.ellipsis, text('modeName'))}>{title}</h1> : label && <p className={cx(styles.muted, styles.ellipsis, text('subline'))}>{label}</p>}
          {onDetails && (
            <button type="button" className={cx(styles.details, text('label'))} aria-label={en.a11y.roundDetails} onClick={onDetails}>
              {en.mindReader.details}
            </button>
          )}
        </div>
        <MenuButton slot={layoutStyle.header} onMenu={onMenu} />
      </div>
      {cards && cards.length > 0 && (
        <div className={styles.cards}>
          {cards.map((card) => (
            <div key={card.label} className={styles.roleCard}>
              <span className={cx(styles.muted, styles.ellipsis, text('overline'))}>{card.label}</span>
              <span className={cx(styles.clamp, text('optionTitle'))} style={{ WebkitLineClamp: layout.mindReader.roleCardLines }}>
                {card.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

// Practice: "Practice · 1 of 4", the step's title and Skip.
export function PracticeHeader({ overline, title, skipHref, onLeave }: { overline: string; title: string; skipHref: string; onLeave: () => void }) {
  return (
    <header className={cx(styles.headerRow, styles.header)}>
      <div className={styles.shrink}>
        <p className={cx(styles.muted, text('overline'))}>{overline}</p>
        <h1 className={text('modeName')}>{title}</h1>
      </div>
      <Link href={skipHref} className={cx(styles.link, text('link'))} onClick={onLeave}>
        {en.mindReader.practice.skip}
      </Link>
    </header>
  );
}

// The word, as large as fits (two lines at most), its left edge on the kicker's.
export function BigWord({ word, max = layout.mindReader.wordSize, center = false }: { word: string; max?: number; center?: boolean }) {
  return <FittedText as="h2" text={word} max={max} min={textStyles.title.size} maxLines={2} className={cx(styles.word, center && styles.centerText, text('word'))} />;
}

// The word on a white card (Show the Clue Giver).
export function WordCard({ word }: { word: string }) {
  return (
    <Card className={styles.wordCard}>
      <BigWord word={word} max={layout.mindReader.bigWordSize} center />
    </Card>
  );
}

// Predicted words said, newest first, each with when and a × to take it back.
export function SpokenList({ rows, onRemove }: { rows: readonly SpokenRow[]; onRemove?: (i: number) => void }) {
  if (rows.length === 0) return null;
  return (
    <Card className={styles.log}>
      <ol className={styles.logList}>
        {rows.map((row, i) => (
          <li key={`${row.label}-${i}`} className={styles.logRow}>
            <span className={cx(styles.grow, text('label'))}>
              <span className={cx(styles.accentText, text('clock'))}>{row.time}</span>
              {` · ${row.word}`}
            </span>
            {onRemove && (
              <button type="button" className={styles.remove} aria-label={format(en.a11y.unspoke, { word: row.word, time: row.time })} onClick={() => onRemove(i)}>
                <Icon name="close" />
              </button>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

// Practice: the dark card that explains the step, with its button at the bottom right.
export function CoachCard({ coach, onDismiss }: { coach: { label: string; body: string; action: string }; onDismiss: () => void }) {
  return (
    <div className={styles.coach} data-region="panel" aria-live="polite">
      <p className={cx(styles.muted, text('overline'))}>{coach.label}</p>
      <p className={text('optionTitle')}>{coach.body}</p>
      <button type="button" className={cx(styles.coachAction, styles.link, text('link'))} onClick={onDismiss}>
        {coach.action}
      </button>
    </div>
  );
}

// "Who's playing this turn": a section per role with names as grey pills and the team at the right.
export function DetailsSheet({ sections, footer, onClose }: { sections: readonly DetailsSection[]; footer: string; onClose: () => void }) {
  const id = useId();
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={en.mindReader.detailsSheet.title} />
      {sections.map((section) => (
        <section key={section.label} className={styles.detailsSection}>
          <div className={styles.labelRow}>
            <h3 className={cx(styles.muted, text('overline'))}>{section.label}</h3>
            {section.team && (
              <span className={cx(styles.teamTag, text('label'))}>
                <TeamDot color={section.team.color ?? 0} small />
                {section.team.name}
              </span>
            )}
          </div>
          <div className={styles.wrap}>
            {section.names.map((name) => (
              <NamePill key={name} name={name} />
            ))}
          </div>
        </section>
      ))}
      <p className={cx(styles.muted, text('subline'))}>{footer}</p>
    </Sheet>
  );
}

type FixProps = {
  onClose: () => void;
  got: string;
  guessed: boolean;
  spoken: readonly SpokenEntry[];
  predictions: number;
  rows: (entries: readonly SpokenEntry[]) => SpokenRow[];
  onSave: (fix: { guessed: boolean; spoken: readonly SpokenEntry[]; predictions: number }) => void;
};

// Fix this turn: the outcome, the correct predictions and the words logged (× takes one off).
export function FixSheet({ onClose, got, guessed, spoken, predictions, rows, onSave }: FixProps) {
  const f = en.mindReader.fix;
  const id = useId();
  const [draft, setDraft] = useState({ guessed, spoken, predictions });
  // The list shows newest first; i counts from the top.
  const shown = rows(draft.spoken).reverse();
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={f.title} />
      <LabelRow label={f.outcome} as="p" />
      <SegmentSwitch
        name="fixOutcome"
        label={f.outcome}
        options={[
          { value: 'got', label: got },
          { value: 'not', label: f.notGuessed },
        ]}
        value={draft.guessed ? 'got' : 'not'}
        onChange={(v) => setDraft((d) => ({ ...d, guessed: v === 'got' }))}
      />
      <Stepper
        label={f.predictions}
        sub={f.predictionsHint}
        value={draft.predictions}
        min={0}
        max={Number.POSITIVE_INFINITY}
        fill="raised"
        onChange={(n) => setDraft((d) => ({ ...d, predictions: Math.max(0, n), spoken: d.spoken.slice(0, Math.max(0, n)) }))}
      />
      {shown.length > 0 && (
        <>
          <LabelRow label={format(f.spoken, { n: draft.spoken.length })} aside={f.removesOne} as="p" />
          <SpokenList
            rows={shown}
            onRemove={(i) =>
              setDraft((d) => {
                const index = d.spoken.length - 1 - i;
                return { ...d, spoken: d.spoken.filter((_, k) => k !== index), predictions: Math.max(0, d.predictions - 1) };
              })
            }
          />
        </>
      )}
      <Button
        size="large"
        onClick={() => {
          onSave(draft);
          onClose();
        }}
      >
        {f.save}
      </Button>
    </Sheet>
  );
}
