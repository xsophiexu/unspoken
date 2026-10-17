'use client';

import { en } from '@unspoken/content';
import {
  addPlayer,
  canUseTeams,
  format,
  gameConfig,
  lineupIssue,
  minTeamPlayers,
  playerName,
  plural,
  setStyle,
  setTeamCount,
  shuffleOrder,
  shuffleTeams,
  type Lineup,
  type PlayStyle,
  type TeamPreset,
} from '@unspoken/core';
import { teamColorOrder } from '@unspoken/design-tokens';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AddPill, Card, Dialog, NameField, NamePill, Note, SegmentSwitch, StepTop, Stepper, TeamBadge } from '@/components/mindReader/parts';
import { TeamSheet } from '@/components/mindReader/TeamSheet';
import { usePlayerMenu } from '@/components/mindReader/usePlayerMenu';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useGame } from '@/state/game';

import styles from './setup.module.css';

// Teams' starting names and colors, in the order teams are added.
function teamPresets(): TeamPreset[] {
  return en.mindReader.teamNames.map((name, i) => ({ name, color: teamColorOrder[i] ?? i }));
}

// Custom game, step 2: Individual or Teams, the turn order or the teams, and any changes to them.
export function MindReaderLineupScreen() {
  const { mindReader, setMindReader } = useGame();
  const router = useRouter();
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

  const pickStyle = (style: PlayStyle) => {
    if (style === 'teams' && !canUseTeams(n)) setNeedTeams(true);
    else edit((l) => setStyle(l, style, teamPresets()));
  };
  const addField = (
    <NameField
      placeholder={s.addPlaceholder}
      autoFocus
      onSubmit={(name) => {
        edit((l) => addPlayer(l, name));
        setAdding(false);
      }}
    />
  );

  return (
    <Screen
      tone="base"
      width="column"
      footer={
        <Button size="large" disabled={issue !== null} onClick={() => router.push(routes.mindReaderSettings)}>
          {en.mindReader.next}
        </Button>
      }
    >
      <StepTop step={2} total={3} title={s.title} back={{ href: routes.mindReaderPlayers, label: en.mindReader.back }} />
      <div className={styles.section}>
        <SegmentSwitch
          name="playStyle"
          label={s.title}
          options={[
            { value: 'individual', label: s.individual },
            { value: 'teams', label: s.teams },
          ]}
          value={lineup.style}
          onChange={pickStyle}
        />
        <p className={cx(styles.muted, text('hint'))}>{lineup.style === 'teams' ? format(s.teamsHint, { min: minTeamPlayers() }) : format(s.individualHint, { min: config.minPlayers })}</p>
      </div>

      {lineup.style === 'individual' ? (
        <Section label={s.order} aside={s.orderAside}>
          <Card className={styles.list}>
            <ol className={styles.order}>
              {lineup.players.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={cx(styles.orderRow, menu.openFor === p.id && styles.orderRowOpen)}
                    aria-label={format(en.a11y.playerOptions, { name: p.name })}
                    aria-expanded={menu.openFor === p.id}
                    onClick={(event) => menu.open(p.id, event.currentTarget)}
                  >
                    <span className={cx(styles.grow, styles.ellipsis, text('label'))}>{format(s.orderName, { n: i + 1, name: p.name })}</span>
                    {i === 0 && <span className={cx(styles.muted, text('small'))}>{s.first}</span>}
                    <span className={styles.pencil}>
                      <Icon name="pencil" />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            {adding ? (
              <div className={styles.addRow}>{addField}</div>
            ) : (
              <button type="button" className={cx(styles.addRow, styles.addLink, text('link'))} onClick={() => setAdding(true)}>
                {s.addPlayer}
              </button>
            )}
          </Card>
          <Button variant="secondary" icon="shuffle" onClick={() => edit((l) => shuffleOrder(l, Math.random))}>
            {s.shuffleOrder}
          </Button>
        </Section>
      ) : (
        <>
          <Section label={s.teamSetup}>
            <Stepper label={s.teamCount} value={lineup.teams.length} min={config.minTeams} max={config.maxTeams} fill="raised" onChange={(count) => edit((l) => setTeamCount(l, count, teamPresets()))} />
            {issue?.kind === 'tooManyTeams' && <Note>{format(s.tooManyTeams, { min: config.minPerTeam, max: issue.max })}</Note>}
            <Button variant="secondary" icon="shuffle" onClick={() => edit((l) => shuffleTeams(l, Math.random))}>
              {s.shuffleTeams}
            </Button>
          </Section>
          <Section label={format(s.teamsLabel, { players: plural(n, s.players).toUpperCase() })} aside={s.teamsAside}>
            {lineup.teams.map((team) => (
              <Card key={team.id}>
                <button type="button" className={styles.teamHead} aria-label={format(en.a11y.editTeam, { team: team.name })} onClick={() => setEditingTeam(team.id)}>
                  <TeamBadge name={team.name} color={team.color} />
                  <span className={cx(styles.grow, styles.ellipsis, text('optionTitle'))}>{team.name}</span>
                  <span className={cx(styles.muted, text('small'))}>{plural(team.members.length, s.players)}</span>
                  <span className={styles.pencil}>
                    <Icon name="pencil" />
                  </span>
                </button>
                <div className={styles.chipsRow}>
                  {team.members.map((id) => (
                    <NamePill
                      key={id}
                      name={playerName(lineup, id)}
                      selected={menu.openFor === id}
                      label={format(en.a11y.playerOptions, { name: playerName(lineup, id) })}
                      onClick={(target) => menu.open(id, target)}
                    />
                  ))}
                </div>
              </Card>
            ))}
            {issue?.kind === 'smallTeam' && (
              <Note>
                {format(s.smallTeam, {
                  team: lineup.teams.find((t) => t.id === issue.teamId)?.name ?? '',
                  size: plural(issue.size, s.players),
                  min: issue.min,
                })}
              </Note>
            )}
            {adding ? (
              addField
            ) : (
              <div>
                <AddPill label={s.addPlayer} onClick={() => setAdding(true)} />
              </div>
            )}
          </Section>
        </>
      )}

      {menu.element}
      {editingTeam && <TeamSheet teamId={editingTeam} onClose={() => setEditingTeam(null)} />}
      {needTeams && (
        <Dialog
          title={format(s.needTeams.title, { min: minTeamPlayers() })}
          body={plural(n, s.needTeams.body, { missing: Math.max(0, minTeamPlayers() - n) })}
          primary={{
            label: s.needTeams.add,
            onClick: () => {
              setNeedTeams(false);
              setAdding(true);
            },
          }}
          secondary={{ label: s.needTeams.stay, onClick: () => setNeedTeams(false) }}
          onClose={() => setNeedTeams(false)}
        />
      )}
    </Screen>
  );
}
