import type { GameState, MapNodeId } from '../game/types/gameTypes';
import { getPhaseInfo } from '../game/data/initialState';
import { getRole } from '../game/data/roles';
import { getDifficulty } from '../game/data/difficulty';
import { getActionSlots } from '../game/engine/actionEngine';
import { getPendingEvent } from '../game/engine/eventEngine';
import { getAction } from '../game/data/actions';
import { MetricsBar } from './MetricsBar';
import { StrategicMap } from './StrategicMap';
import { CommandPanel } from './CommandPanel';
import { ActorPanel } from './ActorPanel';
import { WarFrontsPanel } from './WarFrontsPanel';
import { ActiveCampaignsPanel } from './ActiveCampaignsPanel';
import { TimelineFeed } from './TimelineFeed';
import { EventModal } from './EventModal';

interface Props {
  state: GameState;
  onToggleAction: (actionId: string) => void;
  onSetTarget: (actionId: string, nodeId: MapNodeId) => void;
  onSelectNode: (nodeId: MapNodeId | null) => void;
  onAdvance: () => void;
  onResolveEvent: (eventId: string, choiceId: string) => void;
  onSave: () => void;
  onAbandon: () => void;
  saveFlash: boolean;
}

export function GameShell({
  state,
  onToggleAction,
  onSetTarget,
  onSelectNode,
  onAdvance,
  onResolveEvent,
  onSave,
  onAbandon,
  saveFlash,
}: Props) {
  const phaseInfo = getPhaseInfo(state.phase);
  const role = state.selectedRole ? getRole(state.selectedRole) : undefined;
  const difficulty = getDifficulty(state.difficulty);
  const pendingEvent = getPendingEvent(state);
  const slots = getActionSlots(state);
  const selectedCount = state.pendingActions.length;

  // Every pending targeted action must have a target before the week can advance.
  const missingTarget = state.pendingActions.some((id) => {
    const action = getAction(id);
    const target = state.pendingTargets[id];
    return action?.targeting && (!target || !action.targeting.nodeIds.includes(target));
  });
  const canAdvance = selectedCount > 0 && !pendingEvent && !missingTarget;

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-800 bg-slate-900/80 px-4 py-2">
        <h1 className="text-sm font-bold tracking-tight text-slate-100">
          Straits Protocol <span className="text-cyan-400">2040</span>
          <span className="ml-2 hidden font-normal tracking-widest text-amber-500 uppercase sm:inline">
            Pacific Fracture
          </span>
        </h1>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
            Week {state.week}/{state.maxWeeks}
          </span>
          <span
            className="rounded bg-indigo-950 px-2 py-0.5 text-indigo-300"
            title={phaseInfo.description}
          >
            Phase {phaseInfo.id}: {phaseInfo.name}
          </span>
          {role && <span className="rounded bg-cyan-950 px-2 py-0.5 text-cyan-300">{role.name}</span>}
          <span
            className="rounded bg-amber-950 px-2 py-0.5 text-amber-400"
            title={difficulty.description}
          >
            {difficulty.name}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className="font-mono text-xs text-slate-400"
            title="Action slots come from Personal Stamina ≥65 and Institutional Trust ≥65; Mental Load ≥75 removes one."
          >
            Actions selected: {selectedCount} / {slots}
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
            title={
              pendingEvent
                ? 'Resolve the pending event first'
                : missingTarget
                  ? 'Pick a map target for every targeted action first'
                  : selectedCount > 0
                    ? 'Advance one week'
                    : 'Select at least one action first'
            }
            className="rounded-md bg-cyan-600 px-4 py-1.5 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {missingTarget ? 'Pick a target' : selectedCount > 0 ? '▶ Advance Week' : 'Select an action'}
          </button>
        </div>
      </header>

      {/* Metrics */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-2">
        <MetricsBar metrics={state.metrics} />
      </div>

      {/* Main grid: command + strategic map on top, actors + timeline below */}
      <main className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <div className="grid min-h-0 flex-[3] grid-cols-1 gap-3 lg:grid-cols-[1fr_1.5fr]">
          <CommandPanel
            state={state}
            pendingActions={state.pendingActions}
            slots={slots}
            onToggle={onToggleAction}
            onSetTarget={onSetTarget}
          />
          <StrategicMap state={state} onSelectNode={onSelectNode} />
        </div>
        <div className="grid min-h-0 flex-[2] grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="grid min-h-0 grid-rows-3 gap-3">
            <ActorPanel state={state} />
            <WarFrontsPanel state={state} />
            <ActiveCampaignsPanel state={state} />
          </div>
          <TimelineFeed timeline={state.timeline} />
        </div>
      </main>

      {pendingEvent && (
        <EventModal
          event={pendingEvent}
          onChoose={(choiceId) => onResolveEvent(pendingEvent.id, choiceId)}
        />
      )}
    </div>
  );
}
