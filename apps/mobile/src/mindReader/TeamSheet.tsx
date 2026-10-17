import { en } from '@unspoken/content';
import { addPlayer, format, movePlayer, playerName, renameTeam, setTeamColor } from '@unspoken/core';
import { layout, radius, space, teamColor, teamColors } from '@unspoken/design-tokens';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { usePrefs } from '../state/prefs';
import { Button } from '../ui/Button';
import { Press } from '../ui/Press';
import { SectionLabel } from '../ui/Screen';
import { Sheet, SheetHeader } from '../ui/Sheet';
import { useLineupSetup, type LineupGame } from './lineupGame';
import { usePlayerMenu } from './playerMenu';
import { AddPill, mrStyles, NameField, NamePill } from './ui';

// Customize team: its name and color, its players (tap one for options) and players to bring over
// from other teams.
export function TeamSheet({ game, teamId, onClose }: { game: LineupGame; teamId: string | null; onClose: () => void }) {
  const { theme, selection } = usePrefs();
  const { lineup, edit, config } = useLineupSetup(game);
  const menu = usePlayerMenu(lineup, edit);
  const [adding, setAdding] = useState(false);
  const team = lineup.teams.find((t) => t.id === teamId);
  // The name as typed; a blank box keeps the team's name until something is typed.
  const [draft, setDraft] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  if ((team?.id ?? null) !== draft.id) setDraft({ id: team?.id ?? null, name: team?.name ?? '' });
  const c = en.mindReader.customize;
  const raised = theme.regions.raised;
  const others = lineup.teams.filter((t) => t.id !== teamId).flatMap((t) => t.members);
  return (
    <Sheet visible={!!team} onClose={onClose}>
      {(colors) =>
        team ? (
          <View style={styles.body}>
            <SheetHeader title={c.title} colors={colors} onClose={onClose} />
            <SectionLabel label={c.name} colors={colors} />
            <TextInput
              value={draft.name}
              onChangeText={(name) => {
                setDraft({ id: team.id, name });
                edit((l) => renameTeam(l, team.id, name));
              }}
              accessibilityLabel={c.name}
              autoCapitalize="words"
              autoCorrect={false}
              style={[styles.input, { color: raised.ink, backgroundColor: raised.bg, borderColor: colors.rule }]}
            />
            <SectionLabel label={c.color} colors={colors} />
            <View style={mrStyles.row}>
              {teamColors[selection.mode].map((_, i) => (
                <Press
                  key={i}
                  onPress={() => edit((l) => setTeamColor(l, team.id, i))}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: team.color === i }}
                  accessibilityLabel={format(en.a11y.teamColor, { n: i + 1 })}
                  style={[styles.swatch, { borderColor: team.color === i ? colors.ink : 'transparent' }]}
                >
                  <View style={[styles.swatchFill, { backgroundColor: teamColor(i, selection.mode) }]} />
                </Press>
              ))}
            </View>
            <SectionLabel label={c.members} aside={c.membersAside} colors={colors} />
            <View style={mrStyles.wrap}>
              {team.members.map((id) => (
                <View key={id} ref={menu.ref(id)} collapsable={false}>
                  <NamePill name={playerName(lineup, id)} colors={colors} selected={menu.openFor === id} onPress={() => menu.open(id)} />
                </View>
              ))}
              {!adding ? <AddPill label={en.mindReader.lineup.addPlayer} colors={colors} onPress={() => setAdding(true)} /> : null}
            </View>
            {adding ? (
              <NameField
                placeholder={en.mindReader.lineup.addPlaceholder}
                colors={colors}
                autoFocus
                onSubmit={(name) => {
                  edit((l) => {
                    const added = addPlayer(l, name, config);
                    const newest = added.players[added.players.length - 1];
                    return newest && added.players.length > l.players.length ? movePlayer(added, newest.id, team.id) : added;
                  });
                  setAdding(false);
                }}
              />
            ) : null}
            {others.length > 0 ? (
              <>
                <SectionLabel label={c.addFrom} aside={c.addFromAside} colors={colors} />
                <View style={mrStyles.wrap}>
                  {others.map((id) => (
                    <AddPill key={id} label={format(c.addFromName, { name: playerName(lineup, id) })} colors={colors} onPress={() => edit((l) => movePlayer(l, id, team.id))} />
                  ))}
                </View>
              </>
            ) : null}
            <Button kind="primary" label={c.done} colors={colors} onPress={onClose} style={styles.done} />
            {menu.element}
          </View>
        ) : null
      }
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[2.5] },
  input: { minHeight: layout.control.input.height, borderRadius: radius.md, borderWidth: layout.stroke.outline, paddingHorizontal: space[4] },
  swatch: { width: layout.swatch.size + 2 * (layout.swatch.ring + layout.swatch.gap), height: layout.swatch.size + 2 * (layout.swatch.ring + layout.swatch.gap), borderRadius: radius.pill, borderWidth: layout.swatch.ring, alignItems: 'center', justifyContent: 'center' },
  swatchFill: { width: layout.swatch.size, height: layout.swatch.size, borderRadius: radius.pill },
  done: { marginTop: space[2] },
});
