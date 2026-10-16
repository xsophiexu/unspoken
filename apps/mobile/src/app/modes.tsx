import { en } from '@unspoken/content';
import { MODE_IDS, modeRules } from '@unspoken/core';
import { layout, space } from '@unspoken/design-tokens';
import { router } from 'expo-router';

import { goBack } from '../nav';
import { usePrefs } from '../state/prefs';
import { LinkButton } from '../ui/Button';
import { Grid } from '../ui/Grid';
import { Screen, ScreenTitle, ScreenTop } from '../ui/Screen';
import { SuggestCard } from '../ui/SuggestCard';
import { Tile, useEqualHeight } from '../ui/Tile';

// Every mode as a tile; modes that aren't ready show Coming soon. Tapping one sets up a game. Every
// tile is the same size, whatever its detail line says.
export default function ModesScreen() {
  const { settings } = usePrefs();
  const [tileHeight, reportHeight] = useEqualHeight(layout.control.modeTile);
  const s = en.modesScreen;
  return (
    <Screen tone="base" width="column">
      {(colors) => (
        <>
          <ScreenTop left={<LinkButton label={s.back} colors={colors} onPress={goBack} />} />
          <ScreenTitle title={s.title} sub={s.hint} colors={colors} />
          <Grid columns={layout.grid.modes} gap={space[2.5]}>
            {MODE_IDS.map((id) => {
              const available = modeRules(id).available;
              return (
                <Tile
                  key={id}
                  title={en.modes[id].name}
                  detail={available ? en.modes[id].sub : s.comingSoon}
                  colors={colors}
                  selected={id === settings.mode}
                  disabled={!available}
                  height={tileHeight}
                  onNaturalHeight={reportHeight(id)}
                  onPress={() => router.push({ pathname: '/setup', params: { mode: id } })}
                />
              );
            })}
          </Grid>
          <SuggestCard
            shape="row"
            title={s.suggest.title}
            body={s.suggest.body}
            action={s.suggest.action}
            colors={colors}
            onPress={() => router.push({ pathname: '/feedback', params: { from: 'modes' } })}
          />
        </>
      )}
    </Screen>
  );
}
