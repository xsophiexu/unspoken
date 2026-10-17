import { en } from '@unspoken/content';
import { layout, radius, space } from '@unspoken/design-tokens';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useStartMindReader } from '../../mindReader/start';
import { Card } from '../../mindReader/ui';
import { usePrefs } from '../../state/prefs';
import { LinkButton } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Press } from '../../ui/Press';
import { Screen, ScreenTitle, ScreenTop } from '../../ui/Screen';
import { Txt } from '../../ui/Txt';

// Mind Reader's start: Quick Play in one tap, a Custom game set up in three steps, or a Practice turn.
export default function MindReaderStart() {
  const { theme } = usePrefs();
  const start = useStartMindReader();
  const s = en.mindReader.start;
  const accent = theme.regions.accent;
  return (
    <Screen tone="base" width="column">
      {(colors) => (
        <>
          <ScreenTop left={<LinkButton label={s.back} colors={colors} onPress={() => router.navigate('/modes')} />} />
          <ScreenTitle title={en.modes.mindReader.name} sub={s.sub} colors={colors} />
          <Press onPress={() => start('quick')} accessibilityLabel={`${s.quick.title}. ${s.quick.body}`} style={[styles.quick, { backgroundColor: accent.bg }]}>
            <View style={styles.grow}>
              <Txt variant="modeName" color={accent.ink}>
                {s.quick.title}
              </Txt>
              <Txt variant="small" color={accent.muted}>
                {s.quick.body}
              </Txt>
            </View>
            <View style={[styles.play, { backgroundColor: accent.accent }]}>
              <Txt variant="button" color={accent.onAccent}>
                {s.quick.action}
              </Txt>
              <Icon name="chevronRight" size={layout.icon.sm} color={accent.onAccent} />
            </View>
          </Press>
          <View style={styles.rows}>
            {[
              { ...s.custom, onPress: () => router.push('/mind-reader/players') },
              { ...s.practice, onPress: () => start('practice') },
            ].map((row) => (
              <Press key={row.title} onPress={row.onPress} accessibilityLabel={`${row.title}. ${row.body}`}>
                <Card style={styles.row}>
                  <View style={styles.grow}>
                    <Txt variant="optionTitle" color={colors.ink}>
                      {row.title}
                    </Txt>
                    <Txt variant="small" color={colors.muted}>
                      {row.body}
                    </Txt>
                  </View>
                  <Icon name="chevronRight" size={layout.icon.sm} color={colors.ink} />
                </Card>
              </Press>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, gap: space[1] },
  quick: { flexDirection: 'row', alignItems: 'center', gap: space[3], borderRadius: radius.cardLarge, padding: space[5] },
  play: { flexDirection: 'row', alignItems: 'center', gap: space[1], borderRadius: radius.pill, paddingHorizontal: space[4], minHeight: layout.minTouch - space[1] },
  rows: { gap: space[2.5] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
});
