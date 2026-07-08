import type { GameState, WarFrontState } from '../game/types/gameTypes';
import { getTheatre, NODE_MAP } from '../game/data/mapNodes';
import { METRIC_INFO } from '../game/data/initialState';
import { ACTIONS } from '../game/data/actions';
import { getPlayableFaction } from '../game/data/playableFactions';
import { getPressureCampaign } from '../game/data/pressureCampaigns';
import { isActionVisibleForFaction } from '../game/engine/actionEngine';
import { FRONT_CAMPAIGN_COOLDOWN_WEEKS, WAR_FRONT_CAMPAIGN_HOOKS } from '../game/engine/warFrontEngine';

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

function driversSummary(front: WarFrontState): string {
  const momentum = front.momentum >= 6 ? 'rising momentum' : front.momentum <= -6 ? 'stabilizing momentum' : 'low momentum';
  const modifiers = front.activeModifiers.slice(0, 2).join(' / ');
  return `${momentum}${modifiers ? ` / ${modifiers}` : ''}`;
}

function pressureTrend(front: WarFrontState): string {
  if (front.momentum >= 6) return 'rising';
  if (front.momentum <= -6) return 'decaying';
  return 'stable';
}

function counterplaySummary(state: GameState, front: WarFrontState): string {
  const counters = ACTIONS.filter((action) => isActionVisibleForFaction(state, action))
    .filter((action) =>
      action.warFrontEffects?.some(
        (effect) =>
          effect.frontId === front.id &&
          ((effect.intensity ?? 0) < 0 || (effect.momentum ?? 0) < 0),
      ),
    )
    .slice(0, 3)
    .map((action) => action.name.replace('Activate ', '').replace('Launch ', ''));
  return counters.length > 0 ? counters.join(' / ') : 'No direct action counter';
}

function campaignSummary(state: GameState, front: WarFrontState): string {
  const hooks = WAR_FRONT_CAMPAIGN_HOOKS.filter((hook) => hook.frontId === front.id);
  if (hooks.length === 0) return 'No direct campaign hook';
  const active = hooks.find((hook) =>
    state.activePressureCampaigns.some(
      (campaign) => campaign.templateId === hook.templateId && campaign.status === 'active',
    ),
  );
  if (active) return `Active: ${active.label}`;
  const near = hooks.find((hook) => front.intensity >= hook.threshold - 6);
  if (near) return `Near: ${near.label} at INT ${near.threshold}`;
  return hooks.map((hook) => `${hook.label} at ${hook.threshold}`).join(' / ');
}

function linkedCampaignCount(state: GameState, front: WarFrontState): number {
  const hooks = WAR_FRONT_CAMPAIGN_HOOKS.filter((hook) => hook.frontId === front.id);
  const hookTemplates = new Set(hooks.map((hook) => hook.templateId));
  return state.activePressureCampaigns.filter(
    (campaign) =>
      campaign.status === 'active' &&
      (hookTemplates.has(campaign.templateId) || campaign.theatre === front.theatre),
  ).length;
}

function campaignCooldownSummary(state: GameState, front: WarFrontState): string {
  const hooks = WAR_FRONT_CAMPAIGN_HOOKS.filter((hook) => hook.frontId === front.id);
  if (hooks.length === 0) return 'No front spawn';
  const minimumThreshold = Math.min(...hooks.map((hook) => hook.threshold));
  if (front.intensity < minimumThreshold) return `Arms at INT ${minimumThreshold}`;

  const lastFrontCampaign = [...state.timeline].reverse().find(
    (entry) =>
      entry.type === 'map' &&
      (entry.title === `War front campaign: ${front.name}` || entry.title === `War front campaign refresh: ${front.name}`),
  );
  const cooldownRemaining = lastFrontCampaign
    ? Math.max(0, FRONT_CAMPAIGN_COOLDOWN_WEEKS - (state.week - lastFrontCampaign.week))
    : 0;
  if (cooldownRemaining > 0) return `${cooldownRemaining}w cooldown`;
  return 'Spawn window open';
}

function counterTagSummary(front: WarFrontState): string {
  const tags = new Set<string>();
  for (const hook of WAR_FRONT_CAMPAIGN_HOOKS.filter((candidate) => candidate.frontId === front.id)) {
    const campaign = getPressureCampaign(hook.templateId);
    for (const tag of campaign?.counterActionTags ?? []) tags.add(tag);
  }
  return tags.size > 0 ? [...tags].slice(0, 5).join(' / ') : 'direct action only';
}

function recentShiftSummary(front: WarFrontState): string {
  return `W${front.lastShiftWeek}: ${front.lastShiftSummary}`;
}

export function WarFrontsPanel({ state }: Props) {
  const fronts = Object.values(state.warFronts);
  const faction = getPlayableFaction(state.playableFactionId);

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
              <span className="font-semibold text-slate-400">{faction.factionLabelOverrides?.impactLabel ?? `${faction.shortName} impact`}:</span>{' '}
              {impactSummary(front)}
            </p>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              <span className="font-semibold text-slate-400">Drivers:</span>{' '}
              {driversSummary(front)}
            </p>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              <span className="font-semibold text-slate-400">Counterplay:</span>{' '}
              {counterplaySummary(state, front)}
            </p>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              <span className="font-semibold text-slate-400">Campaign risk:</span>{' '}
              {campaignSummary(state, front)}
            </p>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              <span className="font-semibold text-slate-400">Trend:</span>{' '}
              {pressureTrend(front)} / {linkedCampaignCount(state, front)} linked campaign(s)
            </p>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              <span className="font-semibold text-slate-400">Spawn window:</span>{' '}
              {campaignCooldownSummary(state, front)} / <span className="font-semibold text-slate-400">Counter tags:</span>{' '}
              {counterTagSummary(front)}
            </p>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              <span className="font-semibold text-slate-400">Recent shift:</span>{' '}
              {recentShiftSummary(front)}
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
