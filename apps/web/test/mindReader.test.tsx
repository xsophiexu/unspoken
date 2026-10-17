import { en } from '@unspoken/content';
import { screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SETTINGS_STORAGE_KEY } from '@/lib/settings';
import { MindReaderLineupScreen } from '@/screens/mindReader/LineupScreen';
import { MindReaderPlayersScreen } from '@/screens/mindReader/PlayersScreen';
import { MindReaderStartScreen } from '@/screens/mindReader/StartScreen';
import { PlayScreen } from '@/screens/PlayScreen';
import { SetupScreen } from '@/screens/SetupScreen';

import { renderApp, saved } from './app';

const m = en.mindReader;

// The setup steps and the game share one GameProvider, as they do across the site's pages.
function renderFlow() {
  const result = renderApp(
    <>
      <section aria-label="players">
        <MindReaderPlayersScreen />
      </section>
      <section aria-label="lineup">
        <MindReaderLineupScreen />
      </section>
      <section aria-label="settings">
        <SetupScreen mode="mindReader" custom />
      </section>
      <section aria-label="game">
        <PlayScreen />
      </section>
    </>,
  );
  const region = (name: string) => within(screen.getByRole('region', { name }));
  return { ...result, players: region('players'), lineup: region('lineup'), settings: region('settings'), game: region('game') };
}

async function addNames(user: UserEvent, players: ReturnType<typeof renderFlow>['players'], names: string[]) {
  for (const name of names) await user.type(players.getByRole('textbox', { name: m.players.placeholder }), `${name}{Enter}`);
}

// Roles → predict five words → show the Clue Giver → the clues screen.
async function playTurn(user: UserEvent, game: ReturnType<typeof renderFlow>['game']) {
  await user.click(game.getByRole('button', { name: /the word$/ }));
  for (let i = 1; i <= gameWords.length; i++) await user.type(game.getByRole('textbox', { name: `Word ${i}` }), gameWords[i - 1]!);
  await user.click(game.getByRole('button', { name: /^Show .+ the word$/ }));
  await user.click(game.getByRole('button', { name: /has seen it and looked away$/ }));
}

const gameWords = ['sun', 'sand', 'sea', 'hotel', 'trip'];

