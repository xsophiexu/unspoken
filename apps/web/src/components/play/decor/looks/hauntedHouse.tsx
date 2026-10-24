'use client';

import { en } from '@unspoken/content';
import { fitWordSize } from '@unspoken/core';
import { wordMetrics } from '@unspoken/design-tokens';
import { useRef, type CSSProperties } from 'react';

import { useElementSize } from '@/lib/hooks';
import { cx, text } from '@/lib/ui';

import { BatAt } from '../art';
import { Body, Text, decorLabel, type DecorBodyProps, type LookDecor } from '../frame';
import styles from '../Decor.module.css';

// Haunted house (N11-h10, HC1): burgundy. A haunted house in silhouette against a big pale moon,
// with a bare tree, bats and an iron fence; the banned words are in its lit windows (DON'T SAY, IT'S
// IN THE WINDOWS), one word to a window.

const HOUSE = '#16040A';
const LIT = '#EBCB8B';
const DARK = '#33101A';
// The part of the board the house takes: from the tip of the tower to the fence's foot.
const TOP = 256;
const VIEW = { width: 372, height: 750 - TOP };

type Window = { x: number; y: number; w: number; h: number; radius: string; size: number };
const arch = (x: number, y: number, w = 70): Window => ({ x, y, w, h: 44, radius: '14 14 3 3', size: 13.5 });
// The windows words go in, in order: the round attic window, the two rows of the house, the tower's
// windows, then the smaller ones (an Escalate card can show up to ten words).
const WINDOWS: readonly Window[] = [
  { x: 162, y: 384, w: 50, h: 50, radius: '50%', size: 12.5 },
  arch(114, 466),
  arch(190, 466),
  arch(32, 556, 72),
  arch(114, 556),
  arch(190, 556),
  { x: 268, y: 436, w: 60, h: 50, radius: '30 30 3 3', size: 13 },
  { x: 40, y: 630, w: 56, h: 40, radius: '14 14 3 3', size: 12 },
  { x: 280, y: 526, w: 36, h: 48, radius: '18 18 3 3', size: 11 },
  { x: 284, y: 612, w: 28, h: 40, radius: '14 14 3 3', size: 10 },
];
// Windows lit with no word in them (the tower's, by the design), and the small lit ones.
const ALWAYS_LIT = new Set([6, 9]);
const SMALL_LIT = [
  { x: 352, y: 622, w: 16, h: 30, radius: '14 14 3 3' },
  { x: 53, y: 488, w: 14, h: 14, radius: '7 7 2 2' },
] as const;

const css = (radius: string, scale: number) =>
  radius
    .split(' ')
    .map((r) => (r.endsWith('%') ? r : `${Number(r) * scale}px`))
    .join(' ');

