import { ACTIONS } from '../data/actions';
import { getEnding, getEndingOverlay } from '../data/endings';
import { getPlayableFaction } from '../data/playableFactions';
import type {
  ActionCategory,
  DefiningDecision,
  GameState,
  MetricKey,
  PlayableFactionId,
  PressureCampaignOutcomeSummary,
  ScoreGrade,
  ScorecardItem,
  WarFrontOutcomeItem,
} from '../types/gameTypes';

const ACTION_BY_ID = Object.fromEntries(ACTIONS.map((action) => [action.id, action]));

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function healthyMetric(state: GameState, metric: MetricKey): number {
  const value = state.metrics[metric];
  return metric === 'alignmentPressure' || metric === 'mentalLoad' ? 100 - value : value;
}

function grade(score: number): ScoreGrade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function criticalIds(factionId: PlayableFactionId): Set<string> {
  const ids: Record<PlayableFactionId, string[]> = {
    malaysia: ['strategic-autonomy', 'regional-cohesion', 'maritime-control', 'financial-continuity'],
    singapore: ['financial-continuity', 'institutional-stability', 'cyber-resilience', 'maritime-control'],
    indonesia: ['maritime-control', 'regional-cohesion', 'strategic-autonomy', 'war-front-stewardship'],
    'taiwan-allied-command': ['war-front-stewardship', 'orbital-access', 'cyber-resilience', 'financial-continuity'],
  };
  return new Set(ids[factionId]);
}

function item(
  id: string,
  label: string,
  score: number,
  explanation: string,
  critical: Set<string>,
): ScorecardItem {
  const safeScore = clampScore(score);
  return {
    id,
    label,
    grade: grade(safeScore),
    score: safeScore,
    explanation,
    factionCritical: critical.has(id),
  };
}

export function buildWarFrontOutcomeSummary(state: GameState): WarFrontOutcomeItem[] {
  return Object.values(state.warFronts).map((front) => {
    const phrase: WarFrontOutcomeItem['phrase'] =
      front.intensity < 30
        ? 'contained'
        : front.intensity < 55
          ? 'endured'
          : front.intensity < 80
            ? 'unstable'
            : 'lost control';
    return {
      id: front.id,
      name: front.name,
      status: front.status,
      intensity: Math.round(front.intensity),
      escalationLevel: front.escalationLevel,
      phrase,
    };
  });
}

export function buildPressureCampaignOutcomeSummary(state: GameState): PressureCampaignOutcomeSummary {
  const completed = state.activePressureCampaigns.filter((campaign) => campaign.status === 'completed');
  const disrupted = state.activePressureCampaigns.filter((campaign) => campaign.status === 'disrupted');
  const active = state.activePressureCampaigns.filter((campaign) => campaign.status === 'active');
  const worstUnresolved =
    [...active].sort((a, b) => b.intensity - a.intensity || b.currentWeek - a.currentWeek)[0]?.title ?? null;
  const bestDisrupted =
    [...disrupted].sort((a, b) => b.intensity - a.intensity || b.durationWeeks - a.durationWeeks)[0]?.title ?? null;

  return {
    completed: completed.length,
    disrupted: disrupted.length,
    active: active.length,
    worstUnresolved,
    bestDisrupted,
  };
}

