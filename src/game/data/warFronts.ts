import type { WarFrontDef, WarFrontId } from '../types/gameTypes';

export const WAR_FRONTS: WarFrontDef[] = [
  {
    id: 'pacific-war-front',
    name: 'Pacific War Front',
    description:
      'Taiwan Allied Command and China Fragmenting Command trade pressure across the Pacific, pulling US PACOM and ASEAN into the blast radius.',
    theatre: 'south-china-sea',
    intensity: 38,
    momentum: 4,
    escalationLevel: 2,
    dominantSide: 'Taiwan Allied Command / China Fragmenting Command',
    linkedActors: ['taiwan-allied', 'china-frag', 'us-pacom'],
    linkedMapNodes: [
      'taipei-command',
      'china-coastal-warzone',
      'us-pacom-node',
      'penang',
      'malaysian-eez',
      'luconia-shoals',
      'maritime-imaging',
      'financial-timing-link',
    ],
    linkedMetrics: ['alignmentPressure', 'aseanCohesion', 'maritimeControl', 'financialContinuity'],
    activeModifiers: ['Pacific combat tempo'],
    tags: ['pacific', 'taiwan', 'china', 'semiconductors', 'alignment'],
  },
  {
    id: 'european-pressure-front',
    name: 'European Pressure Front',
    description:
      'Russia Eurasian Network and the European Defence Compact export sanctions demands, cyber pressure and market anxiety into neutral states.',
    theatre: 'external',
    intensity: 30,
    momentum: 3,
    escalationLevel: 2,
    dominantSide: 'Russia Eurasian Network / European Defence Compact',
    linkedActors: ['russia-network', 'europe-compact', 'financial-markets'],
    linkedMapNodes: ['european-front', 'russia-network-node', 'cloud-region', 'bnm-core', 'bursa-node'],
    linkedMetrics: ['alignmentPressure', 'financialContinuity', 'cyberResilience', 'publicReality'],
    activeModifiers: ['Sanctions bargaining'],
    tags: ['europe', 'russia', 'sanctions', 'markets', 'cyber'],
  },
  {
    id: 'orbital-war-front',
    name: 'Orbital War Front',
    description:
      'US, Taiwan, China and Russia contest positioning, timing, satellite internet and maritime imaging infrastructure.',
    theatre: 'orbital',
    intensity: 28,
    momentum: 3,
    escalationLevel: 1,
    dominantSide: 'US / Taiwan / China / Russia space contest',
    linkedActors: ['us-pacom', 'taiwan-allied', 'china-frag', 'russia-network'],
    linkedMapNodes: [
      'asean-microsat',
      'commercial-satnet',
      'financial-timing-link',
      'maritime-imaging',
      'emergency-nav-mesh',
    ],
    linkedMetrics: ['orbitalAccess', 'maritimeControl', 'financialContinuity'],
    activeModifiers: ['PNT contested'],
    tags: ['orbital', 'pnt', 'satellite', 'timing'],
  },
  {
    id: 'cyber-war-front',
    name: 'Cyber War Front',
    description:
      'State services and the autonomous threat ecosystem turn cloud, identity, payments and public reality into continuous battle space.',
    theatre: 'cyber-financial',
    intensity: 34,
    momentum: 4,
    escalationLevel: 2,
    dominantSide: 'State actors / Autonomous Threat Ecosystem',
    linkedActors: ['threat-ecosystem', 'china-frag', 'russia-network', 'us-pacom', 'taiwan-allied'],
    linkedMapNodes: ['cloud-region', 'digital-id', 'payment-rails', 'bnm-core', 'kuala-lumpur'],
    linkedMetrics: ['cyberResilience', 'publicReality', 'financialContinuity', 'institutionalTrust'],
    activeModifiers: ['Autonomous attack surface'],
    tags: ['cyber', 'cloud', 'identity', 'payments', 'disinformation'],
  },
  {
    id: 'maritime-war-front',
    name: 'Maritime War Front',
    description:
      'South China Sea coercion, Malacca routing risk and Pacific shipping shocks converge on Malaysian ports and energy flows.',
    theatre: 'malacca-strait',
    intensity: 32,
    momentum: 3,
    escalationLevel: 2,
    dominantSide: 'South China Sea / Malacca / Pacific shipping conflict',
    linkedActors: ['china-frag', 'indonesia-maritime', 'singapore-authority', 'financial-markets'],
    linkedMapNodes: ['malacca-strait', 'singapore-strait', 'malaysian-eez', 'luconia-shoals', 'port-klang'],
    linkedMetrics: ['maritimeControl', 'energyAssurance', 'financialContinuity', 'aseanCohesion'],
    activeModifiers: ['War-risk insurance'],
    tags: ['maritime', 'shipping', 'malacca', 'scs', 'energy'],
  },
  {
    id: 'financial-war-front',
    name: 'Financial War Front',
    description:
      'Markets, sanctions, currency stress, capital flight, CBDC confidence and insurance pricing turn neutrality into a balance-sheet problem.',
    theatre: 'cyber-financial',
    intensity: 28,
    momentum: 3,
    escalationLevel: 1,
    dominantSide: 'Markets / sanctions / currency / insurance',
    linkedActors: ['financial-markets', 'singapore-authority', 'europe-compact', 'us-pacom'],
    linkedMapNodes: ['bnm-core', 'bursa-node', 'payment-rails', 'singapore', 'financial-timing-link'],
    linkedMetrics: ['financialContinuity', 'sovereignty', 'institutionalTrust', 'alignmentPressure'],
    activeModifiers: ['Capital-flow sensitivity'],
    tags: ['finance', 'markets', 'capital', 'sanctions', 'singapore'],
  },
];

export const WAR_FRONT_MAP: Record<WarFrontId, WarFrontDef> = Object.fromEntries(
  WAR_FRONTS.map((front) => [front.id, front]),
) as Record<WarFrontId, WarFrontDef>;

export function getWarFront(id: string): WarFrontDef | undefined {
  return WAR_FRONTS.find((front) => front.id === id);
}
