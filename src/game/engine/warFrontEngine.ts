import type {
  GameState,
  MetricKey,
  PressureCampaignTemplateId,
  WarFrontEffect,
  WarFrontId,
  WarFrontState,
  WarFrontStateMap,
  WarFrontStatus,
} from '../types/gameTypes';
import type { Rng } from './rng';
import { WAR_FRONT_MAP, WAR_FRONTS } from '../data/warFronts';
import { NODE_MAP } from '../data/mapNodes';
import { addIncidents, applyNodeDelta } from './mapEngine';
import { applyMetricDelta, clamp, makeTimelineEntry } from './actionEngine';
import { startPressureCampaigns } from './pressureCampaignEngine';

const BAD_WHEN_HIGH = new Set<MetricKey>(['alignmentPressure', 'mentalLoad']);
export const FRONT_CAMPAIGN_COOLDOWN_WEEKS = 8;
const METRIC_SHORT: Record<MetricKey, string> = {
  sovereignty: 'SOV',
  alignmentPressure: 'ALN',
  cyberResilience: 'CYB',
  orbitalAccess: 'ORB',
  financialContinuity: 'FIN',
  maritimeControl: 'MAR',
  energyAssurance: 'NRG',
  publicReality: 'PUB',
  aseanCohesion: 'ASN',
  institutionalTrust: 'INS',
  personalStamina: 'STA',
  mentalLoad: 'MTL',
};

export interface WarFrontCampaignHook {
  frontId: WarFrontId;
  templateId: PressureCampaignTemplateId;
  threshold: number;
  label: string;
  refreshActive?: boolean;
  intensity?: number;
  durationWeeks?: number;
}

export const WAR_FRONT_CAMPAIGN_HOOKS: WarFrontCampaignHook[] = [
  { frontId: 'pacific-war-front', templateId: 'china-scs-coercion', threshold: 88, label: 'China SCS coercion' },
  { frontId: 'european-pressure-front', templateId: 'europe-sanctions-track', threshold: 88, label: 'Europe sanctions track' },
  { frontId: 'european-pressure-front', templateId: 'russia-grey-zone-cyber', threshold: 92, label: 'Russian grey-zone cyber' },
  { frontId: 'orbital-war-front', templateId: 'pnt-degradation-cycle', threshold: 82, label: 'PNT degradation cycle', refreshActive: true },
  { frontId: 'cyber-war-front', templateId: 'threat-cloud-banking-wave', threshold: 86, label: 'Cloud-banking attack wave' },
  { frontId: 'maritime-war-front', templateId: 'china-scs-coercion', threshold: 90, label: 'China SCS coercion' },
  { frontId: 'financial-war-front', templateId: 'markets-capital-flight', threshold: 94, label: 'Capital flight cycle' },
  { frontId: 'financial-war-front', templateId: 'singapore-continuity-hedge', threshold: 96, label: 'Singapore continuity hedge' },
];

function clampRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value * 100) / 100));
}

function clampMomentum(value: number): number {
  return clampRange(value, -100, 100);
}

function clampEscalation(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
}

export function deriveWarFrontStatus(intensity: number): WarFrontStatus {
  if (intensity < 30) return 'stable';
  if (intensity < 55) return 'escalating';
  if (intensity < 80) return 'crisis';
  return 'breaking';
}

function targetEscalation(intensity: number): 1 | 2 | 3 | 4 | 5 {
  if (intensity < 30) return 1;
  if (intensity < 55) return 2;
  if (intensity < 72) return 3;
  if (intensity < 88) return 4;
  return 5;
}

export function createInitialWarFronts(startWeek = 1): WarFrontStateMap {
  const fronts = {} as WarFrontStateMap;
  for (const def of WAR_FRONTS) {
    fronts[def.id] = {
      ...def,
      status: deriveWarFrontStatus(def.intensity),
      activeModifiers: [...def.activeModifiers],
      lastShiftWeek: startWeek,
      lastShiftSummary: 'Initial front posture.',
    };
  }
  return fronts;
}

function frontDirection(before: number, after: number): string {
  const delta = after - before;
  if (delta >= 1) return `rises ${Math.round(before)} -> ${Math.round(after)}`;
  if (delta <= -1) return `falls ${Math.round(before)} -> ${Math.round(after)}`;
  return `holds near ${Math.round(after)}`;
}

