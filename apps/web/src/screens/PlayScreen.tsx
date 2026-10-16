'use client';

import { layoutStyleFor } from '@unspoken/design-tokens';
import { useRef, useState } from 'react';

import { Spotlight } from '@/components/play/Spotlight';
import { DifficultyPicker } from '@/components/sheets/DifficultyPicker';
import { GameMenu } from '@/components/sheets/GameMenu';
import { ModeSheet } from '@/components/sheets/ModeSheet';
import { readStored, writeStored } from '@/lib/storage';
import { useGame } from '@/state/game';
import { useTheme } from '@/state/theme';

import { MindReaderRound } from './play/MindReaderRound';
import { ReverseRound } from './play/ReverseRound';
import { SwipeRound } from './play/SwipeRound';

// Set once the player has finished or closed How to play, so it opens by itself only on a first visit.
export const TOUR_STORAGE_KEY = 'unspoken.tourSeen';

type SheetKind = 'menu' | 'mode' | 'difficulty';

// The game: the round in the player's style, the sheets over it, and the first-visit tour.
export function PlayScreen() {
  const { round, dispatch, restart, changeDifficulty } = useGame();
  const { selection } = useTheme();
  // The style as drawn in the player's mode (dark mode changes some slots).
  const layoutStyle = layoutStyleFor(selection.style, selection.mode);
  const rootRef = useRef<HTMLDivElement>(null);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [touring, setTouring] = useState(() => readStored(TOUR_STORAGE_KEY) !== true);
  const swipe = round.kind === 'swipe';

  // Sheets pause a swipe round; closing one resumes it unless the player paused it themselves.
  const open = (kind: SheetKind) => {
    if (swipe) dispatch({ type: 'pause', reason: kind === 'menu' ? 'menu' : 'sheet' });
    setSheet(kind);
  };
  const close = () => {
    setSheet(null);
    if (swipe && round.pause !== 'user') dispatch({ type: 'resume' });
  };
  // Leaving for another screen: a round with a clock waits on Paused; one without carries on.
  const leave = () => {
    if (swipe) dispatch(round.clock ? { type: 'pause', reason: 'user' } : { type: 'resume' });
  };
  // Restart and a new level start a fresh round, so the sheet just goes away.
  const fresh = (start: () => void) => {
    setSheet(null);
    start();
  };
  const finishTour = () => {
    writeStored(TOUR_STORAGE_KEY, true);
    setTouring(false);
  };

  const showTour = touring && swipe;
  const props = {
    blocked: showTour || sheet !== null,
    sheetOpen: sheet !== null,
    onMenu: () => open('menu'),
    // The Card badge names only the level, so it opens the level picker; "Mode · Level" opens both.
    onHeader: () => open(layoutStyle.header.variant === 'titleBadge' ? 'difficulty' : 'mode'),
    onLeave: leave,
  };

  return (
    <div ref={rootRef}>
      {round.kind === 'swipe' && <SwipeRound {...props} round={round} layoutStyle={layoutStyle} />}
      {round.kind === 'reverse' && <ReverseRound {...props} round={round} layoutStyle={layoutStyle} />}
      {round.kind === 'mindReader' && <MindReaderRound {...props} round={round} layoutStyle={layoutStyle} />}

      {sheet === 'menu' && (
        <GameMenu
          round={round}
          customizeFirst={layoutStyle.header.menu === 'sliders'}
          onClose={close}
          onRestart={() => fresh(restart)}
          onHowToPlay={
            swipe
              ? () => {
                  close();
                  setTouring(true);
                }
              : undefined
          }
          onLeave={leave}
        />
      )}
      {sheet === 'mode' && (
        <ModeSheet
          round={round}
          onClose={close}
          onPick={(difficulty) => fresh(() => changeDifficulty(difficulty))}
          onRestart={() => fresh(restart)}
          onLeave={leave}
        />
      )}
      {sheet === 'difficulty' && <DifficultyPicker round={round} onClose={close} onPick={(difficulty) => fresh(() => changeDifficulty(difficulty))} />}
      {showTour && <Spotlight rootRef={rootRef} onDone={finishTour} />}
    </div>
  );
}
