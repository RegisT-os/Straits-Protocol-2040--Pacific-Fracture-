import type { GameState, ScoreGrade } from '../game/types/gameTypes';
import { getEnding, getEndingOverlay } from '../game/data/endings';
import { METRIC_INFO } from '../game/data/initialState';
import { getPlayableFaction } from '../game/data/playableFactions';
import {
  buildDefiningDecisions,
  buildPressureCampaignOutcomeSummary,
  buildScorecard,
  buildWarFrontOutcomeSummary,
} from '../game/engine/scorecardEngine';
import { metricStatus, STATUS_TEXT } from './format';

interface Props {
  state: GameState;
  onRestart: () => void;
}

const TONE_STYLE = {
  good: 'text-emerald-400 border-emerald-800',
  mixed: 'text-amber-400 border-amber-800',
  bad: 'text-red-400 border-red-800',
};

const GRADE_STYLE: Record<ScoreGrade, string> = {
  A: 'text-emerald-300 border-emerald-800',
  B: 'text-cyan-300 border-cyan-800',
  C: 'text-amber-300 border-amber-800',
  D: 'text-orange-300 border-orange-800',
  F: 'text-red-300 border-red-800',
};

function phraseClass(phrase: string): string {
  if (phrase === 'contained') return 'text-emerald-300';
  if (phrase === 'endured') return 'text-cyan-300';
  if (phrase === 'unstable') return 'text-amber-300';
  return 'text-red-300';
}

export function EndingScreen({ state, onRestart }: Props) {
  if (!state.ending) return null;
  const ending = getEnding(state.ending.endingId);
  const faction = getPlayableFaction(state.playableFactionId);
  const overlay = getEndingOverlay(state.ending.endingId, faction.id);
  const scorecard = buildScorecard(state);
  const warFronts = buildWarFrontOutcomeSummary(state);
  const campaigns = buildPressureCampaignOutcomeSummary(state);
  const decisions = buildDefiningDecisions(state);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-center font-mono text-xs tracking-[0.3em] text-slate-500 uppercase">
          Campaign {state.ending.early ? `ended early - week ${state.ending.week}` : 'complete - week 104'}
        </p>
        <p className="mt-2 text-center text-sm font-semibold text-cyan-300">
          {faction.name} - {faction.commandPerspective}
        </p>
        <div className={`mt-4 rounded-lg border bg-slate-900/70 p-6 text-center ${TONE_STYLE[ending.tone]}`}>
          <h1 className="text-3xl font-bold">{overlay.titleOverride ?? ending.title}</h1>
          <p className="mt-2 text-xs tracking-wide text-slate-500 uppercase">{overlay.subtitle}</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{overlay.description}</p>
          <div className="mt-4 grid gap-3 text-left sm:grid-cols-2">
            <p className="rounded-md border border-slate-800 bg-slate-950/50 p-3 text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-200">Interpretation:</span> {overlay.interpretation}
            </p>
            <p className="rounded-md border border-slate-800 bg-slate-950/50 p-3 text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-200">Strategic lesson:</span> {overlay.strategicLesson}
            </p>
          </div>
        </div>

        <h2 className="mt-8 mb-2 text-sm font-semibold tracking-wide text-slate-300 uppercase">
          Campaign Scorecard
        </h2>
        <div className="grid gap-2 md:grid-cols-2">
          {scorecard.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200">
                    {item.label}
                    {item.factionCritical && (
                      <span className="ml-2 rounded border border-cyan-800 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300">
                        critical
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{item.explanation}</p>
                </div>
                <span className={`rounded border px-2 py-1 font-mono text-sm font-bold ${GRADE_STYLE[item.grade]}`}>
                  {item.grade}
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-slate-600">score {item.score}/100</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <section>
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-slate-300 uppercase">
              War Front Outcomes
            </h2>
            <div className="grid gap-2">
              {warFronts.map((front) => (
                <div key={front.id} className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-semibold text-slate-200">{front.name}</p>
                    <span className={`font-mono text-[10px] uppercase ${phraseClass(front.phrase)}`}>{front.phrase}</span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">
                    {front.status} / INT {front.intensity} / ESC {front.escalationLevel}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-slate-300 uppercase">
              Pressure Campaign Outcomes
            </h2>
            <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded bg-slate-950/70 p-2 text-red-300">
                  {campaigns.completed}
                  <p className="mt-1 text-[9px] text-slate-500 uppercase">completed</p>
                </div>
                <div className="rounded bg-slate-950/70 p-2 text-emerald-300">
                  {campaigns.disrupted}
                  <p className="mt-1 text-[9px] text-slate-500 uppercase">disrupted</p>
                </div>
                <div className="rounded bg-slate-950/70 p-2 text-amber-300">
                  {campaigns.active}
                  <p className="mt-1 text-[9px] text-slate-500 uppercase">active</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                <span className="font-semibold text-slate-200">Worst unresolved:</span>{' '}
                {campaigns.worstUnresolved ?? 'none'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                <span className="font-semibold text-slate-200">Best disrupted:</span>{' '}
                {campaigns.bestDisrupted ?? 'none'}
              </p>
            </div>

            <h2 className="mt-4 mb-2 text-sm font-semibold tracking-wide text-slate-300 uppercase">
              Defining Decisions
            </h2>
            <div className="space-y-2">
              {decisions.map((decision) => (
                <div key={`${decision.label}-${decision.detail}`} className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-200">{decision.label}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{decision.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <h2 className="mt-8 mb-2 text-sm font-semibold tracking-wide text-slate-300 uppercase">
          Final Metrics
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {METRIC_INFO.map((info) => {
            const value = state.metrics[info.key];
            const status = metricStatus(info.key, value);
            return (
              <div key={info.key} className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2">
                <p className="text-[10px] text-slate-500">{info.label}</p>
                <p className={`font-mono text-lg font-semibold ${STATUS_TEXT[status]}`}>
                  {Math.round(value)}
                </p>
              </div>
            );
          })}
        </div>

        {state.flags.length > 0 && (
          <>
            <h2 className="mt-6 mb-2 text-sm font-semibold tracking-wide text-slate-300 uppercase">
              Major Flags
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {state.flags.map((flag) => (
                <span
                  key={flag}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-400"
                >
                  {flag}
                </span>
              ))}
            </div>
          </>
        )}

        <p className="mt-6 text-xs text-slate-500">
          {state.completedActions.length} actions taken - {state.timeline.length} timeline entries -
          faction {faction.shortName} - difficulty {state.difficulty} - seed {state.seed}
        </p>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-md bg-cyan-600 px-8 py-3 text-sm font-semibold tracking-wide text-white uppercase transition-colors hover:bg-cyan-500"
          >
            New Campaign
          </button>
        </div>
      </div>
    </div>
  );
}
