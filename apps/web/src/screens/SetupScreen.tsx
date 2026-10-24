'use client';

import { difficultyRowDetail, en } from '@unspoken/content';
import {
  canStart,
  categoriesInBank,
  categoriesSummary,
  deckSize,
  format,
  formatClock,
  hasSkipSetting,
  hasTimeLimit,
  hasTimerSetting,
  isSmallDeck,
  isTimeLimitInRange,
  modeRules,
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

import { DifficultyTiles } from '@/components/game/DifficultyTiles';
import { DifficultySheet } from '@/components/mindReader/DifficultySheet';
import { CategoriesSheet, DifficultyInfoSheet, SmallDeckSheet } from '@/components/setup/SetupSheets';
import { TimerInput, TimerNote } from '@/components/game/TimerInput';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { Grid } from '@/components/ui/Grid';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { InlineSwitch } from '@/components/ui/InlineSwitch';
import { MindReaderRounds } from '@/components/mindReader/MindReaderRounds';
import { StepTop } from '@/components/mindReader/parts';
import { Section } from '@/components/ui/Section';
import { VersusSettings } from '@/components/versus/VersusSettings';
import { bank, config } from '@/lib/catalog';
import { routes } from '@/lib/routes';
import { toggleCategory } from '@/lib/settings';
import { cx, text } from '@/lib/ui';
import { useGame } from '@/state/game';

import styles from './screens.module.css';

const copy = en.setup;
const themes = categoriesInBank(bank, config);
const summaryCopy = { all: en.themes.all, names: en.categories, many: en.themes.many };

type Open = 'categories' | 'difficulty' | 'info' | 'smallDeck' | null;

// New game: categories, difficulties, and the timer and skips where the mode has them. Starts from
// the current settings with the chosen mode. custom: step 3 of a Custom Mind Reader game, with the
// time limit and rounds at the top.
export function SetupScreen({ mode, custom = false }: { mode: ModeId; custom?: boolean }) {
  const game = useGame();
  const router = useRouter();
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...game.settings, mode }));
  const [timerFocused, setTimerFocused] = useState(false);
  const [open, setOpen] = useState<Open>(null);
  const allCardsTap = useRef<AllCardsTap>(null);
  const update = (change: Partial<GameSettings>) => setSettings((current) => ({ ...current, ...change }));
  const { difficulties, categories, roundSeconds, skips, noTimeLimit } = settings;
  // Step 3 of Versus: the turn's time limit (kept in its own setup), rounds, skips and scoring.
  const versus = modeRules(mode).play === 'versus';
  const turn = game.versus;
  const cards = deckSize(bank, difficulties, categories);
  const cardsLabel = (n: number) => plural(n, en.units.cards);
  const summary = categoriesSummary(categories, summaryCopy, config);
  const difficultyRow = difficultyRowDetail(difficulties, cards, config);
  const categoriesRow = (
    <ChevronRow
      title={copy.categories}
      detail={format(copy.categoriesDetail, { summary, cards: cardsLabel(cards) })}
      label={format(en.a11y.categories, { summary })}
      onClick={() => setOpen('categories')}
    />
  );

  const play = () => {
    game.newGame(settings, custom ? 'custom' : undefined);
    router.push(routes.play);
  };
  const ready = canStart(settings) && (!versus || turn.noTimeLimit || isTimeLimitInRange(turn.turnSeconds));
  const start = () => {
    if (!ready) return;
    if (isSmallDeck(cards)) setOpen('smallDeck');
    else play();
  };
  const onAllCards = () => {
    const tap = tapAllCards(categories, allCardsTap.current, Date.now(), themes, motion.doubleTapMs);
    allCardsTap.current = tap.last;
    update({ categories: tap.categories });
  };

  const limits = { min: formatClock(config.minRoundSeconds), max: formatClock(config.maxRoundSeconds) };
  // The time is checked once the box loses focus; Start waits while it is out of range.
  const timeOutOfRange = hasTimeLimit(settings) && !isTimeLimitInRange(roundSeconds) && !timerFocused;
  const turnOutOfRange = versus && !turn.noTimeLimit && !isTimeLimitInRange(turn.turnSeconds) && !timerFocused;

  const versusTimer = versus && (
    <Section
      label={copy.timer}
      aside={<InlineSwitch label={copy.noLimit} name={en.a11y.noTimeLimit} checked={turn.noTimeLimit} onChange={(on) => game.setVersus((v) => ({ ...v, noTimeLimit: on }))} />}
    >
      <TimerInput
        seconds={turn.turnSeconds}
        invalid={turnOutOfRange}
        disabled={turn.noTimeLimit}
        range={format(copy.timerRange, limits)}
        onFocusChange={setTimerFocused}
        onChange={(seconds) => game.setVersus((v) => ({ ...v, turnSeconds: seconds }))}
      />
      {turnOutOfRange && <TimerNote>{format(copy.timerOutOfRange, limits)}</TimerNote>}
    </Section>
  );

  const timerSection = hasTimerSetting(mode) && !versus && (
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
      {/* Mind Reader scores faster guesses higher; with no limit every guess scores the same. */}
      {custom && noTimeLimit && <p className={cx(styles.muted, text('small'))}>{format(en.mindReader.settings.flatGuess, { points: config.mindReader.scoring.guess })}</p>}
    </Section>
  );

  return (
    <Screen
      tone="base"
      width="column"
      back={custom || versus ? undefined : { href: routes.modes, label: copy.back }}
      action={custom || versus ? undefined : <span className={cx(styles.muted, text('link'))}>{en.modes[mode].name}</span>}
      title={custom || versus ? undefined : copy.title}
      footer={
        <Button size="large" disabled={!ready} onClick={start}>
          {copy.start}
        </Button>
      }
    >
      {custom && (
        <>
          <StepTop step={3} total={3} title={en.mindReader.settings.title} back={{ href: routes.mindReaderLineup, label: en.mindReader.back }} />
          {timerSection}
          <MindReaderRounds />
        </>
      )}
      {versus && (
        <>
          <StepTop step={3} total={3} title={en.versus.settings.title} back={{ href: routes.versusLineup, label: en.mindReader.back }} stepText={en.versus.setup.step} />
          {versusTimer}
          <VersusSettings />
        </>
      )}
      {versus ? (
        // WORDS over the Difficulty and Categories rows, like ROUNDS and SCORING.
        <Section label={en.versus.settings.words}>
          <ChevronRow title={en.versus.settings.difficulty} detail={difficultyRow.detail} label={difficultyRow.a11y} onClick={() => setOpen('difficulty')} />
          {categoriesRow}
        </Section>
      ) : (
        categoriesRow
      )}

      {!versus && (
        <DifficultyTiles picked={difficulties} categories={categories} onToggle={(next) => setSettings((current) => toggleDifficulty(current, next, config))} onInfo={() => setOpen('info')} />
      )}

      {!custom && timerSection}

      {hasSkipSetting(mode) && !versus && (
        <Section label={copy.skips} aside={copy.skipsHint}>
          <Grid columns={layout.grid.skips} role="radiogroup" aria-label={copy.skips}>
            {config.skipOptions.map((option) => (
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
      {/* Versus: info opens from the difficulty sheet, and closing it goes back there. */}
      {open === 'info' && <DifficultyInfoSheet onClose={() => setOpen(versus ? 'difficulty' : null)} picked={difficulties} />}
      {open === 'difficulty' && (
        <DifficultySheet
          settings={settings}
          onClose={() => setOpen((current) => (current === 'difficulty' ? null : current))}
          onApply={(next) => setSettings((current) => ({ ...current, difficulties: next.difficulties }))}
          onInfo={(next) => {
            setSettings((current) => ({ ...current, difficulties: next.difficulties }));
            setOpen('info');
          }}
        />
      )}
      {open === 'smallDeck' && <SmallDeckSheet cards={cards} onBack={() => setOpen(null)} onPlay={play} />}
    </Screen>
  );
}

// A box with a title, a line of detail and a chevron, that opens a sheet (Categories; Versus's
// Difficulty).
function ChevronRow({ title, detail, label, onClick }: { title: string; detail: string; label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.categoriesRow} onClick={onClick} aria-label={label} aria-haspopup="dialog">
      <span className={styles.categoriesText}>
        <span className={text('optionTitle')}>{title}</span>
        <span className={cx(styles.muted, text('small'))}>{detail}</span>
      </span>
      <Icon name="chevronRight" className={styles.muted} />
    </button>
  );
}
