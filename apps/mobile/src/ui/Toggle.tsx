import { radius, space, type RegionColors } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

// A small drawn switch (the No limit switch, Banned word penalty). Drawn rather than the platform
// Switch, so it looks the same on iOS, Android and web. The Press around it carries the role.
export function ToggleTrack({ on, colors, knob }: { on: boolean; colors: RegionColors; knob: string }) {
  return (
    <View style={[styles.track, on ? styles.trackOn : null, { backgroundColor: on ? colors.accent : colors.track }]}>
      <View style={[styles.thumb, { backgroundColor: knob }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: space[8], height: space[4.5], borderRadius: radius.pill, padding: space[0.5], alignItems: 'flex-start' },
  trackOn: { alignItems: 'flex-end' },
  thumb: { width: space[3.5], height: space[3.5], borderRadius: radius.pill },
});
