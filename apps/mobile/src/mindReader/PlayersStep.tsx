import { en } from '@unspoken/content';
import { addPlayer, format, lineupIssue, minTeamPlayers, plural, removePlayer, setPlayerCount } from '@unspoken/core';
import { layout, radius, space } from '@unspoken/design-tokens';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { goBack } from '../nav';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Press, slopFor } from '../ui/Press';
import { SectionLabel, Screen } from '../ui/Screen';
import { Txt } from '../ui/Txt';
import { useLineupSetup, type LineupGame } from './lineupGame';
import { defaultPlayerName, mrStyles, NameField, Note, StepTop, Stepper } from './ui';

// Setup step 1 (Mind Reader's Custom game, Versus): how many players, with names if they like.
export function PlayersStep({ game }: { game: LineupGame }) {
  const { lineup, edit, config, copy, next } = useLineupSetup(game);
  const s = en.mindReader.players;
  const { minPlayers, maxPlayers } = config.mindReader;
  const named = lineup.players.filter((p) => p.named);
  const issue = lineupIssue({ ...lineup, style: 'individual' }, config);
  return (
    <Screen
      tone="base"
      width="column"
      footer={(colors) => <Button kind="primary" label={en.mindReader.next} colors={colors} disabled={issue !== null} onPress={() => router.push(next.players)} />}
    >
      {(colors) => (
        <>
          <StepTop step={1} total={3} title={s.title} colors={colors} onBack={goBack} back={copy.startBack} stepText={copy.step} />
          <View style={mrStyles.section}>
            <SectionLabel label={s.count} aside={s.countAside} colors={colors} />
            <Stepper
              label={s.countLabel}
              value={lineup.players.length}
              min={0}
              max={maxPlayers}
              onChange={(n) => edit((l) => setPlayerCount(l, n, defaultPlayerName, config))}
              colors={colors}
              fill="chip"
            />
          </View>
          <View style={mrStyles.section}>
            <SectionLabel label={format(s.names, { n: named.length })} aside={s.namesAside} colors={colors} />
            {named.length > 0 ? (
              <View style={mrStyles.wrap}>
                {named.map((p) => (
                  <View key={p.id} style={[styles.chip, { backgroundColor: colors.chip }]}>
                    <Txt variant="label" color={colors.chipInk} numberOfLines={1} style={styles.shrink}>
                      {p.name}
                    </Txt>
                    <Press onPress={() => edit((l) => removePlayer(l, p.id))} accessibilityLabel={format(en.a11y.removePlayer, { name: p.name })} hitSlop={slopFor(layout.icon.md)}>
                      <Icon name="cross" size={layout.icon.sm} color={colors.muted} />
                    </Press>
                  </View>
                ))}
              </View>
            ) : null}
            <NameField placeholder={s.placeholder} colors={colors} onSubmit={(name) => edit((l) => addPlayer(l, name, config))} />
            {copy.playersHint ? (
              <Txt variant="small" color={colors.muted}>
                {format(copy.playersHint, { individual: minPlayers, teams: minTeamPlayers(config) })}
              </Txt>
            ) : null}
            {issue?.kind === 'tooFewPlayers' ? <Note text={plural(issue.missing, copy.tooFew, { min: minPlayers })} colors={colors} /> : null}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1.5],
    minHeight: layout.mindReader.pillHeight,
    borderRadius: radius.pill,
    paddingLeft: space[3],
    paddingRight: space[2.5],
    maxWidth: '100%',
  },
  shrink: { flexShrink: 1 },
});