function frontImpactText(front: WarFrontState): string {
  const metrics = front.linkedMetrics.slice(0, 3).map((metric) => METRIC_SHORT[metric]).join('/');
  const nodes = front.linkedMapNodes.slice(0, 2).map((nodeId) => NODE_MAP[nodeId].name).join(', ');
  return `${metrics}; ${nodes}`;
}

function recordFrontShift(
  state: GameState,
  front: WarFrontState,
  title: string,
  source: string,
  previousIntensity: number,
): void {
  const direction = frontDirection(previousIntensity, front.intensity);
  front.lastShiftWeek = state.week;
  front.lastShiftSummary = `${source}: ${direction}; ${front.status}, ESC ${front.escalationLevel}`;
  state.timeline.push(
    makeTimelineEntry(state, {
      type: 'map',
      title,
      description: `${front.name} ${direction}. Status: ${front.status}, escalation ${front.escalationLevel}. Affects ${frontImpactText(front)}.`,
    }),
  );
}

export function applyWarFrontEffects(
  state: GameState,
  effects: WarFrontEffect[] | undefined,
  source: string,
): void {
  if (!effects) return;
  for (const effect of effects) {
    const front = state.warFronts[effect.frontId];
    if (!front) continue;
    const previousIntensity = front.intensity;
    const previousStatus = front.status;
    const previousEscalation = front.escalationLevel;

    const counterplayBoost = (effect.intensity ?? 0) < 0 || (effect.momentum ?? 0) < 0 ? 1.15 : 1;
    front.intensity = clamp(front.intensity + (effect.intensity ?? 0) * counterplayBoost);
    front.momentum = clampMomentum(front.momentum + (effect.momentum ?? 0) * counterplayBoost);
    front.escalationLevel = clampEscalation(front.escalationLevel + (effect.escalation ?? 0));
    front.status = deriveWarFrontStatus(front.intensity);
    if (effect.modifier && !front.activeModifiers.includes(effect.modifier)) {
      front.activeModifiers = [effect.modifier, ...front.activeModifiers].slice(0, 4);
    }

    if (front.status !== previousStatus || front.escalationLevel !== previousEscalation) {
      recordFrontShift(state, front, `War front shift: ${front.name}`, source, previousIntensity);
    }
  }
}

export function tickWarFronts(state: GameState, rng: Rng): void {
  for (const front of Object.values(state.warFronts)) {
    const previousIntensity = front.intensity;
    const previousStatus = front.status;
    const previousEscalation = front.escalationLevel;
    const actorDrive = linkedActorDrive(state, front);
    const exposureDrive = linkedExposureDrive(state, front);
    const jitter = rng.next() * 0.8 - 0.4;

    front.momentum = clampMomentum(front.momentum + actorDrive * 0.3 + exposureDrive * 0.25 + jitter);
    const escalationDrag = front.intensity > 90 && front.momentum > 0 ? -0.15 : 0;
    const intensityChange = front.momentum * 0.018 + (front.escalationLevel - 2) * 0.05 + escalationDrag;
    front.intensity = clamp(front.intensity + intensityChange);

    const target = targetEscalation(front.intensity);
    if (target > front.escalationLevel) {
      front.escalationLevel = clampEscalation(front.escalationLevel + 1);
    } else if (target < front.escalationLevel) {
      front.escalationLevel = clampEscalation(front.escalationLevel - 1);
    }
    front.status = deriveWarFrontStatus(front.intensity);
    front.activeModifiers = activeModifiersFor(front, actorDrive, exposureDrive);

    if (front.status !== previousStatus || front.escalationLevel !== previousEscalation) {
      recordFrontShift(state, front, `War front shift: ${front.name}`, 'Weekly war-front tick', previousIntensity);
    }

    applyFrontSpillover(state, rng, front);
  }
}

function linkedActorDrive(state: GameState, front: WarFrontState): number {
  let total = 0;
  let count = 0;
  for (const actorId of front.linkedActors) {
    const actor = state.actors[actorId];
    if (!actor) continue;
    total += (actor.pressure - 30) * 0.025 + (actor.aggression - 35) * 0.015;
    count++;
  }
  return count > 0 ? clampRange(total / count, -2, 2.5) : 0;
}

function linkedExposureDrive(state: GameState, front: WarFrontState): number {
  let total = 0;
  let count = 0;
  for (const nodeId of front.linkedMapNodes) {
    const node = state.map.nodes[nodeId];
    if (!node) continue;
    total += (node.riskLevel - 45) * 0.015 + (50 - node.stability) * 0.01;
    count++;
  }
  for (const metric of front.linkedMetrics) {
    const value = state.metrics[metric];
    const stress = BAD_WHEN_HIGH.has(metric) ? value : 100 - value;
    total += (stress - 45) * 0.012;
    count++;
  }
  return count > 0 ? clampRange(total / count, -1.5, 2) : 0;
}

