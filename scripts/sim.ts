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
import { ACTORS } from '../src/game/data/actors';
import { EVENTS } from '../src/game/data/events';
import { INCIDENTS } from '../src/game/data/incidents';
import { MAP_NODES } from '../src/game/data/mapNodes';
import { PRESSURE_CAMPAIGNS } from '../src/game/data/pressureCampaigns';
import { WAR_FRONTS } from '../src/game/data/warFronts';
import { getActionAvailability, getActionSlots } from '../src/game/engine/actionEngine';
import { addIncidents, applyNodeDelta, tickMap } from '../src/game/engine/mapEngine';
import {
  disruptPressureCampaignsForAction,
  startPressureCampaigns,
  tickPressureCampaigns,
} from '../src/game/engine/pressureCampaignEngine';
import {
  WAR_FRONT_CAMPAIGN_HOOKS,
  applyWarFrontEffects,
  deriveWarFrontStatus,
  tickWarFronts,
} from '../src/game/engine/warFrontEngine';
import { Rng } from '../src/game/engine/rng';
import {
  advanceTurn,
  resolvePendingEvent,
  setActionTarget,
  togglePendingAction,
} from '../src/game/engine/turnEngine';
import { getPendingEvent } from '../src/game/engine/eventEngine';
import { migrateState } from '../src/game/engine/saveEngine';
import type {
  ActionDef,
  AiMoveDef,
  DifficultyId,
  EventChoice,
  EventDef,
  GameState,
  IncidentSpawnDef,
  MapNodeId,
  NodeEffectDef,
  PressureCampaignStartDef,
  PressureCampaignTemplateId,
  RoleId,
  WarFrontEffect,
  WarFrontId,
} from '../src/game/types/gameTypes';

const ROLES: RoleId[] = [
  'security-consultant',
  'policy-strategist',
  'intelligence-officer',
  'finance-operator',
  'military-liaison',
];

const DIFFICULTIES: DifficultyId[] = ['analyst', 'adviser', 'crisis-chair'];

interface RunResult {
  difficulty: DifficultyId;
  role: RoleId;
  final: GameState;
}

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
  for (const def of MAP_NODES) {
    const node = state.map.nodes[def.id];
    check(node !== undefined, `${label}: map node ${def.id} missing`);
    if (!node) continue;
    for (const key of ['stability', 'riskLevel', 'cyberExposure'] as const) {
      check(node[key] >= 0 && node[key] <= 100, `${label}: node ${def.id}.${key} out of range (${node[key]})`);
    }
  }
  for (const campaign of state.activePressureCampaigns) {
    check(
      campaign.intensity >= 0 && campaign.intensity <= 4,
      `${label}: campaign ${campaign.id} intensity out of range (${campaign.intensity})`,
    );
    check(
      campaign.currentWeek >= 0 && campaign.currentWeek <= campaign.durationWeeks,
      `${label}: campaign ${campaign.id} week out of range (${campaign.currentWeek}/${campaign.durationWeeks})`,
    );
  }
  for (const front of Object.values(state.warFronts)) {
    check(
      front.intensity >= 0 && front.intensity <= 100,
      `${label}: front ${front.id} intensity out of range (${front.intensity})`,
    );
    check(
      front.momentum >= -100 && front.momentum <= 100,
      `${label}: front ${front.id} momentum out of range (${front.momentum})`,
    );
    check(
      front.escalationLevel >= 1 && front.escalationLevel <= 5,
      `${label}: front ${front.id} escalation out of range (${front.escalationLevel})`,
    );
    check(
      front.status === deriveWarFrontStatus(front.intensity),
      `${label}: front ${front.id} status does not match intensity`,
    );
  }
}

const NODE_IDS = new Set<MapNodeId>(MAP_NODES.map((node) => node.id));
const INCIDENT_IDS = new Set(INCIDENTS.map((incident) => incident.id));
const PRESSURE_CAMPAIGN_IDS = new Set(PRESSURE_CAMPAIGNS.map((campaign) => campaign.id));
const WAR_FRONT_IDS = new Set<WarFrontId>(WAR_FRONTS.map((front) => front.id));

function checkNodeEffects(label: string, effects: NodeEffectDef[] | undefined): void {
  for (const effect of effects ?? []) {
    check(NODE_IDS.has(effect.nodeId), `${label}: invalid node effect target ${effect.nodeId}`);
  }
}

function checkIncidentSpawns(label: string, spawns: IncidentSpawnDef[] | undefined): void {
  for (const spawn of spawns ?? []) {
    check(INCIDENT_IDS.has(spawn.incidentId), `${label}: invalid incident id ${spawn.incidentId}`);
    check(NODE_IDS.has(spawn.nodeId), `${label}: invalid incident node ${spawn.nodeId}`);
  }
}

