import { en } from '@unspoken/content';
import { clampVersusSetup, format, gameConfig, plural, type VersusSetup } from '@unspoken/core';
import { radius, space, type RegionColors } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { mrStyles, Stepper } from '../mindReader/ui';
import { usePrefs } from '../state/prefs';
import { Press } from '../ui/Press';
import { SectionLabel } from '../ui/Screen';
import { ToggleTrack } from '../ui/Toggle';
import { Txt } from '../ui/Txt';

// Versus's Game settings under the time limit: Rounds and Skips per turn, then Scoring with the
// banned word penalty (off by default) and, when it is on, how many points it costs.
export function VersusSettings({ colors }: { colors: RegionColors }) {
  const { versus, setVersus, theme } = usePrefs();
  const s = en.versus.settings;
  const { rounds, skips, penalty } = gameConfig.versus;
  const set = (patch: Partial<VersusSetup>) => setVersus((v) => clampVersusSetup({ ...v, ...patch }));
  const teams = versus.lineup.style === 'teams';
  return (
    <>
      <View style={mrStyles.section}>
        <SectionLabel label={s.rounds} colors={colors} />
        <Stepper
          label={s.roundsLabel}
          sub={teams ? s.roundsTeams : s.roundsIndividual}
          value={versus.rounds}
          min={rounds.min}
          max={rounds.max}
          onChange={(n) => set({ rounds: n })}
          colors={colors}
          fill="chip"
        />
        <Stepper label={s.skipsLabel} sub={s.skipsSub} value={versus.skips} min={skips.min} max={skips.max} onChange={(n) => set({ skips: n })} colors={colors} fill="chip" />
      </View>
      <View style={mrStyles.section}>
        <SectionLabel label={s.scoring} colors={colors} />
        <Press
          onPress={() => set({ penalty: !versus.penalty })}
          accessibilityRole="switch"
          accessibilityLabel={s.penalty}
          accessibilityState={{ checked: versus.penalty }}
          style={[styles.row, { backgroundColor: colors.chip }]}
        >
          <View style={styles.grow}>
            <Txt variant="optionTitle" color={colors.ink}>
              {s.penalty}
            </Txt>
            <Txt variant="small" color={colors.muted}>
              {versus.penalty ? plural(versus.penaltyPoints, s.penaltyOn) : s.penaltyOff}
            </Txt>
          </View>
          <ToggleTrack on={versus.penalty} colors={colors} knob={theme.regions.raised.bg} />
        </Press>
        {versus.penalty ? (
          <Stepper
            label={s.pointsLost}
            sub={teams ? s.pointsLostTeams : s.pointsLostIndividual}
            value={versus.penaltyPoints}
            display={format(s.pointsLostValue, { n: versus.penaltyPoints })}
            min={penalty.points.min}
            max={penalty.points.max}
            onChange={(n) => set({ penaltyPoints: n })}
            colors={colors}
            fill="chip"
          />
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  // The same box as a Stepper row, with the switch in place of − and +.
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2.5], borderRadius: radius.xl, paddingLeft: space[4], paddingRight: space[3], paddingVertical: space[3] },
});
