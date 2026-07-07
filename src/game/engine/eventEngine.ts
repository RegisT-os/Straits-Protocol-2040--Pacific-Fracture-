import type { EventChoice, EventDef, GameState } from '../types/gameTypes';
import type { Rng } from './rng';
import { EVENTS, getEvent } from '../data/events';
import {
  addFlags,
  applyActorEffects,
  applyMetricDelta,
  makeTimelineEntry,
} from './actionEngine';

/** Chance that any event fires on a given turn. */
const EVENT_CHANCE = 0.6;

function eventEligible(state: GameState, event: EventDef): boolean {
  if (!event.phases.includes(state.phase)) return false;
  if (event.once && state.firedEvents.includes(event.id)) return false;
  // Repeatable events still get a short grace period between firings.
  if (!event.once && state.firedEvents.includes(event.id)) {
    const lastFire = state.timeline
      .filter((t) => t.type === 'event' && t.title === event.title)
      .map((t) => t.week)
      .pop();
    if (lastFire !== undefined && state.week - lastFire < 6) return false;
  }
  const cond = event.condition;
  if (cond) {
    if (cond.minWeek !== undefined && state.week < cond.minWeek) return false;
    if (cond.maxWeek !== undefined && state.week > cond.maxWeek) return false;
    if (cond.requiresFlags && !cond.requiresFlags.every((f) => state.flags.includes(f))) return false;
    if (cond.forbidsFlags && cond.forbidsFlags.some((f) => state.flags.includes(f))) return false;
    if (cond.metricBelow) {
      for (const [key, threshold] of Object.entries(cond.metricBelow)) {
        if (state.metrics[key as keyof typeof state.metrics] >= (threshold ?? 0)) return false;
      }
    }
    if (cond.metricAbove) {
      for (const [key, threshold] of Object.entries(cond.metricAbove)) {
        if (state.metrics[key as keyof typeof state.metrics] <= (threshold ?? 100)) return false;
      }
    }
  }
  return true;
}

/**
 * Maybe trigger one event this turn. Automatic effects apply immediately;
 * events with choices stay in `activeEvents` unresolved until the player picks.
 */
export function maybeTriggerEvent(state: GameState, rng: Rng): void {
  // Draw the roll unconditionally so the rng stream stays stable.
  const fires = rng.chance(EVENT_CHANCE);
  const eligible = EVENTS.filter((e) => eventEligible(state, e));
  if (!fires || eligible.length === 0) return;

  const event = rng.weightedPick(eligible, (e) => e.weight);
  if (!event) return;

  if (!state.firedEvents.includes(event.id)) state.firedEvents.push(event.id);

  applyMetricDelta(state, event.metricEffects);
  applyActorEffects(state, event.actorEffects);
  addFlags(state, event.flagsAdded);

  state.timeline.push(
    makeTimelineEntry(state, {
      type: 'event',
      title: event.title,
      description: event.description,
    }),
  );

  state.activeEvents.push({
    eventId: event.id,
    week: state.week,
    resolved: !event.choices || event.choices.length === 0,
  });
}

/** The unresolved interactive event blocking the next turn, if any. */
export function getPendingEvent(state: GameState): EventDef | null {
  const pending = state.activeEvents.find((a) => !a.resolved);
  if (!pending) return null;
  return getEvent(pending.eventId) ?? null;
}

/** Resolve an interactive event with the chosen option. */
export function resolveEventChoice(state: GameState, event: EventDef, choice: EventChoice): void {
  const active = state.activeEvents.find((a) => a.eventId === event.id && !a.resolved);
  if (!active) return;
  active.resolved = true;

  applyMetricDelta(state, choice.metricEffects);
  applyActorEffects(state, choice.actorEffects);
  addFlags(state, choice.flagsAdded);

  state.timeline.push(
    makeTimelineEntry(state, {
      type: 'event',
      title: `${event.title} — ${choice.label}`,
      description: choice.report,
    }),
  );
}
