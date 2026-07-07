// Headless campaign simulator — the engine's verification harness.
//
// Run with: npm run sim
//
// Checks:
//  1. Full campaigns terminate with an ending for every role (random policy).
//  2. All metrics stay clamped to 0..100 throughout.
//  3. The same seed + same inputs reproduce the identical outcome (determinism).
//  4. A competent "greedy" policy can survive to week 104 (playability floor).
//
// Exits non-zero on any failure so it can gate CI later.

import { createInitialState } from '../src/game/data/initialState';
import { ACTIONS } from '../src/game/data/actions';
import { getActionAvailability } from '../src/game/engine/actionEngine';
import { advanceTurn, resolvePendingEvent } from '../src/game/engine/turnEngine';
import { getPendingEvent } from '../src/game/engine/eventEngine';
import type { GameState, RoleId } from '../src/game/types/gameTypes';

const ROLES: RoleId[] = [
  'security-consultant',
  'policy-strategist',
  'intelligence-officer',
  'finance-operator',
  'military-liaison',
];

let failures = 0;
function check(ok: boolean, message: string): void {
  if (!ok) {
    failures++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertClamped(state: GameState, label: string): void {
  for (const [key, value] of Object.entries(state.metrics)) {
    check(value >= 0 && value <= 100, `${label}: metric ${key} out of range (${value})`);
  }
}

/** Random policy: picks any available action. A floor for chaos-resistance. */
function runRandom(role: RoleId, seed: number): GameState {
  let state = createInitialState(role, seed);
  // Simple LCG for policy decisions, separate from the engine RNG.
  let pick = seed * 7 + 1;
  const next = () => {
    pick = (pick * 1103515245 + 12345) & 0x7fffffff;
    return pick / 0x7fffffff;
  };

  let guard = 0;
  while (state.status === 'active' && guard++ < 300) {
    const available = ACTIONS.filter((a) => getActionAvailability(state, a).available);
    check(available.length > 0, `no available actions at week ${state.week}`);
    if (available.length === 0) break;
    const action = available[Math.floor(next() * available.length)];
    state = advanceTurn(state, action.id);
    const pending = getPendingEvent(state);
    if (pending && pending.choices) {
      const choice = pending.choices[Math.floor(next() * pending.choices.length)];
      state = resolvePendingEvent(state, pending.id, choice.id);
    }
    assertClamped(state, `random ${role}/${seed} week ${state.week}`);
  }
  return state;
}

/** Greedy policy: always shores up the weakest metric. A competent-player proxy. */
function runGreedy(role: RoleId, seed: number): GameState {
  let state = createInitialState(role, seed);
  let guard = 0;
  while (state.status === 'active' && guard++ < 300) {
    const available = ACTIONS.filter((a) => getActionAvailability(state, a).available);
    let best = available[0];
    let bestScore = -Infinity;
    for (const a of available) {
      let score = 0;
      for (const [k, v] of Object.entries(a.metricEffects)) {
        const cur = state.metrics[k as keyof typeof state.metrics];
        const bad = k === 'alignmentPressure' || k === 'mentalLoad';
        const need = bad ? cur : 100 - cur;
        const gain = bad ? -(v ?? 0) : (v ?? 0);
        score += gain * (need / 100 + (cur < 35 && !bad ? 1.5 : 0) + (bad && cur > 65 ? 1.5 : 0));
      }
      if (score > bestScore) {
        bestScore = score;
        best = a;
      }
    }
    state = advanceTurn(state, best.id);
    const pending = getPendingEvent(state);
    if (pending && pending.choices) {
      state = resolvePendingEvent(state, pending.id, pending.choices[0].id);
    }
  }
  return state;
}

// --- 1 & 2: random-policy campaigns terminate, metrics stay clamped ----------
console.log('Random-policy campaigns (all roles, 4 seeds each):');
const endingCounts = new Map<string, number>();
for (const role of ROLES) {
  for (let s = 1; s <= 4; s++) {
    const final = runRandom(role, s * 1000 + ROLES.indexOf(role));
    check(final.status === 'ended' && final.ending !== null, `${role}/${s}: no ending reached`);
    const id = final.ending?.endingId ?? 'none';
    endingCounts.set(id, (endingCounts.get(id) ?? 0) + 1);
    console.log(`  ${role} seed=${s} → week ${final.week}, ${id}${final.ending?.early ? ' (early)' : ''}`);
  }
}
console.log('  ending distribution:', Object.fromEntries(endingCounts));

// --- 3: determinism ----------------------------------------------------------
const a = runRandom('policy-strategist', 42);
const b = runRandom('policy-strategist', 42);
const deterministic =
  JSON.stringify(a.metrics) === JSON.stringify(b.metrics) &&
  a.timeline.length === b.timeline.length &&
  a.ending?.endingId === b.ending?.endingId &&
  a.week === b.week;
check(deterministic, 'same seed + same inputs produced different outcomes');
console.log(`\nDeterminism (seed 42, replayed twice): ${deterministic ? 'OK' : 'BROKEN'}`);

// --- 4: playability floor ----------------------------------------------------
console.log('\nGreedy-policy campaigns (competent player proxy):');
let fullRuns = 0;
let total = 0;
for (const role of ROLES) {
  for (let s = 1; s <= 4; s++) {
    total++;
    const final = runGreedy(role, s * 313 + ROLES.indexOf(role));
    if (!final.ending?.early) fullRuns++;
    console.log(
      `  ${role} seed=${s} → week ${final.week}, ${final.ending?.endingId}${final.ending?.early ? ' (early)' : ''}`,
    );
  }
}
console.log(`  reached week 104: ${fullRuns}/${total}`);
check(fullRuns >= total / 2, `greedy policy survives too rarely (${fullRuns}/${total}) — balance regression`);

// ------------------------------------------------------------------------------
if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED`);
  process.exit(1);
}
console.log('\nALL SIM CHECKS PASSED');
