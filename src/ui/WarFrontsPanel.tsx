import type { GameState, WarFrontState } from '../game/types/gameTypes';
import { getTheatre, NODE_MAP } from '../game/data/mapNodes';
import { METRIC_INFO } from '../game/data/initialState';

interface Props {
  state: GameState;
}

function statusClass(front: WarFrontState): string {
  if (front.status === 'stable') return 'text-emerald-400 border-emerald-900';
  if (front.status === 'escalating') return 'text-amber-400 border-amber-900';
  if (front.status === 'crisis') return 'text-orange-400 border-orange-900';
  return 'text-red-400 border-red-900';
}

function intensityClass(intensity: number): string {
  if (intensity < 30) return 'text-emerald-400';
  if (intensity < 55) return 'text-amber-400';
  if (intensity < 80) return 'text-orange-400';
  return 'text-red-400';
}

function momentumLabel(momentum: number): string {
  if (momentum > 0) return `+${Math.round(momentum)}`;
  return `${Math.round(momentum)}`;
}

function impactSummary(front: WarFrontState): string {
  const metrics = front.linkedMetrics
    .slice(0, 3)
    .map((metric) => METRIC_INFO.find((info) => info.key === metric)?.short ?? metric.toUpperCase())
    .join(' / ');
  const nodes = front.linkedMapNodes
    .slice(0, 2)
    .map((nodeId) => NODE_MAP[nodeId].name)
    .join(' / ');
  return `${metrics} -> ${nodes}`;
}

export function WarFrontsPanel({ state }: Props) {
  const fronts = Object.values(state.warFronts);

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/60">
      <header className="border-b border-slate-800 px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
          War Fronts
        </h2>
      </header>
      <div className="feed-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {fronts.map((front) => (
          <div key={front.id} className="rounded-md border border-slate-800 bg-slate-900 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-200">{front.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                  {getTheatre(front.theatre).name} / {front.dominantSide}
                </p>
              </div>
              <span
                className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase ${statusClass(front)}`}
              >
                {front.status}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1 font-mono text-[10px]">
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
                INT <span className={intensityClass(front.intensity)}>{Math.round(front.intensity)}</span>
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
                MOM <span className={front.momentum >= 0 ? 'text-red-300' : 'text-cyan-300'}>{momentumLabel(front.momentum)}</span>
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
                ESC <span className="text-slate-200">{front.escalationLevel}</span>
              </span>
            </div>
            <p className="mt-1.5 truncate text-[10px] text-slate-500">
              {impactSummary(front)}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {front.activeModifiers.map((modifier) => (
                <span
                  key={modifier}
                  className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300"
                >
                  {modifier}
                </span>
              ))}
              {front.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
