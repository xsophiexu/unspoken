'use client';

import { en } from '@unspoken/content';
import { addPlayer, format, gameConfig, lineupIssue, plural, removePlayer, setPlayerCount, type Lineup } from '@unspoken/core';
import { useRouter } from 'next/navigation';

import { NameField, Note, StepTop, Stepper } from '@/components/mindReader/parts';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useGame } from '@/state/game';

import styles from './setup.module.css';

export const defaultPlayerName = (n: number) => format(en.mindReader.players.defaultName, { n });

// Custom game, step 1: how many players, with names if they like.
export function MindReaderPlayersScreen() {
  const { mindReader, setMindReader } = useGame();
  const router = useRouter();
  const { lineup } = mindReader;
  const s = en.mindReader.players;
  const { minPlayers, maxPlayers } = gameConfig.mindReader;
  const named = lineup.players.filter((p) => p.named);
  const issue = lineupIssue({ ...lineup, style: 'individual' });
  const edit = (change: (l: Lineup) => Lineup) => setMindReader((m) => ({ ...m, lineup: change(m.lineup) }));
  return (
    <Screen
      tone="base"
      width="column"
      footer={
        <Button size="large" disabled={issue !== null} onClick={() => router.push(routes.mindReaderLineup)}>
          {en.mindReader.next}
        </Button>
      }
    >
      <StepTop step={1} total={3} title={s.title} back={{ href: routes.mindReader, label: en.mindReader.start.back }} />
      <Section label={s.count} aside={s.countAside}>
        <Stepper label={s.countLabel} value={lineup.players.length} min={0} max={maxPlayers} fill="chip" onChange={(n) => edit((l) => setPlayerCount(l, n, defaultPlayerName))} />
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
        <NameField placeholder={s.placeholder} onSubmit={(name) => edit((l) => addPlayer(l, name))} />
        {issue?.kind === 'tooFewPlayers' && <Note>{plural(issue.missing, s.tooFew, { min: minPlayers })}</Note>}
      </Section>
    </Screen>
  );
}