function checkPressureCampaignStarts(label: string, starts: PressureCampaignStartDef[] | undefined): void {
  for (const start of starts ?? []) {
    check(
      PRESSURE_CAMPAIGN_IDS.has(start.templateId),
      `${label}: invalid pressure campaign ${start.templateId}`,
    );
  }
}

function checkWarFrontEffects(label: string, effects: WarFrontEffect[] | undefined): void {
  for (const effect of effects ?? []) {
    check(WAR_FRONT_IDS.has(effect.frontId), `${label}: invalid war front ${effect.frontId}`);
  }
}

function validateActionMapRefs(action: ActionDef): void {
  checkNodeEffects(`action ${action.id}`, action.nodeEffects);
  checkIncidentSpawns(`action ${action.id}`, action.incidents);
  checkWarFrontEffects(`action ${action.id}`, action.warFrontEffects);
  if (action.targeting) {
    check(action.targeting.nodeIds.length > 0, `action ${action.id}: targeting has no node options`);
    for (const nodeId of action.targeting.nodeIds) {
      check(NODE_IDS.has(nodeId), `action ${action.id}: invalid targeting node ${nodeId}`);
    }
  }
}

function validateMoveMapRefs(actorId: string, move: AiMoveDef): void {
  checkNodeEffects(`actor ${actorId} move ${move.id}`, move.nodeEffects);
  checkIncidentSpawns(`actor ${actorId} move ${move.id}`, move.incidents);
  checkPressureCampaignStarts(`actor ${actorId} move ${move.id}`, move.pressureCampaigns);
  checkWarFrontEffects(`actor ${actorId} move ${move.id}`, move.warFrontEffects);
}

function validateChoiceMapRefs(eventId: string, choice: EventChoice): void {
  checkNodeEffects(`event ${eventId} choice ${choice.id}`, choice.nodeEffects);
  checkIncidentSpawns(`event ${eventId} choice ${choice.id}`, choice.incidents);
  checkPressureCampaignStarts(`event ${eventId} choice ${choice.id}`, choice.pressureCampaigns);
  checkWarFrontEffects(`event ${eventId} choice ${choice.id}`, choice.warFrontEffects);
}

function validateEventMapRefs(event: EventDef): void {
  checkNodeEffects(`event ${event.id}`, event.nodeEffects);
  checkIncidentSpawns(`event ${event.id}`, event.incidents);
  checkPressureCampaignStarts(`event ${event.id}`, event.pressureCampaigns);
  checkWarFrontEffects(`event ${event.id}`, event.warFrontEffects);
  for (const choice of event.choices ?? []) validateChoiceMapRefs(event.id, choice);
}

function validateDataReferences(): void {
  check(NODE_IDS.size === MAP_NODES.length, 'duplicate map node ids');
  check(INCIDENT_IDS.size === INCIDENTS.length, 'duplicate incident ids');
  for (const node of MAP_NODES) {
    for (const connected of node.connectedNodes) {
      check(NODE_IDS.has(connected), `node ${node.id}: invalid connected node ${connected}`);
    }
  }
  for (const incident of INCIDENTS) {
    check(incident.duration > 0, `incident ${incident.id}: duration must be positive`);
  }
  for (const campaign of PRESSURE_CAMPAIGNS) {
    check(campaign.durationWeeks > 0, `pressure campaign ${campaign.id}: duration must be positive`);
    check(campaign.intensity > 0 && campaign.intensity <= 4, `pressure campaign ${campaign.id}: invalid intensity`);
    check(
      ACTORS.some((actor) => actor.id === campaign.actorId),
      `pressure campaign ${campaign.id}: invalid actor ${campaign.actorId}`,
    );
    for (const nodeId of campaign.targetNodeIds) {
      check(NODE_IDS.has(nodeId), `pressure campaign ${campaign.id}: invalid target node ${nodeId}`);
    }
    check(campaign.counterActionTags.length > 0, `pressure campaign ${campaign.id}: missing counter tags`);
    checkNodeEffects(`pressure campaign ${campaign.id} completion`, campaign.completionEffects.nodeEffects);
    checkNodeEffects(`pressure campaign ${campaign.id} disruption`, campaign.disruptionEffects.nodeEffects);
  }
  check(WAR_FRONT_IDS.size === WAR_FRONTS.length, 'duplicate war front ids');
  for (const front of WAR_FRONTS) {
    check(front.intensity >= 0 && front.intensity <= 100, `war front ${front.id}: invalid intensity`);
    check(front.momentum >= -100 && front.momentum <= 100, `war front ${front.id}: invalid momentum`);
    check(front.escalationLevel >= 1 && front.escalationLevel <= 5, `war front ${front.id}: invalid escalation`);
    for (const actorId of front.linkedActors) {
      check(ACTORS.some((actor) => actor.id === actorId), `war front ${front.id}: invalid actor ${actorId}`);
    }
    for (const nodeId of front.linkedMapNodes) {
      check(NODE_IDS.has(nodeId), `war front ${front.id}: invalid linked node ${nodeId}`);
    }
  }
  for (const hook of WAR_FRONT_CAMPAIGN_HOOKS) {
    check(WAR_FRONT_IDS.has(hook.frontId), `war front campaign hook: invalid front ${hook.frontId}`);
    check(
      PRESSURE_CAMPAIGN_IDS.has(hook.templateId),
      `war front campaign hook: invalid pressure campaign ${hook.templateId}`,
    );
    check(hook.threshold >= 0 && hook.threshold <= 100, `war front campaign hook ${hook.templateId}: invalid threshold`);
  }
  for (const action of ACTIONS) validateActionMapRefs(action);
  for (const actor of ACTORS) {
    for (const move of actor.moves) validateMoveMapRefs(actor.id, move);
  }
  for (const event of EVENTS) validateEventMapRefs(event);
}

