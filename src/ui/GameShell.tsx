import { useState } from 'react';
import type { GameState } from '../game/types/gameTypes';
import { getPhaseInfo } from '../game/data/initialState';
import { getRole } from '../game/data/roles';
import { getPendingEvent } from '../game/engine/eventEngine';
import { MetricsBar } from './MetricsBar';
import { CommandPanel } from './CommandPanel';
import { ActorPanel } from './ActorPanel';
import { TimelineFeed } from './TimelineFeed';
import { EventModal } from './EventModal';

interface Props {
  state: GameState;
  onAdvance: (actionId: string) => void;
  onResolveEvent: (eventId: string, choiceId: string) => void;
  onSave: () => void;
  onAbandon: () => void;
  saveFlash: boolean;
}

export function GameShell({ state, onAdvance, onResolveEvent, onSave, onAbandon, saveFlash }: Props) {
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  const phaseInfo = getPhaseInfo(state.phase);
  const role = state.selectedRole ? getRole(state.selectedRole) : undefined;
  const pendingEvent = getPendingEvent(state);

  const handleAdvance = () => {
    if (!selectedActionId || pendingEvent) return;
    onAdvance(selectedActionId);
    setSelectedActionId(null);
  };

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
        </div>
        <div className="ml-auto flex items-center gap-2">
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
            disabled={!selectedActionId || !!pendingEvent}
            onClick={handleAdvance}
            title={
              pendingEvent
                ? 'Resolve the pending event first'
                : selectedActionId
                  ? 'Advance one week'
                  : 'Select an action first'
            }
            className="rounded-md bg-cyan-600 px-4 py-1.5 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {selectedActionId ? '▶ Advance Week' : 'Select an action'}
          </button>
        </div>
      </header>

      {/* Metrics */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-2">
        <MetricsBar metrics={state.metrics} />
      </div>

      {/* Main grid */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[1.2fr_0.9fr_1fr]">
        <CommandPanel
          state={state}
          selectedActionId={selectedActionId}
          onSelect={setSelectedActionId}
        />
        <ActorPanel state={state} />
        <TimelineFeed timeline={state.timeline} />
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
