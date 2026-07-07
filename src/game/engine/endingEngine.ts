import type { EndingResult, GameState } from '../types/gameTypes';

/**
 * Early collapse conditions — checked every turn. Returns null while the
 * campaign can continue.
 */
export function checkEarlyCollapse(state: GameState): EndingResult | null {
  const m = state.metrics;

  if (m.financialContinuity <= 0) {
    return { endingId: 'market-funeral-2040', week: state.week, early: true };
  }
  if (m.publicReality <= 0) {
    return { endingId: 'public-reality-collapse', week: state.week, early: true };
  }
  if (m.sovereignty <= 0) {
    return { endingId: 'pacific-client-state', week: state.week, early: true };
  }
  if (m.personalStamina <= 0 && m.mentalLoad >= 80) {
    return { endingId: 'quiet-ciso', week: state.week, early: true };
  }
  if (m.cyberResilience <= 0) {
    return { endingId: 'digital-emergency-state', week: state.week, early: true };
  }
  return null;
}

/**
 * Final evaluation at the end of week 104. Ordered from most specific to
 * the fallback — exactly one ending always applies.
 */
export function evaluateFinalEnding(state: GameState): EndingResult {
  const m = state.metrics;
  const has = (flag: string) => state.flags.includes(flag);
  const result = (endingId: EndingResult['endingId']): EndingResult => ({
    endingId,
    week: state.week,
    early: false,
  });

  // Bad outcomes first — collapse-adjacent states override achievements.
  if (m.financialContinuity < 25) return result('market-funeral-2040');
  if (m.publicReality < 25) return result('public-reality-collapse');
  if (m.cyberResilience < 25 && has('reality-warning')) return result('digital-emergency-state');
  if (m.cyberResilience < 20) return result('digital-emergency-state');
  if (m.personalStamina < 20 && m.mentalLoad > 65) return result('quiet-ciso');

  // Dependency outcomes.
  if (m.sovereignty < 40 && (has('aligned-us') || m.alignmentPressure > 70)) {
    return result('pacific-client-state');
  }
  if (has('singapore-lifeline') && state.actors['singapore-authority'].relationship >= 55 && m.sovereignty < 55) {
    return result('singapore-dependency');
  }

  // Good outcomes.
  if (has('asean-shield') && m.aseanCohesion >= 60 && m.sovereignty >= 50) {
    return result('asean-shield');
  }
  if (m.sovereignty >= 60 && m.financialContinuity >= 45 && m.alignmentPressure <= 60) {
    return result('sovereign-middle-power');
  }
  if (m.aseanCohesion >= 70 && m.sovereignty >= 45) {
    return result('asean-shield');
  }

  // Survived without distinction: you kept the lights on, at cost.
  if (m.alignmentPressure > 65) return result('pacific-client-state');
  return result('quiet-ciso');
}

/** Combined per-turn ending check. */
export function checkEnding(state: GameState): EndingResult | null {
  const collapse = checkEarlyCollapse(state);
  if (collapse) return collapse;
  if (state.week >= state.maxWeeks) return evaluateFinalEnding(state);
  return null;
}
