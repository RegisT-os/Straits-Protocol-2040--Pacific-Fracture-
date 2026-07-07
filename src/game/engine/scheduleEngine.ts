import type { GameState, ScheduleDef, ScheduledEffect } from '../types/gameTypes';
import {
  addFlags,
  applyActorEffects,
  applyMetricDelta,
  makeTimelineEntry,
} from './actionEngine';

/**
 * Queue delayed consequences from an action, AI move, or event choice.
 * Each is announced in the timeline when set in motion, so the player
 * always knows a bill is coming — just not exactly what it says.
 */
export function scheduleEffects(
  state: GameState,
  defs: ScheduleDef[] | undefined,
  source: string,
): void {
  if (!defs) return;
  for (const def of defs) {
    const dueWeek = state.week + def.delayWeeks;
    state.scheduledEffects.push({
      id: `${def.id}-w${state.week}`,
      dueWeek,
      source,
      title: def.title,
      description: def.description,
      metricEffects: def.metricEffects,
      actorEffects: def.actorEffects,
      flagsAdded: def.flagsAdded,
      requiresFlags: def.requiresFlags,
      forbidsFlags: def.forbidsFlags,
    });
    state.timeline.push(
      makeTimelineEntry(state, {
        type: 'scheduled',
        title: `Consequence set in motion: ${def.title}`,
        description: `${source} will have repercussions around week ${dueWeek}.`,
      }),
    );
  }
}

function conditionHolds(state: GameState, effect: ScheduledEffect): boolean {
  if (effect.requiresFlags && !effect.requiresFlags.every((f) => state.flags.includes(f))) {
    return false;
  }
  if (effect.forbidsFlags && effect.forbidsFlags.some((f) => state.flags.includes(f))) {
    return false;
  }
  return true;
}

/** Resolve every scheduled effect whose due week has arrived. */
export function resolveDueEffects(state: GameState): void {
  const due = state.scheduledEffects.filter((e) => e.dueWeek <= state.week);
  if (due.length === 0) return;
  state.scheduledEffects = state.scheduledEffects.filter((e) => e.dueWeek > state.week);

  for (const effect of due) {
    if (!conditionHolds(state, effect)) continue; // overtaken by events — quietly lapses
    applyMetricDelta(state, effect.metricEffects);
    applyActorEffects(state, effect.actorEffects);
    addFlags(state, effect.flagsAdded);
    state.timeline.push(
      makeTimelineEntry(state, {
        type: 'scheduled',
        title: effect.title,
        description: effect.description,
      }),
    );
  }
}
