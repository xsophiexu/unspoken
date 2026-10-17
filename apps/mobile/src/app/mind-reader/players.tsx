import { en } from '@unspoken/content';
import { addPlayer, format, gameConfig, lineupIssue, plural, removePlayer, setPlayerCount } from '@unspoken/core';
import { layout, radius, space } from '@unspoken/design-tokens';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { defaultPlayerName, mrStyles, NameField, Note, StepTop, Stepper } from '../../mindReader/ui';
import { goBack } from '../../nav';
import { usePrefs } from '../../state/prefs';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Press, slopFor } from '../../ui/Press';
import { SectionLabel, Screen } from '../../ui/Screen';
import { Txt } from '../../ui/Txt';

// Custom game, step 1: how many players, with names if they like.
export default function MindReaderPlayers() {
  const { mindReader, setMindReader } = usePrefs();
  const { lineup } = mindReader;
  const s = en.mindReader.players;
  const { minPlayers, maxPlayers } = gameConfig.mindReader;
  const named = lineup.players.filter((p) => p.named);
  const issue = lineupIssue({ ...lineup, style: 'individual' });
  const edit = (change: (l: typeof lineup) => typeof lineup) => setMindReader((m) => ({ ...m, lineup: change(m.lineup) }));
  return (
    <Screen
      tone="base"
      width="column"
      footer={(colors) => <Button kind="primary" label={en.mindReader.next} colors={colors} disabled={issue !== null} onPress={() => router.push('/mind-reader/lineup')} />}
    >
      {(colors) => (
        <>
          <StepTop step={1} total={3} title={s.title} colors={colors} onBack={goBack} back={en.mindReader.start.back} />
          <View style={mrStyles.section}>
            <SectionLabel label={s.count} aside={s.countAside} colors={colors} />
            <Stepper
              label={s.countLabel}
              value={lineup.players.length}
              min={0}
              max={maxPlayers}
              onChange={(n) => edit((l) => setPlayerCount(l, n, defaultPlayerName))}
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
            <NameField placeholder={s.placeholder} colors={colors} onSubmit={(name) => edit((l) => addPlayer(l, name))} />
            {issue?.kind === 'tooFewPlayers' ? <Note text={plural(issue.missing, s.tooFew, { min: minPlayers })} colors={colors} /> : null}
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
