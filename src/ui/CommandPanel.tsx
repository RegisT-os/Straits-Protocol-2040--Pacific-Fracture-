import type { ActionDef, GameState } from '../game/types/gameTypes';
import { ACTIONS } from '../game/data/actions';
import { getActionAvailability } from '../game/engine/actionEngine';
import { deltaChips } from './format';

interface Props {
  state: GameState;
  selectedActionId: string | null;
  onSelect: (actionId: string) => void;
}

const CATEGORY_LABEL: Record<ActionDef['category'], string> = {
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
  cyber: 'text-cyan-400 border-cyan-900',
  diplomacy: 'text-indigo-300 border-indigo-900',
  finance: 'text-emerald-400 border-emerald-900',
  maritime: 'text-sky-400 border-sky-900',
  information: 'text-fuchsia-400 border-fuchsia-900',
  energy: 'text-orange-400 border-orange-900',
  personal: 'text-lime-400 border-lime-900',
  strategy: 'text-amber-400 border-amber-900',
};

export function CommandPanel({ state, selectedActionId, onSelect }: Props) {
  const entries = ACTIONS.map((action) => ({
    action,
    availability: getActionAvailability(state, action),
  }));
  // Available actions first; locked ones stay visible with a reason.
  entries.sort((a, b) => Number(b.availability.available) - Number(a.availability.available));

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/60">
      <header className="border-b border-slate-800 px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
          Command Panel
        </h2>
        <p className="text-xs text-slate-500">Choose one action for this week, then advance.</p>
      </header>
      <div className="feed-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {entries.map(({ action, availability }) => {
          const selected = selectedActionId === action.id;
          const chips = deltaChips(action.metricEffects);
          return (
            <button
              key={action.id}
              type="button"
              disabled={!availability.available}
              onClick={() => onSelect(action.id)}
              className={`w-full rounded-md border p-3 text-left transition-colors ${
                selected
                  ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500'
                  : availability.available
                    ? 'border-slate-800 bg-slate-900 hover:border-slate-600'
                    : 'cursor-not-allowed border-slate-800/60 bg-slate-950/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-100">{action.name}</span>
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
          );
        })}
      </div>
    </section>
  );
}
