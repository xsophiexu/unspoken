'use client';

import { en } from '@unspoken/content';
import { FEEDBACK_TOPIC_IDS, canSendFeedback, defaultFeedbackTopic, feedbackLength, feedbackRules, format, type FeedbackEntryPoint } from '@unspoken/core';
import { FeedbackError, type FeedbackClient } from '@unspoken/firebase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { config } from '@/lib/config';
import { feedbackClient } from '@/lib/feedback';
import { feedbackReturn, routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';

import styles from './screens.module.css';

const copy = en.feedback;
// The idea box shows this many lines before it scrolls (the player can drag it taller).
const IDEA_LINES = 5;

type FeedbackScreenProps = {
  // Where the form was opened: picks the topic and where Back goes.
  from: FeedbackEntryPoint;
  // Sends to Firestore; null when Firebase is not configured. Tests pass one over a fake adapter.
  client?: FeedbackClient | null;
};

// Send feedback: a topic (picked for the player from where they came) and up to 500 characters.
// When sending fails, or Firebase is not configured, an inline error shows and the text stays; a
// second idea within a minute gets a "wait a minute" error instead.
export function FeedbackScreen({ from, client = feedbackClient }: FeedbackScreenProps) {
  const router = useRouter();
  const picked = defaultFeedbackTopic(from);
  const [topic, setTopic] = useState(picked);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed' | 'rateLimited'>('idle');
  const place = copy.places[from];

  const send = async () => {
    setStatus('sending');
    try {
      if (!client) throw new Error('Firebase is not configured');
      await client.sendFeedback({ topic, message, entryPoint: from, platform: 'web', appVersion: config.appVersion });
      router.push(routes.thanks(from));
    } catch (error) {
      setStatus(error instanceof FeedbackError && error.code === 'rateLimited' ? 'rateLimited' : 'failed');
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
            if (status === 'failed' || status === 'rateLimited') setStatus('idle');
          }}
        />
        <p className={cx(styles.muted, styles.end, text('small'))} aria-live="polite">
          {format(copy.counter, { n: feedbackLength(message), max: feedbackRules.maxLength })}
        </p>
        {(status === 'failed' || status === 'rateLimited') && (
          <p className={cx(styles.error, text('label'))} role="alert">
            {status === 'rateLimited' ? copy.rateLimited : copy.failed}
          </p>
        )}
      </Section>
    </Screen>
  );
}
