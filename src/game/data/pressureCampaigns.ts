import type { PressureCampaignDef } from '../types/gameTypes';

export const PRESSURE_CAMPAIGNS: PressureCampaignDef[] = [
  {
    id: 'china-scs-coercion',
    actorId: 'china-frag',
    title: 'South China Sea Coercion Campaign',
    description:
      'China sustains coast-guard, militia, cyber and legal pressure across Malaysia sea claims.',
    theatre: 'south-china-sea',
    targetNodeIds: ['malaysian-eez', 'luconia-shoals', 'scs-air-sea-corridor'],
    durationWeeks: 5,
    intensity: 2,
    tags: ['china', 'maritime', 'coercion', 'alignment'],
    counterActionTags: ['maritime', 'diplomacy', 'asean', 'orbital'],
    weeklyNodeEffects: { riskLevel: 1.5, stability: -0.5 },
    weeklyMetricEffects: { maritimeControl: -0.5, alignmentPressure: 0.5 },
    completionEffects: {
      metricEffects: { maritimeControl: -2, sovereignty: -1 },
      nodeEffects: [{ nodeId: 'luconia-shoals', riskLevel: 3 }],
    },
    disruptionEffects: {
      metricEffects: { maritimeControl: 2, aseanCohesion: 1 },
      nodeEffects: [{ nodeId: 'malaysian-eez', riskLevel: -3, stability: 2 }],
    },
    flagsAddedOnStart: ['china-scs-campaign-active'],
    flagsAddedOnCompletion: ['china-scs-campaign-landed'],
  },
  {
    id: 'markets-capital-flight',
    actorId: 'financial-markets',
    title: 'Capital Flight Cycle',
    description:
      'Market desks and rating committees repeatedly reprice Malaysian risk and liquidity.',
    theatre: 'cyber-financial',
    targetNodeIds: ['bnm-core', 'bursa-node', 'payment-rails'],
    durationWeeks: 4,
    intensity: 2,
    tags: ['markets', 'finance', 'confidence'],
    counterActionTags: ['finance', 'confidence', 'singapore'],
    weeklyNodeEffects: { riskLevel: 1.5, stability: -0.5 },
    weeklyMetricEffects: { financialContinuity: -0.35 },
    completionEffects: {
      metricEffects: { financialContinuity: -1.5, institutionalTrust: -1 },
      nodeEffects: [{ nodeId: 'bursa-node', riskLevel: 3 }],
    },
    disruptionEffects: {
      metricEffects: { financialContinuity: 3, institutionalTrust: 1 },
      nodeEffects: [{ nodeId: 'bnm-core', riskLevel: -3, stability: 2 }],
    },
    flagsAddedOnStart: ['capital-flight-cycle-active'],
  },
  {
    id: 'threat-cloud-banking-wave',
    actorId: 'threat-ecosystem',
    title: 'Cloud-Banking Attack Wave',
    description:
      'Autonomous crews chain cloud credentials, payment fraud and identity abuse into a rolling campaign.',
    theatre: 'cyber-financial',
    targetNodeIds: ['cloud-region', 'payment-rails', 'digital-id'],
    durationWeeks: 4,
    intensity: 2,
    tags: ['cyber', 'cloud', 'identity', 'banking'],
    counterActionTags: ['cyber', 'cert', 'identity'],
    weeklyNodeEffects: { riskLevel: 1.5, cyberExposure: 1.5 },
    weeklyMetricEffects: { cyberResilience: -0.5, financialContinuity: -0.25 },
    completionEffects: {
      metricEffects: { cyberResilience: -2, publicReality: -1 },
      nodeEffects: [{ nodeId: 'cloud-region', cyberExposure: 4 }],
    },
    disruptionEffects: {
      metricEffects: { cyberResilience: 3 },
      nodeEffects: [{ nodeId: 'payment-rails', riskLevel: -3, cyberExposure: -3 }],
    },
    flagsAddedOnStart: ['cloud-banking-wave-active'],
  },
  {
    id: 'pnt-degradation-cycle',
    actorId: 'threat-ecosystem',
    title: 'PNT Degradation Cycle',
    description:
      'Orbital and cyber pressure erodes positioning, navigation and timing reliability across emergency routing, settlement clocks and maritime awareness.',
    theatre: 'orbital',
    targetNodeIds: [
      'emergency-nav-mesh',
      'financial-timing-link',
      'maritime-imaging',
      'commercial-satnet',
      'asean-microsat',
    ],
    durationWeeks: 4,
    intensity: 1,
    tags: ['orbital', 'pnt', 'satellite', 'resilience'],
    counterActionTags: ['orbital', 'cyber', 'maritime', 'finance', 'resilience', 'neutrality'],
    weeklyNodeEffects: { riskLevel: 1, stability: -0.35 },
    weeklyMetricEffects: { orbitalAccess: -0.35, maritimeControl: -0.1, financialContinuity: -0.1 },
    completionEffects: {
      metricEffects: { orbitalAccess: -1.5, maritimeControl: -0.75, financialContinuity: -0.75 },
      nodeEffects: [{ nodeId: 'emergency-nav-mesh', riskLevel: 2 }],
    },
    disruptionEffects: {
      metricEffects: { orbitalAccess: 2, maritimeControl: 1 },
      nodeEffects: [{ nodeId: 'emergency-nav-mesh', riskLevel: -3, stability: 2 }],
    },
    flagsAddedOnStart: ['pnt-degradation-cycle-active'],
  },
  {
    id: 'russia-grey-zone-cyber',
    actorId: 'russia-network',
    title: 'Grey-Zone Cyber Pressure',
    description:
      'Russian-linked brokers and crews test Malaysian systems while Europe absorbs the political blast radius.',
    theatre: 'external',
    targetNodeIds: ['european-front', 'cloud-region', 'digital-id'],
    durationWeeks: 4,
    intensity: 1,
    tags: ['russia', 'cyber', 'public-reality', 'europe'],
    counterActionTags: ['cyber', 'europe', 'public-reality', 'neutrality'],
    weeklyNodeEffects: { riskLevel: 1, cyberExposure: 1 },
    weeklyMetricEffects: { publicReality: -0.5, cyberResilience: -0.25 },
    completionEffects: {
      metricEffects: { publicReality: -2, alignmentPressure: 1 },
      nodeEffects: [{ nodeId: 'european-front', riskLevel: 3, stability: -2 }],
    },
    disruptionEffects: {
      metricEffects: { publicReality: 2, cyberResilience: 1 },
      nodeEffects: [{ nodeId: 'digital-id', cyberExposure: -3 }],
    },
    flagsAddedOnStart: ['russian-grey-zone-pressure-active'],
  },
  {
    id: 'singapore-continuity-hedge',
    actorId: 'singapore-authority',
    title: 'Continuity Hedge',
    description:
      'Singapore keeps cooperation open while quietly routing capital, border control and settlement risk around Malaysia.',
    theatre: 'malacca-strait',
    targetNodeIds: ['singapore', 'singapore-strait', 'bnm-core'],
    durationWeeks: 3,
    intensity: 1,
    tags: ['singapore', 'finance', 'diplomacy', 'continuity'],
    counterActionTags: ['singapore', 'finance', 'diplomacy'],
    weeklyNodeEffects: { riskLevel: 1 },
    weeklyMetricEffects: { sovereignty: -0.25, financialContinuity: -0.25 },
    completionEffects: {
      metricEffects: { sovereignty: -2 },
      nodeEffects: [{ nodeId: 'singapore', stability: 2 }],
    },
    disruptionEffects: {
      metricEffects: { financialContinuity: 2, sovereignty: 1 },
      nodeEffects: [{ nodeId: 'singapore-strait', riskLevel: -2 }],
    },
    flagsAddedOnStart: ['singapore-continuity-hedge-active'],
  },
  {
    id: 'europe-sanctions-track',
    actorId: 'europe-compact',
    title: 'Sanctions Pressure Track',
    description:
      'Europe coordinates sanctions pressure, market access warnings and Russia attribution demands.',
    theatre: 'external',
    targetNodeIds: ['european-front', 'russia-network-node', 'bnm-core'],
    durationWeeks: 4,
    intensity: 1,
    tags: ['europe', 'sanctions', 'alignment', 'diplomacy'],
    counterActionTags: ['diplomacy', 'neutrality', 'asean', 'europe'],
    weeklyNodeEffects: { riskLevel: 1 },
    weeklyMetricEffects: { alignmentPressure: 0.5 },
    completionEffects: {
      metricEffects: { alignmentPressure: 2, financialContinuity: -1 },
      nodeEffects: [{ nodeId: 'european-front', stability: 2 }],
      flagsAdded: ['europe-sanctions-pressure-landed'],
    },
    disruptionEffects: {
      metricEffects: { alignmentPressure: -2, aseanCohesion: 1 },
      nodeEffects: [{ nodeId: 'bnm-core', riskLevel: -2 }],
    },
    flagsAddedOnStart: ['europe-sanctions-track-active'],
    flagsAddedOnCompletion: ['europe-sanctions-track-landed'],
  },
];

export function getPressureCampaign(id: string): PressureCampaignDef | undefined {
  return PRESSURE_CAMPAIGNS.find((campaign) => campaign.id === id);
}
