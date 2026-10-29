'use client';

import { cardSpokenTerms, type SpokenHit } from '@unspoken/core';
import { useEffect, useMemo, useState } from 'react';

import { Icon } from '@/components/ui/Icon';
import { speechCheckEnabled, useSpeechCheck, type SpeechCheckStatus } from '@/lib/speechCheck';

import styles from './MicCheck.module.css';

// Experimental, not in the copy catalog yet: wording is for testing only.
const statusText: Record<SpeechCheckStatus, string> = {
  off: 'Listen for banned words',
  unsupported: 'This browser can’t listen',
  needsCloud: 'Can’t listen on this device',
  downloading: 'Getting speech ready…',
  listening: 'Listening',
  blocked: 'Microphone blocked',
  error: 'Listening stopped',
};

// How long the "you said it" banner stays up.
const HIT_MS = 1600;

type MicCheckProps = {
  card: { key: string; word: string; banned: readonly string[] } | null;
  active: boolean;
};

// A mic button over the round. While on, saying the card's word or a banned word that's showing
// beeps and names the word.
export function MicCheck(props: MicCheckProps) {
  const [enabled] = useState(speechCheckEnabled);
  return enabled ? <MicCheckOn {...props} /> : null;
}

function MicCheckOn({ card, active }: MicCheckProps) {
  const [hit, setHit] = useState<{ hit: SpokenHit; at: number } | null>(null);
  const terms = useMemo(() => (card ? cardSpokenTerms(card) : null), [card]);
  const { status, where, on, turnOn, turnOff } = useSpeechCheck({
    terms,
    active: active && card !== null,
    onHit: (h) => setHit({ hit: h, at: Date.now() }),
  });

  useEffect(() => {
    if (!hit) return;
    const id = window.setTimeout(() => setHit(null), HIT_MS);
    return () => window.clearTimeout(id);
  }, [hit]);

  const label = status === 'listening' && where ? `${statusText.listening} · ${where === 'device' ? 'on device' : 'online'}` : statusText[status];

  // Nothing over the intro, sheets, Paused or round-over screens.
  if (!active) return null;

  return (
    <>
      {hit && (
        <div key={hit.at} className={styles.hit} role="alert">
          {hit.hit.kind === 'word' ? 'You said the word' : 'Banned word'}: <strong>{hit.hit.text}</strong>
        </div>
      )}
      <div className={styles.dock}>
        {status === 'needsCloud' && !on && (
          <p className={styles.note}>
            Your browser can only listen by sending audio to its own speech service.{' '}
            <button type="button" className={styles.link} onClick={() => void turnOn(true)}>
              Allow
            </button>
          </p>
        )}
        <button
          type="button"
          className={styles.mic}
          data-on={on || undefined}
          aria-pressed={on}
          onClick={() => (on ? turnOff() : void turnOn())}
        >
          <Icon name="mic" size={16} />
          <span>{label}</span>
        </button>
      </div>
    </>
  );
}
