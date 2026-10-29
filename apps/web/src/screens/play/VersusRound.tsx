'use client';

import { en, guesserButtons, passView, recapView, versusDetails, versusResultsView, versusRoleCards, versusScoresView, versusTitle, type RecapRow } from '@unspoken/content';
import {
  bannedCountFor,
  canVersusAnswer,
  formatClock,
  hardestDifficulty,
  isVersusClockRunning,
  needsGuesser,
  versusCard,
  versusClockProgress,
  type VersusRoundState,
} from '@unspoken/core';
import { cardSwipes, layout, layoutStyleFor, type LayoutStyle } from '@unspoken/design-tokens';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Card, Note, TeamDot } from '@/components/mindReader/parts';
import { Controls } from '@/components/play/Controls';
import type { PlayModel } from '@/components/play/model';
import { Overlay } from '@/components/play/Overlay';
import { PlayFrame } from '@/components/play/PlayFrame';
import { MenuButton } from '@/components/play/Header';
import { useSwipe, type SwipeAnswer } from '@/components/play/useSwipe';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useGame } from '@/state/game';
import { useTheme } from '@/state/theme';

import { Standings } from './MindReaderRound';
import { DetailsSheet, headerVars, MRFrame, TurnHeader } from './mindReaderParts';
import type { RoundScreenProps } from './types';
import { useAnswerKeys } from './useAnswerKeys';
import styles from './mindReader.module.css';
import vs from './versus.module.css';

// The round ticks once a second; core counts the clock in whole seconds.
const TICK_MS = 1000;
// The turn always uses Classic's Card layout (the timer ring around the word card), in the
// player's color, whatever style they picked for the other modes.
const TURN_STYLE = 'card';

type VersusRoundProps = RoundScreenProps & { round: VersusRoundState; layoutStyle: LayoutStyle };

// Versus: pass the phone to the Clue Giver, their timed turn, the recap, the scores after every
// round and the results after the last.
export function VersusRound({ round: state, layoutStyle: s, blocked, onMenu, onLeave }: VersusRoundProps) {
  const game = useGame();
  const { dispatch } = game;
  const [details, setDetails] = useState(false);

  let screen;
  switch (state.phase) {
    case 'pass': {
      const v = passView(state);
      screen = (
        <MRFrame
          layoutStyle={s}
          center
          footer={
            <Button size="large" onClick={() => dispatch({ type: 'startTurn' })}>
              {v.button}
            </Button>
          }
        >
          <div className={styles.centerHead}>
            <p className={cx(styles.muted, text('overline'))}>{v.kicker}</p>
            <h1 className={cx(vs.passTitle, text('title'))}>
              {v.color !== null && <TeamDot color={v.color} large />}
              {v.title}
            </h1>
            <p className={cx(styles.muted, styles.centerText, text('hint'))}>{v.sub}</p>
          </div>
          <Card className={styles.list}>
            {v.rows.map((row) => (
              <div key={row.label} className={cx(styles.logRow, vs.passRow)}>
                <span className={cx(styles.muted, text('overline'))}>{row.label}</span>
                <span className={cx(vs.passValue, text('optionTitle'))}>{row.value}</span>
              </div>
            ))}
          </Card>
          <Note icon="eyeOff">{v.note}</Note>
          {v.nextTime && <p className={cx(styles.muted, styles.centerText, text('small'))}>{v.nextTime}</p>}
        </MRFrame>
      );
      break;
    }
    case 'turn':
      screen = <Turn state={state} blocked={blocked || details} onMenu={onMenu} onLeave={onLeave} onDetails={() => setDetails(true)} />;
      break;
    case 'recap':
      screen = <Recap state={state} layoutStyle={s} onMenu={onMenu} />;
      break;
    case 'scores': {
      const v = versusScoresView(state);
      screen = (
        <MRFrame
          layoutStyle={s}
          footer={
            <>
              {v && (
                <div className={cx(styles.nextBox, vs.nextCentered)}>
                  <p className={cx(styles.muted, text('overline'))}>{en.versus.scores.next}</p>
                  <p className={cx(styles.dotRow, vs.nextLine, text('label'))}>
                    {v.nextColor !== null && <TeamDot color={v.nextColor} small />}
                    <span>{v.next}</span>
                  </p>
                  <p className={cx(styles.muted, text('small'))}>{v.hand}</p>
                </div>
              )}
              <Button size="large" onClick={() => dispatch({ type: 'next' })}>
                {v?.button}
              </Button>
            </>
          }
        >
          <div>
            <p className={cx(styles.muted, text('overline'))}>{v?.kicker}</p>
            <h1 className={text('title')}>{en.versus.scores.title}</h1>
          </div>
          <Standings rows={v?.rows ?? []} />
          <p className={cx(styles.muted, styles.centerText, text('small'))}>{v?.left}</p>
        </MRFrame>
      );
      break;
    }
    case 'results': {
      const v = versusResultsView(state);
      screen = (
        <MRFrame
          layoutStyle={s}
          footer={
            <>
              <Button size="large" onClick={game.restart}>
                {en.versus.results.playAgain}
              </Button>
              <Link href={routes.versus} className={cx(styles.link, styles.footerLink, text('link'))} onClick={onLeave}>
                {en.versus.results.newGame}
              </Link>
            </>
          }
        >
          <div className={styles.centerHead}>
            <p className={cx(styles.muted, text('overline'))}>{v.kicker}</p>
            <h1 className={cx(styles.centerText, text('headline'))}>{v.title}</h1>
            <p className={cx(styles.muted, styles.centerText, text('hint'))}>{v.sub}</p>
          </div>
          <Standings rows={v.rows} />
        </MRFrame>
      );
      break;
    }
  }

  const sheet = versusDetails(state);
  return (
    <>
      {screen}
      {details && <DetailsSheet sections={sheet.sections} footer={sheet.footer} onClose={() => setDetails(false)} />}
    </>
  );
}

