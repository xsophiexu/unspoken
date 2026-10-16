'use client';

import type { ApiClient } from '@unspoken/api-contract';
import { en } from '@unspoken/content';
import { FEEDBACK_TOPIC_IDS, canSendFeedback, defaultFeedbackTopic, feedbackLength, feedbackRules, format, type FeedbackEntryPoint } from '@unspoken/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { apiClient } from '@/lib/api';
import { config } from '@/lib/config';
import { feedbackReturn, routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';

import styles from './screens.module.css';

const copy = en.feedback;
// The idea box shows this many lines before it scrolls (the player can drag it taller).
const IDEA_LINES = 5;

type FeedbackScreenProps = {
  // Where the form was opened: picks the topic and where Back goes.
  from: FeedbackEntryPoint;
  // The API client; null when no API is configured. Tests pass one with a fake fetch.
  client?: ApiClient | null;
};

// Send feedback: a topic (picked for the player from where they came) and up to 500 characters.
// When sending fails, or no API is configured, an inline error shows and the text stays.
export function FeedbackScreen({ from, client = apiClient }: FeedbackScreenProps) {
  const router = useRouter();
  const picked = defaultFeedbackTopic(from);
  const [topic, setTopic] = useState(picked);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed'>('idle');
  const place = copy.places[from];

  const send = async () => {
    setStatus('sending');
    try {
      if (!client) throw new Error('No API configured');
      await client.sendFeedback({ topic, message, entryPoint: from, platform: 'web', appVersion: config.appVersion });
      router.push(routes.thanks(from));
    } catch {
      setStatus('failed');
    }
  };

  return (
    <Screen
      tone="canvas"
      width="page"
      back={{ href: feedbackReturn[from], label: format(copy.back, { place }) }}
      title={copy.title}
      sub={copy.sub}
      footer={
        <Button size="large" icon="send" disabled={status === 'sending' || !canSendFeedback(message)} onClick={send}>
          {status === 'sending' ? copy.sending : copy.send}
        </Button>
      }
    >
      <Section label={copy.topicLabel}>
        <div className={styles.chips} role="radiogroup" aria-label={copy.topicLabel}>
          {FEEDBACK_TOPIC_IDS.map((id) => (
            <Choice key={id} type="radio" name="topic" look="topic" checked={id === topic} onChange={() => setTopic(id)}>
              {copy.topics[id]}
            </Choice>
          ))}
        </div>
        {topic === picked && <p className={cx(styles.muted, text('small'))}>{format(copy.pickedFor, { place })}</p>}
      </Section>

      <Section label={copy.ideaLabel}>
        <textarea
          className={cx(styles.textarea, text('input'))}
          rows={IDEA_LINES}
          value={message}
          placeholder={copy.placeholder}
          aria-label={copy.ideaLabel}
          onChange={(event) => {
            setMessage(event.target.value);
            if (status === 'failed') setStatus('idle');
          }}
        />
        <p className={cx(styles.muted, styles.end, text('small'))} aria-live="polite">
          {format(copy.counter, { n: feedbackLength(message), max: feedbackRules.maxLength })}
        </p>
        {status === 'failed' && (
          <p className={cx(styles.error, text('label'))} role="alert">
            {copy.failed}
          </p>
        )}
      </Section>
    </Screen>
  );
}
