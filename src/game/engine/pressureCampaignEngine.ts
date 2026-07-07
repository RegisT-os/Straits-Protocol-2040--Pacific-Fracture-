import type {
  ActionDef,
  ActivePressureCampaign,
  GameState,
  MetricDelta,
  NodeDelta,
  PressureCampaignDef,
  PressureCampaignOutcomeEffects,
  PressureCampaignStartDef,
} from '../types/gameTypes';
import { getPressureCampaign } from '../data/pressureCampaigns';
import {
  addFlags,
  applyMetricDelta,
  clamp,
  makeTimelineEntry,
} from './actionEngine';
import { applyNodeDelta, applyNodeEffects } from './mapEngine';

const MAX_INTENSITY = 4;

function effectScale(intensity: number): number {
  return Math.max(0.5, intensity * 0.5);
}

function scaleNodeDelta(delta: NodeDelta, intensity: number): NodeDelta {
  const scale = effectScale(intensity);
  return {
    stability: delta.stability === undefined ? undefined : delta.stability * scale,
    riskLevel: delta.riskLevel === undefined ? undefined : delta.riskLevel * scale,
    cyberExposure: delta.cyberExposure === undefined ? undefined : delta.cyberExposure * scale,
  };
}

function scaleMetricDelta(delta: MetricDelta, intensity: number): MetricDelta {
  const scale = effectScale(intensity);
  const out: MetricDelta = {};
  for (const [key, value] of Object.entries(delta) as [keyof MetricDelta, number][]) {
    out[key] = value * scale;
  }
  return out;
}

function campaignFromTemplate(
  state: GameState,
  template: PressureCampaignDef,
  start: PressureCampaignStartDef,
): ActivePressureCampaign {
  return {
    id: `${template.id}-w${state.week}-${state.activePressureCampaigns.length}`,
    templateId: template.id,
    actorId: template.actorId,
    title: template.title,
    description: template.description,
    theatre: template.theatre,
    targetNodeIds: template.targetNodeIds,
    startedWeek: state.week,
    durationWeeks: start.durationWeeks ?? template.durationWeeks,
    currentWeek: 0,
    intensity: Math.max(1, Math.min(MAX_INTENSITY, start.intensity ?? template.intensity)),
    status: 'active',
    tags: template.tags,
    counterActionTags: template.counterActionTags,
    weeklyNodeEffects: template.weeklyNodeEffects,
    weeklyMetricEffects: template.weeklyMetricEffects,
    completionEffects: template.completionEffects,
    disruptionEffects: template.disruptionEffects,
    flagsAddedOnStart: template.flagsAddedOnStart,
    flagsAddedOnCompletion: template.flagsAddedOnCompletion,
  };
}

function applyOutcomeEffects(
  state: GameState,
  effects: PressureCampaignOutcomeEffects,
): void {
  applyMetricDelta(state, effects.metricEffects);
  applyNodeEffects(state, effects.nodeEffects);
  addFlags(state, effects.flagsAdded);
}

export function startPressureCampaigns(
  state: GameState,
  starts: PressureCampaignStartDef[] | undefined,
  source: string,
): void {
  if (!starts) return;
  for (const start of starts) {
    const template = getPressureCampaign(start.templateId);
    if (!template) continue;

    const existing = state.activePressureCampaigns.find(
      (campaign) => campaign.templateId === template.id && campaign.status === 'active',
    );
    if (existing) {
      existing.intensity = Math.max(
        1,
        Math.min(MAX_INTENSITY, existing.intensity + (start.intensity ?? 1)),
      );
      existing.durationWeeks = Math.max(
        existing.durationWeeks,
        start.durationWeeks ?? template.durationWeeks,
      );
      existing.currentWeek = Math.max(0, existing.currentWeek - 1);
      state.timeline.push(
        makeTimelineEntry(state, {
          type: 'map',
          actorId: existing.actorId,
          title: `Campaign intensified: ${existing.title}`,
          description: `${source} refreshes ${existing.title} (intensity ${existing.intensity}).`,
        }),
      );
      continue;
    }

    const campaign = campaignFromTemplate(state, template, start);
    state.activePressureCampaigns.push(campaign);
    addFlags(state, campaign.flagsAddedOnStart);
    state.timeline.push(
      makeTimelineEntry(state, {
        type: 'map',
        actorId: campaign.actorId,
        title: `Campaign started: ${campaign.title}`,
        description: `${source} begins ${campaign.title} across ${campaign.targetNodeIds.length} strategic node(s).`,
      }),
    );
  }
}

