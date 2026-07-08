import type {
  GameState,
  MilitaryAssetState,
  MilitaryOperationTemplate,
  MilitaryStatus,
  PlayableFactionId,
} from '../types/gameTypes';
import type { Rng } from './rng';
import { getMilitaryAssetDefs } from '../data/militaryAssets';
import { MILITARY_OPERATIONS, getMilitaryOperation } from '../data/militaryOperations';
import { NODE_MAP } from '../data/mapNodes';
import { addFlags, applyMetricDelta, clamp, makeTimelineEntry } from './actionEngine';
import { applyNodeDelta, applyNodeEffects } from './mapEngine';
import { applyWarFrontEffects } from './warFrontEngine';

const IDLE_MISSION = 'Holding station';
const VALID_STATUSES: MilitaryStatus[] = ['ready', 'on-mission', 'refitting', 'strained'];

export function clampMilitaryAsset(asset: MilitaryAssetState): void {
  asset.readiness = clamp(asset.readiness);
  asset.strength = clamp(asset.strength);
  asset.logistics = clamp(asset.logistics);
  asset.exposure = clamp(asset.exposure);
}

/** Three faction-flavored assets for the chosen command seat. */
export function createInitialMilitaryAssets(factionId: PlayableFactionId): MilitaryAssetState[] {
  return getMilitaryAssetDefs(factionId).map((def) => ({
    id: def.id,
    templateId: def.id,
    factionId: def.factionId,
    name: def.name,
    type: def.type,
    theatre: def.theatre,
    assignedNodeIds: [...def.assignedNodeIds],
    readiness: def.initial.readiness,
    strength: def.initial.strength,
    logistics: def.initial.logistics,
    exposure: def.initial.exposure,
    mission: IDLE_MISSION,
    status: 'ready',
    tags: [...def.tags],
    showcaseText: def.showcaseText,
  }));
}

/**
 * Repair invalid asset state (used by the save migration and defensively on
 * load): clamp gauges, coerce unknown statuses, drop dangling operation refs.
 */
export function repairMilitaryAssets(state: GameState): void {
  if (!Array.isArray(state.militaryAssets)) {
    state.militaryAssets = createInitialMilitaryAssets(state.playableFactionId);
    return;
  }
  for (const asset of state.militaryAssets) {
    clampMilitaryAsset(asset);
    if (!VALID_STATUSES.includes(asset.status)) asset.status = 'ready';
    if (typeof asset.mission !== 'string' || asset.mission.length === 0) {
      asset.mission = IDLE_MISSION;
    }
    if (asset.activeOperationId && !getMilitaryOperation(asset.activeOperationId)) {
      delete asset.activeOperationId;
      delete asset.operationEndsWeek;
      asset.status = 'ready';
      asset.mission = IDLE_MISSION;
    }
    if (asset.activeOperationId && typeof asset.operationEndsWeek !== 'number') {
      asset.operationEndsWeek = state.week + 1;
    }
    if (!asset.activeOperationId && asset.status === 'on-mission') {
      asset.status = 'ready';
      asset.mission = IDLE_MISSION;
    }
  }
}

/** Operations this asset could start right now. */
export function getEligibleOperations(
  asset: MilitaryAssetState,
  state: GameState,
): MilitaryOperationTemplate[] {
  if (asset.activeOperationId || asset.status === 'on-mission') return [];
  return MILITARY_OPERATIONS.filter((op) => {
    if (!op.eligibleAssetTypes.includes(asset.type)) return false;
    if (op.eligibleFactionIds && !op.eligibleFactionIds.includes(state.playableFactionId)) {
      return false;
    }
    return asset.readiness > op.readinessCost && asset.logistics > op.logisticsCost;
  });
}

/**
 * Assign an operation: pay readiness/logistics/exposure up front, set the
 * mission and ETA. Pure — returns a new state (UI entry point).
 */
export function assignMilitaryOperation(
  state: GameState,
  assetId: string,
  operationId: string,
): GameState {
  const current = state.militaryAssets.find((a) => a.id === assetId);
  const operation = getMilitaryOperation(operationId);
  if (!current || !operation) return state;
  if (!getEligibleOperations(current, state).some((op) => op.id === operationId)) return state;

  const next = structuredClone(state);
  const asset = next.militaryAssets.find((a) => a.id === assetId)!;
  asset.readiness -= operation.readinessCost;
  asset.logistics -= operation.logisticsCost;
  asset.exposure += operation.exposureChange;
  clampMilitaryAsset(asset);
  asset.mission = operation.name;
  asset.status = 'on-mission';
  asset.activeOperationId = operation.id;
  asset.operationEndsWeek = next.week + operation.durationWeeks;

  next.timeline.push(
    makeTimelineEntry(next, {
      type: 'military',
      title: `Operation launched: ${operation.name}`,
      description: `${asset.name} begins ${operation.name} (${operation.durationWeeks} week${operation.durationWeeks > 1 ? 's' : ''}, risk: ${operation.riskLabel.toLowerCase()}).`,
    }),
  );
  return next;
}

