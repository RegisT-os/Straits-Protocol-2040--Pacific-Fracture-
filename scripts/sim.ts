// Headless campaign simulator — the engine's verification harness.
//
// Run with: npm run sim
//
// Checks:
//  1. Full campaigns terminate with an ending for every role × difficulty.
//  2. All metrics stay clamped to 0..100 throughout.
//  3. The same seed + same inputs reproduce the identical outcome (determinism),
//     including multi-action turns.
//  4. Scheduled effects (delayed consequences) resolve without crashing and
//     land in the timeline.
//  5. A competent "greedy" policy using all action slots can survive to
//     week 104 (playability floor per difficulty).
//
// Exits non-zero on any failure so it can gate CI later.

import { createInitialState } from '../src/game/data/initialState';
import { ACTIONS } from '../src/game/data/actions';
import { getActionAvailability, getActionSlots } from '../src/game/engine/actionEngine';
import { advanceTurn, resolvePendingEvent } from '../src/game/engine/turnEngine';
import { getPendingEvent } from '../src/game/engine/eventEngine';
import type { DifficultyId, GameState, RoleId } from '../src/game/types/gameTypes';

const ROLES: RoleId[] = [
  'security-consultant',
  'policy-strategist',
  'intelligence-officer',
  'finance-operator',
  'military-liaison',
];

const DIFFICULTIES: DifficultyId[] = ['analyst', 'adviser', 'crisis-chair'];

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

/** Random policy: fills all slots with random available actions. */
function runRandom(role: RoleId, seed: number, difficulty: DifficultyId): GameState {
  let state = createInitialState(role, seed, difficulty);
  let pick = seed * 7 + 1;
  const next = () => {
    pick = (pick * 1103515245 + 12345) & 0x7fffffff;
    return pick / 0x7fffffff;
  };

  let guard = 0;
  while (state.status === 'active' && guard++ < 300) {
    const slots = getActionSlots(state);
    const available = ACTIONS.filter((a) => getActionAvailability(state, a).available);
    check(available.length > 0, `no available actions at week ${state.week}`);
    if (available.length === 0) break;
    const chosen: string[] = [];
    for (let i = 0; i < slots; i++) {
      const candidates = available.filter((a) => !chosen.includes(a.id));
      if (candidates.length === 0) break;
      chosen.push(candidates[Math.floor(next() * candidates.length)].id);
    }
    state = advanceTurn(state, chosen);
    const pending = getPendingEvent(state);
    if (pending && pending.choices) {
      const choice = pending.choices[Math.floor(next() * pending.choices.length)];
      state = resolvePendingEvent(state, pending.id, choice.id);
    }
    assertClamped(state, `random ${role}/${difficulty}/${seed} week ${state.week}`);
  }
  return state;
}

/** Greedy policy: fills all slots, always shoring up the weakest metrics. */
function runGreedy(role: RoleId, seed: number, difficulty: DifficultyId): GameState {
  let state = createInitialState(role, seed, difficulty);
  let guard = 0;
  while (state.status === 'active' && guard++ < 300) {
    const slots = getActionSlots(state);
    const available = ACTIONS.filter((a) => getActionAvailability(state, a).available);
    const scored = available
      .map((a) => {
        let score = 0;
        for (const [k, v] of Object.entries(a.metricEffects)) {
          const cur = state.metrics[k as keyof typeof state.metrics];
          const bad = k === 'alignmentPressure' || k === 'mentalLoad';
          const need = bad ? cur : 100 - cur;
          const gain = bad ? -(v ?? 0) : (v ?? 0);
          score += gain * (need / 100 + (cur < 35 && !bad ? 1.5 : 0) + (bad && cur > 65 ? 1.5 : 0));
        }
        return { id: a.id, score };
      })
      .sort((x, y) => y.score - x.score);
    state = advanceTurn(state, scored.slice(0, slots).map((s) => s.id));
    const pending = getPendingEvent(state);
    if (pending && pending.choices) {
      state = resolvePendingEvent(state, pending.id, pending.choices[0].id);
    }
  }
  return state;
}