export function buildScorecard(state: GameState): ScorecardItem[] {
  const faction = getPlayableFaction(state.playableFactionId);
  const critical = criticalIds(faction.id);
  const fronts = buildWarFrontOutcomeSummary(state);
  const campaigns = buildPressureCampaignOutcomeSummary(state);
  const frontScore = 100 - average(fronts.map((front) => front.intensity));
  const pressureScore = campaigns.completed + campaigns.disrupted + campaigns.active === 0
    ? 75
    : 70 + campaigns.disrupted * 8 - campaigns.completed * 10 - campaigns.active * 12;
  const autonomyInputs = faction.id === 'indonesia'
    ? [healthyMetric(state, 'sovereignty'), healthyMetric(state, 'alignmentPressure'), healthyMetric(state, 'energyAssurance')]
    : [healthyMetric(state, 'sovereignty'), healthyMetric(state, 'alignmentPressure')];

  return [
    item(
      'strategic-autonomy',
      'Strategic Autonomy / Sovereignty',
      average(autonomyInputs),
      faction.id === 'indonesia'
        ? 'Sovereignty, alignment pressure and energy assurance shaped Jakarta\'s freedom of action.'
        : 'Sovereignty and alignment pressure shaped how much command agency remained.',
      critical,
    ),
    item(
      'financial-continuity',
      'Financial Continuity',
      healthyMetric(state, 'financialContinuity'),
      faction.id === 'taiwan-allied-command'
        ? 'Measures whether chip logistics, emergency liquidity and timing corridors stayed financeable.'
        : 'Measures whether banks, markets and settlement confidence kept functioning.',
      critical,
    ),
    item(
      'cyber-resilience',
      'Cyber Resilience',
      healthyMetric(state, 'cyberResilience'),
      'Measures whether cyber shocks were absorbed without losing core command confidence.',
      critical,
    ),
    item(
      'maritime-control',
      faction.id === 'singapore' ? 'Maritime Continuity' : 'Maritime Control',
      healthyMetric(state, 'maritimeControl'),
      faction.id === 'singapore'
        ? 'Measures Singapore Strait and port-capital continuity under pressure.'
        : 'Measures sea-lane visibility, deterrence and logistics protection.',
      critical,
    ),
    item(
      'orbital-access',
      'Orbital Access',
      healthyMetric(state, 'orbitalAccess'),
      'Measures whether PNT, imaging, timing and satellite connectivity remained usable.',
      critical,
    ),
    item(
      'regional-cohesion',
      'Regional Cohesion',
      healthyMetric(state, 'aseanCohesion'),
      'Measures whether regional channels could still coordinate under pressure.',
      critical,
    ),
    item(
      'war-front-stewardship',
      faction.id === 'taiwan-allied-command' ? 'Pacific War Survival' : 'War Front Stewardship',
      frontScore,
      'Summarizes how much global war-front pressure was contained by the end state.',
      critical,
    ),
    item(
      'pressure-campaign-management',
      'Pressure Campaign Management',
      pressureScore,
      `${campaigns.disrupted} disrupted, ${campaigns.completed} completed against you, ${campaigns.active} still active.`,
      critical,
    ),
    item(
      'institutional-stability',
      'Institutional Stability',
      average([healthyMetric(state, 'institutionalTrust'), healthyMetric(state, 'publicReality')]),
      'Combines institutional trust and shared public reality.',
      critical,
    ),
    item(
      'command-burden',
      'Command Burden / Personal Stamina',
      average([healthyMetric(state, 'personalStamina'), healthyMetric(state, 'mentalLoad')]),
      'Measures whether the command seat remained humanly sustainable.',
      critical,
    ),
  ];
}

function frontDecision(state: GameState): DefiningDecision {
  const fronts = buildWarFrontOutcomeSummary(state);
  const worst = [...fronts].sort((a, b) => b.intensity - a.intensity)[0];
  const best = [...fronts].sort((a, b) => a.intensity - b.intensity)[0];
  if (worst && worst.phrase === 'lost control') {
    return { label: 'War front lost', detail: `${worst.name} ended at INT ${worst.intensity}.` };
  }
  if (best) return { label: 'War front contained', detail: `${best.name} ended ${best.phrase} at INT ${best.intensity}.` };
  return { label: 'War front record', detail: 'No war-front summary was available.' };
}

function mostRepeatedCategory(state: GameState): DefiningDecision | null {
  const counts = new Map<ActionCategory, number>();
  for (const completed of state.completedActions) {
    const category = ACTION_BY_ID[completed.actionId]?.category;
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  return { label: 'Command habit', detail: `${top[0]} actions were used most often (${top[1]} time${top[1] === 1 ? '' : 's'}).` };
}

function factionActionUsed(state: GameState): DefiningDecision | null {
  const faction = getPlayableFaction(state.playableFactionId);
  const used = state.completedActions.find((completed) => faction.uniqueActionIds.includes(completed.actionId));
  if (!used) return null;
  return { label: 'Faction tool used', detail: `${used.name} shaped the ${faction.shortName} campaign.` };
}

function campaignDecision(state: GameState): DefiningDecision | null {
  const summary = buildPressureCampaignOutcomeSummary(state);
  if (summary.bestDisrupted) return { label: 'Campaign disrupted', detail: `${summary.bestDisrupted} was broken before completion.` };
  if (summary.worstUnresolved) return { label: 'Campaign unresolved', detail: `${summary.worstUnresolved} remained active at the end.` };
  if (summary.completed > 0) return { label: 'Campaign pressure landed', detail: `${summary.completed} pressure campaign(s) completed against you.` };
  return null;
}

export function buildDefiningDecisions(state: GameState): DefiningDecision[] {
  if (!state.ending) return [];
  const ending = getEnding(state.ending.endingId);
  const overlay = getEndingOverlay(state.ending.endingId, state.playableFactionId);
  const decisions = [
    mostRepeatedCategory(state),
    factionActionUsed(state),
    campaignDecision(state),
    frontDecision(state),
    {
      label: 'Ending trigger',
      detail: state.ending.early
        ? overlay.collapseExplanation ?? `${ending.title} triggered before week 104.`
        : overlay.victoryFraming ?? overlay.interpretation,
    },
  ].filter((decision): decision is DefiningDecision => decision !== null);

  return decisions.slice(0, 5);
}
