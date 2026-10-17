'use client';

import {
  cluesView,
  detailsSheet,
  en,
  fixLabels,
  overView,
  practiceStep,
  predictionChips,
  predictView,
  difficultyBadge,
  quickOverView,
  toughPrompt,
  resultsView,
  roleCards,
  rolesView,
  scoresView,
  scoringRows,
  showView,
  spokenRows,
  turnTitle,
  type ScoreRow,
} from '@unspoken/content';
import { correctPredictions, format, isMindReaderClockRunning, quickPlaySettings, lastTurn, mindReaderCard, mindReaderClockProgress, type GameSettings, type MindReaderRoundState } from '@unspoken/core';
import { layout, type LayoutStyle } from '@unspoken/design-tokens';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { DifficultySheet } from '@/components/mindReader/DifficultySheet';
import { Card, LabelRow, Note, TeamDot } from '@/components/mindReader/parts';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routes';
import { cx, text } from '@/lib/ui';
import { useGame } from '@/state/game';

import { BigWord, CoachCard, DetailsSheet, DifficultyChip, FixSheet, MRFrame, PracticeHeader, SpokenList, TurnHeader, WordCard } from './mindReaderParts';
import styles from './mindReader.module.css';
import type { RoundScreenProps } from './types';

// The clock ticks once a second; core counts it in whole seconds.
const TICK_SECONDS = 1;

type MindReaderRoundProps = RoundScreenProps & { round: MindReaderRoundState; layoutStyle: LayoutStyle };