function activeModifiersFor(front: WarFrontState, actorDrive: number, exposureDrive: number): string[] {
  const base = WAR_FRONT_MAP[front.id].activeModifiers[0];
  const modifiers = [base];
  if (front.intensity >= 80) modifiers.push('Major spillover');
  else if (front.intensity >= 60) modifiers.push('Regional spillover');
  if (front.momentum >= 15) modifiers.push('Rising momentum');
  if (front.momentum <= -15) modifiers.push('Stabilizing momentum');
  if (front.escalationLevel >= 4) modifiers.push('Escalation shock');
  if (actorDrive > 0.6) modifiers.push('Linked actor pressure');
  if (exposureDrive > 0.6) modifiers.push('Malaysia exposure');
  return modifiers.slice(0, 5);
}

function spilloverScale(front: WarFrontState): number {
  if (front.intensity >= 85) return 0.28;
  if (front.intensity >= 70) return 0.12;
  if (front.intensity >= 55) return 0.04;
  return 0;
}

function maybeStartCampaign(
  state: GameState,
  front: WarFrontState,
  hook: WarFrontCampaignHook,
): boolean {
  if (front.intensity < hook.threshold) return false;
  const active = state.activePressureCampaigns.some(
    (campaign) => campaign.templateId === hook.templateId && campaign.status === 'active',
  );
  if (active && !hook.refreshActive) return false;
  const recentFrontStart = state.timeline.some(
    (entry) =>
      entry.type === 'map' &&
      (entry.title === `War front campaign: ${front.name}` || entry.title === `War front campaign refresh: ${front.name}`) &&
      state.week - entry.week < FRONT_CAMPAIGN_COOLDOWN_WEEKS,
  );
  if (recentFrontStart) return false;
  const previousTimelineLength = state.timeline.length;
  startPressureCampaigns(
    state,
    [{ templateId: hook.templateId, intensity: hook.intensity, durationWeeks: hook.durationWeeks }],
    front.name,
  );
  front.lastShiftWeek = state.week;
  front.lastShiftSummary = `${active ? 'Refreshed' : 'Started'} pressure campaign: ${hook.label}.`;
  for (const entry of state.timeline.slice(previousTimelineLength)) {
    entry.title = active ? `War front campaign refresh: ${front.name}` : `War front campaign: ${front.name}`;
    entry.description = `${front.name} ${active ? 'refreshes' : 'starts'} ${hook.label} at INT ${Math.round(front.intensity)}. Affects ${frontImpactText(front)}.`;
  }
  return true;
}

function majorSpilloverTimeline(state: GameState, front: WarFrontState, description: string): void {
  if (front.intensity < 70 || state.week - front.lastShiftWeek < 8) return;
  front.lastShiftWeek = state.week;
  state.timeline.push(
    makeTimelineEntry(state, {
      type: 'map',
      title: `War spillover: ${front.name}`,
      description: `${description} Affects ${frontImpactText(front)}.`,
    }),
  );
}