function HouseArt() {
  const pickets = Array.from({ length: 27 }, (_, i) => 4 + i * 14).filter((x) => x < 150 || x > 224);
  return (
    <>
      <circle cx={200} cy={422} r={160} fill="#E6D8BC" />
      <BatAt left={60} top={300} scale={0.6} color={HOUSE} />
      <BatAt left={320} top={318} scale={0.45} color={HOUSE} />
      <BatAt left={210} top={276} scale={0.35} color={HOUSE} />
      <g fill={HOUSE}>
        {/* The ground runs on under the controls. */}
        <path d="M-4000 740 L0 736 Q186 712 372 732 L4372 732 L4372 1300 L-4000 1300Z" />
        <rect x={106} y={440} width={162} height={330} />
        <path d="M94 446 L187 356 L280 446Z" />
        <rect x={183} y={334} width={4} height={26} />
        <rect x={24} y={540} width={88} height={230} />
        <path d="M14 544 L30 500 L104 500 L120 544Z" />
        <path d="M44 486 L60 466 L76 486Z" />
        <rect x={48} y={484} width={24} height={20} />
        <rect x={30} y={470} width={12} height={32} />
        <rect x={258} y={398} width={80} height={372} />
        <path d="M246 404 L298 280 L350 404Z" />
        <rect x={296} y={258} width={4} height={26} />
        <rect x={338} y={590} width={40} height={180} />
        <path d="M330 594 L376 560 L380 594Z" />
        <path d="M146 676 L228 676 L240 690 L134 690Z" />
        <rect x={148} y={690} width={6} height={48} />
        <rect x={220} y={690} width={6} height={48} />
      </g>
      <g stroke={HOUSE} strokeLinecap="round" fill="none">
        <path d="M12 744 L16 560 Q18 500 48 452" strokeWidth={9} />
        <path d="M16 600 Q4 566 -4 552" strokeWidth={5} />
        <path d="M30 480 Q50 430 86 414" strokeWidth={4} />
        <path d="M48 452 Q40 420 46 392" strokeWidth={3.5} />
        <path d="M66 424 L84 396" strokeWidth={2.5} />
      </g>
      <g stroke="#4E1A26" fill="none" strokeWidth={2.2}>
        <path d={pickets.map((x) => `M${x} 742 L${x} 702`).join(' ')} />
        <path d={pickets.map((x) => `M${x - 3} 704 L${x} 696 L${x + 3} 704`).join(' ')} fill="#4E1A26" strokeWidth={1} />
        <path d="M0 712 L150 712 M224 712 L372 712 M0 732 L150 732 M224 732 L372 732" />
        <path d="M152 742 L152 700 M222 742 L222 700" />
        <path d="M152 702 Q187 676 222 702" />
      </g>
      <path d="M170 740 V711 A17 17 0 0 1 204 711 V740Z" fill={DARK} />
    </>
  );
}

function HauntedHouseBody({ slot, card, word, swipeItem }: DecorBodyProps) {
  const roomRef = useRef<HTMLDivElement>(null);
  const room = useElementSize(roomRef, VIEW);
  const scale = Math.max(0, Math.min(room.width / VIEW.width, room.height / VIEW.height));
  const box = { width: VIEW.width * scale, height: VIEW.height * scale };
  const words = card?.banned ?? [];
  const place = (w: { x: number; y: number; w: number; h: number; radius: string }): CSSProperties => ({
    left: w.x * scale,
    top: (w.y - TOP) * scale,
    width: w.w * scale,
    height: w.h * scale,
    borderRadius: css(w.radius, scale),
  });

  return (
    <Body look="hauntedHouse">
      <Text className={styles.houseText}>{swipeItem(word)}</Text>
      <section className={styles.houseSection} data-spot="banned" aria-label={en.play.dontSay}>
        <h2 className={cx(styles.houseLabel, text('overline'))}>{decorLabel(slot) ?? en.play.dontSay}</h2>
        <div ref={roomRef} className={styles.houseRoom}>
          <div className={styles.houseBox} style={{ ...box, left: (room.width - box.width) / 2 }}>
            <svg className={styles.houseArt} viewBox={`0 ${TOP} ${VIEW.width} ${VIEW.height}`} aria-hidden="true">
              <HouseArt />
            </svg>
            {WINDOWS.map((w, i) => i >= words.length && <i key={i} className={styles.houseWindow} style={{ ...place(w), background: ALWAYS_LIT.has(i) ? LIT : DARK }} />)}
            {SMALL_LIT.map((w) => (
              <i key={w.x} className={styles.houseWindow} style={{ ...place(w), background: LIT }} />
            ))}
            <div className={styles.houseWindows}>
              {swipeItem(
                <ul className={styles.houseList}>
                  {words.map((banned, i) => {
                    const w = WINDOWS[i];
                    if (!w) return null;
                    const size = fitWordSize(banned, wordMetrics, { width: (w.w - 6) * scale, max: w.size * scale, min: 7 * scale, maxLines: 2 });
                    return (
                      <li key={banned} className={cx(styles.houseWord, i === card?.freshIndex && styles.houseFresh)} style={{ ...place(w), fontSize: size }}>
                        {banned}
                      </li>
                    );
                  })}
                </ul>,
              )}
            </div>
          </div>
        </div>
      </section>
    </Body>
  );
}

export const hauntedHouse: LookDecor = { Body: HauntedHouseBody };
