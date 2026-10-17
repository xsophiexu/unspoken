import { en } from '@unspoken/content';
import { act, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { MindReaderLineupScreen } from '@/screens/mindReader/LineupScreen';
import { MindReaderPlayersScreen } from '@/screens/mindReader/PlayersScreen';
import { PlayScreen } from '@/screens/PlayScreen';
import { SetupScreen } from '@/screens/SetupScreen';

import { renderApp } from './app';

const m = en.mindReader;
const v = en.versus;

// Versus reuses Mind Reader's setup steps; they share one GameProvider with the game.
function renderFlow() {
  renderApp(
    <>
      <section aria-label="players">
        <MindReaderPlayersScreen game="versus" />
      </section>
      <section aria-label="lineup">
        <MindReaderLineupScreen game="versus" />
      </section>
      <section aria-label="settings">
        <SetupScreen mode="versus" />
      </section>
      <section aria-label="game">
        <PlayScreen />
      </section>
    </>,
  );
  const region = (name: string) => within(screen.getByRole('region', { name }));
  return { players: region('players'), lineup: region('lineup'), settings: region('settings'), game: region('game') };
}

// A tapped answer lands once the card has flown off.
const settle = () => act(() => new Promise((done) => setTimeout(done, 1000)));

async function addNames(user: UserEvent, players: ReturnType<typeof renderFlow>['players'], names: string[]) {
  for (const name of names) await user.type(players.getByRole('textbox', { name: m.players.placeholder }), `${name}{Enter}`);
}

describe('Versus', () => {
  it('plays from 2 players, and offers Add players or Individual when Teams is picked with 3', async () => {
    const user = userEvent.setup();
    const { players, lineup } = renderFlow();
    await addNames(user, players, ['Maya']);
    expect(players.getByText('Versus needs at least 2 players. Add 1 more.')).toBeInTheDocument();
    await addNames(user, players, ['Leo']);
    expect(players.getByRole('button', { name: m.next })).toBeEnabled();

    await addNames(user, players, ['Sam']);
    await user.click(lineup.getByRole('radio', { name: m.lineup.teams }));
    const dialog = screen.getByRole('dialog', { name: 'Teams need 4 or more players' });
    await user.click(within(dialog).getByRole('button', { name: m.lineup.needTeams.stay }));
    expect(lineup.getByRole('radio', { name: m.lineup.individual })).toBeChecked();
  });

  it('shows the penalty amount only when the banned word penalty is on', async () => {
    const user = userEvent.setup();
    const { settings } = renderFlow();
    const timeLimit = settings.getByText(en.setup.timer);
    expect(timeLimit.compareDocumentPosition(settings.getByRole('button', { name: 'Fewer Rounds' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(settings.getByText(v.settings.penaltyOff)).toBeInTheDocument();
    expect(settings.queryByText(v.settings.pointsLost)).not.toBeInTheDocument();
    await user.click(settings.getByRole('switch', { name: v.settings.penalty }));
    expect(settings.getByText('Lose 1 point when a banned word is said')).toBeInTheDocument();
    // Individual by default: only the Clue Giver loses them.
    expect(settings.getByText(v.settings.pointsLostIndividual)).toBeInTheDocument();
  });

  it('shows Difficulty as a row that opens the difficulty sheet', async () => {
    const user = userEvent.setup();
    const { settings } = renderFlow();
    expect(settings.queryByRole('checkbox', { name: /^Hard/ })).not.toBeInTheDocument();
    await user.click(settings.getByRole('button', { name: 'Difficulty: Normal. Tap to choose.' }));
    const sheet = within(screen.getByRole('dialog', { name: en.mindReader.quick.sheetTitle }));
    expect(sheet.getByText(en.setup.difficultyHint)).toBeInTheDocument();
    await user.click(sheet.getByRole('checkbox', { name: /^Hard/ }));
    await user.click(sheet.getByRole('button', { name: v.settings.difficultyDone }));
    expect(settings.getByRole('button', { name: 'Difficulty: Normal+. Tap to choose.' })).toBeInTheDocument();
  });

  it('offers the bonus for who guesses it only for Individual with 3 or more', async () => {
    const user = userEvent.setup();
    const { players, lineup, settings } = renderFlow();
    await addNames(user, players, ['Maya', 'Leo']);
    expect(settings.queryByRole('switch', { name: v.settings.bonus })).not.toBeInTheDocument();
    await addNames(user, players, ['Sam']);
    expect(settings.getByRole('switch', { name: v.settings.bonus })).toBeChecked();
    expect(settings.getByText('Tap who got it: they get 1 extra point')).toBeInTheDocument();
    await user.click(settings.getByRole('switch', { name: v.settings.bonus }));
    expect(settings.getByText(v.settings.bonusOff)).toBeInTheDocument();
    await addNames(user, players, ['Ava']);
    await user.click(lineup.getByRole('radio', { name: m.lineup.teams }));
    expect(settings.queryByRole('switch', { name: v.settings.bonus })).not.toBeInTheDocument();
  });

  it('plays a Teams turn: pass, Correct, end the turn, fix a word on the recap', async () => {
    const user = userEvent.setup();
    const { players, lineup, settings, game } = renderFlow();
    await addNames(user, players, ['Maya', 'Leo', 'Sam', 'Ava']);
    await user.click(lineup.getByRole('radio', { name: m.lineup.teams }));
    await user.click(settings.getByRole('switch', { name: en.a11y.noTimeLimit }));
    await user.click(settings.getByRole('switch', { name: v.settings.penalty }));
    await user.click(settings.getByRole('button', { name: en.setup.start }));

    expect(game.getByRole('heading', { name: 'Sharks’ turn' })).toBeInTheDocument();
    expect(game.getByText('Hand the phone to Maya. Only Maya looks at the card.')).toBeInTheDocument();
    await user.click(game.getByRole('button', { name: 'Maya is ready · Start' }));

    expect(game.getByText('Round 1 of 5')).toBeInTheDocument();
    expect(game.getByText('Sharks are up')).toBeInTheDocument();
    for (let i = 0; i < 2; i++) {
      await user.click(game.getByRole('button', { name: en.play.correct }));
      await settle();
    }
    await user.click(game.getByRole('button', { name: v.turn.endTurn }));

    // Two correct, and the card on screen when the turn ended counts as Not guessed.
    expect(game.getByRole('heading', { name: v.recap.title })).toBeInTheDocument();
    const summary = () => within(game.getByText('Sharks scored').parentElement!.parentElement!);
    expect(summary().getByText('+2')).toBeInTheDocument();
    expect(game.getByText('1 not guessed')).toBeInTheDocument();
    await user.click(game.getByRole('button', { name: /, Not guessed, 0\. Tap to change\.$/ }));
    expect(game.getByText('1 banned word')).toBeInTheDocument();
    expect(game.getByRole('button', { name: /, Banned word, −1\. Tap to change\.$/ })).toBeInTheDocument();
    expect(summary().getByText('+1')).toBeInTheDocument();
    expect(game.getByRole('button', { name: 'Next: Owls’ turn' })).toBeInTheDocument();
  });
});
