import type { GameState } from '../game/types/gameTypes';
import { ACTORS } from '../game/data/actors';
import { getRole } from '../game/data/roles';
import { relationshipColor, relationshipLabel } from './format';

interface Props {
  state: GameState;
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-8 font-mono text-[9px] text-slate-500 uppercase">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-6 text-right font-mono text-[9px] text-slate-400">{Math.round(value)}</span>
    </div>
  );
}

export function ActorPanel({ state }: Props) {
  const role = state.selectedRole ? getRole(state.selectedRole) : undefined;
  const seesIntent = role?.seesActorIntent ?? false;

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/60">
      <header className="border-b border-slate-800 px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">Actors</h2>
        <p className="text-xs text-slate-500">
          {seesIntent
            ? 'Your intelligence access reveals actor intent.'
            : 'Intent is opaque — an Intelligence Officer would see more.'}
        </p>
      </header>
      <div className="feed-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {ACTORS.map((def) => {
          const actor = state.actors[def.id];
          return (
            <div key={def.id} className="rounded-md border border-slate-800 bg-slate-900 p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-slate-200" title={def.description}>
                  {def.name}
                </span>
                <span className={`font-mono text-[10px] ${relationshipColor(actor.relationship)}`}>
                  {relationshipLabel(actor.relationship)} {actor.relationship > 0 ? '+' : ''}
                  {Math.round(actor.relationship)}
                </span>
              </div>
              <div className="mt-1.5 space-y-1">
                <MiniBar label="PRS" value={actor.pressure} color="bg-amber-500" />
                <MiniBar label="AGG" value={actor.aggression} color="bg-red-500" />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500">
                <span className="text-slate-600 uppercase">Intent · </span>
                {seesIntent ? actor.intent : 'Unclear'}
              </p>
              {actor.recentMoves.length > 0 && (
                <p className="mt-0.5 truncate text-[10px] text-cyan-500/80">
                  <span className="text-slate-600 uppercase">Last · </span>
                  {actor.recentMoves[0]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
