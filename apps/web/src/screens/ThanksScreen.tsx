'use client';

import { en } from '@unspoken/content';
import type { FeedbackEntryPoint } from '@unspoken/core';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { feedbackReturn } from '@/lib/routes';
import { cx, text } from '@/lib/ui';

import styles from './screens.module.css';

// After feedback is sent. Done goes back to where the form was opened.
export function ThanksScreen({ from }: { from: FeedbackEntryPoint }) {
  return (
    <Screen
      tone="canvas"
      width="prose"
      footer={
        <Button size="large" href={feedbackReturn[from]}>
          {en.thanks.done}
        </Button>
      }
    >
      <div className={styles.thanks}>
        <span className={styles.check} aria-hidden="true">
          <Icon name="check" />
        </span>
        <h1 className={text('modeName')}>{en.thanks.title}</h1>
        <p className={cx(styles.muted, text('hint'))}>{en.thanks.body}</p>
      </div>
    </Screen>
  );
}
