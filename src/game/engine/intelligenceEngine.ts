import type {
  ActivePressureCampaign,
  GameState,
  MapNodeState,
  MilitaryAssetState,
  WarFrontState,
} from '../types/gameTypes';
import { METRIC_INFO } from '../data/initialState';
import { MAP_NODES, NODE_MAP } from '../data/mapNodes';
import { getPlayableFaction } from '../data/playableFactions';

export interface IntelligenceRisk {
  id: string;
  label: string;
  severity: number; // 0..100, higher = worse
  detail: string;
  counterplay: string;
}

export interface IntelligenceReport {
  topRisks: IntelligenceRisk[];
  hottestFront: WarFrontState;
  worstCampaign: ActivePressureCampaign | null;
  mostExposedAsset: MilitaryAssetState | null;
  mostFragileNode: MapNodeState;
  factionWarning: string;
}

/**
 * A pure, state-derived situation estimate: no memory, no prediction models —
 * just the worst things on the board right now and what category of response
 * usually helps.
 */
export function buildIntelligenceReport(state: GameState): IntelligenceReport {
  const faction = getPlayableFaction(state.playableFactionId);
  const risks: IntelligenceRisk[] = [];

  // Metric risks: good metrics low, inverted metrics high.
  for (const info of METRIC_INFO) {
    const value = state.metrics[info.key];
    const danger = info.badWhenHigh ? value : 100 - value;
    if (danger >= 60) {
      risks.push({
        id: `metric-${info.key}`,
        label: `${info.label} ${info.badWhenHigh ? 'critically high' : 'critically low'} (${Math.round(value)})`,
        severity: danger,
        detail: info.description,
        counterplay: info.badWhenHigh
          ? 'Take pressure-relief actions; avoid alignment-heavy and high-load moves this week.'
          : 'Prioritize actions and operations that restore this metric before it triggers collapse checks.',
      });
    }
  }

  // Front risks.
  const fronts = Object.values(state.warFronts);
  const hottestFront = fronts.reduce((a, b) => (b.intensity > a.intensity ? b : a));
  for (const front of fronts) {
    if (front.intensity >= 60 || front.status === 'crisis' || front.status === 'breaking') {
      risks.push({
        id: `front-${front.id}`,
        label: `${front.name} ${front.status} (intensity ${Math.round(front.intensity)})`,
        severity: front.intensity,
        detail: front.lastShiftSummary || front.description,
        counterplay: 'Counter-front actions and military operations against this front reduce intensity and momentum.',
      });
    }
  }

  // Campaign risks.
  const activeCampaigns = state.activePressureCampaigns.filter((c) => c.status === 'active');
  const worstCampaign =
    activeCampaigns.length > 0
      ? activeCampaigns.reduce((a, b) => (b.intensity > a.intensity ? b : a))
      : null;
  for (const campaign of activeCampaigns) {
    risks.push({
      id: `campaign-${campaign.id}`,
      label: `${campaign.title} (intensity ${campaign.intensity})`,
      severity: 40 + campaign.intensity * 10,
      detail: campaign.description,
      counterplay: `Counters: ${campaign.counterActionTags.join(', ')} — actions or military operations carrying these tags degrade it.`,
    });
  }

  // Node risks.
  const nodes = MAP_NODES.map((def) => state.map.nodes[def.id]).filter(Boolean);
  const mostFragileNode = nodes.reduce((a, b) => (b.riskLevel > a.riskLevel ? b : a));
  if (mostFragileNode.riskLevel >= 60) {
    risks.push({
      id: `node-${mostFragileNode.id}`,
      label: `${NODE_MAP[mostFragileNode.id].name} at risk (${Math.round(mostFragileNode.riskLevel)})`,
      severity: mostFragileNode.riskLevel - 5,
      detail: `Stability ${Math.round(mostFragileNode.stability)}, ${mostFragileNode.activeIncidents.length} active incident(s).`,
      counterplay: 'Targeted actions or operations assigned to this node reduce risk and restore stability.',
    });
  }

  // Asset exposure risk.
  const mostExposedAsset =
    state.militaryAssets.length > 0
      ? state.militaryAssets.reduce((a, b) => (b.exposure > a.exposure ? b : a))
      : null;
  if (mostExposedAsset && mostExposedAsset.exposure >= 60) {
    risks.push({
      id: `asset-${mostExposedAsset.id}`,
      label: `${mostExposedAsset.name} heavily exposed (${Math.round(mostExposedAsset.exposure)})`,
      severity: mostExposedAsset.exposure - 10,
      detail: 'High exposure cuts operation success odds and invites escalatory incidents.',
      counterplay: 'Keep the asset idle for a few weeks; exposure bleeds off while it refits.',
    });
  }

  risks.sort((a, b) => b.severity - a.severity);

  // Faction warning keyed to the weakest primary metric.
  const weakest = faction.primaryMetrics.reduce((worst, key) => {
    const info = METRIC_INFO.find((m) => m.key === key);
    const danger = info?.badWhenHigh ? state.metrics[key] : 100 - state.metrics[key];
    const worstInfo = METRIC_INFO.find((m) => m.key === worst);
    const worstDanger = worstInfo?.badWhenHigh ? state.metrics[worst] : 100 - state.metrics[worst];
    return danger > worstDanger ? key : worst;
  }, faction.primaryMetrics[0]);
  const weakestInfo = METRIC_INFO.find((m) => m.key === weakest);
  const factionWarning = `${faction.shortName} watch item: ${weakestInfo?.label ?? weakest} is your most stressed core metric. ${
    faction.collapseRisks[0] ?? ''
  }`;

  return {
    topRisks: risks.slice(0, 5),
    hottestFront,
    worstCampaign,
    mostExposedAsset,
    mostFragileNode,
    factionWarning,
  };
}
