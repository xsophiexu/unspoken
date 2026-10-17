import { en } from '@unspoken/content';
import { movePlayer, playerName, removePlayer, renamePlayer, teamOf, type Lineup } from '@unspoken/core';
import { useState } from 'react';

import { PlayerMenu, RenameSheet, useAnchor, type MenuItem } from './ui';

// The menu on a player in setup: Rename, Move to (Teams), Remove from game. `ref(id)` goes on the
// view the menu opens under; `element` renders the menu and the rename sheet.
export function usePlayerMenu(lineup: Lineup, edit: (change: (l: Lineup) => Lineup) => void) {
  const anchor = useAnchor();
  const [renaming, setRenaming] = useState<string | null>(null);
  const m = en.mindReader.lineup.menu;
  const id = anchor.anchor?.id ?? null;
  const current = id ? teamOf(lineup, id) : undefined;
  const others = lineup.style === 'teams' ? lineup.teams.filter((t) => t.id !== current?.id) : [];
  const items: MenuItem[] = id
    ? [
        { label: m.rename, onPress: () => setRenaming(id) },
        ...(others.length > 0 ? [{ label: m.moveTo, onPress: () => undefined, submenu: true }] : []),
        { label: m.remove, onPress: () => edit((l) => removePlayer(l, id)), danger: true },
      ]
    : [];
  const element = (
    <>
      <PlayerMenu
        key={id ?? 'none'}
        anchor={anchor.anchor?.rect ?? null}
        items={items}
        moveTo={id ? others.map((t) => ({ label: t.name, dot: t.color, onPress: () => edit((l) => movePlayer(l, id, t.id)) })) : undefined}
        onClose={anchor.close}
      />
      <RenameSheet
        visible={renaming !== null}
        title={m.rename}
        initial={renaming ? playerName(lineup, renaming) : ''}
        onSave={(name) => renaming && edit((l) => renamePlayer(l, renaming, name))}
        onClose={() => setRenaming(null)}
      />
    </>
  );
  return { ref: anchor.ref, open: anchor.open, openFor: id, element };
}
