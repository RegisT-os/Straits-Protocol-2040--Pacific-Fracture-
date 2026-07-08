import type { GameState } from '../game/types/gameTypes';
import { getPhaseInfo, METRIC_INFO } from '../game/data/initialState';
import { getRole } from '../game/data/roles';
import { getDifficulty } from '../game/data/difficulty';
import { getPlayableFaction } from '../game/data/playableFactions';
import { getActionSlots } from '../game/engine/actionEngine';

interface Props {
  state: GameState;
  canAdvance: boolean;
  advanceLabel: string;
  advanceTitle: string;
  onAdvance: () => void;
  onSave: () => void;
  onAbandon: () => void;
  saveFlash: boolean;
}

/** Overall crisis severity: worst of front status and metric criticality. */
function crisisChip(state: GameState): { label: string; className: string } {
  const fronts = Object.values(state.warFronts);
  const breaking = fronts.filter((f) => f.status === 'breaking' || f.status === 'crisis').length;
  const criticalMetrics = METRIC_INFO.filter((info) => {
    const value = state.metrics[info.key];
    return info.badWhenHigh ? value >= 75 : value <= 30;
  }).length;

  if (breaking >= 2 || criticalMetrics >= 3) {
    return { label: 'CRITICAL', className: 'bg-red-950 text-red-400 border border-red-800' };
  }
  if (breaking >= 1 || criticalMetrics >= 1) {
    return { label: 'STRAINED', className: 'bg-amber-950 text-amber-400 border border-amber-900' };
  }
  return { label: 'HOLDING', className: 'bg-emerald-950 text-emerald-400 border border-emerald-900' };
}

export function CommandBar({
  state,
  canAdvance,
  advanceLabel,
  advanceTitle,
  onAdvance,
  onSave,
  onAbandon,
  saveFlash,
}: Props) {
  const phaseInfo = getPhaseInfo(state.phase);
  const faction = getPlayableFaction(state.playableFactionId);
  const role = state.selectedRole ? getRole(state.selectedRole) : undefined;
  const difficulty = getDifficulty(state.difficulty);
  const slots = getActionSlots(state);
  const crisis = crisisChip(state);

  return (
    <header
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-800 bg-slate-900/80 px-4 py-2"
      data-testid="command-bar"
    >
      <h1 className="text-sm font-bold tracking-tight text-slate-100">
        Straits Protocol <span className="text-cyan-400">2040</span>
        <span className="ml-2 hidden font-normal tracking-widest text-amber-500 uppercase xl:inline">
          Pacific Fracture
        </span>
      </h1>
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
          Week {state.week}/{state.maxWeeks}
        </span>
        <span className="rounded bg-indigo-950 px-2 py-0.5 text-indigo-300" title={phaseInfo.description}>
          P{phaseInfo.id}: {phaseInfo.name}
        </span>
        <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-200" title={faction.commandPerspective}>
          {faction.shortName}
        </span>
        {role && <span className="rounded bg-cyan-950 px-2 py-0.5 text-cyan-300">{role.name}</span>}
        <span className="rounded bg-amber-950 px-2 py-0.5 text-amber-400" title={difficulty.description}>
          {difficulty.name}
        </span>
        <span
          className={`rounded px-2 py-0.5 font-semibold ${crisis.className}`}
          title="Overall crisis severity from war fronts and critical metrics"
        >
          {crisis.label}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span
          className="font-mono text-xs text-slate-400"
          title="Action slots come from Personal Stamina ≥65 and Institutional Trust ≥65; Mental Load ≥75 removes one."
        >
          Actions selected: {state.pendingActions.length} / {slots}
        </span>
        <button
          type="button"
          onClick={onSave}
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
            saveFlash
              ? 'border-emerald-500 text-emerald-400'
              : 'border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'
          }`}
        >
          {saveFlash ? 'Saved ✓' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onAbandon}
          className="rounded-md border border-slate-800 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-red-800 hover:text-red-400"
        >
          Abandon
        </button>
        <button
          type="button"
          disabled={!canAdvance}
          onClick={onAdvance}
          title={advanceTitle}
          className="rounded-md bg-cyan-600 px-4 py-1.5 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          {advanceLabel}
        </button>
      </div>
    </header>
  );
}
