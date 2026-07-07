import type {
  GameState,
  IncidentSpawnDef,
  MapNodeId,
  MapNodeState,
  MapState,
  NodeDelta,
  NodeEffectDef,
  TheatreId,
} from '../types/gameTypes';
import { MAP_NODES, NODE_MAP } from '../data/mapNodes';
import { getIncident } from '../data/incidents';
import { clamp, makeTimelineEntry } from './actionEngine';

/** Fresh map state from the static node definitions. */
export function createInitialMap(): MapState {
  const nodes = {} as Record<MapNodeId, MapNodeState>;
  for (const def of MAP_NODES) {
    nodes[def.id] = {
      id: def.id,
      stability: def.initial.stability,
      riskLevel: def.initial.riskLevel,
      cyberExposure: def.initial.cyberExposure,
      activeIncidents: [],
    };
  }
  return { nodes };
}

export function applyNodeDelta(state: GameState, nodeId: MapNodeId, delta: NodeDelta): void {
  const node = state.map.nodes[nodeId];
  if (!node) return;
  state.map.nodes[nodeId] = {
    ...node,
    stability: clamp(node.stability + (delta.stability ?? 0)),
    riskLevel: clamp(node.riskLevel + (delta.riskLevel ?? 0)),
    cyberExposure: clamp(node.cyberExposure + (delta.cyberExposure ?? 0)),
  };
}

export function applyNodeEffects(state: GameState, effects: NodeEffectDef[] | undefined): void {
  if (!effects) return;
  for (const eff of effects) applyNodeDelta(state, eff.nodeId, eff);
}

/**
 * Spawn incidents on nodes. Onset effects apply immediately; the incident
 * then grinds the node weekly until it expires. Each landing is reported
 * in the timeline with the node named.
 */
export function addIncidents(
  state: GameState,
  spawns: IncidentSpawnDef[] | undefined,
  source: string,
): void {
  if (!spawns) return;
  for (const spawn of spawns) {
    const def = getIncident(spawn.incidentId);
    const node = state.map.nodes[spawn.nodeId];
    if (!def || !node) continue;
    // One instance of an incident type per node at a time — refresh instead of stacking.
    const existing = node.activeIncidents.find((i) => i.incidentId === def.id);
    if (existing) {
      existing.expiresWeek = state.week + def.duration;
      continue;
    }
    applyNodeDelta(state, spawn.nodeId, def.onset);
    state.map.nodes[spawn.nodeId].activeIncidents.push({
      id: `${def.id}-${spawn.nodeId}-w${state.week}`,
      incidentId: def.id,
      title: def.title,
      severity: def.severity,
      source,
      startedWeek: state.week,
      expiresWeek: state.week + def.duration,
      tags: def.tags,
    });
    state.timeline.push(
      makeTimelineEntry(state, {
        type: 'map',
        title: `Incident: ${def.title} — ${NODE_MAP[spawn.nodeId].name}`,
        description: `${source} triggers ${def.title.toLowerCase()} at ${NODE_MAP[spawn.nodeId].name} (severity ${def.severity}, ~${def.duration} weeks).`,
      }),
    );
  }
}

/**
 * Weekly map tick: incidents grind and expire; quiet nodes recover.
 * Deterministic — no rng involved.
 */
export function tickMap(state: GameState): void {
  for (const def of MAP_NODES) {
    const node = state.map.nodes[def.id];
    if (!node) continue;

    // Active incidents grind the node.
    for (const incident of node.activeIncidents) {
      const template = getIncident(incident.incidentId);
      if (template?.weekly) applyNodeDelta(state, def.id, template.weekly);
    }

    // Expiry.
    const expired = node.activeIncidents.filter((i) => i.expiresWeek <= state.week);
    if (expired.length > 0) {
      state.map.nodes[def.id] = {
        ...state.map.nodes[def.id],
        activeIncidents: node.activeIncidents.filter((i) => i.expiresWeek > state.week),
      };
      for (const incident of expired) {
        state.timeline.push(
          makeTimelineEntry(state, {
            type: 'map',
            title: `Incident contained: ${incident.title} — ${def.name}`,
            description: `The ${incident.title.toLowerCase()} at ${def.name} has run its course.`,
          }),
        );
      }
    }

    // Natural recovery when nothing is actively burning.
    const current = state.map.nodes[def.id];
    if (current.activeIncidents.length === 0) {
      if (current.riskLevel > def.initial.riskLevel) {
        applyNodeDelta(state, def.id, { riskLevel: -1 });
      }
      if (current.stability < def.initial.stability && current.riskLevel < 50) {
        applyNodeDelta(state, def.id, { stability: 1 });
      }
    }
  }
}

