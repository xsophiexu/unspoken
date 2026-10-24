import { Body, Room, Text, type DecorBodyProps, type LookDecor } from '../frame';
import styles from '../Decor.module.css';

// Little ghosts (N9-p05, GH1): the word and its banned chips on a big friendly ghost (a face on its
// head, a wavy hem), with little ghosts floating around it.

const SHEET = '#F4F8F7';
const INK = '#1F3332';
// A little ghost in a 100 × 120 box.
const LITTLE = 'M0 50 Q0 0 50 0 Q100 0 100 50 L100 112 Q83 96 67 112 Q50 126 33 112 Q17 96 0 112Z';

function Little({ left, top, w, rotate, opacity }: { left: number; top: number; w: number; rotate: number; opacity: number }) {
  const s = w / 100;
  const h = 120 * s;
  return (
    <g opacity={opacity} transform={`translate(${left} ${top}) rotate(${rotate} ${w / 2} ${h / 2}) scale(${s})`}>
      <path d={LITTLE} fill={SHEET} />
      <circle cx={36} cy={46} r={7} fill={INK} />
      <circle cx={64} cy={46} r={7} fill={INK} />
    </g>
  );
}

function LittleGhostsBody({ word, banned, swipeCard }: DecorBodyProps) {
  return (
    <Body look="littleGhosts">
      <Text className={styles.ghostText}>
        {/* Two little ghosts peek out from behind the big one. */}
        <svg className={styles.ghostPeek} viewBox="0 112 372 108" aria-hidden="true">
          <Little left={2} top={150} w={58} rotate={-14} opacity={0.55} />
          <Little left={232} top={112} w={17} rotate={-6} opacity={0.22} />
        </svg>
        {swipeCard(
          <div className={styles.ghost}>
            <svg className={styles.ghostHead} viewBox="0 0 344 150" aria-hidden="true">
              <path d="M0 151 L0 150 Q0 0 172 0 Q344 0 344 150 L344 151Z" fill={SHEET} />
              <ellipse cx={140} cy={88} rx={13} ry={18} fill={INK} />
              <ellipse cx={204} cy={88} rx={13} ry={18} fill={INK} />
              <ellipse cx={118} cy={118} rx={12} ry={6} fill="#F2B8A8" opacity={0.6} />
              <ellipse cx={226} cy={118} rx={12} ry={6} fill="#F2B8A8" opacity={0.6} />
              <path d="M160 116 Q172 126 184 116" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
            </svg>
            <div className={styles.ghostBody}>
              {word}
              {banned}
            </div>
            <svg className={styles.ghostHem} viewBox="0 399 344 61" aria-hidden="true">
              <path d="M0 399 L344 399 L344 430 Q318 404 294 430 Q270 458 246 430 Q222 404 198 430 Q172 458 148 430 Q124 404 100 430 Q76 458 50 430 Q26 404 0 430Z" fill={SHEET} />
            </svg>
          </div>,
        )}
      </Text>
      <Room view={[0, 650, 372, 100]} grow>
        <Little left={268} top={668} w={30} rotate={8} opacity={0.4} />
        <Little left={70} top={712} w={20} rotate={-5} opacity={0.25} />
      </Room>
    </Body>
  );
}

export const littleGhosts: LookDecor = { Body: LittleGhostsBody };
