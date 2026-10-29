'use client';

import { en, mdEn } from '@unspoken/content';
import { MD_MODE_IDS, MODE_IDS, modeRules, type MdModeId, type ModeId } from '@unspoken/core';
import { layout } from '@unspoken/design-tokens';

import { Tile } from '@/components/ui/Choice';
import { Grid } from '@/components/ui/Grid';
import { Screen } from '@/components/ui/Screen';
import { SuggestCard } from '@/components/ui/SuggestCard';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useEdition } from '@/state/edition';
import { useGame } from '@/state/game';

import styles from './screens.module.css';

// Where each mode's tile goes: Mind Reader opens its own start screen (Quick Play, Custom game,
// Practice), Versus starts with who's playing, and the rest open New game.
function modeHref(id: ModeId): string {
  return id === 'mindReader' ? routes.mindReader : id === 'versus' ? routes.versus : routes.setup(id);
}

// Pick a mode to set up a game. Modes that are not ready yet show Coming soon; the card at the
// bottom asks for ideas. Every tile is the same size, whatever its detail line says. UnspokenMD
// lists its own three (home-v4, screen 3): Zen across the top, Versus and Ladder under it.
export function ModesScreen() {
  const { settings } = useGame();
  const { edition } = useEdition();
  const copy = en.modesScreen;
  const back = { href: routes.home, label: copy.back };

  if (edition === 'md') {
    const tile = (id: MdModeId) => <Tile key={id} title={mdEn.modes[id].name} detail={mdEn.modes[id].sub} selected={id === settings.mode} href={modeHref(id)} />;
    const [first, ...rest] = MD_MODE_IDS;
    return (
      <Screen tone="base" width="column" back={back} action={<span className={cx(styles.muted, text('link'))}>{mdEn.edition.name}</span>} title={copy.title} sub={copy.hint}>
        <Grid columns={1}>{tile(first)}</Grid>
        <Grid columns={layout.grid.modes} equalRows={layout.control.modeTile}>
          {rest.map(tile)}
        </Grid>
      </Screen>
    );
  }

  return (
    <Screen tone="base" width="column" back={back} title={copy.title} sub={copy.hint}>
      <Grid columns={layout.grid.modes} equalRows={layout.control.modeTile}>
        {MODE_IDS.map((id) => {
          const available = modeRules(id).available;
          return (
            <Tile
              key={id}
              title={en.modes[id].name}
              detail={available ? en.modes[id].sub : undefined}
              status={available ? undefined : copy.comingSoon}
              disabled={!available}
              selected={id === settings.mode}
              href={modeHref(id)}
            />
          );
        })}
      </Grid>
      <SuggestCard look="row" title={copy.suggest.title} body={copy.suggest.body} action={copy.suggest.action} href={routes.feedback('modes')} />
    </Screen>
  );
}
