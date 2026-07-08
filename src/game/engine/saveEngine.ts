import type {
  ActivePressureCampaign,
  GameState,
  MapIncident,
  MapNodeId,
  MapNodeState,
  PlayableFactionId,
  PressureCampaignStatus,
  WarFrontState,
} from '../types/gameTypes';
import { getAction } from '../data/actions';
import { getIncident } from '../data/incidents';
import { MAP_NODES, NODE_MAP } from '../data/mapNodes';
import { DEFAULT_PLAYABLE_FACTION_ID, PLAYABLE_FACTION_MAP } from '../data/playableFactions';
import { getPressureCampaign } from '../data/pressureCampaigns';
import { WAR_FRONTS } from '../data/warFronts';
import { getActionAvailability, getActionSlots } from './actionEngine';
import { createInitialMap } from './mapEngine';
import { createInitialWarFronts, deriveWarFrontStatus } from './warFrontEngine';

const SAVE_KEY = 'straits-protocol-2040-save';
const SAVE_VERSION = 6;

interface SaveEnvelope {
  version: number;
  savedAt: string;
  state: GameState;
}

/** Cheap structural validation so a corrupt/incompatible save never crashes the app. */
function isValidState(state: unknown): state is GameState {
  if (typeof state !== 'object' || state === null) return false;
  const s = state as Partial<GameState>;
  return (
    typeof s.campaignId === 'string' &&
    typeof s.seed === 'number' &&
    typeof s.week === 'number' &&
    typeof s.maxWeeks === 'number' &&
    typeof s.metrics === 'object' &&
    s.metrics !== null &&
    typeof s.actors === 'object' &&
    s.actors !== null &&
    Array.isArray(s.timeline) &&
    Array.isArray(s.flags) &&
    (s.status === 'setup' || s.status === 'active' || s.status === 'ended')
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMapNodeId(value: unknown): value is MapNodeId {
  return typeof value === 'string' && value in NODE_MAP;
}

function isPlayableFactionId(value: unknown): value is PlayableFactionId {
  return typeof value === 'string' && value in PLAYABLE_FACTION_MAP;
}

function isPressureCampaignStatus(value: unknown): value is PressureCampaignStatus {
  return value === 'active' || value === 'completed' || value === 'disrupted';
}

function clampNodeValue(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

function normalizeIncident(raw: unknown, fallbackWeek: number): MapIncident | null {
  if (!isObject(raw) || typeof raw.incidentId !== 'string') return null;
  const template = getIncident(raw.incidentId);
  if (!template) return null;
  const startedWeek =
    typeof raw.startedWeek === 'number' && Number.isFinite(raw.startedWeek)
      ? raw.startedWeek
      : fallbackWeek;
  const expiresWeek =
    typeof raw.expiresWeek === 'number' && Number.isFinite(raw.expiresWeek)
      ? raw.expiresWeek
      : startedWeek + template.duration;
  if (expiresWeek <= startedWeek) return null;
  return {
    id: typeof raw.id === 'string' ? raw.id : `${template.id}-restored-w${startedWeek}`,
    incidentId: template.id,
    title: typeof raw.title === 'string' ? raw.title : template.title,
    severity: template.severity,
    source: typeof raw.source === 'string' ? raw.source : 'Saved campaign',
    startedWeek,
    expiresWeek,
    tags: Array.isArray(raw.tags) && raw.tags.every((tag) => typeof tag === 'string')
      ? raw.tags
      : template.tags,
  };
}

function normalizeMapState(state: GameState): void {
  const fresh = createInitialMap();
  const savedNodes: Record<string, unknown> = isObject(state.map?.nodes)
    ? state.map.nodes
    : {};
  const nodes = {} as Record<MapNodeId, MapNodeState>;

  for (const def of MAP_NODES) {
    const fallback = fresh.nodes[def.id];
    const rawSaved = savedNodes[def.id];
    const saved: Record<string, unknown> = isObject(rawSaved) ? rawSaved : {};
    const rawIncidents: unknown[] = Array.isArray(saved.activeIncidents) ? saved.activeIncidents : [];
    nodes[def.id] = {
      id: def.id,
      stability: clampNodeValue(saved.stability, fallback.stability),
      riskLevel: clampNodeValue(saved.riskLevel, fallback.riskLevel),
      cyberExposure: clampNodeValue(saved.cyberExposure, fallback.cyberExposure),
      activeIncidents: rawIncidents
        .map((incident) => normalizeIncident(incident, state.week))
        .filter((incident): incident is MapIncident => incident !== null),
    };
  }

  state.map = { nodes };
}

function normalizeSelectionState(state: GameState): void {
  state.selectedNode = isMapNodeId(state.selectedNode) ? state.selectedNode : null;

  const rawPendingActions = Array.isArray(state.pendingActions) ? state.pendingActions : [];
  const pendingActions: string[] = [];
  for (const actionId of rawPendingActions) {
    if (typeof actionId !== 'string' || pendingActions.includes(actionId)) continue;
    const action = getAction(actionId);
    if (!action || !getActionAvailability(state, action).available) continue;
    pendingActions.push(actionId);
  }
  state.pendingActions = pendingActions.slice(0, getActionSlots(state));

  const rawTargets = isObject(state.pendingTargets) ? state.pendingTargets : {};
  const pendingTargets: GameState['pendingTargets'] = {};
  for (const actionId of state.pendingActions) {
    const action = getAction(actionId);
    if (!action?.targeting) continue;
    const rawTarget = rawTargets[actionId];
    if (isMapNodeId(rawTarget) && action.targeting.nodeIds.includes(rawTarget)) {
      pendingTargets[actionId] = rawTarget;
    } else if (action.targeting.nodeIds.length === 1) {
      pendingTargets[actionId] = action.targeting.nodeIds[0];
    }
  }
  state.pendingTargets = pendingTargets;
}

function normalizePressureCampaign(raw: unknown, state: GameState): ActivePressureCampaign | null {
  if (!isObject(raw) || typeof raw.templateId !== 'string') return null;
  const template = getPressureCampaign(raw.templateId);
  if (!template) return null;
  const startedWeek =
    typeof raw.startedWeek === 'number' && Number.isFinite(raw.startedWeek)
      ? raw.startedWeek
      : state.week;
  const durationWeeks =
    typeof raw.durationWeeks === 'number' &&
    Number.isFinite(raw.durationWeeks) &&
    raw.durationWeeks > 0
      ? raw.durationWeeks
      : template.durationWeeks;
  const currentWeek =
    typeof raw.currentWeek === 'number' && Number.isFinite(raw.currentWeek)
      ? Math.max(0, Math.min(durationWeeks, raw.currentWeek))
      : 0;
  const intensity =
    typeof raw.intensity === 'number' && Number.isFinite(raw.intensity)
      ? Math.max(0, Math.min(4, raw.intensity))
      : template.intensity;
  const rawStatus = isPressureCampaignStatus(raw.status) ? raw.status : 'active';
  const status = rawStatus === 'active' && intensity <= 0 ? 'disrupted' : rawStatus;
  const rawTargets = Array.isArray(raw.targetNodeIds) ? raw.targetNodeIds : template.targetNodeIds;
  const targetNodeIds = rawTargets.filter(isMapNodeId);

  return {
    id: typeof raw.id === 'string' ? raw.id : `${template.id}-restored-w${startedWeek}`,
    templateId: template.id,
    actorId: template.actorId,
    title: typeof raw.title === 'string' ? raw.title : template.title,
    description: typeof raw.description === 'string' ? raw.description : template.description,
    theatre: template.theatre,
    targetNodeIds: targetNodeIds.length > 0 ? targetNodeIds : template.targetNodeIds,
    startedWeek,
    durationWeeks,
    currentWeek,
    intensity,
    status,
    tags: Array.isArray(raw.tags) && raw.tags.every((tag) => typeof tag === 'string')
      ? raw.tags
      : template.tags,
    counterActionTags:
      Array.isArray(raw.counterActionTags) &&
      raw.counterActionTags.every((tag) => typeof tag === 'string')
        ? raw.counterActionTags
        : template.counterActionTags,
    weeklyNodeEffects: template.weeklyNodeEffects,
    weeklyMetricEffects: template.weeklyMetricEffects,
    completionEffects: template.completionEffects,
    disruptionEffects: template.disruptionEffects,
    flagsAddedOnStart: template.flagsAddedOnStart,
    flagsAddedOnCompletion: template.flagsAddedOnCompletion,
  };
}

function normalizePressureCampaigns(state: GameState): void {
  const rawCampaigns = Array.isArray(state.activePressureCampaigns)
    ? state.activePressureCampaigns
    : [];
  state.activePressureCampaigns = rawCampaigns
    .map((campaign) => normalizePressureCampaign(campaign, state))
    .filter((campaign): campaign is ActivePressureCampaign => campaign !== null);
}

function clampFrontValue(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

function clampFrontMomentum(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(-100, Math.min(100, Math.round(value * 100) / 100));
}

function clampFrontEscalation(value: unknown, fallback: number): 1 | 2 | 3 | 4 | 5 {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback as 1 | 2 | 3 | 4 | 5;
  return Math.max(1, Math.min(5, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
}

function normalizeWarFront(raw: unknown, fallback: WarFrontState): WarFrontState {
  const saved = isObject(raw) ? raw : {};
  const intensity = clampFrontValue(saved.intensity, fallback.intensity);
  const modifiers =
    Array.isArray(saved.activeModifiers) &&
    saved.activeModifiers.every((modifier) => typeof modifier === 'string')
      ? saved.activeModifiers.slice(0, 5)
      : fallback.activeModifiers;
  return {
    ...fallback,
    intensity,
    momentum: clampFrontMomentum(saved.momentum, fallback.momentum),
    escalationLevel: clampFrontEscalation(saved.escalationLevel, fallback.escalationLevel),
    dominantSide: typeof saved.dominantSide === 'string' ? saved.dominantSide : fallback.dominantSide,
    status: deriveWarFrontStatus(intensity),
    activeModifiers: modifiers,
    lastShiftWeek:
      typeof saved.lastShiftWeek === 'number' && Number.isFinite(saved.lastShiftWeek)
        ? Math.max(1, Math.round(saved.lastShiftWeek))
        : fallback.lastShiftWeek,
    lastShiftSummary:
      typeof saved.lastShiftSummary === 'string'
        ? saved.lastShiftSummary
        : fallback.lastShiftSummary,
  };
}

function normalizeWarFronts(state: GameState): void {
  const fallback = createInitialWarFronts(state.week);
  const rawFronts: Record<string, unknown> = isObject(state.warFronts) ? state.warFronts : {};
  for (const def of WAR_FRONTS) {
    fallback[def.id] = normalizeWarFront(rawFronts[def.id], fallback[def.id]);
  }
  state.warFronts = fallback;
}

export function saveGame(state: GameState): boolean {
  try {
    const envelope: SaveEnvelope = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      state,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/** Fill in fields introduced after a save was written, so older saves still load. */
export function migrateState(state: GameState, version: number): GameState {
  if (version < 2) {
    state.difficulty ??= 'adviser';
    state.pendingActions ??= [];
    state.scheduledEffects ??= [];
    state.lastEventWeek ??= {};
  }
  if (version < 3) {
    // v2 saves predate the strategic map — start it fresh mid-campaign.
    state.map ??= createInitialMap();
    state.selectedNode ??= null;
    state.pendingTargets ??= {};
  }
  if (version < 4) {
    state.activePressureCampaigns ??= [];
  }
  if (version < 5) {
    state.warFronts ??= createInitialWarFronts(state.week);
  }
  if (version < 6) {
    state.playableFactionId ??= DEFAULT_PLAYABLE_FACTION_ID;
  }
  state.playableFactionId = isPlayableFactionId(state.playableFactionId)
    ? state.playableFactionId
    : DEFAULT_PLAYABLE_FACTION_ID;
  state.pendingActions ??= [];
  state.pendingTargets ??= {};
  state.scheduledEffects ??= [];
  state.lastEventWeek ??= {};
  state.activePressureCampaigns ??= [];
  state.warFronts ??= createInitialWarFronts(state.week);
  state.rngCursor ??= 0;
  state.turn ??= state.week;
  state.map ??= createInitialMap();
  normalizeMapState(state);
  normalizeSelectionState(state);
  normalizePressureCampaigns(state);
  normalizeWarFronts(state);
  return state;
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as Partial<SaveEnvelope>;
    if (typeof envelope.version !== 'number' || envelope.version > SAVE_VERSION) return null;
    if (!isValidState(envelope.state)) return null;
    return migrateState(envelope.state, envelope.version);
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}

export function savedAt(): string | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as Partial<SaveEnvelope>;
    return envelope.savedAt ?? null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // storage unavailable — nothing to clear
  }
}
