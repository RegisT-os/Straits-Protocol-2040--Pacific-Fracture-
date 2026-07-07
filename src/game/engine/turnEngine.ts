import type { ActionDef, DifficultyDef, GameState, MapNodeId } from '../types/gameTypes';
import { Rng } from './rng';
import { getAction } from '../data/actions';
import { getDifficulty } from '../data/difficulty';
import { getPhaseInfo, phaseForWeek } from '../data/initialState';
import { NODE_MAP } from '../data/mapNodes';
import {
  applyPlayerAction,
  clamp,
  getActionAvailability,
  getActionSlots,
  makeTimelineEntry,
  tickActionCooldowns,
} from './actionEngine';
import { applyPhaseAggression, runAiTurn, tickActorCooldowns } from './aiEngine';
import { getEvent } from '../data/events';
import { maybeTriggerEvent, resolveEventChoice } from './eventEngine';
import { checkEnding } from './endingEngine';
import { resolveDueEffects, scheduleEffects } from './scheduleEngine';
import {
  addIncidents,
  applyMapPressureOnMetrics,
  applyNodeDelta,
  applyNodeEffects,
  tickMap,
} from './mapEngine';
import {
  disruptPressureCampaignsForAction,
  tickPressureCampaigns,
} from './pressureCampaignEngine';
import { applyWarFrontEffects, tickWarFronts } from './warFrontEngine';

function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

/**
 * Passive weekly drift — the slow physics of the crisis.
 * Small, legible rules; each one is a design statement.
 * Difficulty scales the recovery side, not the pressure side.
 */
function applyPassiveDrift(state: GameState, difficulty: DifficultyDef): void {
  const m = state.metrics;
  const recover = difficulty.recoveryStep;

  // Stamina recovers a little when the load is manageable; burns when it is not.
  if (m.mentalLoad < 50) m.personalStamina = clamp(m.personalStamina + 2);
  if (m.mentalLoad >= 70) m.personalStamina = clamp(m.personalStamina - 2);

  // High stamina slowly works the load down.
  if (m.personalStamina > 60) m.mentalLoad = clamp(m.mentalLoad - 1);

  // Institutions bleed trust when nobody agrees on reality.
  if (m.publicReality < 40) m.institutionalTrust = clamp(m.institutionalTrust - 1);

  // Weak cyber defenses tax the financial system continuously.
  if (m.cyberResilience < 40) m.financialContinuity = clamp(m.financialContinuity - 1);

  // Sustained great-power pressure erodes sovereignty.
  if (m.alignmentPressure > 70) m.sovereignty = clamp(m.sovereignty - 1);

  // Over-alignment alienates the neighbourhood.
  if (m.alignmentPressure > 80) m.aseanCohesion = clamp(m.aseanCohesion - 1);

  // Functioning institutions slowly pull core systems back toward normal.
  if (m.cyberResilience >= 55 && m.financialContinuity < 70) {
    m.financialContinuity = clamp(m.financialContinuity + recover);
  }
  if (m.financialContinuity < 45 && m.institutionalTrust >= 45) {
    // BNM emergency machinery kicks in before the system fails outright.
    m.financialContinuity = clamp(m.financialContinuity + recover);
  }
  if (m.institutionalTrust >= 55 && m.publicReality < 70) {
    m.publicReality = clamp(m.publicReality + recover);
  }
  if (m.institutionalTrust >= 50 && m.cyberResilience < 50) {
    m.cyberResilience = clamp(m.cyberResilience + recover);
  }

  // Crisis mobilization: a nation staring into the abyss adapts.
  for (const key of [
    'financialContinuity',
    'publicReality',
    'cyberResilience',
    'maritimeControl',
    'energyAssurance',
    'aseanCohesion',
  ] as const) {
    if (m[key] < difficulty.mobilizationThreshold) m[key] = clamp(m[key] + 1);
  }

  // The load only compounds while core systems are in crisis.
  const inCrisis =
    m.financialContinuity < 40 || m.publicReality < 40 || m.cyberResilience < 40;
  if (inCrisis) m.mentalLoad = clamp(m.mentalLoad + difficulty.crisisLoadStep);
}

/**
 * Advance one week, applying the selected actions in the order given.
 * Pure with respect to the input state (deep-cloned).
 *
 * Order per turn:
 *  1. phase determination, 2. passive drift + map/campaign/front tick/pressure,
 *  3. cooldown ticks, 4. player actions (up to slot count),
 *  5. scheduled effects due, 6. AI moves, 7. event trigger,
 *  8. ending check, 9. week increment + phase transition.
 */
