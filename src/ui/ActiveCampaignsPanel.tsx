import type { ActivePressureCampaign, GameState } from '../game/types/gameTypes';
import { ACTOR_MAP } from '../game/data/actors';
import { NODE_MAP, getTheatre } from '../game/data/mapNodes';

interface Props {
  state: GameState;
}

function statusClass(campaign: ActivePressureCampaign): string {
  if (campaign.status === 'completed') return 'text-emerald-400 border-emerald-900';
  if (campaign.status === 'disrupted') return 'text-cyan-400 border-cyan-900';
  return 'text-amber-400 border-amber-900';
}

export function ActiveCampaignsPanel({ state }: Props) {
  const campaigns = [...state.activePressureCampaigns].reverse();

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/60">
      <header className="border-b border-slate-800 px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
          Active Campaigns
        </h2>
      </header>
      <div className="feed-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {campaigns.length === 0 && (
          <p className="text-xs text-slate-500">No active theatre pressure campaigns.</p>
        )}
        {campaigns.map((campaign) => {
          const actor = ACTOR_MAP[campaign.actorId];
          const remaining = Math.max(0, campaign.durationWeeks - campaign.currentWeek);
          return (
            <div key={campaign.id} className="rounded-md border border-slate-800 bg-slate-900 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-200">{campaign.title}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {actor?.short ?? campaign.actorId} / {getTheatre(campaign.theatre).name}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase ${statusClass(campaign)}`}
                >
                  {campaign.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                  W{campaign.currentWeek}/{campaign.durationWeeks}
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                  {remaining} left
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-amber-400">
                  INT {campaign.intensity}
                </span>
              </div>
              <p className="mt-1.5 truncate text-[10px] text-slate-500">
                {campaign.targetNodeIds.map((nodeId) => NODE_MAP[nodeId].name).join(' / ')}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {campaign.counterActionTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
