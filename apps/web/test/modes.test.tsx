import { en } from '@unspoken/content';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ModesScreen } from '@/screens/ModesScreen';

import { renderApp } from './app';

describe('Modes', () => {
  it('sets up any available mode, shows Teams as coming soon, and asks for ideas', () => {
    renderApp(<ModesScreen />);
    expect(screen.getByRole('link', { name: new RegExp(`^${en.modes.mindReader.name}`) })).toHaveAttribute('href', '/setup/?mode=mindReader');
    expect(screen.getByRole('button', { name: new RegExp(`^${en.modes.teams.name}`) })).toBeDisabled();
    expect(screen.getByText(en.modesScreen.comingSoon)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(en.modesScreen.suggest.title) })).toHaveAttribute('href', '/feedback/?from=modes');
  });
});
