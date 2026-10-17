'use client';

import { en } from '@unspoken/content';
import { MODE_IDS, modeRules } from '@unspoken/core';
import { layout } from '@unspoken/design-tokens';

import { Tile } from '@/components/ui/Choice';
import { Grid } from '@/components/ui/Grid';
import { Screen } from '@/components/ui/Screen';
import { SuggestCard } from '@/components/ui/SuggestCard';
import { routes } from '@/lib/routes';
import { useGame } from '@/state/game';

// Pick a mode to set up a game. Modes that are not ready yet show Coming soon; the card at the
// bottom asks for ideas. Every tile is the same size, whatever its detail line says.
export function ModesScreen() {
  const { settings } = useGame();
  const copy = en.modesScreen;
  return (
    <Screen tone="base" width="column" back={{ href: routes.play, label: copy.back }} title={copy.title} sub={copy.hint}>
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
              href={routes.setup(id)}
            />
          );
        })}
      </Grid>
      <SuggestCard look="row" title={copy.suggest.title} body={copy.suggest.body} action={copy.suggest.action} href={routes.feedback('modes')} />
    </Screen>
  );
}
