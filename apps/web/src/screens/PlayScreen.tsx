'use client';

import { en } from '@unspoken/content';
import { layoutStyleFor, modeFor } from '@unspoken/design-tokens';
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
import { VersusRound } from './play/VersusRound';

// The How to play version the player last finished or closed. It opens by itself on the first game,
// and again once whenever the walkthrough changes (a returning player who saw an older one, saved
// here as true, gets the new one).
export const TOUR_STORAGE_KEY = 'unspoken.tourSeen';
const tourDue = () => readStored(TOUR_STORAGE_KEY) !== en.howToPlay.version;

type SheetKind = 'menu' | 'mode' | 'difficulty';

// The game: the round in the player's style, the sheets over it, and the first-visit tour.
export function PlayScreen() {
  const { round, dispatch, restart, changeDifficulty } = useGame();
  const { selection } = useTheme();
  // The style as drawn in the mode in use (dark mode changes some slots; a Halloween look is always dark).
  const layoutStyle = layoutStyleFor(selection.style, modeFor(selection));
  const rootRef = useRef<HTMLDivElement>(null);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [touring, setTouring] = useState(tourDue);
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
    if (round.kind === 'versus' && round.phase === 'turn' && round.clock) dispatch({ type: 'pause' });
  };
  // Restart and a new level start a fresh round, so the sheet just goes away.
  const fresh = (start: () => void) => {
    setSheet(null);
    start();
  };
  const finishTour = () => {
    writeStored(TOUR_STORAGE_KEY, en.howToPlay.version);
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
      {round.kind === 'versus' && <VersusRound {...props} round={round} layoutStyle={layoutStyle} />}

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
      {showTour && <Spotlight rootRef={rootRef} onDone={finishTour} layoutStyle={layoutStyle} />}
    </div>
  );
}
