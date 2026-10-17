import { en } from '@unspoken/content';
import {
  addPlayer,
  canUseTeams,
  format,
  gameConfig,
  lineupIssue,
  minTeamPlayers,
  plural,
  playerName,
  setStyle,
  setTeamCount,
  shuffleOrder,
  shuffleTeams,
  type Lineup,
  type PlayStyle,
} from '@unspoken/core';
import { layout, space, type RegionColors } from '@unspoken/design-tokens';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { usePlayerMenu } from '../../mindReader/playerMenu';
import { TeamSheet } from '../../mindReader/TeamSheet';
import { AddPill, Card, Dialog, mrStyles, NameField, NamePill, Note, SegmentSwitch, StepTop, Stepper, TeamBadge, teamPresets } from '../../mindReader/ui';
import { goBack } from '../../nav';
import { usePrefs } from '../../state/prefs';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Press } from '../../ui/Press';
import { SectionLabel, Screen } from '../../ui/Screen';
import { Txt } from '../../ui/Txt';

// Custom game, step 2: Individual or Teams, the turn order or the teams, and any changes to them.
export default function MindReaderLineup() {
  const { mindReader, setMindReader, theme } = usePrefs();
  const { lineup } = mindReader;
  const s = en.mindReader.lineup;
  const config = gameConfig.mindReader;
  const [needTeams, setNeedTeams] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const edit = (change: (l: Lineup) => Lineup) => setMindReader((m) => ({ ...m, lineup: change(m.lineup) }));
  const menu = usePlayerMenu(lineup, edit);
  const issue = lineupIssue(lineup);
  const n = lineup.players.length;
  const raised = theme.regions.raised;

  const pickStyle = (style: PlayStyle) => {
    if (style === 'teams' && !canUseTeams(n)) setNeedTeams(true);
    else edit((l) => setStyle(l, style, teamPresets()));
  };
  const addField = (colors: RegionColors) =>
    adding ? (
      <NameField
        placeholder={s.addPlaceholder}
        colors={colors}
        autoFocus
        onSubmit={(name) => {
          edit((l) => addPlayer(l, name));
          setAdding(false);
        }}
      />
    ) : null;

  return (
    <Screen
      tone="base"
      width="column"
      footer={(colors) => (
        <Button kind="primary" label={en.mindReader.next} colors={colors} disabled={issue !== null} onPress={() => router.push({ pathname: '/setup', params: { mode: 'mindReader', custom: '1' } })} />
      )}
    >
      {(colors) => (
        <>
          <StepTop step={2} total={3} title={s.title} colors={colors} onBack={goBack} />
          <View style={mrStyles.section}>
            <SegmentSwitch
              options={[
                { value: 'individual', label: s.individual },
                { value: 'teams', label: s.teams },
              ]}
              value={lineup.style}
              onChange={pickStyle}
              colors={colors}
            />
            <Txt variant="hint" color={colors.muted}>
              {lineup.style === 'teams' ? format(s.teamsHint, { min: minTeamPlayers() }) : format(s.individualHint, { min: config.minPlayers })}
            </Txt>
          </View>

          {lineup.style === 'individual' ? (
            <View style={mrStyles.section}>
              <SectionLabel label={s.order} aside={s.orderAside} colors={colors} />
              <Card style={styles.list}>
                {lineup.players.map((p, i) => (
                  <View key={p.id} ref={menu.ref(p.id)} collapsable={false}>
                    <Press
                      onPress={() => menu.open(p.id)}
                      accessibilityLabel={format(en.a11y.playerOptions, { name: p.name })}
                      style={[styles.orderRow, { borderBottomColor: raised.rule }, menu.openFor === p.id && { borderColor: colors.accent, borderWidth: layout.stroke.focus }]}
                    >
                      <Txt variant="label" color={raised.ink} style={mrStyles.grow} numberOfLines={1}>
                        {format(s.orderName, { n: i + 1, name: p.name })}
                      </Txt>
                      {i === 0 ? (
                        <Txt variant="small" color={raised.muted}>
                          {s.first}
                        </Txt>
                      ) : null}
                      <View style={[styles.pencil, { backgroundColor: raised.chip }]}>
                        <Icon name="pencil" size={layout.icon.sm} color={raised.ink} />
                      </View>
                    </Press>
                  </View>
                ))}
                {adding ? (
                  <View style={styles.addRow}>{addField(raised)}</View>
                ) : (
                  <Press onPress={() => setAdding(true)} accessibilityLabel={s.addPlayer} style={styles.addRow}>
                    <Txt variant="link" color={raised.accentText}>
                      {s.addPlayer}
                    </Txt>
                  </Press>
                )}
              </Card>
              <Button label={s.shuffleOrder} icon="shuffle" colors={colors} onPress={() => edit((l) => shuffleOrder(l, Math.random))} />
            </View>
          ) : (
            <>
              <View style={mrStyles.section}>
                <SectionLabel label={s.teamSetup} colors={colors} />
                <Stepper
                  label={s.teamCount}
                  value={lineup.teams.length}
                  min={config.minTeams}
                  max={config.maxTeams}
                  onChange={(count) => edit((l) => setTeamCount(l, count, teamPresets()))}
                  colors={colors}
                  fill="raised"
                />
                {issue?.kind === 'tooManyTeams' ? <Note text={format(s.tooManyTeams, { min: config.minPerTeam, max: issue.max })} colors={colors} /> : null}
                <Button label={s.shuffleTeams} icon="shuffle" colors={colors} onPress={() => edit((l) => shuffleTeams(l, Math.random))} />
              </View>
              <View style={mrStyles.section}>
                <SectionLabel label={format(s.teamsLabel, { players: plural(n, s.players).toUpperCase() })} aside={s.teamsAside} colors={colors} />
                {lineup.teams.map((team) => (
                  <Card key={team.id} style={styles.team}>
                    <Press onPress={() => setEditingTeam(team.id)} accessibilityLabel={format(en.a11y.editTeam, { team: team.name })} style={styles.teamHead}>
                      <TeamBadge name={team.name} color={team.color} />
                      <Txt variant="optionTitle" color={raised.ink} style={mrStyles.grow} numberOfLines={1}>
                        {team.name}
                      </Txt>
                      <Txt variant="small" color={raised.muted}>
                        {plural(team.members.length, s.players)}
                      </Txt>
                      <View style={[styles.pencil, { backgroundColor: raised.chip }]}>
                        <Icon name="pencil" size={layout.icon.sm} color={raised.ink} />
                      </View>
                    </Press>
                    <View style={mrStyles.wrap}>
                      {team.members.map((id) => (
                        <View key={id} ref={menu.ref(id)} collapsable={false}>
                          <NamePill
                            name={playerName(lineup, id)}
                            colors={raised}
                            selected={menu.openFor === id}
                            onPress={() => menu.open(id)}
                            accessibilityLabel={format(en.a11y.playerOptions, { name: playerName(lineup, id) })}
                          />
                        </View>
                      ))}
                    </View>
                  </Card>
                ))}
                {issue?.kind === 'smallTeam' ? (
                  <Note
                    text={format(s.smallTeam, {
                      team: lineup.teams.find((t) => t.id === issue.teamId)?.name ?? '',
                      size: plural(issue.size, s.players),
                      min: issue.min,
                    })}
                    colors={colors}
                  />
                ) : null}
                {adding ? addField(colors) : (
                  <View style={styles.addPill}>
                    <AddPill label={s.addPlayer} colors={colors} onPress={() => setAdding(true)} />
                  </View>
                )}
              </View>
            </>
          )}

          {menu.element}
          <TeamSheet teamId={editingTeam} onClose={() => setEditingTeam(null)} />
          <Dialog
            visible={needTeams}
            title={format(s.needTeams.title, { min: minTeamPlayers() })}
            body={plural(n, s.needTeams.body, { missing: Math.max(0, minTeamPlayers() - n) })}
            primary={{
              label: s.needTeams.add,
              onPress: () => {
                setNeedTeams(false);
                setAdding(true);
              },
            }}
            secondary={{ label: s.needTeams.stay, onPress: () => setNeedTeams(false) }}
            onClose={() => setNeedTeams(false)}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: space[1] },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2.5],
    minHeight: layout.mindReader.logRow + space[2.5],
    borderBottomWidth: layout.stroke.hairline,
    borderRadius: 0,
  },
  pencil: { width: space[7], height: space[7], borderRadius: space[3.5], alignItems: 'center', justifyContent: 'center' },
  addRow: { minHeight: layout.minTouch + space[2], justifyContent: 'center', paddingVertical: space[1.5] },
  team: { gap: space[2.5] },
  teamHead: { flexDirection: 'row', alignItems: 'center', gap: space[2.5] },
  addPill: { flexDirection: 'row' },
});
