import type {
  ActionAvailability,
  ActionDef,
  ActorEffect,
  GameState,
  MetricDelta,
  Metrics,
  TimelineEntry,
} from '../types/gameTypes';
import type { Rng } from './rng';
import { getPlayableFaction } from '../data/playableFactions';
import { getRole } from '../data/roles';

export function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

export function clampMetrics(metrics: Metrics): Metrics {
  const out = { ...metrics };
  for (const key of Object.keys(out) as (keyof Metrics)[]) {
    out[key] = clamp(out[key]);
  }
  return out;
}

/** Apply a metric delta in place (state.metrics must already be a fresh copy). */
export function applyMetricDelta(state: GameState, delta: MetricDelta | undefined): void {
  if (!delta) return;
  for (const [key, value] of Object.entries(delta)) {
    const k = key as keyof Metrics;
    state.metrics[k] = clamp(state.metrics[k] + (value ?? 0));
  }
}

export function applyActorEffects(state: GameState, effects: ActorEffect[] | undefined): void {
  if (!effects) return;
  for (const eff of effects) {
    const actor = state.actors[eff.actorId];
    if (!actor) continue;
    state.actors[eff.actorId] = {
      ...actor,
      relationship: Math.max(-100, Math.min(100, actor.relationship + (eff.relationship ?? 0))),
      pressure: clamp(actor.pressure + (eff.pressure ?? 0)),
      aggression: clamp(actor.aggression + (eff.aggression ?? 0)),
    };
  }
}

export function addFlags(state: GameState, flags: string[] | undefined): void {
  if (!flags) return;
  for (const flag of flags) {
    if (!state.flags.includes(flag)) state.flags.push(flag);
  }
}

export function makeTimelineEntry(
  state: GameState,
  entry: Omit<TimelineEntry, 'id' | 'week' | 'phase'>,
): TimelineEntry {
  return {
    id: `tl-${state.week}-${state.timeline.length}-${entry.type}`,
    week: state.week,
    phase: state.phase,
    ...entry,
  };
}

/**
 * Action slots available this turn. Capacity comes from personal reserves
 * and institutional capacity; overload takes it away.
 */
export function getActionSlots(state: GameState): number {
  let slots = 1;
  if (state.metrics.personalStamina >= 65) slots++;
  if (state.metrics.institutionalTrust >= 65) slots++;
  if (state.metrics.mentalLoad >= 75) slots--;
  return Math.max(1, Math.min(3, slots));
}

export function isActionVisibleForFaction(state: GameState, action: ActionDef): boolean {
  const faction = getPlayableFaction(state.playableFactionId);
  if (action.factionRestriction && !action.factionRestriction.includes(faction.id)) return false;
  if (faction.disabledActionIds?.includes(action.id)) return false;
  return true;
}

/**
 * Availability check for the command panel. Locked actions always come with
 * a human-readable reason — they never disappear silently.
 */
export function getActionAvailability(state: GameState, action: ActionDef): ActionAvailability {
  if (!isActionVisibleForFaction(state, action)) {
    return { available: false, lockedReason: 'Unavailable to this faction' };
  }
  if (action.roleRestriction && state.selectedRole && !action.roleRestriction.includes(state.selectedRole)) {
    const roles = action.roleRestriction
      .map((r) => getRole(r)?.name ?? r)
      .join(' / ');
    return { available: false, lockedReason: `Requires role: ${roles}` };
  }
  if (action.phaseRestriction && !action.phaseRestriction.includes(state.phase)) {
    return {
      available: false,
      lockedReason: `Available in phase ${action.phaseRestriction.join(', ')} only`,
    };
  }
  if (action.once && state.completedActions.some((c) => c.actionId === action.id)) {
    return { available: false, lockedReason: 'Already done — once per campaign' };
  }
  const cooldownLeft = state.actionCooldowns[action.id] ?? 0;
  if (cooldownLeft > 0) {
    return { available: false, lockedReason: `On cooldown — ${cooldownLeft} more week${cooldownLeft > 1 ? 's' : ''}` };
  }
  if (action.requiresFlags) {
    for (const flag of action.requiresFlags) {
      if (!state.flags.includes(flag)) {
        return { available: false, lockedReason: lockedReasonForFlag(flag) };
      }
    }
  }
  if (action.forbidsFlags) {
    for (const flag of action.forbidsFlags) {
      if (state.flags.includes(flag)) {
        return { available: false, lockedReason: 'No longer possible — the moment has passed' };
      }
    }
  }
  return { available: true };
}

function lockedReasonForFlag(flag: string): string {
  const reasons: Record<string, string> = {
    'us-package-offered': 'The US has not offered a cyber package yet',
  };
  return reasons[flag] ?? `Requires prior development (${flag})`;
}

/** Apply the chosen player action. Mutates the (already cloned) state. */
export function applyPlayerAction(state: GameState, rng: Rng, action: ActionDef): void {
  applyMetricDelta(state, action.metricEffects);
  applyActorEffects(state, action.actorEffects);
  addFlags(state, action.flagsAdded);

  if (action.cooldown) {
    state.actionCooldowns[action.id] = action.cooldown;
  }

  state.completedActions.push({ week: state.week, actionId: action.id, name: action.name });

  state.timeline.push(
    makeTimelineEntry(state, {
      type: 'player',
      title: action.name,
      description: action.description,
    }),
  );

  if (action.risk && rng.chance(action.risk.chance)) {
    applyMetricDelta(state, action.risk.metricEffects);
    applyActorEffects(state, action.risk.actorEffects);
    state.timeline.push(
      makeTimelineEntry(state, {
        type: 'risk',
        title: `Blowback: ${action.risk.label}`,
        description: action.risk.report,
      }),
    );
  }
}

/** Tick down all action cooldowns by one week. */
export function tickActionCooldowns(state: GameState): void {
  const next: Record<string, number> = {};
  for (const [id, weeks] of Object.entries(state.actionCooldowns)) {
    if (weeks > 1) next[id] = weeks - 1;
  }
  state.actionCooldowns = next;
}
