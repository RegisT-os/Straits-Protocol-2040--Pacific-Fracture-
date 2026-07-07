import type {
  DifficultyDef,
  EventChoice,
  EventDef,
  GameState,
  MetricDelta,
} from '../types/gameTypes';
import type { Rng } from './rng';
import { EVENTS, getEvent } from '../data/events';
import {
  addFlags,
  applyActorEffects,
  applyMetricDelta,
  makeTimelineEntry,
} from './actionEngine';
import { scheduleEffects } from './scheduleEngine';
import { addIncidents, applyNodeEffects } from './mapEngine';
import { startPressureCampaigns } from './pressureCampaignEngine';

/** Chance that any event fires on a given turn. */
const EVENT_CHANCE = 0.6;

/** Weeks before a repeatable event may fire again when it sets no cooldown. */
const DEFAULT_EVENT_COOLDOWN = 8;

function eventEligible(state: GameState, event: EventDef): boolean {
  if (!event.phases.includes(state.phase)) return false;
  if (event.once && state.firedEvents.includes(event.id)) return false;
  const lastFired = state.lastEventWeek[event.id];
  if (lastFired !== undefined) {
    const cooldown = event.cooldown ?? DEFAULT_EVENT_COOLDOWN;
    if (state.week - lastFired < cooldown) return false;
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

/** Scale an event's negative metric effects by difficulty; boons stay as-is. */
function scaleSeverity(delta: MetricDelta | undefined, mult: number): MetricDelta | undefined {
  if (!delta || mult === 1) return delta;
  const out: MetricDelta = {};
  for (const [key, value] of Object.entries(delta) as [keyof MetricDelta, number][]) {
    // "Negative" means bad for the player: drops in good metrics, rises in
    // Alignment Pressure / Mental Load.
    const badWhenHigh = key === 'alignmentPressure' || key === 'mentalLoad';
    const isHarm = badWhenHigh ? value > 0 : value < 0;
    out[key] = isHarm ? Math.round(value * mult) : value;
  }
  return out;
}

/**
 * Maybe trigger one event this turn. Automatic effects apply immediately;
 * events with choices stay in `activeEvents` unresolved until the player picks.
 */
export function maybeTriggerEvent(state: GameState, rng: Rng, difficulty: DifficultyDef): void {
  // Draw the roll unconditionally so the rng stream stays stable.
  const fires = rng.chance(EVENT_CHANCE);
  const eligible = EVENTS.filter((e) => eventEligible(state, e));
  if (!fires || eligible.length === 0) return;

  const event = rng.weightedPick(eligible, (e) => e.weight);
  if (!event) return;

  if (!state.firedEvents.includes(event.id)) state.firedEvents.push(event.id);
  state.lastEventWeek[event.id] = state.week;

  applyMetricDelta(state, scaleSeverity(event.metricEffects, difficulty.eventSeverityMult));
  applyActorEffects(state, event.actorEffects);
  addFlags(state, event.flagsAdded);
  applyNodeEffects(state, event.nodeEffects);
  addIncidents(state, event.incidents, event.title);
  startPressureCampaigns(state, event.pressureCampaigns, event.title);

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
  scheduleEffects(state, choice.schedules, event.title);
  applyNodeEffects(state, choice.nodeEffects);
  addIncidents(state, choice.incidents, event.title);
  startPressureCampaigns(state, choice.pressureCampaigns, event.title);

  state.timeline.push(
    makeTimelineEntry(state, {
      type: 'event',
      title: `${event.title} — ${choice.label}`,
      description: choice.report,
    }),
  );
}
