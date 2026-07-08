import type { GameState } from '../game/types/gameTypes';
import { getEnding } from '../game/data/endings';
import { METRIC_INFO } from '../game/data/initialState';
import { getPlayableFaction } from '../game/data/playableFactions';
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

export function EndingScreen({ state, onRestart }: Props) {
  if (!state.ending) return null;
  const ending = getEnding(state.ending.endingId);
  const faction = getPlayableFaction(state.playableFactionId);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-center font-mono text-xs tracking-[0.3em] text-slate-500 uppercase">
          Campaign {state.ending.early ? `ended early - week ${state.ending.week}` : 'complete - week 104'}
        </p>
        <p className="mt-2 text-center text-sm font-semibold text-cyan-300">
          {faction.name} · {faction.commandPerspective}
        </p>
        <div className={`mt-4 rounded-lg border bg-slate-900/70 p-6 text-center ${TONE_STYLE[ending.tone]}`}>
          <h1 className="text-3xl font-bold">{ending.title}</h1>
          <p className="mt-2 text-xs tracking-wide text-slate-500 uppercase">
            {faction.factionLabelOverrides?.endingSubtitle ?? faction.victoryFocus}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{ending.description}</p>
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
          {state.completedActions.length} actions taken · {state.timeline.length} timeline entries ·
          faction {faction.shortName} · difficulty {state.difficulty} · seed {state.seed}
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
