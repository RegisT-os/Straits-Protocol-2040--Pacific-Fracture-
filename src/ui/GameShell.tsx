import { useState } from 'react';
import type { GameState, MapNodeId } from '../game/types/gameTypes';
import { getActionSlots } from '../game/engine/actionEngine';
import { getPendingEvent } from '../game/engine/eventEngine';
import { getAction } from '../game/data/actions';
import { MetricsBar } from './MetricsBar';
import { CommandBar } from './CommandBar';
import { CommandPanel } from './CommandPanel';
import { MainTheatreBoard } from './MainTheatreBoard';
import { SituationPanel } from './SituationPanel';
import { TimelineFeed } from './TimelineFeed';
import { TimelineControls } from './TimelineControls';
import type { TimelineFilterId } from './timelineFilters';
import { EventModal } from './EventModal';
import type { BoardMode } from './boardModes';

interface Props {
  state: GameState;
  onToggleAction: (actionId: string) => void;
  onSetTarget: (actionId: string, nodeId: MapNodeId) => void;
  onSelectNode: (nodeId: MapNodeId | null) => void;
  onAssignOperation: (assetId: string, operationId: string) => void;
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
  onAssignOperation,
  onAdvance,
  onResolveEvent,
  onSave,
  onAbandon,
  saveFlash,
}: Props) {
  // War-room UI state — transient by design, never saved.
  const [boardMode, setBoardMode] = useState<BoardMode>('map');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilterId>('all');
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);

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
      <CommandBar
        state={state}
        canAdvance={canAdvance}
        advanceLabel={
          missingTarget ? 'Pick a target' : selectedCount > 0 ? '▶ Advance Week' : 'Select an action'
        }
        advanceTitle={
          pendingEvent
            ? 'Resolve the pending event first'
            : missingTarget
              ? 'Pick a map target for every targeted action first'
              : selectedCount > 0
                ? 'Advance one week'
                : 'Select at least one action first'
        }
        onAdvance={onAdvance}
        onSave={onSave}
        onAbandon={onAbandon}
        saveFlash={saveFlash}
      />

      {/* Metrics strip */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-2">
        <MetricsBar metrics={state.metrics} />
      </div>

      {/* War room: command decisions | main theatre board | situation */}
      <main className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <div
          className={`grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-[1fr_1.9fr_0.9fr] ${
            timelineCollapsed ? 'flex-1' : 'flex-[3]'
          }`}
        >
          <CommandPanel
            state={state}
            pendingActions={state.pendingActions}
            slots={slots}
            onToggle={onToggleAction}
            onSetTarget={onSetTarget}
          />
          <MainTheatreBoard
            state={state}
            mode={boardMode}
            onChangeMode={setBoardMode}
            onSelectNode={onSelectNode}
            selectedAssetId={selectedAssetId}
            onSelectAsset={setSelectedAssetId}
            onAssignOperation={onAssignOperation}
          />
          <SituationPanel state={state} />
        </div>

        {/* Collapsible, filterable timeline */}
        <div className={`flex min-h-0 flex-col ${timelineCollapsed ? '' : 'flex-[1.4]'}`}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <TimelineControls filter={timelineFilter} onChange={setTimelineFilter} />
            <button
              type="button"
              onClick={() => setTimelineCollapsed((c) => !c)}
              className="rounded px-2 py-0.5 font-mono text-[10px] text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
            >
              {timelineCollapsed ? '▲ Show timeline' : '▼ Collapse'}
            </button>
          </div>
          {!timelineCollapsed && <TimelineFeed timeline={state.timeline} filter={timelineFilter} />}
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
