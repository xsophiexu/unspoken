'use client';

import { en } from '@unspoken/content';
import { cardById } from '@unspoken/core';
import { useRef, useState } from 'react';

import { Spotlight } from '@/components/play/Spotlight';
import { DifficultyPicker } from '@/components/sheets/DifficultyPicker';
import { FindCardSheet } from '@/components/sheets/FindCardSheet';
import { GameMenu } from '@/components/sheets/GameMenu';
import { ModeSheet } from '@/components/sheets/ModeSheet';
import { WordBankSheet } from '@/components/sheets/WordBankSheet';
import { catalogFor } from '@/lib/catalog';
import { routes } from '@/lib/routes';
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

// wordBank and search: UnspokenMD's chip sheet and Find a card.
type SheetKind = 'menu' | 'mode' | 'difficulty' | 'wordBank' | 'search';

// The game: the round in the player's style, the sheets over it, and the first-visit tour. `tour`
// (How to play on Home) opens the tour whatever the round.
export function PlayScreen({ tour = false }: { tour?: boolean }) {
  const { round, dispatch, restart, changeDifficulty, newGame } = useGame();
  // The style as drawn in the mode in use (dark mode changes some slots; a Halloween look is always
  // dark) and the edition (UnspokenMD has no holiday looks).
  const layoutStyle = useTheme().theme.style;
  const rootRef = useRef<HTMLDivElement>(null);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [touring, setTouring] = useState(() => tour || tourDue());
  const swipe = round.kind === 'swipe';
  // UnspokenMD's one-card rounds (Zen, Ladder): the chip opens the word bank sheet, and search sits beside ···.
  const mdSwipe = swipe && round.config.edition === 'md';

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

  const showTour = touring && (swipe || tour);
  const props = {
    blocked: showTour || sheet !== null,
    sheetOpen: sheet !== null,
    onMenu: () => open('menu'),
    // The Card badge names only the level, so it opens the level picker; "Mode · Level" opens both.
    onHeader: () => open(mdSwipe ? 'wordBank' : layoutStyle.header.variant === 'titleBadge' ? 'difficulty' : 'mode'),
    onLeave: leave,
  };
  // A card from search plays next; then the game carries on.
  const playFound = (id: string) => {
    const card = cardById(catalogFor(round.config).bank, id);
    if (card) dispatch({ type: 'showCard', card });
    close();
  };

  return (
    <div ref={rootRef}>
      {round.kind === 'swipe' && <SwipeRound {...props} round={round} layoutStyle={layoutStyle} onSearch={mdSwipe ? () => open('search') : undefined} />}
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
        <ModeSheet round={round} onClose={close} onPick={(difficulty) => fresh(() => changeDifficulty(difficulty))} onRestart={() => fresh(restart)} onLeave={leave} />
      )}
      {sheet === 'difficulty' && <DifficultyPicker round={round} onClose={close} onPick={(difficulty) => fresh(() => changeDifficulty(difficulty))} />}
      {sheet === 'wordBank' && (
        <WordBankSheet
          settings={round.settings}
          onClose={close}
          onApply={(settings) => fresh(() => newGame(settings))}
          customHref={routes.setup(round.settings.mode)}
          onCustom={leave}
        />
      )}
      {sheet === 'search' && <FindCardSheet onClose={close} onPick={playFound} />}
      {showTour && <Spotlight rootRef={rootRef} onDone={finishTour} layoutStyle={layoutStyle} />}
    </div>
  );
}
