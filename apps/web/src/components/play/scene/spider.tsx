import { ms, sceneMotion, type ArtProps, type LookArt } from './parts';

// Spider: the spider lowers on its thread from the web as time runs out; notches on the thread mark
// the quarters and the time pill rides beside it. Board coordinates and colors from gen62hw.py
// spider().

const TX = 300;
const START = 262;
const DROP = 390;
const BODY = '#0C0A10';
const RAYS = Array.from({ length: 10 }, (_, i) => 0.15 * (i + 1));
const RINGS = [50, 90, 130, 170];
const LEGS = [-1, 1].flatMap((side) => [-6, 0, 6, 12].map((dy) => [side, dy] as const));

const at = (r: number, a: number) => `${(372 - r * Math.cos(a)).toFixed(0)} ${(90 + r * Math.sin(a)).toFixed(0)}`;

// Where the spider hangs for a share of time left.
const drop = (f: number) => START + (1 - f) * DROP;

function SpiderArt({ f, animate }: ArtProps) {
  const y = drop(f);
  return (
    <>
      <g stroke="#FFFFFF30" strokeWidth={1.4} fill="none">
        {RAYS.map((a) => (
          <path key={a} d={`M372 90 L${at(190, a)}`} />
        ))}
        {RINGS.map((r) => (
          <path key={r} d={`M${at(r, 0.15)} ${RAYS.slice(1)
            .map((a) => `L${at(r, a)}`)
            .join(' ')}`} />
        ))}
      </g>
      {[0, 1, 2, 3, 4].map((k) => (
        <path key={k} d={`M${TX - 6} ${(START + (DROP * k) / 4).toFixed(0)} h12`} stroke="#FFFFFF40" strokeWidth={2} />
      ))}
      {/* The thread and spider sway a little from the web. */}
      <g>
        {animate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={`${-sceneMotion.swayDeg} ${TX} 90;${sceneMotion.swayDeg} ${TX} 90;${-sceneMotion.swayDeg} ${TX} 90`}
            dur={ms(sceneMotion.swayMs)}
            repeatCount="indefinite"
          />
        )}
        <path d={`M${TX} 90 V${(y - 20).toFixed(1)}`} stroke="#D9D3E6" strokeWidth={1.6} />
        <g transform={`translate(${TX} ${y.toFixed(1)})`}>
          {LEGS.map(([side, dy]) => (
            <path key={`${side}${dy}`} d={`M${side * 8} ${dy} q${side * 18} -14 ${side * 30} ${6 + dy}`} stroke={BODY} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          ))}
          <ellipse cx={0} cy={10} rx={17} ry={20} fill={BODY} />
          <circle cx={0} cy={-12} r={11} fill={BODY} />
          <circle cx={-4} cy={-13} r={2.6} fill="#E3C878" />
          <circle cx={4} cy={-13} r={2.6} fill="#E3C878" />
          <path d="M-7 4 l14 0 l-7 9Z" fill="#B5463D" />
        </g>
      </g>
    </>
  );
}

export const spider: LookArt = {
  box: { x: 176, y: 84, width: 196, height: 616 },
  align: { x: 'end', y: 'start' },
  // The pill's right edge just clear of the spider's legs, level with its body.
  holder: (f) => ({ x: TX - 44, y: drop(f) - 17, anchor: 'end' }),
  Art: SpiderArt,
};
