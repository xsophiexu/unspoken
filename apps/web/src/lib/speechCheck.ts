'use client';

// Experimental: listen to the clue giver and beep when they say the card's word or a banned word.
// The browser's speech recognizer turns speech into text; @unspoken/core decides what counts as
// saying a word. Audio stays on the device whenever the browser can recognize speech there; when
// it can't, the player has to allow the browser's own speech service first.

import { SpokenTermListener, type SpokenHit, type SpokenTerm } from '@unspoken/core';
import { useCallback, useEffect, useRef, useState } from 'react';

import { readStored, writeStored } from './storage';

// Turned on with ?mic=1 and off with ?mic=0; remembered on this device.
const FLAG_KEY = 'unspoken.experiment.mic';

export function speechCheckEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const param = new URLSearchParams(window.location.search).get('mic');
  if (param === '1' || param === '0') writeStored(FLAG_KEY, param === '1');
  return readStored(FLAG_KEY) === true;
}

// The parts of the Web Speech API used here. TypeScript's DOM types don't cover on-device
// recognition yet, and the constructor is prefixed in some browsers.
type Availability = 'available' | 'downloadable' | 'downloading' | 'unavailable';
type LocalOptions = { langs: string[]; processLocally: boolean };
type ResultList = ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  processLocally?: boolean;
  onresult: ((event: { resultIndex: number; results: ResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
};
type RecognitionClass = {
  new (): Recognition;
  available?: (options: LocalOptions) => Promise<Availability>;
  install?: (options: LocalOptions) => Promise<boolean>;
};

function recognitionClass(): RecognitionClass | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechCheckStatus =
  | 'off'
  // The browser has no speech recognition at all.
  | 'unsupported'
  // On-device recognition isn't available; waiting for the player to allow the browser's service.
  | 'needsCloud'
  | 'downloading'
  | 'listening'
  // The player or the browser refused the microphone.
  | 'blocked'
  | 'error';

// Where speech is turned into text while listening.
export type SpeechWhere = 'device' | 'cloud';

// A short two-tone buzz, made on the spot so there's no sound file to load.
function buzz(audio: AudioContext) {
  const now = audio.currentTime;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  gain.connect(audio.destination);
  const osc = audio.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.setValueAtTime(660, now + 0.14);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.34);
  navigator.vibrate?.(200);
}

type Options = {
  // The card's word and banned words showing, or null between cards.
  terms: readonly SpokenTerm[] | null;
  // False while the round is paused or covered, so nothing listens then.
  active: boolean;
  onHit: (hit: SpokenHit) => void;
};

export function useSpeechCheck({ terms, active, onHit }: Options) {
  const [status, setStatus] = useState<SpeechCheckStatus>('off');
  const [where, setWhere] = useState<SpeechWhere | null>(null);
  const [wanted, setWanted] = useState(false);
  const listener = useRef(new SpokenTermListener());
  const recognition = useRef<Recognition | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const onHitRef = useRef(onHit);
  useEffect(() => {
    onHitRef.current = onHit;
  });

  // A new card: what was already said doesn't count against it.
  const termsKey = terms?.map((t) => t.text).join('\n') ?? '';
  useEffect(() => {
    listener.current.setTerms(terms ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- termsKey stands for terms
  }, [termsKey]);

  const lang = typeof navigator === 'undefined' ? 'en-US' : navigator.language || 'en-US';

  // Decide where recognition can run. Called from a tap, which browsers need before a download or
  // the microphone prompt.
  const turnOn = useCallback(
    async (allowCloud = false) => {
      const Rec = recognitionClass();
      if (!Rec) return setStatus('unsupported');
      audio.current ??= new AudioContext();
      void audio.current.resume();
      const local = { langs: [lang], processLocally: true };
      let state: Availability = 'unavailable';
      try {
        state = (await Rec.available?.(local)) ?? 'unavailable';
      } catch {
        state = 'unavailable';
      }
      if (state === 'downloadable' || state === 'downloading') {
        setStatus('downloading');
        const installed = await Rec.install?.(local).catch(() => false);
        state = installed ? 'available' : 'unavailable';
      }
      if (state === 'available') setWhere('device');
      else if (allowCloud) setWhere('cloud');
      else return setStatus('needsCloud');
      setWanted(true);
    },
    [lang],
  );

  const turnOff = useCallback(() => {
    setWanted(false);
    setWhere(null);
    setStatus('off');
  }, []);

  // Listen while wanted and the round is in play. Browsers end a session after a pause in speech,
  // so it starts again until it's no longer wanted.
  useEffect(() => {
    const Rec = recognitionClass();
    if (!wanted || !active || !where || !Rec) return;
    let stopped = false;
    const start = () => {
      const rec = new Rec();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      if (where === 'device') rec.processLocally = true;
      listener.current.restart();
      rec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i]?.[0]?.transcript ?? '';
          for (const hit of listener.current.hear(i, text)) {
            if (audio.current) buzz(audio.current);
            onHitRef.current(hit);
          }
        }
      };
      rec.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          stopped = true;
          setWanted(false);
          setStatus('blocked');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setStatus('error');
        }
      };
      rec.onend = () => {
        if (!stopped) start();
      };
      recognition.current = rec;
      try {
        rec.start();
        setStatus('listening');
      } catch {
        setStatus('error');
      }
    };
    start();
    return () => {
      stopped = true;
      recognition.current?.abort();
      recognition.current = null;
    };
  }, [wanted, active, where, lang]);

  return { status, where, on: wanted, turnOn, turnOff };
}
