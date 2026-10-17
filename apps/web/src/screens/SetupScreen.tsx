'use client';

import { bank, en } from '@unspoken/content';
import {
  canStart,
  categoriesInBank,
  deckSize,
  format,
  formatClock,
  gameConfig,
  hasSkipSetting,
  hasTimeLimit,
  hasTimerSetting,
  isTimeLimitInRange,
  plural,
  withDifficulty,
  type GameSettings,
  type ModeId,
} from '@unspoken/core';
import { layout } from '@unspoken/design-tokens';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DifficultyGrid } from '@/components/game/DifficultyGrid';
import { TimerInput, TimerNote } from '@/components/game/TimerInput';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { Grid } from '@/components/ui/Grid';
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

// New game: difficulty, themes, and the timer and skips where the mode has them. Starts from the
// current settings with the chosen mode.
export function SetupScreen({ mode }: { mode: ModeId }) {
  const game = useGame();
  const router = useRouter();
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...game.settings, mode }));
  const [timerFocused, setTimerFocused] = useState(false);
  const update = (change: Partial<GameSettings>) => setSettings((current) => ({ ...current, ...change }));
  const { difficulty, categories, roundSeconds, skips, noTimeLimit } = settings;
  const cards = deckSize(bank, difficulty, categories);
  const cardsLabel = (n: number) => plural(n, en.units.cards);

  const start = () => {
    if (!canStart(settings)) return;
    game.newGame(settings);
    router.push(routes.play);
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
      <Section label={copy.difficulty}>
        <DifficultyGrid
          kind="pick"
          label={copy.difficulty}
          columns={layout.grid.setupDifficulty}
          current={difficulty}
          onPick={(next) => setSettings((current) => withDifficulty(current, next))}
          detail={(level) => cardsLabel(deckSize(bank, level, categories))}
        />
      </Section>

      <Section label={copy.themes} aside={copy.themesHint}>
        <div className={styles.chips} role="group" aria-label={copy.themes}>
          <Choice type="checkbox" name="themes" look="chip" checked={categories.length === 0} onChange={() => update({ categories: [] })} detail={deckSize(bank, difficulty, [])}>
            {en.themes.all}
          </Choice>
          {themes.map((theme) => (
            <Choice
              key={theme}
              type="checkbox"
              name="themes"
              look="chip"
              checked={categories.includes(theme)}
              onChange={() => update({ categories: toggleCategory(categories, theme) })}
              detail={deckSize(bank, difficulty, [theme])}
            >
              {en.categories[theme]}
            </Choice>
          ))}
        </div>
        {cards < gameConfig.smallDeckCards && (
          <p className={cx(styles.muted, text('hint'))} role="status">
            {format(copy.smallDeck, { cards: cardsLabel(cards) })}
          </p>
        )}
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
    </Screen>
  );
}