export function tickPressureCampaigns(state: GameState): void {
  for (const campaign of state.activePressureCampaigns) {
    if (campaign.status !== 'active') continue;
    campaign.currentWeek += 1;

    const nodeDelta = scaleNodeDelta(campaign.weeklyNodeEffects, campaign.intensity);
    for (const nodeId of campaign.targetNodeIds) {
      applyNodeDelta(state, nodeId, nodeDelta);
    }
    applyMetricDelta(state, scaleMetricDelta(campaign.weeklyMetricEffects, campaign.intensity));

    state.timeline.push(
      makeTimelineEntry(state, {
        type: 'map',
        actorId: campaign.actorId,
        title: `Campaign pressure: ${campaign.title}`,
        description: `${campaign.title} applies week ${campaign.currentWeek}/${campaign.durationWeeks} pressure (intensity ${campaign.intensity}).`,
      }),
    );

    if (campaign.currentWeek >= campaign.durationWeeks) {
      campaign.status = 'completed';
      campaign.currentWeek = campaign.durationWeeks;
      applyOutcomeEffects(state, campaign.completionEffects);
      addFlags(state, campaign.flagsAddedOnCompletion);
      state.timeline.push(
        makeTimelineEntry(state, {
          type: 'map',
          actorId: campaign.actorId,
          title: `Campaign completed: ${campaign.title}`,
          description: `${campaign.title} has run its course and its strategic effects settle in.`,
        }),
      );
    }
  }
}

function actionCounterTags(action: ActionDef): string[] {
  const tags = new Set<string>([action.category]);
  for (const flag of action.flagsAdded ?? []) tags.add(flag);
  if (action.id.includes('asean')) tags.add('asean');
  if (action.id.includes('cert')) tags.add('cert');
  if (action.id.includes('cyber')) tags.add('cyber');
  if (action.id.includes('drone') || action.id.includes('maritime')) tags.add('maritime');
  if (action.id.includes('reality')) tags.add('public-reality');
  if (action.id.includes('singapore')) tags.add('singapore');
  if (action.id.includes('neutrality') || action.id.includes('alignment')) tags.add('neutrality');
  if (action.id.includes('bnm') || action.id.includes('confidence')) tags.add('confidence');
  if (action.id.includes('europe')) tags.add('europe');
  if (action.id.includes('identity')) tags.add('identity');
  return [...tags];
}

export function disruptPressureCampaignsForAction(
  state: GameState,
  action: ActionDef,
): void {
  const tags = actionCounterTags(action);
  for (const campaign of state.activePressureCampaigns) {
    if (campaign.status !== 'active') continue;
    const matches = campaign.counterActionTags.filter((tag) => tags.includes(tag));
    if (matches.length === 0) continue;

    const reduction = matches.length >= 2 ? 2 : 1;
    campaign.intensity = clamp(campaign.intensity - reduction);
    campaign.durationWeeks = Math.max(campaign.currentWeek, campaign.durationWeeks - 1);

    state.timeline.push(
      makeTimelineEntry(state, {
        type: 'map',
        actorId: campaign.actorId,
        title: `Campaign disrupted: ${campaign.title}`,
        description: `${action.name} counters ${campaign.title} via ${matches.join(', ')}.`,
      }),
    );

    if (campaign.intensity <= 0) {
      campaign.status = 'disrupted';
      campaign.intensity = 0;
      applyOutcomeEffects(state, campaign.disruptionEffects);
      state.timeline.push(
        makeTimelineEntry(state, {
          type: 'map',
          actorId: campaign.actorId,
          title: `Campaign broken: ${campaign.title}`,
          description: `${campaign.title} loses coherence before completion.`,
        }),
      );
    }
  }
}
