import type { ActionDef, GameState, MapNodeId } from '../game/types/gameTypes';
import { ACTIONS } from '../game/data/actions';
import { NODE_MAP } from '../game/data/mapNodes';
import { getActionAvailability, isActionVisibleForFaction } from '../game/engine/actionEngine';
import { deltaChips } from './format';

interface Props {
  state: GameState;
  pendingActions: string[];
  slots: number;
  onToggle: (actionId: string) => void;
  onSetTarget: (actionId: string, nodeId: MapNodeId) => void;
}

const CATEGORY_LABEL: Record<ActionDef['category'], string> = {
  orbital: 'Orbital',
  cyber: 'Cyber',
  diplomacy: 'Diplomacy',
  finance: 'Finance',
  maritime: 'Maritime',
  information: 'Information',
  energy: 'Energy',
  personal: 'Personal',
  strategy: 'Strategy',
};

const CATEGORY_COLOR: Record<ActionDef['category'], string> = {
  orbital: 'text-violet-300 border-violet-900',
  cyber: 'text-cyan-400 border-cyan-900',
  diplomacy: 'text-indigo-300 border-indigo-900',
  finance: 'text-emerald-400 border-emerald-900',
  maritime: 'text-sky-400 border-sky-900',
  information: 'text-fuchsia-400 border-fuchsia-900',
  energy: 'text-orange-400 border-orange-900',
  personal: 'text-lime-400 border-lime-900',
  strategy: 'text-amber-400 border-amber-900',
};

export function CommandPanel({ state, pendingActions, slots, onToggle, onSetTarget }: Props) {
  const entries = ACTIONS.filter((action) => isActionVisibleForFaction(state, action)).map((action) => ({
    action,
    availability: getActionAvailability(state, action),
  }));
  // Available actions first; locked ones stay visible with a reason.
  entries.sort((a, b) => Number(b.availability.available) - Number(a.availability.available));

  const slotsFull = pendingActions.length >= slots;

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/60">
      <header className="border-b border-slate-800 px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
          Command Panel
        </h2>
        <p className="text-xs text-slate-500">
          Select up to {slots} action{slots > 1 ? 's' : ''} for this week, then advance.
          {slotsFull && ' All slots used — deselect to swap.'}
        </p>
      </header>
      <div className="feed-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {entries.map(({ action, availability }) => {
          const selected = pendingActions.includes(action.id);
          const blocked = !selected && slotsFull;
          const chips = deltaChips(action.metricEffects);
          const selectedTarget =
            action.targeting?.nodeIds.find((nodeId) => nodeId === state.pendingTargets[action.id]) ?? '';
          const targetSelectId = `target-${action.id}`;
          return (
            <div key={action.id}>
            <button
              type="button"
              disabled={!availability.available || blocked}
              title={blocked ? 'All action slots used — deselect another action first' : undefined}
              onClick={() => onToggle(action.id)}
              className={`w-full rounded-md border p-3 text-left transition-colors ${
                selected
                  ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500'
                  : !availability.available
                    ? 'cursor-not-allowed border-slate-800/60 bg-slate-950/60 opacity-60'
                    : blocked
                      ? 'cursor-not-allowed border-slate-800 bg-slate-900 opacity-50'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-600'
              } ${selected && action.targeting ? 'rounded-b-none' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-100">
                  {selected && (
                    <span className="mr-1.5 rounded bg-cyan-600 px-1.5 py-0.5 font-mono text-[10px] text-white">
                      {pendingActions.indexOf(action.id) + 1}
                    </span>
                  )}
                  {action.name}
                </span>
                <span
                  className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase ${CATEGORY_COLOR[action.category]}`}
                >
                  {CATEGORY_LABEL[action.category]}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{action.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {chips.map((chip) => (
                  <span
                    key={chip.key}
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      chip.positive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                    }`}
                  >
                    {chip.short} {chip.value > 0 ? '+' : ''}
                    {chip.value}
                  </span>
                ))}
                {action.risk && (
                  <span className="rounded bg-amber-950 px-1.5 py-0.5 font-mono text-[10px] text-amber-400">
                    ⚠ {Math.round(action.risk.chance * 100)}% {action.risk.label}
                  </span>
                )}
              </div>
              {!availability.available && (
                <p className="mt-2 font-mono text-[10px] text-red-400/90 uppercase">
                  🔒 {availability.lockedReason}
                </p>
              )}
            </button>
            {selected && action.targeting && (
              <div className="rounded-b-md border border-t-0 border-cyan-500 bg-cyan-950/30 px-3 py-2">
                <label htmlFor={targetSelectId} className="font-mono text-[10px] text-amber-400 uppercase">
                  {action.targeting.hint}{' '}
                </label>
                <select
                  id={targetSelectId}
                  value={selectedTarget}
                  onChange={(e) => onSetTarget(action.id, e.target.value as MapNodeId)}
                  className="ml-1 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-200"
                >
                  {!selectedTarget && <option value="">— pick a target —</option>}
                  {action.targeting.nodeIds.map((nodeId) => (
                    <option key={nodeId} value={nodeId}>
                      {NODE_MAP[nodeId].name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