describe('Mind Reader', () => {
  it('starts Quick play in one tap: no setup, no round heading', async () => {
    const user = userEvent.setup();
    const { router } = renderApp(
      <>
        <MindReaderStartScreen />
        <section aria-label="game">
          <PlayScreen />
        </section>
      </>,
    );
    await user.click(screen.getByRole('button', { name: new RegExp(`^${m.start.quick.title}`) }));
    expect(router.push).toHaveBeenCalledWith('/');
    const game = within(screen.getByRole('region', { name: 'game' }));
    expect(game.getByRole('heading', { name: m.roles.quick.title })).toBeInTheDocument();
    await user.click(game.getByRole('button', { name: m.roles.quick.show }));
    expect(game.getByRole('heading', { name: m.quick.title })).toBeInTheDocument();
    expect(game.queryByRole('heading', { name: /^Round/ })).not.toBeInTheDocument();
    expect(game.getByRole('button', { name: 'Write 5 more' })).toBeDisabled();
  });

  it('starts Quick play at Normal, and the chip changes the difficulty', async () => {
    saved({ [SETTINGS_STORAGE_KEY]: { mode: 'classic', difficulties: ['Expert'], categories: [], skips: 3 } });
    const user = userEvent.setup();
    renderApp(
      <>
        <MindReaderStartScreen />
        <section aria-label="game">
          <PlayScreen />
        </section>
      </>,
    );
    await user.click(screen.getByRole('button', { name: new RegExp(`^${m.start.quick.title}`) }));
    const game = within(screen.getByRole('region', { name: 'game' }));
    await user.click(game.getByRole('button', { name: 'Difficulty NORMAL. Tap to change.' }));

    const sheet = within(screen.getByRole('dialog', { name: m.quick.sheetTitle }));
    expect(sheet.getByText(en.setup.difficultyHint)).toBeInTheDocument();
    await user.click(sheet.getByRole('checkbox', { name: /^Hard/ }));
    expect(sheet.getByText(/^2 difficulties · /)).toBeInTheDocument();
    await user.click(sheet.getByRole('checkbox', { name: /^Normal/ }));
    await user.click(sheet.getByRole('button', { name: m.quick.apply }));
    expect(game.getByRole('button', { name: 'Difficulty HARD. Tap to change.' })).toBeInTheDocument();
  });

  it('offers an easier difficulty after a word that wasn’t guessed, not after one that was', async () => {
    const user = userEvent.setup();
    renderApp(
      <>
        <MindReaderStartScreen />
        <section aria-label="game">
          <PlayScreen />
        </section>
      </>,
    );
    await user.click(screen.getByRole('button', { name: new RegExp(`^${m.start.quick.title}`) }));
    const game = within(screen.getByRole('region', { name: 'game' }));
    const playWord = async (guessed: boolean) => {
      await user.click(game.getByRole('button', { name: m.roles.quick.show }));
      for (let i = 1; i <= gameWords.length; i++) await user.type(game.getByRole('textbox', { name: `Word ${i}` }), gameWords[i - 1]!);
      await user.click(game.getByRole('button', { name: m.predict.doneQuick }));
      await user.click(game.getByRole('button', { name: m.show.seenQuick }));
      await user.click(game.getByRole('button', { name: guessed ? m.clues.guessed : m.clues.notGuessed }));
    };

    await playWord(true);
    expect(game.queryByText(m.quickOver.tough, { exact: false })).not.toBeInTheDocument();
    expect(game.getByRole('link', { name: m.quickOver.custom })).toHaveAttribute('href', '/mind-reader/players/');

    await user.click(game.getByRole('button', { name: m.quickOver.next }));
    await playWord(false);
    expect(game.getByText(m.quickOver.tough, { exact: false })).toBeInTheDocument();
    await user.click(game.getByRole('button', { name: m.quickOver.switch }));
    expect(screen.getByRole('dialog', { name: m.quick.sheetTitle })).toBeInTheDocument();
  });

  it('needs 3 players, and offers Add players or Individual when Teams is picked with 3', async () => {
    const user = userEvent.setup();
    const { players, lineup } = renderFlow();
    await addNames(user, players, ['Maya', 'Leo']);
    expect(players.getByText('Mind Reader needs at least 3 players. Add 1 more.')).toBeInTheDocument();
    expect(players.getByRole('button', { name: m.next })).toBeDisabled();

    await addNames(user, players, ['Sam']);
    expect(players.getByRole('button', { name: m.next })).toBeEnabled();

    await user.click(lineup.getByRole('radio', { name: m.lineup.teams }));
    const dialog = screen.getByRole('dialog', { name: 'Teams need 4 or more players' });
    await user.click(within(dialog).getByRole('button', { name: m.lineup.needTeams.stay }));
    expect(lineup.getByRole('radio', { name: m.lineup.individual })).toBeChecked();
    expect(lineup.getByRole('button', { name: 'Maya: options' })).toBeInTheDocument();
  });

  it('moves a player to another team from their menu, and holds Next while a team is too small', async () => {
    const user = userEvent.setup();
    const { players, lineup } = renderFlow();
    await addNames(user, players, ['Maya', 'Leo', 'Sam', 'Ava']);
    await user.click(lineup.getByRole('radio', { name: m.lineup.teams }));
    expect(lineup.getByRole('button', { name: m.next })).toBeEnabled();

    await user.click(lineup.getByRole('button', { name: 'Maya: options' }));
    await user.click(screen.getByRole('button', { name: m.lineup.menu.moveTo }));
    await user.click(screen.getByRole('button', { name: 'Owls' }));

    expect(lineup.getByText('Sharks has 1 player. Each team needs at least 2 to continue.')).toBeInTheDocument();
    expect(lineup.getByRole('button', { name: m.next })).toBeDisabled();
  });

  it('puts the time limit above rounds, and says a guess scores a flat 3 with no limit', async () => {
    const user = userEvent.setup();
    const { settings } = renderFlow();
    const timeLimit = settings.getByText(en.setup.timer);
    const rounds = settings.getByText(m.settings.rounds);
    expect(timeLimit.compareDocumentPosition(rounds) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(settings.queryByText('A correct guess is a flat 3.')).not.toBeInTheDocument();
    await user.click(settings.getByRole('switch', { name: en.a11y.noTimeLimit }));
    expect(settings.getByText('A correct guess is a flat 3.')).toBeInTheDocument();
  });

  it('plays a Custom Teams game to the winner: a turn each, then the results', async () => {
    saved({ [SETTINGS_STORAGE_KEY]: { mode: 'mindReader', difficulty: 'Normal', categories: [], skips: 3, noTimeLimit: true } });
    const user = userEvent.setup();
    const { players, lineup, settings, game } = renderFlow();
    await addNames(user, players, ['Maya', 'Leo', 'Sam', 'Ava']);
    await user.click(lineup.getByRole('radio', { name: m.lineup.teams }));
    for (let i = 0; i < 4; i++) await user.click(settings.getByRole('button', { name: 'Fewer Rounds' }));
    await user.click(settings.getByRole('button', { name: en.setup.start }));

    // Sharks predict, Owls guess.
    expect(game.getByRole('heading', { name: 'Sharks’ turn' })).toBeInTheDocument();
    await playTurn(user, game);
    expect(game.getByText(m.clues.tapHint)).toBeInTheDocument();
    await user.click(game.getByRole('button', { name: 'sea was said' }));
    expect(game.getByText('1 correct prediction')).toBeInTheDocument();
    await user.click(game.getByRole('button', { name: 'Owls guessed it!' }));
    expect(game.getByText('Owls guessed it')).toBeInTheDocument();
    await user.click(game.getByRole('button', { name: m.over.seeScores }));
    expect(game.getByText('Hand the phone to Owls.')).toBeInTheDocument();
    await user.click(game.getByRole('button', { name: 'Start Owls’ turn' }));

    // Owls predict, Sharks don't guess it: the Mind Readers take the bonus.
    await playTurn(user, game);
    await user.click(game.getByRole('button', { name: m.clues.notGuessed }));
    await user.click(game.getByRole('button', { name: m.over.seeResults }));
    expect(game.getByText('Game over · 1 round')).toBeInTheDocument();
    expect(game.getByRole('heading', { name: 'Owls win' })).toBeInTheDocument();
  });

  it('fixes a turn: taking a spoken word off lowers the score', async () => {
    saved({ [SETTINGS_STORAGE_KEY]: { mode: 'mindReader', difficulty: 'Normal', categories: [], skips: 3, noTimeLimit: true } });
    const user = userEvent.setup();
    const { players, settings, game } = renderFlow();
    await addNames(user, players, ['Maya', 'Leo', 'Sam']);
    await user.click(settings.getByRole('button', { name: en.setup.start }));
    await playTurn(user, game);
    await user.click(game.getByRole('button', { name: 'sun was said' }));
    await user.click(game.getByRole('button', { name: 'sand was said' }));
    await user.click(game.getByRole('button', { name: m.clues.notGuessed }));
    // Maya predicted: 2 spoken + 3 for not guessed.
    expect(game.getByText('+5')).toBeInTheDocument();

    await user.click(game.getByRole('button', { name: m.over.fix }));
    const sheet = screen.getByRole('dialog', { name: m.fix.title });
    await user.click(within(sheet).getByRole('button', { name: /^Remove sand/ }));
    await user.click(within(sheet).getByRole('button', { name: m.fix.save }));
    expect(game.getByText('+4')).toBeInTheDocument();
  });
});
