import type {
  ActorDef,
  AiMoveDef,
  DifficultyDef,
  GameState,
  PhaseId,
  WeightDynamic,
} from '../types/gameTypes';
import type { Rng } from './rng';
import { ACTORS } from '../data/actors';
import {
  addFlags,
  applyActorEffects,
  applyMetricDelta,
  makeTimelineEntry,
} from './actionEngine';
import { scheduleEffects } from './scheduleEngine';
import { addIncidents, applyNodeEffects } from './mapEngine';
import { startPressureCampaigns } from './pressureCampaignEngine';

/** How many actors act per turn, by phase (base value; rng may add one). */
const BASE_ACTORS_PER_TURN: Record<PhaseId, number> = { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3 };

function dynamicMatches(state: GameState, dyn: WeightDynamic): boolean {
  if (dyn.requiresFlags && !dyn.requiresFlags.every((f) => state.flags.includes(f))) return false;
  if (dyn.forbidsFlags && dyn.forbidsFlags.some((f) => state.flags.includes(f))) return false;
  if (dyn.metricBelow) {
    for (const [key, threshold] of Object.entries(dyn.metricBelow)) {
      if (state.metrics[key as keyof typeof state.metrics] >= (threshold ?? 0)) return false;
    }
  }
  if (dyn.metricAbove) {
    for (const [key, threshold] of Object.entries(dyn.metricAbove)) {
      if (state.metrics[key as keyof typeof state.metrics] <= (threshold ?? 100)) return false;
    }
  }
  return true;
}

/** Product of all matching dynamics' multipliers (1 when none match). */
export function dynamicMultiplier(state: GameState, dynamics?: WeightDynamic[]): number {
  if (!dynamics) return 1;
  let mult = 1;
  for (const dyn of dynamics) {
    if (dynamicMatches(state, dyn)) mult *= dyn.multiplier;
  }
  return mult;
}

function moveEligible(state: GameState, actorDef: ActorDef, move: AiMoveDef): boolean {
  const actor = state.actors[actorDef.id];
  if (move.phases && !move.phases.includes(state.phase)) return false;
  if ((actor.cooldowns[move.id] ?? 0) > 0) return false;
  if (move.requiresFlags && !move.requiresFlags.every((f) => state.flags.includes(f))) return false;
  if (move.forbidsFlags && move.forbidsFlags.some((f) => state.flags.includes(f))) return false;
  if (move.minRelationship !== undefined && actor.relationship < move.minRelationship) return false;
  if (move.maxRelationship !== undefined && actor.relationship > move.maxRelationship) return false;
  return true;
}

/** Apply per-phase aggression bumps when a new phase begins. */
export function applyPhaseAggression(state: GameState, phase: PhaseId): void {
  for (const def of ACTORS) {
    const bump = def.phaseAggression?.[phase];
    if (bump) {
      const actor = state.actors[def.id];
      state.actors[def.id] = {
        ...actor,
        aggression: Math.max(0, Math.min(100, actor.aggression + bump)),
      };
    }
  }
}

/**
 * Run the AI turn: 2–4 actors act depending on phase, aggression, difficulty
 * and seed. Actor and move weights react to world state via `dynamics`.
 * Every move lands in the timeline so the player always sees who did what.
 */
export function runAiTurn(state: GameState, rng: Rng, difficulty: DifficultyDef): void {
  let count = BASE_ACTORS_PER_TURN[state.phase];
  if (rng.chance(difficulty.extraActorChance)) count++;
  count = Math.min(count, 4);

  const pool = [...ACTORS];
  const acted: ActorDef[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const picked = rng.weightedPick(pool, (def) => {
      const actor = state.actors[def.id];
      const base = 10 + actor.aggression + actor.pressure * 0.5;
      return base * dynamicMultiplier(state, def.dynamics) * difficulty.aiWeightMult;
    });
    if (!picked) break;
    pool.splice(pool.indexOf(picked), 1);
    acted.push(picked);
  }

  for (const def of acted) {
    const eligible = def.moves.filter((m) => moveEligible(state, def, m));
    if (eligible.length === 0) continue;
    const move = rng.weightedPick(eligible, (m) => m.weight * dynamicMultiplier(state, m.dynamics));
    if (!move) continue;

    applyMetricDelta(state, move.metricEffects);
    applyActorEffects(state, move.actorEffects);
    addFlags(state, move.flagsAdded);
    scheduleEffects(state, move.schedules, def.name);
    applyNodeEffects(state, move.nodeEffects);
    addIncidents(state, move.incidents, def.short);
    startPressureCampaigns(state, move.pressureCampaigns, def.short);

    const actor = state.actors[def.id];
    state.actors[def.id] = {
      ...actor,
      recentMoves: [move.name, ...actor.recentMoves].slice(0, 3),
      cooldowns: { ...actor.cooldowns, [move.id]: move.cooldown ?? 2 },
    };

    state.timeline.push(
      makeTimelineEntry(state, {
        type: 'ai',
        actorId: def.id,
        title: `${def.short}: ${move.name}`,
        description: move.report,
      }),
    );
  }
}

/** Tick down actor move cooldowns by one week. */
export function tickActorCooldowns(state: GameState): void {
  for (const def of ACTORS) {
    const actor = state.actors[def.id];
    const next: Record<string, number> = {};
    for (const [id, weeks] of Object.entries(actor.cooldowns)) {
      if (weeks > 1) next[id] = weeks - 1;
    }
    state.actors[def.id] = { ...actor, cooldowns: next };
  }
}
