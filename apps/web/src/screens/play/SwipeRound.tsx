'use client';

import { en } from '@unspoken/content';
import { formatClock, hasTimeLimit, hasTimerSetting, isClockRunning, pausedStatus, swipeSummary, timeLimitDiffers, type SwipeRoundState } from '@unspoken/core';
import { cardSwipes, type LayoutStyle } from '@unspoken/design-tokens';
import { useEffect, useRef, useState } from 'react';

import { MicCheck } from '@/components/play/MicCheck';
import { swipeModel } from '@/components/play/model';
import { Overlay } from '@/components/play/Overlay';
import { PlayFrame } from '@/components/play/PlayFrame';
import { useSwipe, type SwipeAnswer } from '@/components/play/useSwipe';
import { ChangeTimeLimitRow, TimeLimitSheet } from '@/components/sheets/TimeLimitSheet';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routes';
import { useGame } from '@/state/game';

import type { RoundScreenProps } from './types';
import { useAnswerKeys } from './useAnswerKeys';

// The round ticks once a second; core counts the clock in whole seconds.
const TICK_MS = 1000;

type SwipeRoundProps = RoundScreenProps & { round: SwipeRoundState; layoutStyle: LayoutStyle };

// Classic, Endless, Time Attack, Escalate and Hot Potato: one card at a time in the chosen style.
export function SwipeRound({ round, layoutStyle, blocked, sheetOpen, onMenu, onHeader, onLeave }: SwipeRoundProps) {
  const { dispatch, restart, settings: next, saveSettings } = useGame();
  // The Paused screen's time limit changer. A saved change is for the next turn (Play again, Restart
  // or a new game); this turn keeps its clock.
  const [changingTime, setChangingTime] = useState(false);
  const timed = hasTimerSetting(round.settings.mode);
  const frameRef = useRef<HTMLDivElement>(null);
  const model = swipeModel(round);
  const summary = swipeSummary(round, en);
  // A pause from the menu or a sheet shows as Paused once nothing covers the round any more.
  const paused = round.pause !== null && !sheetOpen;
  const active = !blocked && !summary && !round.passing && !paused;

  const { surface, answer } = useSwipe({
    frameRef,
    can: { correct: active && model.canCorrect, skip: active && model.canSkip },
    onAnswer: (kind: SwipeAnswer) => dispatch({ type: kind }),
    cardKey: model.card?.key ?? null,
    drags: cardSwipes(layoutStyle),
  });
  useAnswerKeys(active, answer);

  const running = isClockRunning(round) && !blocked;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => dispatch({ type: 'tick' }), TICK_MS);
    return () => window.clearInterval(id);
  }, [running, dispatch]);

  const tone = layoutStyle.regions.page;
  let overlay = null;
  if (summary) {
    overlay = (
      <Overlay
        tone={tone}
        label={summary.label}
        title={summary.value ?? summary.title}
        big={summary.value !== null}
        sub={summary.sub}
        actions={
          <>
            <Button size="large" onClick={restart}>
              {en.over.playAgain}
            </Button>
            <Button size="large" variant="secondary" href={routes.modes}>
              {en.over.changeSettings}
            </Button>
          </>
        }
      />
    );
  } else if (round.passing) {
    overlay = (
      <Overlay
        tone={tone}
        label={en.pass.label}
        title={en.pass.title}
        corner={round.clock && en.pass.timerPaused}
        actions={
          <Button size="large" onClick={() => dispatch({ type: 'ready' })}>
            {en.pass.ready}
          </Button>
        }
      />
    );
  } else if (paused) {
    overlay = (
      <Overlay
        tone={tone}
        label={en.paused.label}
        title={model.clock?.label ?? model.modeName}
        big={model.clock !== null}
        sub={pausedStatus(round, en)}
        extra={
          timed && (
            <>
              <ChangeTimeLimitRow
                value={hasTimeLimit(next) ? formatClock(next.roundSeconds) : en.paused.noLimit}
                pending={timeLimitDiffers(round.settings, next)}
                onClick={() => setChangingTime(true)}
              />
              {changingTime && (
                <TimeLimitSheet
                  value={next}
                  clock={model.clock?.label ?? null}
                  onClose={() => setChangingTime(false)}
                  onSave={(limit) => {
                    saveSettings({ ...next, ...limit });
                    setChangingTime(false);
                  }}
                />
              )}
            </>
          )
        }
        actions={
          <>
            <Button size="large" onClick={() => dispatch({ type: 'resume' })}>
              {en.paused.resume}
            </Button>
            <Button size="large" variant="secondary" href={routes.modes} onClick={onLeave}>
              {en.paused.changeSettings}
            </Button>
            <Button size="large" variant="quiet" onClick={restart}>
              {en.paused.newGame}
            </Button>
          </>
        }
      />
    );
  }

  return (
    <>
      <PlayFrame
        layoutStyle={layoutStyle}
        model={model}
        frameRef={frameRef}
        surface={surface}
        overlay={overlay}
        actions={{
          onCorrect: () => answer('correct'),
          onSkip: () => answer('skip'),
          onPause: () => dispatch({ type: 'pause', reason: 'user' }),
          onMenu,
          onHeader,
        }}
      />
      <MicCheck card={model.card} active={active} />
    </>
  );
}