// --- 1 & 2: campaigns terminate cleanly on every difficulty -------------------
console.log('Random-policy campaigns (all roles × all difficulties, 2 seeds each):');
const endingCounts = new Map<string, number>();
for (const difficulty of DIFFICULTIES) {
  for (const role of ROLES) {
    for (let s = 1; s <= 2; s++) {
      const final = runRandom(role, s * 1000 + ROLES.indexOf(role), difficulty);
      check(
        final.status === 'ended' && final.ending !== null,
        `${role}/${difficulty}/${s}: no ending reached`,
      );
      const id = final.ending?.endingId ?? 'none';
      endingCounts.set(id, (endingCounts.get(id) ?? 0) + 1);
      console.log(
        `  ${difficulty} ${role} seed=${s} → week ${final.week}, ${id}${final.ending?.early ? ' (early)' : ''}`,
      );
    }
  }
}
console.log('  ending distribution:', Object.fromEntries(endingCounts));

// --- 3: determinism with multi-action turns -----------------------------------
const a = runRandom('policy-strategist', 42, 'adviser');
const b = runRandom('policy-strategist', 42, 'adviser');
const deterministic =
  JSON.stringify(a.metrics) === JSON.stringify(b.metrics) &&
  a.timeline.length === b.timeline.length &&
  a.ending?.endingId === b.ending?.endingId &&
  a.week === b.week;
check(deterministic, 'same seed + same inputs produced different outcomes');
console.log(`\nDeterminism (seed 42, replayed twice): ${deterministic ? 'OK' : 'BROKEN'}`);

// --- 4: scheduled effects resolve without crashing ----------------------------
// Scripted run: take actions with delayed consequences, then idle past their
// due weeks and verify they resolved into the timeline.
{
  let state = createInitialState('policy-strategist', 7, 'adviser');
  state = advanceTurn(state, ['condemn-russia']);
  let pending = getPendingEvent(state);
  if (pending?.choices) state = resolvePendingEvent(state, pending.id, pending.choices[0].id);
  state = advanceTurn(state, ['public-reality-campaign']);
  pending = getPendingEvent(state);
  if (pending?.choices) state = resolvePendingEvent(state, pending.id, pending.choices[0].id);
  check(state.scheduledEffects.length >= 2, 'actions with schedules did not queue effects');
  const queued = state.scheduledEffects.length;
  for (let i = 0; i < 8 && state.status === 'active'; i++) {
    state = advanceTurn(state, ['stabilize-routine']);
    const p = getPendingEvent(state);
    if (p?.choices) state = resolvePendingEvent(state, p.id, p.choices[0].id);
  }
  const announced = state.timeline.filter((t) => t.type === 'scheduled');
  const resolved = announced.filter((t) => !t.title.startsWith('Consequence set in motion'));
  check(resolved.length >= 1, 'no scheduled effect resolved into the timeline');
  assertClamped(state, 'scheduled-effects scripted run');
  console.log(
    `\nScheduled effects: ${queued} queued, ${resolved.length} resolved by week ${state.week} — OK`,
  );
}

// --- 5: playability floor per difficulty --------------------------------------
console.log('\nGreedy-policy campaigns (competent player proxy):');
const floor: Record<DifficultyId, { full: number; total: number }> = {
  analyst: { full: 0, total: 0 },
  adviser: { full: 0, total: 0 },
  'crisis-chair': { full: 0, total: 0 },
};
for (const difficulty of DIFFICULTIES) {
  for (const role of ROLES) {
    for (let s = 1; s <= 3; s++) {
      const final = runGreedy(role, s * 313 + ROLES.indexOf(role), difficulty);
      floor[difficulty].total++;
      if (!final.ending?.early) floor[difficulty].full++;
      console.log(
        `  ${difficulty} ${role} seed=${s} → week ${final.week}, ${final.ending?.endingId}${final.ending?.early ? ' (early)' : ''}`,
      );
    }
  }
}
for (const difficulty of DIFFICULTIES) {
  const { full, total } = floor[difficulty];
  console.log(`  ${difficulty}: reached week 104 in ${full}/${total} runs`);
}
check(
  floor.analyst.full >= floor.analyst.total * 0.7,
  `Analyst too hard: greedy reached 104 only ${floor.analyst.full}/${floor.analyst.total}`,
);
check(
  floor.adviser.full >= floor.adviser.total * 0.5,
  `Adviser too hard: greedy reached 104 only ${floor.adviser.full}/${floor.adviser.total}`,
);
check(
  floor['crisis-chair'].full >= 1,
  'Crisis Chair is instant death: greedy never reached week 104',
);

// ------------------------------------------------------------------------------
if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED`);
  process.exit(1);
}
console.log('\nALL SIM CHECKS PASSED');