/** Fill required targets for a set of chosen actions (first option). */
function targetsFor(actionIds: string[]): Record<string, MapNodeId> {
  const targets: Record<string, MapNodeId> = {};
  for (const id of actionIds) {
    const action = ACTIONS.find((a) => a.id === id);
    if (action?.targeting) targets[id] = action.targeting.nodeIds[0];
  }
  return targets;
}

function expectCampaignCounter(templateId: PressureCampaignTemplateId, actionId: string): void {
  const action = ACTIONS.find((candidate) => candidate.id === actionId);
  check(action !== undefined, `expected counter action ${actionId}`);
  if (!action) return;

  const state = createInitialState('security-consultant', 9001, 'adviser');
  startPressureCampaigns(state, [{ templateId, intensity: 3 }], 'counter-test');
  const campaign = state.activePressureCampaigns[0];
  const before = campaign.intensity;
  disruptPressureCampaignsForAction(state, action);

  check(
    campaign.status === 'disrupted' || campaign.intensity < before,
    `${actionId} did not counter ${templateId}`,
  );
  check(
    state.timeline.some((entry) => entry.type === 'map' && entry.title.startsWith('Campaign disrupted')),
    `${actionId} counter did not create a campaign timeline entry`,
  );
}

function average(values: number[]): string {
  if (values.length === 0) return 'n/a';
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function campaignStartCount(state: GameState): number {
  return state.timeline.filter(
    (entry) =>
      entry.type === 'map' &&
      (entry.title.startsWith('Campaign started:') || entry.title.startsWith('War front campaign:')),
  ).length;
}

function frontDrivenCampaignStartCount(state: GameState): number {
  return state.timeline.filter((entry) => entry.type === 'map' && entry.title.startsWith('War front campaign:')).length;
}

function campaignRefreshCount(state: GameState): number {
  return state.timeline.filter(
    (entry) =>
      entry.type === 'map' &&
      (entry.title.startsWith('Campaign intensified:') || entry.title.startsWith('War front campaign refresh:')),
  ).length;
}

function reportRunDiagnostics(label: string, results: RunResult[]): void {
  console.log(`\n${label} diagnostics:`);
  for (const difficulty of DIFFICULTIES) {
    const byDifficulty = results.filter((result) => result.difficulty === difficulty);
    const early = byDifficulty.filter((result) => result.final.ending?.early);
    const campaignStarts = byDifficulty.map((result) => campaignStartCount(result.final));
    const frontCampaignStarts = byDifficulty.map((result) => frontDrivenCampaignStartCount(result.final));
    const campaignRefreshes = byDifficulty.map((result) => campaignRefreshCount(result.final));
    console.log(
      `  ${difficulty}: avg early collapse week ${average(early.map((result) => result.final.week))} (${early.length}/${byDifficulty.length} early), avg campaign starts ${average(campaignStarts)} (${average(frontCampaignStarts)} front-driven), avg campaign refreshes ${average(campaignRefreshes)}`,
    );
  }

  const escalationCounts = new Map<number, number>();
  const statusCounts = new Map<string, number>();
  for (const { final } of results) {
    for (const front of Object.values(final.warFronts)) {
      escalationCounts.set(front.escalationLevel, (escalationCounts.get(front.escalationLevel) ?? 0) + 1);
      statusCounts.set(front.status, (statusCounts.get(front.status) ?? 0) + 1);
    }
  }
  console.log('  final front escalation distribution:', Object.fromEntries(escalationCounts));
  console.log('  final front status distribution:', Object.fromEntries(statusCounts));
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
    state = advanceTurn(state, chosen, targetsFor(chosen));
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
        for (const effect of a.warFrontEffects ?? []) {
          const front = state.warFronts[effect.frontId];
          const counter = Math.max(0, -(effect.intensity ?? 0)) + Math.max(0, -(effect.momentum ?? 0)) * 0.35;
          const pressure = front.intensity / 100 + Math.max(0, front.momentum) / 80 + front.escalationLevel * 0.12;
          score += counter * pressure;
        }
        return { id: a.id, score };
      })
      .sort((x, y) => y.score - x.score);
    const chosen = scored.slice(0, slots).map((s) => s.id);
    state = advanceTurn(state, chosen, targetsFor(chosen));
    const pending = getPendingEvent(state);
    if (pending && pending.choices) {
      state = resolvePendingEvent(state, pending.id, pending.choices[0].id);
    }
  }
  return state;
}