export interface TheatreSummary {
  theatre: TheatreId;
  avgRisk: number;
  avgStability: number;
  incidentCount: number;
}

export function summarizeTheatres(state: GameState): Record<TheatreId, TheatreSummary> {
  const acc = {} as Record<TheatreId, { risk: number; stab: number; n: number; inc: number }>;
  for (const def of MAP_NODES) {
    const node = state.map.nodes[def.id];
    if (!node) continue;
    const bucket = (acc[def.theatre] ??= { risk: 0, stab: 0, n: 0, inc: 0 });
    bucket.risk += node.riskLevel;
    bucket.stab += node.stability;
    bucket.inc += node.activeIncidents.length;
    bucket.n++;
  }
  const out = {} as Record<TheatreId, TheatreSummary>;
  for (const [theatre, b] of Object.entries(acc) as [TheatreId, (typeof acc)[TheatreId]][]) {
    out[theatre] = {
      theatre,
      avgRisk: Math.round(b.risk / b.n),
      avgStability: Math.round(b.stab / b.n),
      incidentCount: b.inc,
    };
  }
  return out;
}

/**
 * The map pushes back on the national metrics — modest, legible thresholds.
 * External Pressure theatre is weather, not a Malaysian liability, so it
 * never drains metrics directly.
 */
export function applyMapPressureOnMetrics(state: GameState): void {
  const s = summarizeTheatres(state);
  const m = state.metrics;

  if (s['cyber-financial'].avgRisk > 60) {
    m.financialContinuity = clamp(m.financialContinuity - 1);
    m.publicReality = clamp(m.publicReality - 1);
  }
  if (s['malacca-strait'].avgRisk > 60) {
    m.maritimeControl = clamp(m.maritimeControl - 1);
    m.financialContinuity = clamp(m.financialContinuity - 1);
  }
  if (s.orbital.avgStability < 40) {
    m.orbitalAccess = clamp(m.orbitalAccess - 1);
    m.maritimeControl = clamp(m.maritimeControl - 1);
  }
  const energyStability =
    (state.map.nodes['bintulu-lng'].stability + state.map.nodes['brunei-energy-corridor'].stability) / 2;
  if (energyStability < 40) {
    m.energyAssurance = clamp(m.energyAssurance - 1);
  }
  if (s['asean-region'].avgRisk > 60) {
    m.aseanCohesion = clamp(m.aseanCohesion - 1);
  }
  if (s['malaysia-core'].avgStability < 45) {
    m.institutionalTrust = clamp(m.institutionalTrust - 1);
  }
}

/** Human-readable pressure warnings for the UI. */
export function getMapWarnings(state: GameState): string[] {
  const s = summarizeTheatres(state);
  const warnings: string[] = [];
  if (s['cyber-financial'].avgRisk > 60) warnings.push('Cyber-financial risk is draining Financial Continuity and Public Reality');
  if (s['malacca-strait'].avgRisk > 60) warnings.push('Strait instability is draining Maritime Control and Financial Continuity');
  if (s.orbital.avgStability < 40) warnings.push('Orbital degradation is draining Orbital Access and Maritime Control');
  if (s['asean-region'].avgRisk > 60) warnings.push('Regional instability is draining ASEAN Cohesion');
  if (s['malaysia-core'].avgStability < 45) warnings.push('Domestic instability is draining Institutional Trust');
  return warnings;
}