export function advanceTurn(
  state: GameState,
  actionIds: string[],
  targetOverrides?: Record<string, MapNodeId>,
): GameState {
  if (state.status !== 'active') return state;

  const next = cloneState(state);
  const rng = new Rng(next.seed, next.rngCursor);
  const difficulty = getDifficulty(next.difficulty);
  const targets = targetOverrides ?? next.pendingTargets;

  // Slot capacity is what the player saw when selecting — pre-drift.
  const slots = getActionSlots(next);

  // 1. Phase is derived from the current week.
  next.phase = phaseForWeek(next.week);

  // 2. Passive drift, then the map, campaigns and global fronts grind.
  applyPassiveDrift(next, difficulty);
  tickMap(next);
  tickPressureCampaigns(next);
  tickWarFronts(next, rng);
  applyMapPressureOnMetrics(next);

  // 3. Cooldown ticks.
  tickActionCooldowns(next);
  tickActorCooldowns(next);

  // 4. Player actions, in selection order, capped at slot capacity.
  const seen = new Set<string>();
  for (const actionId of actionIds.slice(0, slots)) {
    if (seen.has(actionId)) continue;
    seen.add(actionId);
    const action = getAction(actionId);
    if (!action || !getActionAvailability(next, action).available) continue;
    // A targeted action without a valid target is skipped defensively;
    // the UI blocks advancing in that situation.
    const target = targets[actionId];
    if (action.targeting && (!target || !action.targeting.nodeIds.includes(target))) continue;
    applyPlayerAction(next, rng, action);
    scheduleEffects(next, action.schedules, action.name);
    applyNodeEffects(next, action.nodeEffects);
    addIncidents(next, action.incidents, action.name);
    if (action.targeting && target) applyActionTarget(next, action, target);
    disruptPressureCampaignsForAction(next, action);
    applyWarFrontEffects(next, action.warFrontEffects, action.name);
  }
  next.pendingActions = [];
  next.pendingTargets = {};

  // 5. Delayed consequences whose week has come.
  resolveDueEffects(next);

  // 6. AI actors move.
  runAiTurn(next, rng, difficulty);

  // 7. Possibly one event.
  maybeTriggerEvent(next, rng, difficulty);

  // 8. Ending check on the current week's outcome.
  const ending = checkEnding(next);
  if (ending) {
    next.ending = ending;
    next.status = 'ended';
    next.rngCursor = rng.cursor;
    return next;
  }

  // 9. Advance the calendar.
  next.week += 1;
  next.turn = next.week;
  const newPhase = phaseForWeek(next.week);
  if (newPhase !== next.phase) {
    next.phase = newPhase;
    const info = getPhaseInfo(newPhase);
    applyPhaseAggression(next, newPhase);
    next.timeline.push(
      makeTimelineEntry(next, {
        type: 'phase',
        title: `Phase ${info.id}: ${info.name}`,
        description: info.description,
      }),
    );
  }

  next.rngCursor = rng.cursor;
  return next;
}

/** Apply a targeted action's effect to its chosen node, with a timeline note. */
function applyActionTarget(state: GameState, action: ActionDef, target: MapNodeId): void {
  if (!action.targeting) return;
  applyNodeDelta(state, target, action.targeting.effect);
  state.timeline.push(
    makeTimelineEntry(state, {
      type: 'map',
      title: `${action.name} — ${NODE_MAP[target].name}`,
      description: `${action.name} takes effect at ${NODE_MAP[target].name}.`,
    }),
  );
}

/** Toggle an action in the pending selection (used by the UI before advancing). */
export function togglePendingAction(state: GameState, actionId: string): GameState {
  const next = cloneState(state);
  const idx = next.pendingActions.indexOf(actionId);
  if (idx >= 0) {
    next.pendingActions.splice(idx, 1);
    delete next.pendingTargets[actionId];
  } else if (next.pendingActions.length < getActionSlots(next)) {
    const action = getAction(actionId);
    if (!action || !getActionAvailability(next, action).available) return state;
    next.pendingActions.push(actionId);
    delete next.pendingTargets[actionId];
    // Single-option targeting is auto-assigned; multi-option waits for the player.
    if (action?.targeting && action.targeting.nodeIds.length === 1) {
      next.pendingTargets[actionId] = action.targeting.nodeIds[0];
    }
  }
  return next;
}

/** Set (or change) the map target for a pending targeted action. */
export function setActionTarget(state: GameState, actionId: string, nodeId: MapNodeId): GameState {
  const action = getAction(actionId);
  if (!action?.targeting || !action.targeting.nodeIds.includes(nodeId)) return state;
  if (!state.pendingActions.includes(actionId)) return state;
  const next = cloneState(state);
  next.pendingTargets[actionId] = nodeId;
  return next;
}

/** Select a node for inspection in the map UI. */
export function selectMapNode(state: GameState, nodeId: MapNodeId | null): GameState {
  if (nodeId && !NODE_MAP[nodeId]) return state;
  const next = cloneState(state);
  next.selectedNode = nodeId;
  return next;
}

/**
 * Resolve the pending interactive event with the given choice.
 * Runs the ending check again, since choices can push metrics over the edge.
 */
export function resolvePendingEvent(state: GameState, eventId: string, choiceId: string): GameState {
  const next = cloneState(state);
  const event = getEvent(eventId);
  if (!event || !event.choices) return next;
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) return next;

  resolveEventChoice(next, event, choice);

  const ending = checkEnding(next);
  if (ending && next.status === 'active') {
    next.ending = ending;
    next.status = 'ended';
  }
  return next;
}