function applyFrontSpillover(state: GameState, rng: Rng, front: WarFrontState): void {
  const scale = spilloverScale(front);
  if (scale <= 0) return;

  switch (front.id as WarFrontId) {
    case 'pacific-war-front':
      for (const nodeId of ['malaysian-eez', 'luconia-shoals', 'scs-air-sea-corridor', 'china-coastal-warzone', 'penang'] as const) {
        applyNodeDelta(state, nodeId, { riskLevel: 0.55 * scale, stability: nodeId === 'penang' ? -0.2 * scale : 0 });
      }
      applyMetricDelta(state, {
        alignmentPressure: 0.35 * scale,
        maritimeControl: -0.25 * scale,
        financialContinuity: -0.1 * scale,
        aseanCohesion: front.escalationLevel >= 4 ? -0.3 * scale : 0,
      });
      maybeStartCampaign(state, front, WAR_FRONT_CAMPAIGN_HOOKS[0]);
      majorSpilloverTimeline(state, front, 'Pacific combat tempo spills into South China Sea risk and ASEAN alignment pressure.');
      break;

    case 'european-pressure-front':
      for (const nodeId of ['european-front', 'russia-network-node', 'cloud-region', 'bnm-core'] as const) {
        applyNodeDelta(state, nodeId, { riskLevel: 0.45 * scale, cyberExposure: nodeId === 'cloud-region' ? 0.4 * scale : 0 });
      }
      applyMetricDelta(state, {
        alignmentPressure: 0.3 * scale,
        financialContinuity: -0.15 * scale,
        publicReality: -0.15 * scale,
      });
      maybeStartCampaign(state, front, WAR_FRONT_CAMPAIGN_HOOKS[1]);
      maybeStartCampaign(state, front, WAR_FRONT_CAMPAIGN_HOOKS[2]);
      majorSpilloverTimeline(state, front, 'Europe and Russia export sanctions pressure, market fear and cyber opportunism into Malaysia.');
      break;

    case 'orbital-war-front':
      for (const nodeId of ['asean-microsat', 'commercial-satnet', 'financial-timing-link', 'maritime-imaging', 'emergency-nav-mesh'] as const) {
        applyNodeDelta(state, nodeId, { riskLevel: 0.6 * scale, stability: -0.35 * scale });
      }
      applyMetricDelta(state, { orbitalAccess: -0.45 * scale, maritimeControl: -0.2 * scale });
      maybeStartCampaign(state, front, WAR_FRONT_CAMPAIGN_HOOKS[3]);
      if (front.intensity >= 80 && rng.chance(0.14)) {
        addIncidents(state, [{ incidentId: 'satellite-internet-interruption', nodeId: 'commercial-satnet' }], front.name);
      }
      majorSpilloverTimeline(state, front, 'Orbital contestation degrades PNT, satellite internet and maritime imaging reliability.');
      break;

    case 'cyber-war-front':
      for (const nodeId of ['cloud-region', 'digital-id', 'payment-rails', 'bnm-core'] as const) {
        applyNodeDelta(state, nodeId, { riskLevel: 0.65 * scale, cyberExposure: 0.55 * scale });
      }
      applyMetricDelta(state, {
        cyberResilience: -0.45 * scale,
        publicReality: -0.3 * scale,
        financialContinuity: -0.1 * scale,
      });
      maybeStartCampaign(state, front, WAR_FRONT_CAMPAIGN_HOOKS[4]);
      if (front.intensity >= 84 && rng.chance(0.12)) {
        addIncidents(state, [{ incidentId: 'cloud-credential-cascade', nodeId: 'cloud-region' }], front.name);
      }
      majorSpilloverTimeline(state, front, 'Cyber front intensity spills into cloud, identity, payments and public reality pressure.');
      break;

    case 'maritime-war-front':
      for (const nodeId of ['malacca-strait', 'singapore-strait', 'malaysian-eez', 'luconia-shoals', 'port-klang'] as const) {
        applyNodeDelta(state, nodeId, { riskLevel: 0.6 * scale, stability: -0.2 * scale });
      }
      applyMetricDelta(state, {
        maritimeControl: -0.4 * scale,
        energyAssurance: -0.25 * scale,
        financialContinuity: -0.1 * scale,
      });
      maybeStartCampaign(state, front, WAR_FRONT_CAMPAIGN_HOOKS[5]);
      if (front.intensity >= 82 && rng.chance(0.12)) {
        addIncidents(state, [{ incidentId: 'gps-spoofing-malacca', nodeId: 'malacca-strait' }], front.name);
      }
      majorSpilloverTimeline(state, front, 'Shipping conflict raises insurance, Strait risk and energy routing pressure.');
      break;

    case 'financial-war-front':
      for (const nodeId of ['bnm-core', 'bursa-node', 'payment-rails', 'singapore'] as const) {
        applyNodeDelta(state, nodeId, { riskLevel: 0.55 * scale, stability: -0.2 * scale });
      }
      applyMetricDelta(state, {
        financialContinuity: -0.3 * scale,
        sovereignty: -0.1 * scale,
        institutionalTrust: -0.1 * scale,
        alignmentPressure: 0.15 * scale,
      });
      maybeStartCampaign(state, front, WAR_FRONT_CAMPAIGN_HOOKS[6]);
      maybeStartCampaign(state, front, WAR_FRONT_CAMPAIGN_HOOKS[7]);
      if (front.intensity >= 82 && rng.chance(0.12)) {
        addIncidents(state, [{ incidentId: 'capital-flight-pressure', nodeId: 'bursa-node' }], front.name);
      }
      majorSpilloverTimeline(state, front, 'Financial front stress pushes capital, settlement and Singapore dependency pressure into the campaign.');
      break;
  }
}
