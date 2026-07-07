import type {
  ActorId,
  ActorState,
  GameState,
  MetricInfo,
  Metrics,
  PhaseId,
  PhaseInfo,
  RoleId,
} from '../types/gameTypes';
import { ACTORS } from './actors';
import { getRole } from './roles';
import { clampMetrics } from '../engine/actionEngine';

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

export function createInitialState(roleId: RoleId, seed: number): GameState {
  const role = getRole(roleId);
  const metrics: Metrics = { ...BASE_METRICS };
  if (role) {
    for (const [key, delta] of Object.entries(role.startingModifiers)) {
      metrics[key as keyof Metrics] += delta ?? 0;
    }
  }

  return {
    campaignId: `campaign-${seed.toString(16)}-${Date.now().toString(36)}`,
    seed,
    rngCursor: 0,
    turn: 1,
    week: 1,
    maxWeeks: MAX_WEEKS,
    phase: 1,
    selectedRole: roleId,
    status: 'active',
    metrics: clampMetrics(metrics),
    actors: initialActors(),
    activeEvents: [],
    firedEvents: [],
    timeline: [
      {
        id: 'tl-genesis',
        week: 1,
        phase: 1,
        type: 'system',
        title: 'Campaign start — January 2040',
        description:
          'Russia holds Ukraine and probes Europe. The US is all-in on the Pacific. Taiwan is at war. Hormuz is open, the Straits are not safe, and Malaysia is on its own side. Good luck.',
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
    flags: [],
    ending: null,
  };
}
