'use client';

import { en } from '@unspoken/content';
import { addPlayer, format, movePlayer, playerName, renameTeam, setTeamColor, type Lineup } from '@unspoken/core';
import { teamColors } from '@unspoken/design-tokens';
import { useId, useState } from 'react';

import { SheetHead } from '@/components/sheets/SheetHead';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { Sheet } from '@/components/ui/Sheet';
import { cx, text } from '@/lib/ui';
import { useGame } from '@/state/game';

import { AddPill, NameField, NamePill, teamColorVar } from './parts';
import { usePlayerMenu } from './usePlayerMenu';
import styles from './mindReader.module.css';

// Customize team: its name and color, its players (tap one for options) and players to bring over
// from other teams. Render it while open.
export function TeamSheet({ teamId, onClose }: { teamId: string; onClose: () => void }) {
  const { mindReader, setMindReader } = useGame();
  const { lineup } = mindReader;
  const edit = (change: (l: Lineup) => Lineup) => setMindReader((m) => ({ ...m, lineup: change(m.lineup) }));
  const menu = usePlayerMenu(lineup, edit);
  const id = useId();
  const [adding, setAdding] = useState(false);
  const team = lineup.teams.find((t) => t.id === teamId);
  // The name as typed; a blank box keeps the team's name until something is typed.
  const [name, setName] = useState(team?.name ?? '');
  const c = en.mindReader.customize;
  if (!team) return null;
  const others = lineup.teams.filter((t) => t.id !== teamId).flatMap((t) => t.members);
  return (
    <Sheet labelledBy={id} onClose={onClose}>
      <SheetHead id={id} title={c.title} />
      <div className={styles.sheetBody}>
        <Section label={c.name}>
          <input
            className={cx(styles.input, text('input'))}
            data-region="raised"
            value={name}
            aria-label={c.name}
            autoComplete="off"
            onChange={(event) => {
              setName(event.target.value);
              edit((l) => renameTeam(l, team.id, event.target.value));
            }}
          />
        </Section>
        <Section label={c.color}>
          <div role="radiogroup" aria-label={c.color} className={styles.swatches}>
            {teamColors.light.map((_, i) => (
              <label key={i} className={cx(styles.swatch, team.color === i && styles.swatchOn)}>
                <input type="radio" name="teamColor" className="visually-hidden" checked={team.color === i} onChange={() => edit((l) => setTeamColor(l, team.id, i))} aria-label={format(en.a11y.teamColor, { n: i + 1 })} />
                <span className={styles.swatchFill} style={{ background: teamColorVar(i) }} />
              </label>
            ))}
          </div>
        </Section>
        <Section label={c.members} aside={c.membersAside}>
          <div className={styles.wrap}>
            {team.members.map((pid) => (
              <NamePill
                key={pid}
                name={playerName(lineup, pid)}
                selected={menu.openFor === pid}
                label={format(en.a11y.playerOptions, { name: playerName(lineup, pid) })}
                onClick={(target) => menu.open(pid, target)}
              />
            ))}
            {!adding && <AddPill label={en.mindReader.lineup.addPlayer} onClick={() => setAdding(true)} />}
          </div>
          {adding && (
            <NameField
              placeholder={en.mindReader.lineup.addPlaceholder}
              autoFocus
              onSubmit={(added) => {
                edit((l) => {
                  const next = addPlayer(l, added);
                  const newest = next.players[next.players.length - 1];
                  return newest && next.players.length > l.players.length ? movePlayer(next, newest.id, team.id) : next;
                });
                setAdding(false);
              }}
            />
          )}
        </Section>
        {others.length > 0 && (
          <Section label={c.addFrom} aside={c.addFromAside}>
            <div className={styles.wrap}>
              {others.map((pid) => (
                <AddPill key={pid} label={format(c.addFromName, { name: playerName(lineup, pid) })} onClick={() => edit((l) => movePlayer(l, pid, team.id))} />
              ))}
            </div>
          </Section>
        )}
        <Button size="large" onClick={onClose}>
          {c.done}
        </Button>
      </div>
      {menu.element}
    </Sheet>
  );
}
