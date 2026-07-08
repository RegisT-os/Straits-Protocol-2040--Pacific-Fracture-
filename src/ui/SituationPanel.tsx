import type { GameState, WarFrontState } from '../game/types/gameTypes';
import { NODE_MAP } from '../game/data/mapNodes';
import { ACTORS } from '../game/data/actors';
import { getRole } from '../game/data/roles';
import { relationshipColor, relationshipLabel } from './format';

interface Props {
  state: GameState;
}

function frontColor(front: WarFrontState): string {
  if (front.status === 'stable') return 'text-emerald-400';
  if (front.status === 'escalating') return 'text-amber-400';
  return 'text-red-400';
}

/**
 * Right-hand situation column: selected node context, front summary, active
 * campaigns, and actor activity — the compact "what is happening" strip.
 */
export function SituationPanel({ state }: Props) {
  const role = state.selectedRole ? getRole(state.selectedRole) : undefined;
  const seesIntent = role?.seesActorIntent ?? false;
  const fronts = Object.values(state.warFronts).sort((a, b) => b.intensity - a.intensity);
  const campaigns = state.activePressureCampaigns.filter((c) => c.status === 'active');
  const selectedNode = state.selectedNode ? state.map.nodes[state.selectedNode] : null;

  return (
    <section
      className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/60"
      data-testid="situation-panel"
    >
      <header className="border-b border-slate-800 px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">Situation</h2>
        <p className="text-xs text-slate-500">Fronts, campaigns and actor activity at a glance.</p>
      </header>
      <div className="feed-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {selectedNode && (
          <div className="rounded-md border border-cyan-800 bg-cyan-950/20 p-2.5">
            <p className="font-mono text-[9px] text-cyan-500 uppercase">Selected node</p>
            <p className="text-xs font-semibold text-slate-100">
              {NODE_MAP[selectedNode.id].name}
            </p>
            <p className="font-mono text-[10px] text-slate-400">
              risk {Math.round(selectedNode.riskLevel)} · stability{' '}
              {Math.round(selectedNode.stability)} · {selectedNode.activeIncidents.length}{' '}
              incident(s)
            </p>
          </div>
        )}

        <div>
          <p className="mb-1 font-mono text-[9px] tracking-wider text-slate-600 uppercase">
            War fronts
          </p>
          <div className="space-y-1">
            {fronts.map((front) => (
              <div key={front.id} className="flex items-center gap-2" title={front.lastShiftSummary}>
                <span className="w-24 truncate text-[11px] text-slate-300">{front.name}</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      front.intensity >= 60 ? 'bg-red-500' : front.intensity >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${front.intensity}%` }}
                  />
                </div>
                <span className={`w-16 text-right font-mono text-[9px] uppercase ${frontColor(front)}`}>
                  {front.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 font-mono text-[9px] tracking-wider text-slate-600 uppercase">
            Active campaigns ({campaigns.length})
          </p>
          {campaigns.length === 0 && (
            <p className="text-[11px] text-slate-500">No active pressure campaigns.</p>
          )}
          <div className="space-y-1">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded border border-slate-800 bg-slate-900 px-2 py-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] text-slate-200">{c.title}</span>
                  <span className="font-mono text-[9px] text-red-400">INT {c.intensity}</span>
                </div>
                <p className="font-mono text-[9px] text-slate-500">
                  counters: {c.counterActionTags.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 font-mono text-[9px] tracking-wider text-slate-600 uppercase">
            Actor activity {seesIntent ? '(intent visible)' : '(intent opaque)'}
          </p>
          <div className="space-y-1">
            {ACTORS.map((def) => {
              const actor = state.actors[def.id];
              if (!actor) return null;
              return (
                <div key={def.id} className="rounded border border-slate-800 bg-slate-900 px-2 py-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11px] text-slate-300" title={def.description}>
                      {def.short}
                    </span>
                    <span className={`font-mono text-[9px] ${relationshipColor(actor.relationship)}`}>
                      {relationshipLabel(actor.relationship)}
                    </span>
                  </div>
                  <p className="truncate text-[10px] text-slate-500">
                    {seesIntent ? actor.intent : actor.recentMoves[0] ?? 'No recent activity'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
