'use client';

import { en } from '@unspoken/content';
import { HOT_MIC_RULES, hotMicSettings, type GameSettings, type HotMicSettings } from '@unspoken/core';

import { Section } from '@/components/ui/Section';
import { cx, text } from '@/lib/ui';

import styles from './HotMicSetup.module.css';

const copy = en.hotMic;

// The top of New game in Hot Mic: what the mode does, what a banned word heard costs, and the sound.
export function HotMicSetup({ settings, onChange }: { settings: GameSettings; onChange: (next: HotMicSettings) => void }) {
  const current = hotMicSettings(settings);
  return (
    <>
      <p className={cx(styles.hint, text('hint'))}>{copy.hint}</p>
      <Section label={copy.ruleLabel}>
        <div className={styles.rows} role="radiogroup" aria-label={copy.ruleLabel}>
          {HOT_MIC_RULES.map((rule) => (
            <label key={rule} className={cx(styles.row, current.rule === rule && styles.on)}>
              <input type="radio" name="hotMicRule" className="visually-hidden" checked={current.rule === rule} onChange={() => onChange({ ...current, rule })} />
              <span className={styles.radio} aria-hidden="true" />
              <span className={styles.text}>
                <span className={text('optionTitle')}>{copy.rules[rule].title}</span>
                <span className={cx(styles.detail, text('small'))}>{copy.rules[rule].detail}</span>
              </span>
            </label>
          ))}
          <label className={styles.row}>
            <span className={styles.text}>
              <span className={text('optionTitle')}>{copy.sound.title}</span>
              <span className={cx(styles.detail, text('small'))}>{copy.sound.detail}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="visually-hidden"
              aria-label={copy.sound.title}
              checked={current.sound}
              onChange={(event) => onChange({ ...current, sound: event.target.checked })}
            />
            <span className={cx(styles.track, current.sound && styles.trackOn)} aria-hidden="true">
              <span className={styles.thumb} />
            </span>
          </label>
        </div>
      </Section>
    </>
  );
}