// Mind Reader: roles, predict, show the Clue Giver, clues, then the turn's result, the scores and
// the winner (Custom); word after word in Quick Play; one guided turn in Practice. The words on
// every screen come from @unspoken/content's presenters, shared with the app.
export function MindReaderRound({ round: state, layoutStyle: s, blocked, onMenu, onLeave }: MindReaderRoundProps) {
  const game = useGame();
  const { dispatch } = game;
  const [sheet, setSheet] = useState<'details' | 'fix' | 'difficulty' | null>(null);
  // Quick Play: a difficulty applied on the word-over screen waits for Next word.
  const [pending, setPending] = useState<GameSettings | null>(null);
  const word = mindReaderCard(state)?.word ?? '';
  const custom = state.match !== null;
  const practice = state.play === 'practice';
  const quick = !custom && !practice;
  const difficulties = (pending ?? state.settings).difficulties;
  const step = practiceStep(state);

  // The clock stops while a sheet covers the turn.
  const running = isMindReaderClockRunning(state) && !blocked && sheet === null;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => dispatch({ type: 'tick', seconds: TICK_SECONDS }), TICK_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [running, dispatch]);

  const close = () => setSheet(null);
  const startHere = (play: 'quick' | 'practice') =>
    game.newGame(play === 'quick' ? quickPlaySettings(game.settings) : { ...game.settings, mode: 'mindReader' }, play);
  const details = detailsSheet(state);
  // Quick Play and Practice keep their few lines in the middle of the screen.
  const centered = !custom;
  // Custom: the round, Details and the role cards. Quick Play: "Quick Play" with the difficulty chip
  // and the menu, "Mind Reader" under it. Practice: its step and Skip.
  const header = (props: { cards?: boolean; details?: boolean } = {}) =>
    practice ? (
      <PracticeHeader overline={step.overline} title={en.mindReader.practice.title} skipHref={routes.mindReader} onLeave={onLeave} />
    ) : (
      <TurnHeader
        layoutStyle={s}
        title={turnTitle(state)}
        subtitle={custom ? undefined : en.modes.mindReader.name}
        chip={custom ? undefined : <DifficultyChip label={difficultyBadge(difficulties)} onClick={() => setSheet('difficulty')} />}
        cards={custom && props.cards ? roleCards(state) : undefined}
        onDetails={custom && props.details ? () => setSheet('details') : undefined}
        onMenu={onMenu}
      />
    );
  const coach = step.coach && <CoachCard coach={step.coach} onDismiss={() => dispatch({ type: 'dismissCoach' })} />;
  const textLink = (href: string, label: string) => (
    <Link href={href} className={cx(styles.link, styles.footerLink, text('link'))} onClick={onLeave}>
      {label}
    </Link>
  );

  let screen;
  switch (state.phase) {
    case 'roles': {
      const v = rolesView(state);
      screen = (
        <MRFrame
          layoutStyle={s}
          center
          header={custom ? undefined : header()}
          footer={
            <Button size="large" onClick={() => dispatch({ type: 'showWord' })}>
              {v.button}
            </Button>
          }
        >
          <div className={styles.centerHead}>
            <p className={cx(styles.muted, text('overline'))}>{v.kicker}</p>
            <h1 className={cx(styles.centerText, text('title'))}>{v.title}</h1>
          </div>
          {v.cards.map((card) => (
            <Card key={card.label} className={styles.tight}>
              <p className={cx(styles.muted, text('overline'))}>{card.label}</p>
              <p className={styles.dotRow}>
                {card.color !== null && <TeamDot color={card.color} />}
                <span className={cx(styles.roleTitle, text('sheetTitle'))}>{card.title}</span>
              </p>
              <p className={cx(styles.muted, text('small'))}>{card.detail}</p>
            </Card>
          ))}
          <Note icon="eyeOff">{v.note}</Note>
        </MRFrame>
      );
      break;
    }
    case 'predict': {
      const v = predictView(state);
      screen = (
        <MRFrame
          layoutStyle={s}
          center={centered}
          roomy
          header={header({ cards: true, details: true })}
          footer={
            <>
              {coach}
              <Button size="large" disabled={!v.ready} onClick={() => dispatch({ type: 'handOff' })}>
                {v.button}
              </Button>
            </>
          }
        >
          {/* The word block on a band the color of the role cards, its text indented like theirs. */}
          <div className={cx(styles.band, styles.predictBand)}>
            <p className={cx(styles.muted, text('subline'))}>{v.kicker}</p>
            <BigWord word={word} />
          </div>
          <div className={styles.section} role="group" aria-label={v.label}>
            <LabelRow label={v.label} aside={v.hint} />
            {state.predictions.map((value, index) => {
              const placeholder = format(en.mindReader.predict.placeholder, { n: index + 1 });
              return (
                <input
                  key={index}
                  className={cx(styles.input, value.trim() && styles.inputFilled, text('input'))}
                  value={value}
                  placeholder={placeholder}
                  aria-label={placeholder}
                  autoComplete="off"
                  autoCapitalize="words"
                  enterKeyHint={index === state.predictions.length - 1 ? 'done' : 'next'}
                  onChange={(event) => dispatch({ type: 'predict', index, text: event.target.value })}
                />
              );
            })}
          </div>
          {/* The hint is a section of its own, clear of the last word. */}
          {v.note && <Note icon="eyeOff">{v.note}</Note>}
        </MRFrame>
      );
      break;
    }
    case 'show': {
      const v = showView(state);
      screen = (
        <MRFrame
          layoutStyle={s}
          center
          header={header({ cards: true, details: true })}
          footer={
            <>
              {coach}
              <Button size="large" onClick={() => dispatch({ type: 'startClues' })}>
                {v.button}
              </Button>
            </>
          }
        >
          <div className={styles.centerHead}>
            {v.kicker && <p className={cx(styles.muted, text('overline'))}>{v.kicker}</p>}
            <h2 className={cx(styles.centerText, text('sheetTitle'))}>{v.title}</h2>
          </div>
          <WordCard word={word} />
          <Note icon="eyeOff">{v.guessers}</Note>
          <p className={cx(styles.muted, styles.centerText, text('hint'))}>
            {v.keep}
            <br />
            {v.gives}
          </p>
        </MRFrame>
      );
      break;
    }
    case 'clues': {
      const v = cluesView(state);
      const progress = mindReaderClockProgress(state);
      const finish = (guessed: boolean) => dispatch({ type: 'finishClues', guessed });
      screen = (
        <MRFrame
          layoutStyle={s}
          center={centered}
          header={header({ details: true })}
          footer={
            <>
              {coach}
              {v.notGuessed ? (
                <div className={styles.pair}>
                  <Button size="large" variant="secondary" className={styles.pairSecondary} onClick={() => finish(false)}>
                    {v.notGuessed}
                  </Button>
                  <Button size="large" className={styles.grow} onClick={() => finish(true)}>
                    {v.guessed}
                  </Button>
                </div>
              ) : (
                <Button size="large" onClick={() => finish(true)}>
                  {v.guessed}
                </Button>
              )}
            </>
          }
        >
          <Card className={styles.cluesCard}>
            <p className={cx(styles.muted, text('subline'))}>{en.mindReader.clues.theWord}</p>
            <BigWord word={word} max={layout.mindReader.cardWordSize} />
            <div className={styles.wrap}>
              {predictionChips(state).map((p) => (
                <button key={p.index} type="button" className={cx(styles.predChip, text('label'))} aria-label={format(en.a11y.spoke, { word: p.word })} onClick={() => dispatch({ type: 'spoke', prediction: p.index })}>
                  {p.word}
                  <span className={styles.plus} aria-hidden="true">
                    +
                  </span>
                </button>
              ))}
            </div>
            <p className={cx(styles.muted, text('small'))}>{en.mindReader.clues.tapHint}</p>
          </Card>
          {v.guessNow && (
            <div className={styles.clock}>
              <span className={cx(styles.clockValue, text('score'))} role="timer">
                {v.clock}
              </span>
              <div className={styles.grow}>
                <div className={styles.track}>
                  <div className={styles.progress} style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
                <p className={cx(styles.muted, text('small'))}>{v.guessNow}</p>
              </div>
            </div>
          )}
          <div className={styles.section}>
            <LabelRow label={en.mindReader.clues.spoken} aside={v.correct} />
            <SpokenList rows={v.spoken} onRemove={(i) => dispatch({ type: 'unspoke', entry: state.spoken.length - 1 - i })} />
            {v.countUp && <p className={cx(styles.muted, text('small'))}>{v.countUp}</p>}
          </div>
        </MRFrame>
      );
      break;
    }
    case 'over': {
      if (!custom) {
        const v = quickOverView(state);
        const tough = toughPrompt(difficulties, { guessed: state.guessed, applied: pending !== null });
        screen = (
          <MRFrame
            layoutStyle={s}
            center
            header={header()}
            footer={
              <>
                <Button size="large" onClick={() => {
                    if (!pending) return dispatch({ type: 'next' });
                    setPending(null);
                    game.newGame(pending, 'quick');
                  }}>
                  {en.mindReader.quickOver.next}
                </Button>
                <p className={styles.links}>
                  {textLink(routes.mindReader, en.mindReader.quickOver.end)}
                  <span className={cx(styles.muted, text('link'))} aria-hidden="true">
                    ·
                  </span>
                  {textLink(routes.mindReaderPlayers, en.mindReader.quickOver.custom)}
                </p>
              </>
            }
          >
            <div className={styles.centerHead}>
              <p className={cx(styles.muted, text('overline'))}>{v.kicker}</p>
              <BigWord word={word} center />
            </div>
            <Card className={styles.quickResult}>
              <p className={text('optionTitle')}>{v.correct}</p>
              {v.said && <p className={cx(styles.muted, text('small'))}>{v.said}</p>}
            </Card>
            {/* A word that wasn't guessed offers an easier difficulty, or confirms the new one. */}
            {tough && <ToughBox prompt={tough} onSwitch={() => setSheet('difficulty')} />}
            <p className={cx(styles.muted, styles.centerText, text('hint'))}>{en.mindReader.quickOver.pass}</p>
          </MRFrame>
        );
        break;
      }
      const v = overView(state);
      const turn = lastTurn(state);
      const labels = fixLabels(state);
      screen = (
        <MRFrame
          layoutStyle={s}
          header={header()}
          footer={
            <>
              <Button size="large" variant="secondary" onClick={() => setSheet('fix')}>
                {en.mindReader.over.fix}
              </Button>
              <Button size="large" onClick={() => dispatch({ type: 'next' })}>
                {v?.button}
              </Button>
            </>
          }
        >
          <div className={styles.kicker}>
            <p className={cx(styles.muted, text('overline'))}>{v?.kicker}</p>
            <h2 className={text('title')}>{v?.word}</h2>
          </div>
          {v?.sides.map((side) => (
            <Card key={side.name}>
              <div className={styles.dotRow}>
                {side.color !== null && <TeamDot color={side.color} />}
                <span className={cx(styles.grow, text('optionTitle'))}>{side.name}</span>
                <span className={cx(styles.accentText, styles.bigNumber, text('sheetTitle'))}>{side.total}</span>
              </div>
              {side.rows.map((row) => (
                <div key={row.title} className={cx(styles.dotRow, styles.pointsRow)}>
                  <span className={cx(styles.grow, styles.stack)}>
                    <span className={text('label')}>{row.title}</span>
                    <span className={cx(styles.muted, text('small'))}>{row.detail}</span>
                  </span>
                  <span className={text('optionTitle')}>{row.points}</span>
                </div>
              ))}
            </Card>
          ))}
          {sheet === 'fix' && turn && labels && (
            <FixSheet
              onClose={close}
              got={labels.got}
              guessed={turn.result.guessed}
              spoken={turn.result.spoken}
              predictions={correctPredictions(turn.result)}
              rows={(entries) => spokenRows(state, entries)}
              onSave={(fix) => dispatch({ type: 'fixTurn', ...fix })}
            />
          )}
        </MRFrame>
      );
      break;
    }
    case 'scores': {
      const v = scoresView(state);
      screen = (
        <MRFrame
          layoutStyle={s}
          footer={
            <>
              {v && (
                <div className={styles.nextBox}>
                  <p className={cx(styles.muted, text('overline'))}>{en.mindReader.scores.next}</p>
                  <p className={cx(styles.dotRow, text('label'))}>
                    {v.nextColor !== null && <TeamDot color={v.nextColor} small />}
                    <span className={styles.grow}>{v.next}</span>
                  </p>
                  <p className={cx(styles.dotRow, text('label'))}>
                    {v.clueColor !== null && <TeamDot color={v.clueColor} small />}
                    <span className={styles.grow}>{v.nextClues}</span>
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
            <h1 className={text('title')}>{en.mindReader.scores.title}</h1>
          </div>
          <Standings rows={v?.rows ?? []} />
        </MRFrame>
      );
      break;
    }
    case 'results': {
      const v = resultsView(state);
      screen = (
        <MRFrame
          layoutStyle={s}
          footer={
            <>
              <Button size="large" onClick={game.restart}>
                {en.mindReader.results.playAgain}
              </Button>
              {textLink(routes.mindReader, en.mindReader.results.newGame)}
            </>
          }
        >
          <div className={styles.centerHead}>
            <p className={cx(styles.muted, text('overline'))}>{v?.kicker}</p>
            <h1 className={cx(styles.centerText, text('headline'))}>{v?.title}</h1>
            <p className={cx(styles.muted, text('hint'))}>{v?.sub}</p>
          </div>
          <Standings rows={v?.rows ?? []} />
        </MRFrame>
      );
      break;
    }
    case 'scoring': {
      const v = scoringRows(state);
      const sc = en.mindReader.practice;
      screen = (
        <MRFrame
          layoutStyle={s}
          center
          header={<PracticeHeader overline={step.overline} title={sc.scoring.title} skipHref={routes.mindReader} onLeave={onLeave} />}
          footer={
            <>
              <div className={styles.pair}>
                <Button size="large" className={styles.grow} onClick={() => startHere('quick')}>
                  {sc.quick}
                </Button>
                <Button size="large" variant="secondary" className={styles.grow} href={routes.mindReaderPlayers} onClick={onLeave}>
                  {sc.custom}
                </Button>
              </div>
              <button type="button" className={cx(styles.link, styles.footerLink, text('link'))} onClick={() => startHere('practice')}>
                {sc.again}
              </button>
            </>
          }
        >
          <p className={cx(styles.muted, text('hint'))}>{sc.scoring.lead}</p>
          <Card className={styles.list}>
            {v.rows.map((row) => (
              <div key={row.title} className={cx(styles.dotRow, styles.scoreRule)}>
                <span className={cx(styles.grow, styles.stack)}>
                  <span className={text('optionTitle')}>{row.title}</span>
                  <span className={cx(styles.muted, text('small'))}>{row.detail}</span>
                </span>
                <span className={cx(styles.accentText, styles.bigNumber, text('sheetTitle'))}>{row.points}</span>
              </div>
            ))}
          </Card>
          <div className={styles.nextBox}>
            <p className={text('optionTitle')}>{sc.scoring.example.title}</p>
            <p className={cx(styles.muted, text('small'))}>{v.example}</p>
          </div>
        </MRFrame>
      );
      break;
    }
  }

  return (
    <>
      {screen}
      {sheet === 'difficulty' && !custom && (
        <DifficultySheet
          settings={pending ?? state.settings}
          onClose={close}
          // On the word-over screen the new difficulty starts with the next word; elsewhere at once.
          onApply={(settings) => (state.phase === 'over' ? setPending(settings) : game.newGame(settings, 'quick'))} customHref={routes.mindReaderPlayers} onCustom={onLeave} />
      )}
      {sheet === 'details' && details && <DetailsSheet sections={details.sections} footer={details.footer} onClose={close} />}
    </>
  );
}

// The box after a Quick Play word that wasn't guessed, on the role cards' color.
function ToughBox({ prompt, onSwitch }: { prompt: { title: string; body: string; action: string }; onSwitch: () => void }) {
  return (
    <div className={styles.tough} aria-live="polite">
      <div className={cx(styles.grow, text('label'))}>
        <p>{prompt.title}</p>
        <p>{prompt.body}</p>
      </div>
      <Button variant="secondary" size="compact" onClick={onSwitch}>
        {prompt.action}
      </Button>
    </div>
  );
}

// Teams (or players) by total, the leader on a white row.
function Standings({ rows }: { rows: readonly ScoreRow[] }) {
  return (
    <ol className={styles.standings}>
      {rows.map((row, i) => (
        <li key={`${row.name}-${row.rank}`} className={styles.standing} data-region={i === 0 ? 'raised' : undefined}>
          <span className={cx(styles.muted, text('label'))}>{row.rank}</span>
          {row.color !== null && <TeamDot color={row.color} />}
          <span className={cx(styles.grow, styles.ellipsis, text('optionTitle'))}>{row.name}</span>
          {row.last && <span className={cx(styles.muted, text('small'))}>{row.last}</span>}
          <span className={cx(styles.tabular, text('sheetTitle'))}>{row.total}</span>
        </li>
      ))}
    </ol>
  );
}
