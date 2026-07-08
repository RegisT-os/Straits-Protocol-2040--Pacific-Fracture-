import type {
  ActorId,
  ActorState,
  DifficultyId,
  GameState,
  MapState,
  MetricInfo,
  Metrics,
  NodeEffectDef,
  PhaseId,
  PhaseInfo,
  PlayableFactionId,
  RoleId,
  WarFrontEffect,
  WarFrontStateMap,
} from '../types/gameTypes';
import { ACTORS } from './actors';
import { getDifficulty } from './difficulty';
import { DEFAULT_PLAYABLE_FACTION_ID, getPlayableFaction } from './playableFactions';
import { getRole } from './roles';
import { clamp, clampMetrics } from '../engine/actionEngine';
import { createInitialMap } from '../engine/mapEngine';
import { createInitialMilitaryAssets } from '../engine/militaryEngine';
import { createInitialWarFronts, deriveWarFrontStatus } from '../engine/warFrontEngine';

export const MAX_WEEKS = 104;

export const METRIC_INFO: MetricInfo[] = [
  { key: 'sovereignty', label: 'Sovereignty', short: 'SOV', badWhenHigh: false, description: 'Freedom of national decision-making. At 0, Malaysia is a client state.' },
  { key: 'alignmentPressure', label: 'Alignment Pressure', short: 'ALN', badWhenHigh: true, description: 'How hard great powers are squeezing Malaysia to pick a side.' },
  { key: 'cyberResilience', label: 'Cyber Resilience', short: 'CYB', badWhenHigh: false, description: 'Ability of national networks to absorb and recover from attacks.' },
  { key: 'orbitalAccess', label: 'Orbital Access', short: 'ORB', badWhenHigh: false, description: 'Reliable positioning, timing, and satellite communications.' },
  { key: 'financialContinuity', label: 'Financial Continuity', short: 'FIN', badWhenHigh: false, description: 'Banks settle, markets clear, the ringgit holds. At 0, the system stops.' },
  { key: 'maritimeControl', label: 'Maritime Control', short: 'MAR', badWhenHigh: false, description: 'Visibility and control over the Straits and the EEZ.' },
  { key: 'energyAssurance', label: 'Energy Assurance', short: 'NRG', badWhenHigh: false, description: 'Fuel, gas and grid stability under pressure.' },
  { key: 'publicReality', label: 'Public Reality', short: 'PUB', badWhenHigh: false, description: 'Shared factual ground. At 0, nobody believes anything official.' },
  { key: 'aseanCohesion', label: 'ASEAN Cohesion', short: 'ASN', badWhenHigh: false, description: 'Whether ASEAN still functions as more than a logo.' },
  { key: 'institutionalTrust', label: 'Institutional Trust', short: 'INS', badWhenHigh: false, description: 'Confidence in Malaysian institutions to handle the crisis.' },
  { key: 'personalStamina', label: 'Personal Stamina', short: 'STA', badWhenHigh: false, description: 'Your reserves. At 0 with high mental load, you break.' },
  { key: 'mentalLoad', label: 'Mental Load', short: 'MTL', badWhenHigh: true, description: 'The weight you are carrying. High load burns stamina.' },
];

export const PHASES: PhaseInfo[] = [
  {
    id: 1,
    name: 'The Quiet Burn',
    weeks: [1, 16],
    description: 'Cyberattacks rise, attribution blurs. Malaysia prepares without overreacting.',
  },
  {
    id: 2,
    name: 'Pacific Counteroffensive',
    weeks: [17, 40],
    description: 'Taiwan and allies strike Chinese coastal infrastructure. China answers with cyber, maritime, propaganda and economic pressure.',
  },
  {
    id: 3,
    name: 'The Orbital Week',
    weeks: [41, 56],
    description: 'Space infrastructure destabilizes: GPS spoofing, satellite outages, debris, financial timing disruptions.',
  },
  {
    id: 4,
    name: 'ASEAN Breakpoint',
    weeks: [57, 80],
    description: 'ASEAN splits between US alignment, Chinese pressure, neutrality, and raw survival logic.',
  },
  {
    id: 5,
    name: 'Sovereignty Reckoning',
    weeks: [81, 104],
    description: "Malaysia's final posture is tested. Whatever you built, you now defend.",
  },
];

export function phaseForWeek(week: number): PhaseId {
  for (const p of PHASES) {
    if (week >= p.weeks[0] && week <= p.weeks[1]) return p.id;
  }
  return 5;
}

export function getPhaseInfo(id: PhaseId): PhaseInfo {
  return PHASES[id - 1];
}