// --- The turn ----------------------------------------------------------------------------------

function turnModel(state: VersusRoundState): PlayModel {
  const card = versusCard(state);
  const shown = bannedCountFor(hardestDifficulty(state.settings.difficulties, state.config), state.config);
  return {
    modeName: en.modes.versus.name,
    difficulty: { name: '', badge: '' },
    subline: versusTitle(state),
    stats: { points: null, detail: '' },
    clock: state.clock ? { label: formatClock(state.clock.left), progress: versusClockProgress(state), running: isVersusClockRunning(state), hidden: false } : null,
    card: card && { key: `${state.deck.seed}:${state.deck.index}`, word: card.word, banned: card.banned.slice(0, shown), freshIndex: null },
    canCorrect: canVersusAnswer(state, 'correct'),
    canSkip: canVersusAnswer(state, 'skip'),
    firstCard: state.cards.length === 0 && state.turns.length === 0,
    note: null,
  };
}

function Turn({ state, blocked, onMenu, onLeave, onDetails }: { state: VersusRoundState; blocked: boolean; onMenu: () => void; onLeave: () => void; onDetails: () => void }) {
  const { dispatch, restart } = useGame();
  const layoutStyle = layoutStyleFor(TURN_STYLE, useTheme().theme.mode);
  const frameRef = useRef<HTMLDivElement>(null);
  const model = turnModel(state);
  const pick = needsGuesser(state);
  const active = !blocked && !state.paused;
  const { surface, answer } = useSwipe({
    frameRef,
    // With 3 or more players, Correct names who got it, so the card only swipes to Skip.
    can: { correct: active && model.canCorrect && !pick, skip: active && model.canSkip },
    onAnswer: (kind: SwipeAnswer) => dispatch({ type: kind }),
    cardKey: model.card?.key ?? null,
    drags: cardSwipes(layoutStyle),
  });
  useAnswerKeys(active, answer);

  const running = isVersusClockRunning(state) && !blocked;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => dispatch({ type: 'tick' }), TICK_MS);
    return () => window.clearInterval(id);
  }, [running, dispatch]);

  const controls = pick ? (
    <div className={vs.guessRow}>
      <button type="button" className={cx(vs.skip, text('link'))} disabled={!active || !model.canSkip} onClick={() => answer('skip')} aria-label={en.play.skip}>
        {en.play.skipLink}
        <span className={vs.skipBar} aria-hidden="true" />
      </button>
      <div className={vs.who}>
        <p className={cx(styles.muted, text('overline'))}>{en.versus.turn.tapWho}</p>
        <div className={vs.whoButtons}>
          {guesserButtons(state).map((g) => (
            <button key={g.id} type="button" className={cx(vs.whoButton, text('label'))} disabled={!active || !model.canCorrect} aria-label={g.label} onClick={() => dispatch({ type: 'correct', guesser: g.id })}>
              {g.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <Controls
      slot={layoutStyle.controls}
      regions={layoutStyle.regions}
      canSkip={active && model.canSkip}
      canCorrect={active && model.canCorrect}
      onSkip={() => answer('skip')}
      onCorrect={() => answer('correct')}
      showHint={model.firstCard}
    />
  );

  return (
    <PlayFrame
      layoutStyle={layoutStyle}
      model={model}
      frameRef={frameRef}
      surface={surface}
      // The header sits on the play screen's margins; its role cards on the setup screens', like
      // Mind Reader's.
      top={
        <div className={vs.turnHeader} style={headerVars(layoutStyle)}>
          <TurnHeader layoutStyle={layoutStyle} title={versusTitle(state)} cards={versusRoleCards(state)} onDetails={onDetails} onMenu={onMenu} />
        </div>
      }
      controls={
        state.clock ? (
          controls
        ) : (
          // No time limit: the Clue Giver ends the turn.
          <div className={vs.endTurn}>
            {controls}
            <button type="button" className={cx(styles.link, text('link'))} onClick={() => dispatch({ type: 'endTurn' })}>
              {en.versus.turn.endTurn}
            </button>
          </div>
        )
      }
      overlay={
        state.paused ? (
          <Overlay
            tone={layoutStyle.regions.page}
            label={en.paused.label}
            title={model.clock?.label ?? model.modeName}
            big={model.clock !== null}
            sub={versusTitle(state)}
            actions={
              <>
                <Button size="large" onClick={() => dispatch({ type: 'resume' })}>
                  {en.paused.resume}
                </Button>
                <Button size="large" variant="secondary" href={routes.modes} onClick={onLeave}>
                  {en.paused.changeSettings}
                </Button>
                <Button size="large" variant="quiet" onClick={restart}>
                  {en.paused.newGame}
                </Button>
              </>
            }
          />
        ) : null
      }
      actions={{
        onCorrect: () => answer('correct'),
        onSkip: () => answer('skip'),
        onPause: () => dispatch({ type: 'pause' }),
        onMenu,
        onHeader: onDetails,
      }}
    />
  );
}

// --- Turn recap ----------------------------------------------------------------------------------

function Recap({ state, layoutStyle, onMenu }: { state: VersusRoundState; layoutStyle: LayoutStyle; onMenu: () => void }) {
  const { dispatch } = useGame();
  const v = recapView(state);
  if (!v) return null;
  return (
    <MRFrame
      layoutStyle={layoutStyle}
      header={
        <header className={styles.header}>
          <div className={cx(styles.headerRow, styles.playRow)}>
            <div className={styles.shrink}>
              <p className={cx(styles.muted, styles.ellipsis, text('overline'))}>{v.kicker}</p>
              <h1 className={cx(styles.title, text('modeName'))}>{v.title}</h1>
            </div>
            <MenuButton slot={layoutStyle.header} onMenu={onMenu} />
          </div>
        </header>
      }
      footer={
        <Button size="large" onClick={() => dispatch({ type: 'next' })}>
          {v.button}
        </Button>
      }
    >
      <Card>
        <div className={vs.summary}>
          <div className={styles.grow}>
            <p className={text('optionTitle')}>{v.scored}</p>
            <p className={vs.counts}>
              {v.counts.map((c) => (
                <span key={c.outcome} className={cx(vs.count, styles.muted, text('small'))}>
                  <span className={vs.dot} data-outcome={c.outcome} aria-hidden="true" />
                  {c.label}
                </span>
              ))}
            </p>
          </div>
          <span className={cx(vs.total, styles.tabular, text('score'))} style={{ fontSize: layout.versus.totalSize }}>
            {v.total}
          </span>
        </div>
      </Card>
      <p className={cx(vs.hint, styles.muted, text('small'))}>
        <Icon name="restart" />
        {v.hint}
      </p>
      <Card className={styles.list}>
        {v.rows.map((row) => (
          <RecapRowView key={row.index} row={row} onClick={() => dispatch({ type: 'cycleCard', index: row.index })} />
        ))}
      </Card>
    </MRFrame>
  );
}

// A word with its outcome pill and points: Correct in teal, Not guessed in grey, Banned word as an
// ink outline with the word struck through.
function RecapRowView({ row, onClick }: { row: RecapRow; onClick: () => void }) {
  return (
    <button type="button" className={vs.recapRow} data-outcome={row.outcome} aria-label={row.a11y} onClick={onClick}>
      <span className={vs.wordCell}>
        <span className={cx(vs.word, styles.ellipsis, text('label'))}>{row.word}</span>
        {row.who && <span className={cx(styles.muted, styles.ellipsis, text('small'))}>{row.who}</span>}
      </span>
      <span className={cx(vs.pill, text('small'))}>
        {row.outcome === 'correct' && <Icon name="check" />}
        {row.label}
      </span>
      <span className={cx(vs.points, styles.tabular, text('label'))}>{row.points}</span>
    </button>
  );
}
