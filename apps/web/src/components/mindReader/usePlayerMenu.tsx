'use client';

import { en } from '@unspoken/content';
import { movePlayer, playerName, removePlayer, renamePlayer, teamOf, type Lineup } from '@unspoken/core';
import { useState } from 'react';

import { PlayerMenu, RenameSheet, type MenuItem } from './parts';

// The menu on a player in setup: Rename, Move to (Teams, when there is another team), Remove from
// game. open(id, element) opens it under that element; `element` renders the menu and the rename sheet.
export function usePlayerMenu(lineup: Lineup, edit: (change: (l: Lineup) => Lineup) => void) {
  const [anchor, setAnchor] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const m = en.mindReader.lineup.menu;
  const id = anchor?.id ?? null;
  const current = id ? teamOf(lineup, id) : undefined;
  const others = lineup.style === 'teams' ? lineup.teams.filter((t) => t.id !== current?.id) : [];
  const items: MenuItem[] = id
    ? [
        { label: m.rename, onClick: () => setRenaming(id) },
        ...(others.length > 0 ? [{ label: m.moveTo, onClick: () => undefined, submenu: true }] : []),
        { label: m.remove, onClick: () => edit((l) => removePlayer(l, id)), danger: true },
      ]
    : [];
  const element = (
    <>
      {anchor && id && (
        <PlayerMenu
          anchor={anchor.rect}
          items={items}
          moveTo={others.map((t) => ({ label: t.name, dot: t.color, onClick: () => edit((l) => movePlayer(l, id, t.id)) }))}
          onClose={() => setAnchor(null)}
        />
      )}
      {renaming && (
        <RenameSheet
          title={m.rename}
          initial={playerName(lineup, renaming)}
          onSave={(name) => edit((l) => renamePlayer(l, renaming, name))}
          onClose={() => setRenaming(null)}
        />
      )}
    </>
  );
  return {
    openFor: id,
    open: (playerId: string, target: Element) => setAnchor({ id: playerId, rect: target.getBoundingClientRect() }),
    element,
  };
}
