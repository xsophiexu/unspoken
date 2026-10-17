'use client';

import { en } from '@unspoken/content';
import { addPlayer, format, lineupIssue, minTeamPlayers, plural, removePlayer, setPlayerCount } from '@unspoken/core';
import { useRouter } from 'next/navigation';

import { useLineupSetup, type LineupGame } from '@/components/mindReader/lineupGame';
import { NameField, Note, StepTop, Stepper } from '@/components/mindReader/parts';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { cx, text } from '@/lib/ui';

import styles from './setup.module.css';

export const defaultPlayerName = (n: number) => format(en.mindReader.players.defaultName, { n });

// Setup step 1 (Mind Reader's Custom game, Versus): how many players, with names if they like.
export function MindReaderPlayersScreen({ game = 'mindReader' }: { game?: LineupGame }) {
  const router = useRouter();
  const { lineup, edit, config, copy, routes } = useLineupSetup(game);
  const s = en.mindReader.players;
  const { minPlayers, maxPlayers } = config.mindReader;
  const named = lineup.players.filter((p) => p.named);
  const issue = lineupIssue({ ...lineup, style: 'individual' }, config);
  return (
    <Screen
      tone="base"
      width="column"
      footer={
        <Button size="large" disabled={issue !== null} onClick={() => router.push(routes.lineup)}>
          {en.mindReader.next}
        </Button>
      }
    >
      <StepTop step={1} total={3} title={s.title} back={{ href: routes.start, label: copy.startBack }} stepText={copy.step} />
      <Section label={s.count} aside={s.countAside}>
        <Stepper label={s.countLabel} value={lineup.players.length} min={0} max={maxPlayers} fill="chip" onChange={(n) => edit((l) => setPlayerCount(l, n, defaultPlayerName, config))} />
      </Section>
      <Section label={format(s.names, { n: named.length })} aside={s.namesAside}>
        {named.length > 0 && (
          <ul className={styles.chips}>
            {named.map((p) => (
              <li key={p.id} className={cx(styles.nameChip, text('label'))}>
                <span className={styles.ellipsis}>{p.name}</span>
                <button type="button" className={styles.remove} aria-label={format(en.a11y.removePlayer, { name: p.name })} onClick={() => edit((l) => removePlayer(l, p.id))}>
                  <Icon name="close" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <NameField placeholder={s.placeholder} onSubmit={(name) => edit((l) => addPlayer(l, name, config))} />
        {copy.playersHint && <p className={cx(styles.muted, text('small'))}>{format(copy.playersHint, { individual: minPlayers, teams: minTeamPlayers(config) })}</p>}
        {issue?.kind === 'tooFewPlayers' && <Note>{plural(issue.missing, copy.tooFew, { min: minPlayers })}</Note>}
      </Section>
    </Screen>
  );
}