// --- 0: v0.4 data references --------------------------------------------------
validateDataReferences();
console.log('Data references: map nodes, incidents, targeting, AI moves, and events OK');

// --- 1 & 2: campaigns terminate cleanly on every difficulty -------------------
console.log('Random-policy campaigns (all roles × all difficulties, 2 seeds each):');
const endingCounts = new Map<string, number>();
const randomResults: RunResult[] = [];
for (const difficulty of DIFFICULTIES) {
  for (const role of ROLES) {
    for (let s = 1; s <= 2; s++) {
      const final = runRandom(role, s * 1000 + ROLES.indexOf(role), difficulty);
      randomResults.push({ difficulty, role, final });
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
reportRunDiagnostics('Random policy', randomResults);

// --- 3: determinism with multi-action turns -----------------------------------
const a = runRandom('policy-strategist', 42, 'adviser');
const b = runRandom('policy-strategist', 42, 'adviser');
const deterministic =
  JSON.stringify(a.metrics) === JSON.stringify(b.metrics) &&
  JSON.stringify(a.map) === JSON.stringify(b.map) &&
  JSON.stringify(a.activePressureCampaigns) === JSON.stringify(b.activePressureCampaigns) &&
  JSON.stringify(a.warFronts) === JSON.stringify(b.warFronts) &&
  JSON.stringify(a.timeline) === JSON.stringify(b.timeline) &&
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
  state = advanceTurn(state, ['public-reality-campaign'], targetsFor(['public-reality-campaign']));
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

// --- 4a: global war fronts initialize, clamp, tick, and spill over ------------
{
  const state = createInitialState('security-consultant', 14, 'adviser');
  check(Object.keys(state.warFronts).length === WAR_FRONTS.length, 'war fronts did not initialize');
  check(deriveWarFrontStatus(10) === 'stable', 'front status threshold stable failed');
  check(deriveWarFrontStatus(40) === 'escalating', 'front status threshold escalating failed');
  check(deriveWarFrontStatus(65) === 'crisis', 'front status threshold crisis failed');
  check(deriveWarFrontStatus(90) === 'breaking', 'front status threshold breaking failed');

  applyWarFrontEffects(
    state,
    [
      { frontId: 'cyber-war-front', intensity: 999, momentum: 999, escalation: 9 },
      { frontId: 'financial-war-front', intensity: -999, momentum: -999, escalation: -9 },
    ],
    'sim',
  );
  check(state.warFronts['cyber-war-front'].intensity === 100, 'war front intensity did not clamp high');
  check(state.warFronts['cyber-war-front'].momentum === 100, 'war front momentum did not clamp high');
  check(state.warFronts['cyber-war-front'].escalationLevel === 5, 'war front escalation did not clamp high');
  check(state.warFronts['financial-war-front'].intensity === 0, 'war front intensity did not clamp low');
  check(state.warFronts['financial-war-front'].momentum === -100, 'war front momentum did not clamp low');
  check(state.warFronts['financial-war-front'].escalationLevel === 1, 'war front escalation did not clamp low');

  const tickA = createInitialState('security-consultant', 21, 'adviser');
  const tickB = createInitialState('security-consultant', 21, 'adviser');
  const rngA = new Rng(tickA.seed, tickA.rngCursor);
  const rngB = new Rng(tickB.seed, tickB.rngCursor);
  tickWarFronts(tickA, rngA);
  tickWarFronts(tickB, rngB);
  check(JSON.stringify(tickA.warFronts) === JSON.stringify(tickB.warFronts), 'war front tick was not deterministic');
  check(rngA.cursor === rngB.cursor, 'war front tick consumed different RNG cursor counts');

  const spill = createInitialState('security-consultant', 22, 'adviser');
  spill.warFronts['cyber-war-front'].intensity = 88;
  spill.warFronts['cyber-war-front'].momentum = 20;
  tickWarFronts(spill, new Rng(spill.seed, spill.rngCursor));
  const cloudCampaigns = spill.activePressureCampaigns.filter(
    (campaign) => campaign.templateId === 'threat-cloud-banking-wave',
  );
  check(cloudCampaigns.length === 1, 'high cyber front did not start cloud-banking pressure campaign');
  assertClamped(spill, 'war-front spillover');

  const pnt = createInitialState('security-consultant', 23, 'adviser');
  pnt.warFronts['orbital-war-front'].intensity = 84;
  pnt.warFronts['orbital-war-front'].momentum = 20;
  tickWarFronts(pnt, new Rng(pnt.seed, pnt.rngCursor));
  const pntCampaigns = pnt.activePressureCampaigns.filter(
    (campaign) => campaign.templateId === 'pnt-degradation-cycle',
  );
  check(pntCampaigns.length === 1, 'high orbital front did not start PNT degradation campaign');
  const firstPntIntensity = pntCampaigns[0]?.intensity ?? 0;
  pnt.week += 9;
  tickWarFronts(pnt, new Rng(pnt.seed, pnt.rngCursor));
  const refreshedPntCampaigns = pnt.activePressureCampaigns.filter(
    (campaign) => campaign.templateId === 'pnt-degradation-cycle' && campaign.status === 'active',
  );
  check(refreshedPntCampaigns.length === 1, 'orbital front stacked duplicate PNT campaigns');
  check(refreshedPntCampaigns[0]?.intensity > firstPntIntensity, 'orbital front did not refresh active PNT campaign after cooldown');
  assertClamped(pnt, 'orbital-front PNT spillover');

  console.log('\nWar fronts: init, status, clamping, deterministic tick, orbital PNT campaign, and spillover OK');
}

// --- 4b: theatre pressure campaigns start, refresh, tick, complete, disrupt ---
{
  let state = createInitialState('security-consultant', 15, 'adviser');
  startPressureCampaigns(state, [{ templateId: 'china-scs-coercion' }], 'sim');
  check(state.activePressureCampaigns.length === 1, 'pressure campaign did not start');
  const firstIntensity = state.activePressureCampaigns[0].intensity;
  startPressureCampaigns(state, [{ templateId: 'china-scs-coercion' }], 'sim-refresh');
  const activeChina = state.activePressureCampaigns.filter(
    (campaign) => campaign.templateId === 'china-scs-coercion' && campaign.status === 'active',
  );
  check(activeChina.length === 1, 'duplicate pressure campaign stacked instead of refreshing');
  check(activeChina[0].intensity > firstIntensity, 'duplicate pressure campaign did not intensify');

  for (let i = 0; i < activeChina[0].durationWeeks; i++) {
    tickPressureCampaigns(state);
    assertClamped(state, `campaign tick ${i}`);
  }
  check(
    state.activePressureCampaigns[0].status === 'completed',
    'pressure campaign did not complete after its duration',
  );

  state = createInitialState('security-consultant', 16, 'adviser');
  startPressureCampaigns(state, [{ templateId: 'threat-cloud-banking-wave', intensity: 2 }], 'sim');
  const certAction = ACTIONS.find((action) => action.id === 'coordinate-asean-cert');
  check(certAction !== undefined, 'expected ASEAN CERT action for campaign disruption');
  if (certAction) disruptPressureCampaignsForAction(state, certAction);
  check(
    state.activePressureCampaigns[0].status === 'disrupted',
    'matching counter action did not disrupt cloud-banking campaign',
  );
  assertClamped(state, 'campaign disruption');

  const zeroTick = createInitialState('security-consultant', 17, 'adviser');
  startPressureCampaigns(zeroTick, [{ templateId: 'markets-capital-flight', intensity: 1 }], 'sim');
  zeroTick.activePressureCampaigns[0].intensity = 0;
  tickPressureCampaigns(zeroTick);
  check(
    zeroTick.activePressureCampaigns[0].status === 'disrupted' &&
      zeroTick.activePressureCampaigns[0].currentWeek === 0,
    'zero-intensity active campaign ticked instead of becoming disrupted',
  );

  const pntRefresh = createInitialState('security-consultant', 18, 'adviser');
  startPressureCampaigns(pntRefresh, [{ templateId: 'pnt-degradation-cycle', intensity: 1 }], 'sim');
  const firstPntIntensity = pntRefresh.activePressureCampaigns[0].intensity;
  startPressureCampaigns(pntRefresh, [{ templateId: 'pnt-degradation-cycle', intensity: 1 }], 'sim-refresh');
  const activePnt = pntRefresh.activePressureCampaigns.filter(
    (campaign) => campaign.templateId === 'pnt-degradation-cycle' && campaign.status === 'active',
  );
  check(activePnt.length === 1, 'PNT degradation campaign stacked instead of refreshing');
  check(activePnt[0].intensity > firstPntIntensity, 'PNT degradation campaign did not refresh intensity');

  const counterPairs: [PressureCampaignTemplateId, string][] = [
    ['china-scs-coercion', 'deploy-drone-patrols'],
    ['china-scs-coercion', 'quiet-asean-backchannel'],
    ['china-scs-coercion', 'request-us-orbital'],
    ['markets-capital-flight', 'bnm-confidence-briefing'],
    ['markets-capital-flight', 'singapore-continuity-channel'],
    ['threat-cloud-banking-wave', 'coordinate-asean-cert'],
    ['threat-cloud-banking-wave', 'national-cyber-shield'],
    ['russia-grey-zone-cyber', 'public-reality-campaign'],
    ['russia-grey-zone-cyber', 'strict-neutrality'],
    ['russia-grey-zone-cyber', 'engage-europe'],
    ['singapore-continuity-hedge', 'singapore-continuity-channel'],
    ['singapore-continuity-hedge', 'quiet-asean-backchannel'],
    ['europe-sanctions-track', 'strict-neutrality'],
    ['europe-sanctions-track', 'engage-europe'],
    ['europe-sanctions-track', 'quiet-asean-backchannel'],
    ['pnt-degradation-cycle', 'activate-terrestrial-navigation-backup'],
    ['pnt-degradation-cycle', 'harden-financial-timing-backup'],
    ['pnt-degradation-cycle', 'lease-allied-orbital-coverage'],
    ['pnt-degradation-cycle', 'national-cyber-shield'],
    ['pnt-degradation-cycle', 'deploy-drone-patrols'],
  ];
  for (const [templateId, actionId] of counterPairs) {
    expectCampaignCounter(templateId, actionId);
  }

  console.log('\nPressure campaigns: start, refresh, completion, disruption, counterplay, and clamping OK');
}

// --- 4c: map incidents fire, targeted actions work, migration restores map ----
{
  const clampState = createInitialState('security-consultant', 10, 'adviser');
  applyNodeDelta(clampState, 'port-klang', {
    stability: 1000,
    riskLevel: -1000,
    cyberExposure: 1000,
  });
  check(clampState.map.nodes['port-klang'].stability === 100, 'node stability did not clamp high');
  check(clampState.map.nodes['port-klang'].riskLevel === 0, 'node risk did not clamp low');
  check(clampState.map.nodes['port-klang'].cyberExposure === 100, 'node cyber exposure did not clamp high');

  const incidentState = createInitialState('security-consultant', 10, 'adviser');
  addIncidents(
    incidentState,
    [{ incidentId: 'gps-spoofing-malacca', nodeId: 'malacca-strait' }],
    'sim',
  );
  const onsetRisk = incidentState.map.nodes['malacca-strait'].riskLevel;
  addIncidents(
    incidentState,
    [{ incidentId: 'gps-spoofing-malacca', nodeId: 'malacca-strait' }],
    'sim-refresh',
  );
  check(incidentState.map.nodes['malacca-strait'].activeIncidents.length === 1, 'incident refresh stacked duplicate instances');
  check(incidentState.map.nodes['malacca-strait'].riskLevel === onsetRisk, 'incident refresh re-applied onset effects');
  const expiresWeek = incidentState.map.nodes['malacca-strait'].activeIncidents[0].expiresWeek;
  incidentState.week = expiresWeek - 2;
  tickMap(incidentState);
  incidentState.week = expiresWeek - 1;
  tickMap(incidentState);
  const riskBeforeExpiry = incidentState.map.nodes['malacca-strait'].riskLevel;
  incidentState.week = expiresWeek;
  tickMap(incidentState);
  check(incidentState.map.nodes['malacca-strait'].activeIncidents.length === 0, 'incident did not expire on schedule');
  check(incidentState.map.nodes['malacca-strait'].riskLevel <= riskBeforeExpiry, 'incident applied weekly effect on expiry week');

  let selection = createInitialState('security-consultant', 12, 'adviser');
  selection.pendingTargets['coordinate-asean-cert'] = 'digital-id';
  selection = togglePendingAction(selection, 'coordinate-asean-cert');
  check(selection.pendingActions.includes('coordinate-asean-cert'), 'targeted action was not selected');
  check(selection.pendingTargets['coordinate-asean-cert'] === undefined, 'stale multi-target value survived selection');
  selection = setActionTarget(selection, 'coordinate-asean-cert', 'bnm-core');
  check(selection.pendingTargets['coordinate-asean-cert'] === 'bnm-core', 'valid selected target was not saved');
  selection = togglePendingAction(selection, 'coordinate-asean-cert');
  check(!selection.pendingActions.includes('coordinate-asean-cert'), 'targeted action was not deselected');
  check(selection.pendingTargets['coordinate-asean-cert'] === undefined, 'target value survived deselection');

  let multi = createInitialState('security-consultant', 13, 'adviser');
  multi = togglePendingAction(multi, 'harden-port-klang');
  multi = togglePendingAction(multi, 'public-reality-campaign');
  check(multi.pendingTargets['harden-port-klang'] === 'port-klang', 'single-option target was not auto-assigned');
  check(multi.pendingTargets['public-reality-campaign'] === undefined, 'multi-option target should wait for selection');
  multi = setActionTarget(multi, 'public-reality-campaign', 'putrajaya');
  multi = advanceTurn(multi, multi.pendingActions);
  check(
    multi.timeline.some((t) => t.type === 'map' && t.title.includes('Port Klang')),
    'first targeted action in a multi-action turn did not apply',
  );
  check(
    multi.timeline.some((t) => t.type === 'map' && t.title.includes('Putrajaya')),
    'second targeted action in a multi-action turn did not apply',
  );

  let state = createInitialState('military-liaison', 11, 'adviser');
  // Targeted action via engine path (greedy policy also exercises this).
  state = advanceTurn(state, ['deploy-drone-patrols'], { 'deploy-drone-patrols': 'malaysian-eez' });
  let p = getPendingEvent(state);
  if (p?.choices) state = resolvePendingEvent(state, p.id, p.choices[0].id);
  const targeted = state.timeline.some((t) => t.type === 'map' && t.title.includes('Malaysian EEZ'));
  check(targeted, 'targeted action did not produce a map timeline entry');

  // Run 30 weeks and confirm incidents appear and expire without crashing.
  for (let i = 0; i < 30 && state.status === 'active'; i++) {
    state = advanceTurn(state, ['monitor-situation']);
    p = getPendingEvent(state);
    if (p?.choices) state = resolvePendingEvent(state, p.id, p.choices[0].id);
  }
  const incidentEntries = state.timeline.filter((t) => t.type === 'map' && t.title.startsWith('Incident'));
  check(incidentEntries.length >= 1, 'no map incidents fired in 30 weeks');
  assertClamped(state, 'map scripted run');

  // Save-migration path: a v2 save (no map/front fields) must come back repaired.
  const v2 = structuredClone(state) as Partial<GameState>;
  delete v2.map;
  delete v2.selectedNode;
  delete v2.pendingTargets;
  delete v2.activePressureCampaigns;
  delete v2.warFronts;
  const migrated = migrateState(v2 as GameState, 2);
  check(migrated.map !== undefined && migrated.map.nodes['port-klang'] !== undefined, 'v2 migration did not initialize map state');
  check(migrated.pendingTargets !== undefined && migrated.selectedNode === null, 'v2 migration did not initialize target/selection fields');
  check(migrated.activePressureCampaigns.length === 0, 'v2 migration did not initialize pressure campaigns');
  check(Object.keys(migrated.warFronts).length === WAR_FRONTS.length, 'v2 migration did not initialize war fronts');

  const v1 = structuredClone(state) as Partial<GameState>;
  delete v1.difficulty;
  delete v1.pendingActions;
  delete v1.scheduledEffects;
  delete v1.lastEventWeek;
  delete v1.map;
  delete v1.selectedNode;
  delete v1.pendingTargets;
  delete v1.activePressureCampaigns;
  delete v1.warFronts;
  const migratedV1 = migrateState(v1 as GameState, 1);
  check(migratedV1.difficulty === 'adviser', 'v1 migration did not default difficulty');
  check(migratedV1.map.nodes['port-klang'] !== undefined, 'v1 migration did not initialize map state');
  check(Array.isArray(migratedV1.pendingActions), 'v1 migration did not initialize pending actions');
  check(Array.isArray(migratedV1.activePressureCampaigns), 'v1 migration did not initialize pressure campaigns');
  check(Object.keys(migratedV1.warFronts).length === WAR_FRONTS.length, 'v1 migration did not initialize war fronts');

  const corruptV3 = structuredClone(state) as GameState;
  delete (corruptV3.map.nodes as Partial<Record<MapNodeId, unknown>>)['port-klang'];
  corruptV3.map.nodes['malacca-strait'].riskLevel = 999;
  corruptV3.selectedNode = 'not-a-node' as MapNodeId;
  corruptV3.pendingActions = ['public-reality-campaign', 'missing-action'];
  corruptV3.pendingTargets = { 'public-reality-campaign': 'not-a-node' as MapNodeId };
  const repaired = migrateState(corruptV3, 3);
  check(repaired.map.nodes['port-klang'] !== undefined, 'v3 repair did not restore missing map node');
  check(repaired.map.nodes['malacca-strait'].riskLevel === 100, 'v3 repair did not clamp corrupt node value');
  check(repaired.selectedNode === null, 'v3 repair did not clear invalid selected node');
  check(repaired.pendingActions.length === 1, 'v3 repair did not prune invalid pending actions');
  check(repaired.pendingTargets['public-reality-campaign'] === undefined, 'v3 repair did not clear invalid pending target');

  const corruptV4 = structuredClone(state) as GameState;
  corruptV4.activePressureCampaigns = [
    {
      id: 'bad-but-known',
      templateId: 'china-scs-coercion',
      actorId: 'china-frag',
      title: 'Bad Save Campaign',
      description: 'bad',
      theatre: 'south-china-sea',
      targetNodeIds: ['not-a-node' as MapNodeId],
      startedWeek: state.week,
      durationWeeks: 2,
      currentWeek: 99,
      intensity: 99,
      status: 'active',
      tags: [],
      counterActionTags: [],
      weeklyNodeEffects: {},
      weeklyMetricEffects: {},
      completionEffects: {},
      disruptionEffects: {},
    },
    {
      id: 'unknown-template',
      templateId: 'missing-template' as typeof corruptV4.activePressureCampaigns[number]['templateId'],
      actorId: 'china-frag',
      title: 'Unknown',
      description: 'unknown',
      theatre: 'south-china-sea',
      targetNodeIds: ['malaysian-eez'],
      startedWeek: state.week,
      durationWeeks: 1,
      currentWeek: 0,
      intensity: 1,
      status: 'active',
      tags: [],
      counterActionTags: [],
      weeklyNodeEffects: {},
      weeklyMetricEffects: {},
      completionEffects: {},
      disruptionEffects: {},
    },
    {
      id: 'zero-active',
      templateId: 'markets-capital-flight',
      actorId: 'financial-markets',
      title: 'Zero Intensity',
      description: 'zero',
      theatre: 'cyber-financial',
      targetNodeIds: ['bnm-core'],
      startedWeek: state.week,
      durationWeeks: 4,
      currentWeek: 1,
      intensity: 0,
      status: 'active',
      tags: [],
      counterActionTags: [],
      weeklyNodeEffects: {},
      weeklyMetricEffects: {},
      completionEffects: {},
      disruptionEffects: {},
    },
  ];
  const repairedV4 = migrateState(corruptV4, 4);
  const clampedCampaign = repairedV4.activePressureCampaigns.find((campaign) => campaign.id === 'bad-but-known');
  const zeroCampaign = repairedV4.activePressureCampaigns.find((campaign) => campaign.id === 'zero-active');
  check(repairedV4.activePressureCampaigns.length === 2, 'v4 repair did not prune unknown pressure campaign');
  check(clampedCampaign?.intensity === 4, 'v4 repair did not clamp pressure campaign intensity');
  check(clampedCampaign?.currentWeek === 2, 'v4 repair did not clamp pressure campaign week');
  check(
    zeroCampaign?.status === 'disrupted' && zeroCampaign.intensity === 0,
    'v4 repair left a zero-intensity pressure campaign active',
  );

  const corruptV5 = structuredClone(state) as GameState;
  corruptV5.warFronts['pacific-war-front'].intensity = 999;
  corruptV5.warFronts['pacific-war-front'].momentum = 999;
  corruptV5.warFronts['pacific-war-front'].escalationLevel = 99 as typeof corruptV5.warFronts['pacific-war-front']['escalationLevel'];
  corruptV5.warFronts['pacific-war-front'].status = 'stable';
  delete (corruptV5.warFronts as Partial<typeof corruptV5.warFronts>)['orbital-war-front'];
  const repairedV5 = migrateState(corruptV5, 5);
  check(repairedV5.warFronts['pacific-war-front'].intensity === 100, 'v5 repair did not clamp front intensity');
  check(repairedV5.warFronts['pacific-war-front'].momentum === 100, 'v5 repair did not clamp front momentum');
  check(repairedV5.warFronts['pacific-war-front'].escalationLevel === 5, 'v5 repair did not clamp front escalation');
  check(repairedV5.warFronts['pacific-war-front'].status === 'breaking', 'v5 repair did not derive front status');
  check(repairedV5.warFronts['orbital-war-front'] !== undefined, 'v5 repair did not restore missing front');

  console.log(`\nMap systems: targeted action OK, ${incidentEntries.length} incident(s) in 30 weeks, v1/v2/v3/v4/v5 save migration OK`);
}

// --- 5: playability floor per difficulty --------------------------------------
console.log('\nGreedy-policy campaigns (competent player proxy):');
const floor: Record<DifficultyId, { full: number; total: number }> = {
  analyst: { full: 0, total: 0 },
  adviser: { full: 0, total: 0 },
  'crisis-chair': { full: 0, total: 0 },
};
const greedyResults: RunResult[] = [];
for (const difficulty of DIFFICULTIES) {
  for (const role of ROLES) {
    for (let s = 1; s <= 3; s++) {
      const final = runGreedy(role, s * 313 + ROLES.indexOf(role), difficulty);
      greedyResults.push({ difficulty, role, final });
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
reportRunDiagnostics('Greedy policy', greedyResults);
check(
  floor.analyst.full >= 14,
  `Analyst too hard: greedy reached 104 only ${floor.analyst.full}/${floor.analyst.total}`,
);
check(
  floor.adviser.full >= 10,
  `Adviser too hard: greedy reached 104 only ${floor.adviser.full}/${floor.adviser.total}`,
);
check(
  floor['crisis-chair'].full >= 4,
  `Crisis Chair collapsed too quickly: greedy reached 104 only ${floor['crisis-chair'].full}/${floor['crisis-chair'].total}`,
);

// ------------------------------------------------------------------------------
if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED`);
  process.exit(1);
}
console.log('\nALL SIM CHECKS PASSED');
