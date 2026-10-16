import { en } from '@unspoken/content';
import {
  FEEDBACK_ENTRY_POINTS,
  FEEDBACK_TOPIC_IDS,
  canSendFeedback,
  defaultFeedbackTopic,
  feedbackLength,
  feedbackRules,
  format,
  type FeedbackEntryPoint,
} from '@unspoken/core';
import { layout, nativeTextStyle, radius, space } from '@unspoken/design-tokens';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { apiClient, appConfig } from '../config';
import { goBack } from '../nav';
import { usePrefs } from '../state/prefs';
import { Button, LinkButton } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { Screen, ScreenTitle, ScreenTop, SectionLabel } from '../ui/Screen';
import { Txt } from '../ui/Txt';

function entryPoint(value: unknown): FeedbackEntryPoint | undefined {
  return FEEDBACK_ENTRY_POINTS.find((e) => e === value);
}

// Send feedback: a topic (picked for the player by where they came from) and up to 500 characters,
// posted to the service through the API client. When it can't be sent the text stays and an error
// says so.
export default function FeedbackScreen() {
  const { theme } = usePrefs();
  const from = entryPoint(useLocalSearchParams<{ from?: string }>().from);
  const [topic, setTopic] = useState(() => defaultFeedbackTopic(from));
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const f = en.feedback;
  const field = theme.regions.raised;
  const place = f.places[from ?? 'menu'];

  const send = async () => {
    const client = apiClient();
    setFailed(false);
    if (!client) {
      setFailed(true);
      return;
    }
    setSending(true);
    try {
      const { platform, appVersion } = appConfig();
      await client.sendFeedback({ topic, message, entryPoint: from, platform, appVersion });
      router.replace('/thanks');
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      tone="canvas"
      width="page"
      footer={(colors) => (
        <Button kind="primary" icon="send" label={sending ? f.sending : f.send} colors={colors} disabled={sending || !canSendFeedback(message)} onPress={send} />
      )}
    >
      {(colors) => (
        <>
          <ScreenTop left={<LinkButton label={format(f.back, { place })} colors={colors} onPress={goBack} />} />
          <ScreenTitle title={f.title} sub={f.sub} colors={colors} />

          <View style={styles.section}>
            <SectionLabel label={f.topicLabel} colors={colors} />
            <View accessibilityRole="radiogroup" style={styles.chips}>
              {FEEDBACK_TOPIC_IDS.map((id) => (
                <Chip key={id} label={f.topics[id]} colors={colors} selected={id === topic} onPress={() => setTopic(id)} />
              ))}
            </View>
            {from ? (
              <Txt variant="subline" color={colors.muted}>
                {format(f.pickedFor, { place })}
              </Txt>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionLabel label={f.ideaLabel} aside={format(f.counter, { n: feedbackLength(message), max: feedbackRules.maxLength })} colors={colors} />
            <TextInput
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                setFailed(false);
              }}
              placeholder={f.placeholder}
              placeholderTextColor={field.muted}
              accessibilityLabel={f.ideaLabel}
              multiline
              maxLength={feedbackRules.maxLength}
              textAlignVertical="top"
              style={[styles.input, nativeTextStyle('input'), { backgroundColor: field.bg, color: field.ink, borderColor: colors.outline }]}
            />
            {failed ? (
              <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.error, { backgroundColor: colors.chip, borderColor: colors.outline }]}>
                <Icon name="cross" size={layout.icon.md} color={colors.chipInk} />
                <Txt variant="label" color={colors.chipInk} style={styles.errorText}>
                  {f.failed}
                </Txt>
              </View>
            ) : null}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[2.5] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  input: {
    minHeight: layout.control.input.multilineHeight,
    borderRadius: radius.md,
    borderWidth: layout.stroke.hairline,
    padding: space[4],
  },
  error: { flexDirection: 'row', alignItems: 'center', gap: space[2.5], borderRadius: radius.md, borderWidth: layout.stroke.hairline, padding: space[3] },
  errorText: { flex: 1 },
});
