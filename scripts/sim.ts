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
import { getActionAvailability, getActionSlots } from '../src/game/engine/actionEngine';
import { addIncidents, applyNodeDelta, tickMap } from '../src/game/engine/mapEngine';
import {
  disruptPressureCampaignsForAction,
  startPressureCampaigns,
  tickPressureCampaigns,
} from '../src/game/engine/pressureCampaignEngine';
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
  RoleId,
} from '../src/game/types/gameTypes';

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
}

const NODE_IDS = new Set<MapNodeId>(MAP_NODES.map((node) => node.id));
const INCIDENT_IDS = new Set(INCIDENTS.map((incident) => incident.id));
const PRESSURE_CAMPAIGN_IDS = new Set(PRESSURE_CAMPAIGNS.map((campaign) => campaign.id));

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

function validateActionMapRefs(action: ActionDef): void {
  checkNodeEffects(`action ${action.id}`, action.nodeEffects);
  checkIncidentSpawns(`action ${action.id}`, action.incidents);
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
}

function validateChoiceMapRefs(eventId: string, choice: EventChoice): void {
  checkNodeEffects(`event ${eventId} choice ${choice.id}`, choice.nodeEffects);
  checkIncidentSpawns(`event ${eventId} choice ${choice.id}`, choice.incidents);
  checkPressureCampaignStarts(`event ${eventId} choice ${choice.id}`, choice.pressureCampaigns);
}

function validateEventMapRefs(event: EventDef): void {
  checkNodeEffects(`event ${event.id}`, event.nodeEffects);
  checkIncidentSpawns(`event ${event.id}`, event.incidents);
  checkPressureCampaignStarts(`event ${event.id}`, event.pressureCampaigns);
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
  JSON.stringify(a.map) === JSON.stringify(b.map) &&
  JSON.stringify(a.activePressureCampaigns) === JSON.stringify(b.activePressureCampaigns) &&
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
  console.log('\nPressure campaigns: start, refresh, completion, disruption, and clamping OK');
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

  // Save-migration path: a v2 save (no map fields) must come back with a map.
  const v2 = structuredClone(state) as Partial<GameState>;
  delete v2.map;
  delete v2.selectedNode;
  delete v2.pendingTargets;
  delete v2.activePressureCampaigns;
  const migrated = migrateState(v2 as GameState, 2);
  check(migrated.map !== undefined && migrated.map.nodes['port-klang'] !== undefined, 'v2 migration did not initialize map state');
  check(migrated.pendingTargets !== undefined && migrated.selectedNode === null, 'v2 migration did not initialize target/selection fields');
  check(migrated.activePressureCampaigns.length === 0, 'v2 migration did not initialize pressure campaigns');

  const v1 = structuredClone(state) as Partial<GameState>;
  delete v1.difficulty;
  delete v1.pendingActions;
  delete v1.scheduledEffects;
  delete v1.lastEventWeek;
  delete v1.map;
  delete v1.selectedNode;
  delete v1.pendingTargets;
  delete v1.activePressureCampaigns;
  const migratedV1 = migrateState(v1 as GameState, 1);
  check(migratedV1.difficulty === 'adviser', 'v1 migration did not default difficulty');
  check(migratedV1.map.nodes['port-klang'] !== undefined, 'v1 migration did not initialize map state');
  check(Array.isArray(migratedV1.pendingActions), 'v1 migration did not initialize pending actions');
  check(Array.isArray(migratedV1.activePressureCampaigns), 'v1 migration did not initialize pressure campaigns');

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
  ];
  const repairedV4 = migrateState(corruptV4, 4);
  check(repairedV4.activePressureCampaigns.length === 1, 'v4 repair did not prune unknown pressure campaign');
  check(repairedV4.activePressureCampaigns[0].intensity === 4, 'v4 repair did not clamp pressure campaign intensity');
  check(repairedV4.activePressureCampaigns[0].currentWeek === 2, 'v4 repair did not clamp pressure campaign week');

  console.log(`\nMap systems: targeted action OK, ${incidentEntries.length} incident(s) in 30 weeks, v1/v2/v3/v4 save migration OK`);
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
