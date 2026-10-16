import { en } from '@unspoken/content';
import { layout, maxWidth, radius, space } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { goBack } from '../nav';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Screen } from '../ui/Screen';
import { Txt } from '../ui/Txt';

// After feedback is sent. Done returns to where the player opened the form.
export default function ThanksScreen() {
  const t = en.thanks;
  return (
    <Screen tone="canvas" width="page" scroll={false} footer={(colors) => <Button kind="primary" label={t.done} colors={colors} onPress={goBack} />}>
      {(colors) => (
        <View style={styles.middle}>
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Icon name="check" size={layout.icon.xl + space[2]} color={colors.onAccent} />
          </View>
          <Txt variant="modeName" color={colors.ink} accessibilityRole="header" style={styles.center}>
            {t.title}
          </Txt>
          <Txt variant="hint" color={colors.muted} style={[styles.center, styles.prose]}>
            {t.body}
          </Txt>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[3] },
  badge: { width: layout.control.heroBadge, height: layout.control.heroBadge, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginBottom: space[2] },
  center: { textAlign: 'center' },
  prose: { maxWidth: maxWidth.prose },
});
