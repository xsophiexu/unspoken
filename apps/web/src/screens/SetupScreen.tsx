'use client';

import { bank, en } from '@unspoken/content';
import {
  canStart,
  categoriesInBank,
  categoriesSummary,
  deckSize,
  format,
  formatClock,
  gameConfig,
  hasSkipSetting,
  hasTimeLimit,
  hasTimerSetting,
  isSmallDeck,
  isTimeLimitInRange,
  plural,
  tapAllCards,
  toggleDifficulty,
  type AllCardsTap,
  type GameSettings,
  type ModeId,
} from '@unspoken/core';
import { layout, motion } from '@unspoken/design-tokens';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { DifficultyGrid } from '@/components/game/DifficultyGrid';
import { CategoriesSheet, DifficultyInfoSheet, SmallDeckSheet } from '@/components/setup/SetupSheets';
import { TimerInput, TimerNote } from '@/components/game/TimerInput';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { Grid } from '@/components/ui/Grid';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { InlineSwitch } from '@/components/ui/InlineSwitch';
import { Section } from '@/components/ui/Section';
import { routes } from '@/lib/routes';
import { toggleCategory } from '@/lib/settings';
import { cx, text } from '@/lib/ui';
import { useGame } from '@/state/game';

import styles from './screens.module.css';

const copy = en.setup;
const themes = categoriesInBank(bank);
const summaryCopy = { all: en.themes.all, names: en.categories, many: en.themes.many };

type Open = 'categories' | 'info' | 'smallDeck' | null;

// New game: categories, difficulties, and the timer and skips where the mode has them. Starts from
// the current settings with the chosen mode.
export function SetupScreen({ mode }: { mode: ModeId }) {
  const game = useGame();
  const router = useRouter();
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...game.settings, mode }));
  const [timerFocused, setTimerFocused] = useState(false);
  const [open, setOpen] = useState<Open>(null);
  const allCardsTap = useRef<AllCardsTap>(null);
  const update = (change: Partial<GameSettings>) => setSettings((current) => ({ ...current, ...change }));
  const { difficulties, categories, roundSeconds, skips, noTimeLimit } = settings;
  const cards = deckSize(bank, difficulties, categories);
  const cardsLabel = (n: number) => plural(n, en.units.cards);
  const summary = categoriesSummary(categories, summaryCopy);

  const play = () => {
    game.newGame(settings);
    router.push(routes.play);
  };
  const start = () => {
    if (!canStart(settings)) return;
    if (isSmallDeck(cards)) setOpen('smallDeck');
    else play();
  };
  const onAllCards = () => {
    const tap = tapAllCards(categories, allCardsTap.current, Date.now(), themes, motion.doubleTapMs);
    allCardsTap.current = tap.last;
    update({ categories: tap.categories });
  };

  const limits = { min: formatClock(gameConfig.minRoundSeconds), max: formatClock(gameConfig.maxRoundSeconds) };
  // The time is checked once the box loses focus; Start waits while it is out of range.
  const timeOutOfRange = hasTimeLimit(settings) && !isTimeLimitInRange(roundSeconds) && !timerFocused;

  return (
    <Screen
      tone="base"
      width="column"
      back={{ href: routes.modes, label: copy.back }}
      action={<span className={cx(styles.muted, text('link'))}>{en.modes[mode].name}</span>}
      title={copy.title}
      footer={
        <Button size="large" disabled={!canStart(settings)} onClick={start}>
          {copy.start}
        </Button>
      }
    >
      <button
        type="button"
        className={styles.categoriesRow}
        onClick={() => setOpen('categories')}
        aria-label={format(en.a11y.categories, { summary })}
        aria-haspopup="dialog"
      >
        <span className={styles.categoriesText}>
          <span className={text('optionTitle')}>{copy.categories}</span>
          <span className={cx(styles.muted, text('small'))}>{format(copy.categoriesDetail, { summary, cards: cardsLabel(cards) })}</span>
        </span>
        <Icon name="chevronRight" className={styles.muted} />
      </button>

      <Section
        label={copy.difficulty}
        aside={
          <span className={styles.difficultyAside}>
            {difficulties.length === 1
              ? copy.difficultyHint
              : format(copy.difficultyPicked, { difficulties: plural(difficulties.length, en.units.difficulties), cards: cardsLabel(cards) })}
            <button type="button" className={styles.infoButton} onClick={() => setOpen('info')} aria-label={en.a11y.difficultyInfo} aria-haspopup="dialog">
              <Icon name="info" />
            </button>
          </span>
        }
      >
        <DifficultyGrid
          kind="pick"
          label={copy.difficulty}
          columns={layout.grid.setupDifficulty}
          current={difficulties}
          onPick={(next) => setSettings((current) => toggleDifficulty(current, next))}
          detail={(level) => cardsLabel(deckSize(bank, level, categories))}
        />
      </Section>

      {hasTimerSetting(mode) && (
        <Section
          label={copy.timer}
          aside={<InlineSwitch label={copy.noLimit} name={en.a11y.noTimeLimit} checked={noTimeLimit} onChange={(on) => update({ noTimeLimit: on })} />}
        >
          <TimerInput
            seconds={roundSeconds}
            invalid={timeOutOfRange}
            disabled={noTimeLimit}
            range={format(copy.timerRange, limits)}
            onFocusChange={setTimerFocused}
            onChange={(seconds) => update({ roundSeconds: seconds })}
          />
          {timeOutOfRange && <TimerNote>{format(copy.timerOutOfRange, limits)}</TimerNote>}
        </Section>
      )}

      {hasSkipSetting(mode) && (
        <Section label={copy.skips} aside={copy.skipsHint}>
          <Grid columns={layout.grid.skips} role="radiogroup" aria-label={copy.skips}>
            {gameConfig.skipOptions.map((option) => (
              <Choice
                key={String(option)}
                type="radio"
                name="skips"
                look="cell"
                checked={option === skips}
                onChange={() => update({ skips: option })}
                label={option === null ? en.a11y.unlimitedSkips : undefined}
              >
                {option === null ? copy.unlimited : option}
              </Choice>
            ))}
          </Grid>
        </Section>
      )}

      {open === 'categories' && (
        <CategoriesSheet
          onClose={() => setOpen(null)}
          available={themes}
          counts={themes.map((theme) => deckSize(bank, difficulties, [theme]))}
          allCount={deckSize(bank, difficulties, [])}
          cards={cards}
          picked={categories}
          onAllCards={onAllCards}
          onToggle={(theme) => update({ categories: toggleCategory(categories, theme) })}
        />
      )}
      {open === 'info' && <DifficultyInfoSheet onClose={() => setOpen(null)} picked={difficulties} />}
      {open === 'smallDeck' && <SmallDeckSheet cards={cards} onBack={() => setOpen(null)} onPlay={play} />}
    </Screen>
  );
}
