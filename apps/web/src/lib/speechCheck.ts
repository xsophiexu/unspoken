'use client';

// Hot Mic: listen to the clue giver and report each banned word heard. The browser's speech
// recognizer turns speech into text; @unspoken/core decides what counts as saying a word. Speech is
// recognized on the phone whenever the browser can; when it can't, the player has to agree before
// audio goes to the browser's speech service.

import { SpokenTermListener, type SpokenHit, type SpokenTerm } from '@unspoken/core';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  start(): void;
  abort(): void;
};
type RecognitionClass = {
  new (): Recognition;
  available?: (options: LocalOptions) => Promise<Availability>;
  install?: (options: LocalOptions) => Promise<boolean>;
};

function recognitionClass(): RecognitionClass | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type MicState =
  | 'off'
  | 'starting'
  | 'listening'
  // On-device recognition isn't available; waiting for the player to agree to the speech service.
  | 'online'
  // The browser has no speech recognition.
  | 'unsupported'
  // The player or the browser refused the microphone.
  | 'blocked';

// A short two-tone beep, made on the spot so there's no sound file to load.
function beep(audio: AudioContext) {
  const now = audio.currentTime;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  gain.connect(audio.destination);
  const osc = audio.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.setValueAtTime(520, now + 0.13);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.32);
}

type Options = {
  // The terms to listen for on the card showing, or null between cards.
  terms: readonly SpokenTerm[] | null;
  // False while the round is paused, covered or over, so nothing listens then.
  active: boolean;
  // Off: only vibrate.
  sound: boolean;
  onHeard: (hit: SpokenHit) => void;
};

export function useHotMic({ terms, active, sound, onHeard }: Options) {
  const [state, setState] = useState<MicState>('off');
  const [online, setOnline] = useState(false);
  // The recognizer hears sound right now, for the live wave.
  const [hearing, setHearing] = useState(false);
  const listener = useRef(new SpokenTermListener());
  const audio = useRef<AudioContext | null>(null);
  const latest = useRef({ onHeard, sound });
  useEffect(() => {
    latest.current = { onHeard, sound };
  });

  // A new card: what was already said doesn't count against it.
  const termsKey = terms?.map((t) => t.text).join('\n') ?? '';
  useEffect(() => {
    listener.current.setTerms(terms ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- termsKey stands for terms
  }, [termsKey]);

  const lang = typeof navigator === 'undefined' ? 'en-US' : navigator.language || 'en-US';

  // Turn listening on: on the phone when the browser can, otherwise only with allowOnline. Call it
  // from a tap where possible; browsers want one before a download or a sound.
  const turnOn = useCallback(
    async (allowOnline = false) => {
      const Rec = recognitionClass();
      if (!Rec) return setState('unsupported');
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume();
      } catch {
        // No Web Audio: it still vibrates.
      }
      setState('starting');
      const local = { langs: [lang], processLocally: true };
      let availability: Availability = 'unavailable';
      try {
        availability = (await Rec.available?.(local)) ?? 'unavailable';
        if (availability === 'downloadable' || availability === 'downloading') availability = (await Rec.install?.(local)) ? 'available' : 'unavailable';
      } catch {
        availability = 'unavailable';
      }
      if (availability !== 'available' && !allowOnline) return setState('online');
      setOnline(availability !== 'available');
      setState('listening');
    },
    [lang],
  );

  const turnOff = useCallback(() => setState('off'), []);

  // Browsers end a session after a pause in speech, so it starts again while listening.
  const listening = state === 'listening';
  useEffect(() => {
    const Rec = recognitionClass();
    if (!listening || !active || !Rec) return;
    let stopped = false;
    let current: Recognition | null = null;
    const start = () => {
      const rec = new Rec();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      if (!online) rec.processLocally = true;
      listener.current.restart();
      rec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          for (const hit of listener.current.hear(i, event.results[i]?.[0]?.transcript ?? '')) {
            if (latest.current.sound && audio.current) beep(audio.current);
            navigator.vibrate?.(180);
            latest.current.onHeard(hit);
          }
        }
      };
      rec.onsoundstart = () => setHearing(true);
      rec.onsoundend = () => setHearing(false);
      rec.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
          stopped = true;
          setState('blocked');
        }
      };
      rec.onend = () => {
        setHearing(false);
        if (!stopped) start();
      };
      current = rec;
      try {
        rec.start();
      } catch {
        stopped = true;
        setState('blocked');
      }
    };
    start();
    return () => {
      stopped = true;
      current?.abort();
      setHearing(false);
    };
  }, [listening, active, online, lang]);

  return { state, online, hearing: listening && active && hearing, turnOn, turnOff };
}
