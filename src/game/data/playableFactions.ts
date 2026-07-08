import type { PlayableFactionDef, PlayableFactionId } from '../types/gameTypes';

export const DEFAULT_PLAYABLE_FACTION_ID: PlayableFactionId = 'malaysia';

export const PLAYABLE_FACTIONS: PlayableFactionDef[] = [
  {
    id: 'malaysia',
    name: 'Malaysia',
    shortName: 'Malaysia',
    description:
      'A middle power trying to keep sovereignty, markets, cyber systems and ASEAN room to maneuver intact.',
    commandPerspective: 'National Security Council / whole-of-government crisis cell',
    difficultyFlavor: 'Balanced survival campaign with strong tradeoffs and no single safe lane.',
    startingMetricModifiers: {},
    startingMapNodeModifiers: [],
    startingWarFrontModifiers: [],
    uniqueActionIds: [],
    primaryMetrics: ['sovereignty', 'aseanCohesion', 'maritimeControl', 'cyberResilience', 'financialContinuity'],
    strategicPriorities: ['Preserve sovereignty', 'Keep ASEAN viable', 'Hold the Straits', 'Absorb cyber-financial pressure'],
    collapseRisks: ['Client-state drift', 'Market failure', 'Public reality collapse'],
    victoryFocus: 'Survive as a sovereign middle power without becoming anyone else\'s operating base.',
    factionLabelOverrides: {
      impactLabel: 'Malaysia impact',
      endingSubtitle: 'Malaysia writes the final posture from inside ASEAN.',
    },
  },
  {
    id: 'singapore',
    name: 'Singapore',
    shortName: 'Singapore',
    description:
      'A compact continuity state defending finance, ports, settlement trust and regional optionality from systemic contagion.',
    commandPerspective: 'Crisis Strategy Group / MAS-MHA continuity command',
    difficultyFlavor: 'Stable and well-resourced, but highly sensitive to capital flight, port disruption and regional collapse.',
    startingMetricModifiers: {
      financialContinuity: 9,
      institutionalTrust: 7,
      cyberResilience: 5,
      maritimeControl: 3,
      sovereignty: -1,
      aseanCohesion: -3,
    },
    startingMapNodeModifiers: [
      { nodeId: 'singapore', stability: 7, riskLevel: -3 },
      { nodeId: 'singapore-strait', stability: 3 },
      { nodeId: 'bnm-core', stability: 2 },
      { nodeId: 'financial-timing-link', stability: 3, riskLevel: -2 },
    ],
    startingWarFrontModifiers: [
      { frontId: 'financial-war-front', intensity: 4, modifier: 'Singapore continuity posture' },
      { frontId: 'cyber-war-front', intensity: -2, momentum: -2, modifier: 'Continuity-state cyber discipline' },
      { frontId: 'maritime-war-front', intensity: 3, momentum: 2, modifier: 'Strait dependency' },
    ],
    uniqueActionIds: ['activate-continuity-authority', 'ringfence-financial-flows'],
    disabledActionIds: ['bnm-confidence-briefing', 'propose-asean-shield'],
    primaryMetrics: ['financialContinuity', 'institutionalTrust', 'cyberResilience', 'maritimeControl'],
    strategicPriorities: ['Keep settlement trusted', 'Protect the Singapore Strait', 'Insulate capital flows', 'Avoid dependency spirals'],
    collapseRisks: ['Capital flight', 'Singapore Strait disruption', 'Continuity dependency', 'Regional contagion'],
    victoryFocus: 'Keep the continuity state credible while the region fractures around it.',
    factionLabelOverrides: {
      impactLabel: 'Singapore impact',
      endingSubtitle: 'Singapore measures survival in continuity, trust and room to hedge.',
    },
  },
  {
    id: 'indonesia',
    name: 'Indonesia',
    shortName: 'Indonesia',
    description:
      'An archipelago maritime power and ASEAN leadership contender trying to coordinate scale under pressure.',
    commandPerspective: 'National maritime-security coordination command',
    difficultyFlavor: 'Bigger strategic depth and maritime reach, with harder coordination and energy exposure.',
    startingMetricModifiers: {
      maritimeControl: 9,
      aseanCohesion: 8,
      energyAssurance: 5,
      sovereignty: 3,
      institutionalTrust: -4,
      financialContinuity: -3,
      mentalLoad: 4,
    },
    startingMapNodeModifiers: [
      { nodeId: 'jakarta', stability: 6, riskLevel: -3 },
      { nodeId: 'batam-corridor', stability: 4, riskLevel: -2 },
      { nodeId: 'malacca-strait', riskLevel: -2 },
      { nodeId: 'bintulu-lng', riskLevel: 2 },
    ],
    startingWarFrontModifiers: [
      { frontId: 'maritime-war-front', intensity: -3, momentum: -3, modifier: 'Archipelago maritime depth' },
      { frontId: 'pacific-war-front', intensity: -1, momentum: -2, modifier: 'ASEAN leadership channel' },
      { frontId: 'financial-war-front', intensity: 2, momentum: 1, modifier: 'Archipelago coordination costs' },
    ],
    uniqueActionIds: ['expand-maritime-patrol-zone', 'lead-asean-shield-proposal'],
    disabledActionIds: ['bnm-confidence-briefing', 'quiet-asean-backchannel', 'propose-asean-shield'],
    primaryMetrics: ['maritimeControl', 'aseanCohesion', 'energyAssurance', 'sovereignty'],
    strategicPriorities: ['Lead ASEAN', 'Coordinate the archipelago', 'Keep sea lanes usable', 'Protect energy corridors'],
    collapseRisks: ['Archipelago coordination strain', 'Maritime incidents', 'Energy disruption', 'ASEAN fracture'],
    victoryFocus: 'Turn maritime scale into ASEAN leadership without losing coordination at home.',
    factionLabelOverrides: {
      impactLabel: 'Indonesia impact',
      endingSubtitle: 'Indonesia weighs survival against the burden of leading the archipelago.',
    },
  },
  {
    id: 'taiwan-allied-command',
    name: 'Taiwan Allied Command',
    shortName: 'Taiwan Allied',
    description:
      'A frontline coalition command trying to keep Taiwan, logistics, chips, cyber systems and orbital coverage alive.',
    commandPerspective: 'Joint theatre resilience and counter-blockade command',
    difficultyFlavor: 'The most war-game perspective: stronger cyber/orbital tools, severe alignment and front exposure.',
    startingMetricModifiers: {
      alignmentPressure: 16,
      orbitalAccess: 8,
      cyberResilience: 8,
      maritimeControl: 4,
      financialContinuity: -4,
      aseanCohesion: -6,
      sovereignty: -2,
      mentalLoad: 6,
    },
    startingMapNodeModifiers: [
      { nodeId: 'taipei-command', stability: 6, riskLevel: -4, cyberExposure: -3 },
      { nodeId: 'china-coastal-warzone', riskLevel: 8, stability: -4 },
      { nodeId: 'maritime-imaging', stability: 4, riskLevel: -2 },
      { nodeId: 'financial-timing-link', stability: 3 },
      { nodeId: 'penang', riskLevel: 3 },
    ],
    startingWarFrontModifiers: [
      { frontId: 'pacific-war-front', intensity: 24, momentum: 10, escalation: 1, modifier: 'Frontline theatre command' },
      { frontId: 'orbital-war-front', intensity: 12, momentum: 6, modifier: 'Orbital targeting pressure' },
      { frontId: 'cyber-war-front', intensity: 6, momentum: 4, modifier: 'Frontline cyber contest' },
      { frontId: 'maritime-war-front', intensity: 5, momentum: 3, modifier: 'Counter-blockade pressure' },
    ],
    uniqueActionIds: ['harden-semiconductor-corridor', 'deploy-counter-blockade-cyber-cell'],
    disabledActionIds: ['bnm-confidence-briefing', 'quiet-asean-backchannel', 'propose-asean-shield', 'reject-alignment'],
    primaryMetrics: ['orbitalAccess', 'cyberResilience', 'maritimeControl', 'financialContinuity'],
    strategicPriorities: ['Hold the Pacific front', 'Keep semiconductor logistics alive', 'Defend orbital access', 'Break blockade pressure'],
    collapseRisks: ['China escalation', 'Orbital disruption', 'Maritime blockade', 'Semiconductor shock'],
    victoryFocus: 'Keep the frontline coalition alive long enough for the Pacific war to remain survivable.',
    factionLabelOverrides: {
      impactLabel: 'Taiwan Allied impact',
      endingSubtitle: 'Taiwan Allied Command survives by holding logistics, chips and orbital access under fire.',
    },
  },
];

export const PLAYABLE_FACTION_MAP: Record<PlayableFactionId, PlayableFactionDef> = Object.fromEntries(
  PLAYABLE_FACTIONS.map((faction) => [faction.id, faction]),
) as Record<PlayableFactionId, PlayableFactionDef>;

export function getPlayableFaction(id: string | null | undefined): PlayableFactionDef {
  return PLAYABLE_FACTION_MAP[(id as PlayableFactionId) ?? DEFAULT_PLAYABLE_FACTION_ID] ?? PLAYABLE_FACTION_MAP[DEFAULT_PLAYABLE_FACTION_ID];
}
