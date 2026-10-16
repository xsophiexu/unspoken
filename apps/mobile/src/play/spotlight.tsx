import type { SpotlightTarget } from '@unspoken/content';
import { createContext, use, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

// How to play points at parts of the play screen. Each style puts the word, banned list, level,
// menu and controls in different places, so the slots mark their own element with <Target> and
// the tour measures whatever is marked. A marked element that lays out again (a fitted word, a
// style change, a rotation) tells the tour, which measures again.

export type Targets = {
  set: (name: SpotlightTarget, node: View | null) => unknown;
  get: (name: SpotlightTarget) => View | null;
  // Called when a marked element lays out again.
  changed: () => void;
  // Returns the unsubscribe.
  listen: (fn: () => void) => () => void;
};

const TargetsContext = createContext<Targets | null>(null);

export function useTargets(): Targets {
  const [targets] = useState<Targets>(() => {
    const nodes = new Map<SpotlightTarget, View>();
    const listeners = new Set<() => void>();
    return {
      set: (name, node) => (node ? nodes.set(name, node) : nodes.delete(name)),
      get: (name) => nodes.get(name) ?? null,
      changed: () => listeners.forEach((fn) => fn()),
      listen: (fn) => {
        listeners.add(fn);
        return () => {
          listeners.delete(fn);
        };
      },
    };
  });
  return targets;
}

export function TargetsProvider({ targets, children }: { targets: Targets; children: ReactNode }) {
  return <TargetsContext value={targets}>{children}</TargetsContext>;
}

export function Target({ name, children }: { name: SpotlightTarget; children: ReactNode }) {
  const targets = use(TargetsContext);
  return (
    <View
      collapsable={false}
      style={styles.target}
      onLayout={targets ? () => targets.changed() : undefined}
      ref={
        targets
          ? (node) => {
              targets.set(name, node);
            }
          : undefined
      }
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Never wider than its container, so long content inside (the mode label) can shrink.
  target: { maxWidth: '100%' },
});
