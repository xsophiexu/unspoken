import { cx } from '@/lib/ui';

import { Body, Room, Text, useUid, type DecorBodyProps, type LookDecor } from '../frame';
import styles from '../Decor.module.css';

// Glowing chips (N8-k06, JL14): a glowing jack-o'-lantern face in the dark over a glowing word, the
// banned words in orange-lit tiles, and a full-width Skip and Correct bar.

function GlowingChipsBody({ word, banned, swipeItem }: DecorBodyProps) {
  const uid = useUid();
  return (
    <Body look="glowingChips">
      <Room view={[0, 128, 372, 110]} align="xMaxYMax">
        <defs>
          <filter id={`${uid}-lit`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx={0} dy={0} stdDeviation={4} floodColor="#F6A65A" />
          </filter>
        </defs>
        <g transform={`translate(254 176) scale(${96 / 180})`} fill="#F6A65A" filter={`url(#${uid}-lit)`}>
          <path d="M20 48 L52 48 L36 14Z M128 48 L160 48 L144 14Z" />
          <path d="M14 68 Q90 132 166 68 L150 76 L140 66 L126 84 L112 70 L98 88 L82 70 L68 88 L54 70 L40 84 L30 72Z" />
        </g>
      </Room>
      <Text className={cx(styles.glowingChipsText, styles.tiles)}>
        {swipeItem(word)}
        {swipeItem(banned)}
      </Text>
    </Body>
  );
}

export const glowingChips: LookDecor = { Body: GlowingChipsBody };