/** Success odds from the asset's condition and the operation's risk. */
export function operationSuccessChance(
  asset: MilitaryAssetState,
  operation: MilitaryOperationTemplate,
): number {
  const chance =
    0.85 -
    operation.risk +
    (asset.readiness - 50) / 250 +
    (asset.logistics - 50) / 300 -
    (asset.exposure - 40) / 250;
  return Math.max(0.15, Math.min(0.95, chance));
}

/** Military counter to active pressure campaigns (same semantics as actions). */
export function applyMilitaryCampaignCounters(
  state: GameState,
  tags: string[] | undefined,
  source: string,
): void {
  if (!tags || tags.length === 0) return;
  for (const campaign of state.activePressureCampaigns) {
    if (campaign.status !== 'active') continue;
    const matches = campaign.counterActionTags.filter((tag) => tags.includes(tag));
    if (matches.length === 0) continue;

    const reduction = matches.length >= 2 ? 2 : 1;
    campaign.intensity = Math.max(0, campaign.intensity - reduction);
    campaign.durationWeeks = Math.max(campaign.currentWeek, campaign.durationWeeks - 1);

    state.timeline.push(
      makeTimelineEntry(state, {
        type: 'military',
        actorId: campaign.actorId,
        title: `Campaign countered: ${campaign.title}`,
        description: `${source} degrades ${campaign.title} via ${matches.join(', ')}.`,
      }),
    );

    if (campaign.intensity <= 0) {
      campaign.status = 'disrupted';
      applyMetricDelta(state, campaign.disruptionEffects.metricEffects);
      applyNodeEffects(state, campaign.disruptionEffects.nodeEffects);
      addFlags(state, campaign.disruptionEffects.flagsAdded);
      state.timeline.push(
        makeTimelineEntry(state, {
          type: 'military',
          actorId: campaign.actorId,
          title: `Campaign broken: ${campaign.title}`,
          description: `${campaign.title} loses coherence under sustained military pressure.`,
        }),
      );
    }
  }
}

function assignedNodeNames(asset: MilitaryAssetState): string {
  return asset.assignedNodeIds.map((id) => NODE_MAP[id]?.name ?? id).join(', ');
}

/** Resolve operations whose ETA has arrived. Deterministic via the seeded rng. */
export function tickMilitaryOperations(state: GameState, rng: Rng): void {
  for (const asset of state.militaryAssets) {
    if (!asset.activeOperationId || asset.operationEndsWeek === undefined) continue;
    if (asset.operationEndsWeek > state.week) continue;
    const operation = getMilitaryOperation(asset.activeOperationId);
    if (!operation) {
      // Dangling reference (should be repaired on load) — release the asset.
      delete asset.activeOperationId;
      delete asset.operationEndsWeek;
      asset.status = 'refitting';
      asset.mission = IDLE_MISSION;
      continue;
    }

    const chance = operationSuccessChance(asset, operation);
    const success = rng.chance(chance);

    if (success) {
      applyMetricDelta(state, operation.successMetricEffects);
      if (operation.assignedNodeDelta) {
        for (const nodeId of asset.assignedNodeIds) {
          applyNodeDelta(state, nodeId, operation.assignedNodeDelta);
        }
      }
      applyNodeEffects(state, operation.nodeEffects);
      applyWarFrontEffects(state, operation.warFrontEffects, `${asset.name} — ${operation.name}`);
      applyMilitaryCampaignCounters(
        state,
        operation.campaignCounterTags,
        `${asset.name} (${operation.name})`,
      );
      state.timeline.push(
        makeTimelineEntry(state, {
          type: 'military',
          title: `Operation complete: ${operation.name}`,
          description: `${asset.name} completes ${operation.name} across ${assignedNodeNames(asset)}. Effects take hold.`,
        }),
      );
    } else {
      applyMetricDelta(state, operation.failureMetricEffects);
      asset.exposure += 6;
      state.timeline.push(
        makeTimelineEntry(state, {
          type: 'military',
          title: `Operation failed: ${operation.name}`,
          description: `${asset.name} aborts ${operation.name} — ${operation.riskLabel.toLowerCase()}. The force withdraws to refit.`,
        }),
      );
    }

    delete asset.activeOperationId;
    delete asset.operationEndsWeek;
    asset.status = 'refitting';
    asset.mission = IDLE_MISSION;
    clampMilitaryAsset(asset);
  }
}

/** Weekly recovery for assets that are not on mission. */
export function recoverMilitaryAssets(state: GameState): void {
  for (const asset of state.militaryAssets) {
    if (asset.status === 'on-mission') continue;
    asset.readiness += 3;
    asset.logistics += 3;
    asset.exposure -= 2;
    clampMilitaryAsset(asset);
    if (asset.status === 'refitting' && asset.readiness >= 60 && asset.logistics >= 50) {
      asset.status = 'ready';
    }
    if (asset.readiness < 30) {
      asset.status = 'strained';
    } else if (asset.status === 'strained') {
      asset.status = asset.readiness >= 60 ? 'ready' : 'refitting';
    }
  }
}