export const BASE_METRICS: Metrics = {
  sovereignty: 65,
  alignmentPressure: 30,
  cyberResilience: 55,
  orbitalAccess: 60,
  financialContinuity: 65,
  maritimeControl: 55,
  energyAssurance: 65,
  publicReality: 60,
  aseanCohesion: 55,
  institutionalTrust: 55,
  personalStamina: 80,
  mentalLoad: 25,
};

function initialActors(): Record<ActorId, ActorState> {
  const out = {} as Record<ActorId, ActorState>;
  for (const def of ACTORS) {
    out[def.id] = {
      id: def.id,
      relationship: def.initial.relationship,
      pressure: def.initial.pressure,
      aggression: def.initial.aggression,
      intent: def.initial.intent,
      recentMoves: [],
      cooldowns: {},
    };
  }
  return out;
}

function applyStartingMapModifiers(map: MapState, modifiers: NodeEffectDef[]): void {
  for (const modifier of modifiers) {
    const node = map.nodes[modifier.nodeId];
    if (!node) continue;
    node.stability = clamp(node.stability + (modifier.stability ?? 0));
    node.riskLevel = clamp(node.riskLevel + (modifier.riskLevel ?? 0));
    node.cyberExposure = clamp(node.cyberExposure + (modifier.cyberExposure ?? 0));
  }
}

function applyStartingWarFrontModifiers(fronts: WarFrontStateMap, modifiers: WarFrontEffect[]): void {
  for (const modifier of modifiers) {
    const front = fronts[modifier.frontId];
    if (!front) continue;
    front.intensity = clamp(front.intensity + (modifier.intensity ?? 0));
    front.momentum = Math.max(-100, Math.min(100, Math.round((front.momentum + (modifier.momentum ?? 0)) * 100) / 100));
    front.escalationLevel = Math.max(1, Math.min(5, Math.round(front.escalationLevel + (modifier.escalation ?? 0)))) as 1 | 2 | 3 | 4 | 5;
    front.status = deriveWarFrontStatus(front.intensity);
    if (modifier.modifier && !front.activeModifiers.includes(modifier.modifier)) {
      front.activeModifiers = [modifier.modifier, ...front.activeModifiers].slice(0, 5);
    }
  }
}

export function createInitialState(
  roleId: RoleId,
  seed: number,
  difficultyId: DifficultyId = 'adviser',
  playableFactionId: PlayableFactionId = DEFAULT_PLAYABLE_FACTION_ID,
): GameState {
  const faction = getPlayableFaction(playableFactionId);
  const role = getRole(roleId);
  const difficulty = getDifficulty(difficultyId);
  const metrics: Metrics = { ...BASE_METRICS };
  for (const [key, delta] of Object.entries(faction.startingMetricModifiers)) {
    metrics[key as keyof Metrics] += delta ?? 0;
  }
  if (role) {
    for (const [key, delta] of Object.entries(role.startingModifiers)) {
      metrics[key as keyof Metrics] += delta ?? 0;
    }
  }
  for (const [key, delta] of Object.entries(difficulty.startingModifiers)) {
    metrics[key as keyof Metrics] += delta ?? 0;
  }
  const map = createInitialMap();
  applyStartingMapModifiers(map, faction.startingMapNodeModifiers);
  const warFronts = createInitialWarFronts(1);
  applyStartingWarFrontModifiers(warFronts, faction.startingWarFrontModifiers);

  return {
    campaignId: `campaign-${seed.toString(16)}-${Date.now().toString(36)}`,
    seed,
    rngCursor: 0,
    turn: 1,
    week: 1,
    maxWeeks: MAX_WEEKS,
    phase: 1,
    playableFactionId: faction.id,
    selectedRole: roleId,
    difficulty: difficultyId,
    status: 'active',
    metrics: clampMetrics(metrics),
    actors: initialActors(),
    activeEvents: [],
    firedEvents: [],
    lastEventWeek: {},
    timeline: [
      {
        id: 'tl-genesis',
        week: 1,
        phase: 1,
        type: 'system',
        title: 'Campaign start — January 2040',
        description:
          `Russia holds Ukraine and probes Europe. The US is all-in on the Pacific. Taiwan is at war. Hormuz is open, the Straits are not safe, and ${faction.shortName} is on the board. Good luck.`,
      },
      {
        id: 'tl-phase-1',
        week: 1,
        phase: 1,
        type: 'phase',
        title: 'Phase 1: The Quiet Burn',
        description: PHASES[0].description,
      },
    ],
    completedActions: [],
    actionCooldowns: {},
    pendingActions: [],
    pendingTargets: {},
    map,
    selectedNode: null,
    scheduledEffects: [],
    activePressureCampaigns: [],
    warFronts,
    militaryAssets: createInitialMilitaryAssets(playableFactionId),
    flags: [],
    ending: null,
  };
}
