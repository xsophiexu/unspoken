'use client';

import { en } from '@unspoken/content';
import { cardSpokenTerms, format, hotMicSettings, type GameSettings, type SpokenHit } from '@unspoken/core';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { readStored, writeStored } from '@/lib/storage';
import { useHotMic } from '@/lib/speechCheck';
import { cx, text } from '@/lib/ui';

import { HotMicContext } from './context';
import styles from './HotMic.module.css';

const copy = en.hotMic;
// Set once the player has answered the ask, so it shows only the first time.
const ASKED_KEY = 'unspoken.hotMic.asked';
// How long the pill says "Heard: word" before it goes back to Listening.
const HEARD_MS = 1200;

type HotMicRoundProps = {
  settings: GameSettings;
  card: { key: string; word: string; banned: readonly string[] } | null;
  // False while the round is paused, covered or over.
  active: boolean;
  onHeard: () => void;
  children: ReactNode;
};

// Hot Mic around a swipe round: listens while a card is up, reports each banned word heard (and each
// word of the card's own word), and gives the play screen the pill and the chip marks.
export function HotMicRound({ settings, card, active, onHeard, children }: HotMicRoundProps) {
  const { sound } = hotMicSettings(settings);
  const terms = useMemo(() => (card ? cardSpokenTerms(card) : null), [card]);
  const [heard, setHeard] = useState<{ cardKey: string; counts: Map<string, number>; last: SpokenHit; n: number } | null>(null);
  const [showHeard, setShowHeard] = useState(false);
  const [asking, setAsking] = useState(() => readStored(ASKED_KEY) !== true);
  const mic = useHotMic({
    terms,
    active: active && card !== null,
    sound,
    onHeard: (hit) => {
      setHeard((current) => {
        const counts = new Map(current && current.cardKey === card?.key ? current.counts : []);
        counts.set(hit.text, (counts.get(hit.text) ?? 0) + 1);
        return { cardKey: card?.key ?? '', counts, last: hit, n: (current?.n ?? 0) + 1 };
      });
      setShowHeard(true);
      onHeard();
    },
  });

  // The first time, ask before listening; after that, listen straight away.
  useEffect(() => {
    if (!asking) void mic.turnOn();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the round opens
  }, []);

  useEffect(() => {
    if (!showHeard) return;
    const id = window.setTimeout(() => setShowHeard(false), HEARD_MS);
    return () => window.clearTimeout(id);
  }, [showHeard, heard?.n]);

  const counts = heard && heard.cardKey === card?.key ? heard.counts : new Map<string, number>();
  const on = mic.state === 'listening' || mic.state === 'starting';
  const label = !on ? copy.pill.off : showHeard && heard ? format(copy.pill.heard, { word: spoken(heard.last.text) }) : copy.pill.listening;
  const pill = (
    <div className={styles.pillRow}>
      <button
        // A new key on each word heard replays the shake.
        key={showHeard ? `heard-${heard?.n}` : 'pill'}
        type="button"
        className={cx(styles.pill, text('label'), !on && styles.off, on && showHeard && styles.heard)}
        aria-pressed={on}
        aria-label={on ? copy.pill.a11yOn : copy.pill.a11yOff}
        onClick={() => (on ? mic.turnOff() : void mic.turnOn(mic.online))}
      >
        <MicIcon off={!on} />
        {on && <Wave live={mic.hearing} />}
        <span aria-live="polite">{label}</span>
      </button>
      {mic.state === 'online' && (
        <p className={cx(styles.note, text('small'))}>
          {copy.online}{' '}
          <button type="button" className={styles.link} onClick={() => void mic.turnOn(true)}>
            {copy.onlineAnyway}
          </button>
        </p>
      )}
      {(mic.state === 'blocked' || mic.state === 'unsupported') && (
        <p className={cx(styles.note, text('small'))}>{mic.state === 'blocked' ? copy.blocked : copy.unsupported}</p>
      )}
    </div>
  );

  const answer = (allow: boolean) => {
    writeStored(ASKED_KEY, true);
    setAsking(false);
    if (allow) void mic.turnOn();
  };

  return (
    <HotMicContext.Provider value={{ pill, heard: counts }}>
      {children}
      {/* Asked once the intro and any sheet are out of the way. */}
      {asking && active && (
        <Sheet labelledBy="hot-mic-ask" onClose={() => answer(false)}>
          <div className={styles.ask}>
            <span className={styles.askIcon} aria-hidden="true">
              <MicIcon />
            </span>
            <h2 id="hot-mic-ask" className={text('sheetTitle')}>
              {copy.ask.title}
            </h2>
            <p className={cx(styles.muted, text('hint'))}>{copy.ask.body}</p>
            <p className={cx(styles.privacy, text('label'))}>
              <LockIcon />
              {copy.ask.privacy}
            </p>
            <p className={cx(styles.muted, text('small'))}>{copy.ask.note}</p>
            <div className={styles.askActions}>
              <Button size="large" onClick={() => answer(true)}>
                {copy.ask.allow}
              </Button>
              <Button size="large" variant="quiet" onClick={() => answer(false)}>
                {copy.ask.notNow}
              </Button>
            </div>
          </div>
        </Sheet>
      )}
    </HotMicContext.Provider>
  );
}

// How a heard word reads in the pill: lowercase like speech ("Heard: ejection fraction"), apart
// from abbreviations ("Heard: LDL").
function spoken(term: string): string {
  return term === term.toUpperCase() ? term : term.toLowerCase();
}

function MicIcon({ off = false }: { off?: boolean }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

// Five bars that move while the phone hears sound and rest low when it's quiet.
function Wave({ live }: { live: boolean }) {
  return (
    <span className={cx(styles.wave, live && styles.live)} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} />
      ))}
    </span>
  );
}
