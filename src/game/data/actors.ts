import type { ActorDef, ActorId } from '../types/gameTypes';

export const ACTORS: ActorDef[] = [
  // -------------------------------------------------------------------------
  {
    id: 'us-pacom',
    name: 'United States Pacific Command',
    short: 'US PACOM',
    description:
      'Washington pivoted hard to APAC and left Europe on read. It wants ' +
      'Malaysia inside the tent — ports, satellites, cyber corridors — and ' +
      'it is offering carrots with strings visible from orbit.',
    wants: ['APAC alignment', 'China containment', 'Port access', 'Cyber/orbital cooperation'],
    initial: { relationship: 20, pressure: 30, aggression: 35, intent: 'Court Malaysia into the containment lattice' },
    phaseAggression: { 2: 10, 4: 10 },
    moves: [
      {
        id: 'us-cyber-package',
        name: 'Offers cyber defense package',
        report:
          'US PACOM tables a cyber defense assistance package — sensors, threat feeds, and a liaison cell in Cyberjaya. Terms attached.',
        weight: 3,
        metricEffects: { alignmentPressure: 4 },
        actorEffects: [{ actorId: 'us-pacom', relationship: 3 }],
        flagsAdded: ['us-package-offered'],
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: -2, momentum: -3, modifier: 'US cyber assistance' },
          { frontId: 'pacific-war-front', intensity: 1, momentum: 2, modifier: 'US security offer' },
        ],
        cooldown: 8,
      },
      {
        id: 'us-request-alignment',
        name: 'Requests Malaysian alignment',
        report:
          'A US envoy requests Malaysia "clarify its posture" on the Pacific conflict. The word "partner" is used eleven times.',
        weight: 3,
        metricEffects: { alignmentPressure: 6, sovereignty: -2 },
        actorEffects: [{ actorId: 'us-pacom', pressure: 6 }],
        warFrontEffects: [{ frontId: 'pacific-war-front', intensity: 3, momentum: 4, modifier: 'US alignment request' }],
        cooldown: 4,
      },
      {
        id: 'us-sanctions-pressure',
        name: 'Pressures sanctions compliance',
        report:
          'US Treasury flags Malaysian entities for secondary sanctions exposure over dual-use transshipment. Compliance costs bite.',
        weight: 2,
        phases: [2, 3, 4, 5],
        metricEffects: { financialContinuity: -3, alignmentPressure: 4 },
        actorEffects: [{ actorId: 'us-pacom', pressure: 5, relationship: -2 }],
        warFrontEffects: [
          { frontId: 'european-pressure-front', intensity: 2, momentum: 3, modifier: 'Secondary sanctions' },
          { frontId: 'financial-war-front', intensity: 2, momentum: 3, modifier: 'Sanctions compliance risk' },
        ],
        cooldown: 6,
      },
      {
        id: 'us-orbital-offer',
        name: 'Offers orbital coverage',
        report:
          'US PACOM offers backup PNT and satellite communications coverage for the Straits — contingent on basing conversations.',
        weight: 2,
        nodeEffects: [
          { nodeId: 'commercial-satnet', stability: 4 },
          { nodeId: 'financial-timing-link', stability: 3 },
        ],
        phases: [3, 4, 5],
        metricEffects: { orbitalAccess: 3, alignmentPressure: 3 },
        flagsAdded: ['us-orbital-offered'],
        warFrontEffects: [
          { frontId: 'orbital-war-front', intensity: -2, momentum: -2, modifier: 'US orbital coverage' },
          { frontId: 'pacific-war-front', intensity: 2, momentum: 3, modifier: 'US orbital leverage' },
        ],
        cooldown: 8,
      },
      {
        id: 'us-port-access',
        name: 'Requests port access',
        report:
          'US logistics command requests expanded access rotations through Malaysian ports. China will notice within the hour.',
        weight: 2,
        phases: [2, 3, 4, 5],
        metricEffects: { alignmentPressure: 5 },
        actorEffects: [
          { actorId: 'us-pacom', pressure: 4 },
          { actorId: 'china-frag', pressure: 4 },
        ],
        warFrontEffects: [
          { frontId: 'pacific-war-front', intensity: 4, momentum: 5, modifier: 'Port-access contest' },
          { frontId: 'maritime-war-front', intensity: 2, momentum: 3, modifier: 'US logistics pressure' },
        ],
        cooldown: 6,
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    id: 'china-frag',
    name: 'China Fragmenting Command',
    short: 'China',
    description:
      'Bleeding in the Pacific war and internally fractured, Beijing is ' +
      'weaker but meaner. It cannot afford to lose ASEAN too, and it will ' +
      'spend cyber, maritime and economic coercion to keep the region unaligned.',
    wants: ['Punish Taiwan supporters', 'Block ASEAN-US alignment', 'Keep SCS pressure alive'],
    initial: { relationship: -10, pressure: 40, aggression: 50, intent: 'Deter Malaysian drift toward Washington' },
    phaseAggression: { 2: 15, 4: 10 },
    dynamics: [
      { requiresFlags: ['aligned-us'], multiplier: 1.4 },
      { requiresFlags: ['supported-taiwan'], multiplier: 1.25 },
      { requiresFlags: ['strict-neutrality'], multiplier: 0.75 },
      { metricAbove: { maritimeControl: 65 }, multiplier: 1.2 },
    ],
    moves: [
      {
        id: 'cn-cyber-probing',
        name: 'Cyber probing campaign',
        report:
          'Sustained probing of Malaysian government and port networks, consistent with known China-nexus activity. Attribution: deniable, as always.',
        weight: 3,
        nodeEffects: [{ nodeId: 'port-klang', cyberExposure: 3, riskLevel: 2 }],
        metricEffects: { cyberResilience: -3 },
        actorEffects: [{ actorId: 'china-frag', pressure: 3 }],
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: 4, momentum: 4, modifier: 'China cyber probing' },
          { frontId: 'pacific-war-front', intensity: 1, momentum: 2, modifier: 'China cyber pressure' },
        ],
        cooldown: 3,
      },
      {
        id: 'cn-maritime-pressure',
        name: 'Maritime pressure near Luconia',
        report:
          'Chinese coast guard and maritime militia loiter near Luconia Shoals. Fishing fleets with unusual antenna arrays follow.',
        weight: 3,
        incidents: [{ incidentId: 'china-maritime-shadowing', nodeId: 'luconia-shoals' }],
        pressureCampaigns: [{ templateId: 'china-scs-coercion' }],
        metricEffects: { maritimeControl: -3, energyAssurance: -1 },
        actorEffects: [{ actorId: 'china-frag', pressure: 4 }],
        warFrontEffects: [
          { frontId: 'pacific-war-front', intensity: 3, momentum: 4, modifier: 'SCS coercion' },
          { frontId: 'maritime-war-front', intensity: 4, momentum: 5, modifier: 'Luconia pressure' },
        ],
        cooldown: 4,
      },
      {
        id: 'cn-propaganda',
        name: 'Propaganda campaign',
        report:
          'Coordinated inauthentic networks push "ASEAN neutrality means rejecting Washington" narratives into Malaysian feeds.',
        weight: 2,
        metricEffects: { publicReality: -3, aseanCohesion: -1 },
        warFrontEffects: [{ frontId: 'cyber-war-front', intensity: 2, momentum: 2, modifier: 'Information pressure' }],
        cooldown: 4,
      },
      {
        id: 'cn-economic-coercion',
        name: 'Economic coercion',
        report:
          'Chinese customs discovers sudden "quality issues" with Malaysian palm oil and E&E exports. The message is not subtle.',
        weight: 2,
        phases: [2, 3, 4, 5],
        metricEffects: { financialContinuity: -3, energyAssurance: -1 },
        actorEffects: [{ actorId: 'china-frag', pressure: 4 }],
        warFrontEffects: [
          { frontId: 'financial-war-front', intensity: 3, momentum: 3, modifier: 'China economic coercion' },
          { frontId: 'pacific-war-front', intensity: 2, momentum: 2, modifier: 'Export coercion' },
        ],
        cooldown: 6,
      },
      {
        id: 'cn-escalation-warning',
        name: 'Escalation warning',
        report:
          'Beijing issues a rare formal warning: facilitation of "hostile military activity" from Malaysian territory will have consequences.',
        weight: 1,
        nodeEffects: [
          { nodeId: 'scs-air-sea-corridor', riskLevel: 6 },
          { nodeId: 'malaysian-eez', riskLevel: 4 },
        ],
        phases: [3, 4, 5],
        requiresFlags: ['aligned-us'],
        metricEffects: { sovereignty: -3, mentalLoad: 5 },
        actorEffects: [{ actorId: 'china-frag', pressure: 8, aggression: 5 }],
        warFrontEffects: [
          { frontId: 'pacific-war-front', intensity: 5, momentum: 6, escalation: 1, modifier: 'China escalation warning' },
          { frontId: 'maritime-war-front', intensity: 4, momentum: 5, modifier: 'SCS escalation warning' },
        ],
        cooldown: 10,
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    id: 'taiwan-allied',
    name: 'Taiwan Allied Command',
    short: 'Taiwan Allied',
    description:
      'Taipei and its coalition are fighting for survival and winning more ' +
      'than anyone expected. They need quiet friends, semiconductor logistics, ' +
      'and cyber intelligence corridors through Southeast Asia.',
    wants: ['Regional support', 'Semiconductor logistics', 'Cyber intel corridors', 'Legitimacy'],
    initial: { relationship: 10, pressure: 15, aggression: 30, intent: 'Recruit quiet enablers without burning them' },
    phaseAggression: { 2: 15 },
    moves: [
      {
        id: 'tw-quiet-support',
        name: 'Requests quiet support',
        report:
          'Taiwan Allied Command quietly asks Malaysia for overflight tolerance and humanitarian port calls. Nothing on paper.',
        weight: 3,
        phases: [2, 3, 4, 5],
        metricEffects: { alignmentPressure: 3 },
        actorEffects: [{ actorId: 'taiwan-allied', pressure: 3 }],
        warFrontEffects: [{ frontId: 'pacific-war-front', intensity: 3, momentum: 3, modifier: 'Taiwan support request' }],
        cooldown: 6,
      },
      {
        id: 'tw-cyber-intel',
        name: 'Offers cyber intelligence',
        report:
          'Taiwanese CERT shares fresh indicators on China-nexus intrusion sets active in ASEAN networks. The data is good.',
        weight: 2,
        metricEffects: { cyberResilience: 3 },
        actorEffects: [{ actorId: 'taiwan-allied', relationship: 3 }],
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: -2, momentum: -2, modifier: 'Taiwan cyber intelligence' },
          { frontId: 'pacific-war-front', intensity: 1, momentum: 1, modifier: 'Taiwan intelligence link' },
        ],
        cooldown: 5,
      },
      {
        id: 'tw-semiconductor',
        name: 'Offers semiconductor access',
        report:
          'Taipei offers priority wafer allocation for Malaysian packaging plants — a lifeline for Penang, a red flag for Beijing.',
        weight: 2,
        nodeEffects: [{ nodeId: 'penang', stability: 3 }],
        phases: [2, 3, 4, 5],
        metricEffects: { financialContinuity: 3 },
        actorEffects: [
          { actorId: 'taiwan-allied', relationship: 3 },
          { actorId: 'china-frag', pressure: 3 },
        ],
        warFrontEffects: [
          { frontId: 'pacific-war-front', intensity: 2, momentum: 2, modifier: 'Semiconductor linkage' },
          { frontId: 'financial-war-front', intensity: -1, momentum: -1, modifier: 'Wafer allocation' },
        ],
        cooldown: 8,
      },
      {
        id: 'tw-gratitude',
        name: 'Publicly thanks "regional friends"',
        report:
          'A Taiwanese official thanks unnamed "regional friends" for support. Beijing\'s analysts begin drawing up a list.',
        weight: 1,
        requiresFlags: ['supported-taiwan'],
        metricEffects: { publicReality: -2 },
        actorEffects: [{ actorId: 'china-frag', pressure: 5, aggression: 3 }],
        warFrontEffects: [{ frontId: 'pacific-war-front', intensity: 4, momentum: 4, modifier: 'Taiwan public signal' }],
        cooldown: 10,
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    id: 'russia-network',
    name: 'Russia Eurasian Network',
    short: 'Russia',
    description:
      'Victorious in Ukraine and running a profitable grey-zone franchise, ' +
      'Moscow sells chaos wholesale: cyber mercenaries, disinformation kits, ' +
      'discounted energy. Europe screams; nobody in Washington picks up.',
    wants: ['Profit from chaos', 'Weaken US influence', 'Sell grey-zone tools', 'Exploit neutrals'],
    initial: { relationship: -5, pressure: 20, aggression: 40, intent: 'Monetize Malaysian anxiety' },
    phaseAggression: { 3: 10, 4: 5 },
    dynamics: [
      { requiresFlags: ['condemned-russia'], multiplier: 1.5 },
      { requiresFlags: ['engaged-europe'], multiplier: 1.3 },
    ],
    moves: [
      {
        id: 'ru-grey-tools',
        name: 'Offers grey-market cyber tools',
        report:
          'A Russian intermediary offers "defensive cyber capabilities, very effective, very deniable" at friendship prices.',
        weight: 2,
        dynamics: [{ metricBelow: { cyberResilience: 45 }, multiplier: 2 }],
        forbidsFlags: ['condemned-russia'],
        metricEffects: { mentalLoad: 2 },
        flagsAdded: ['russia-tools-offered'],
        warFrontEffects: [{ frontId: 'cyber-war-front', intensity: 2, momentum: 3, modifier: 'Russian grey-market tools' }],
        cooldown: 8,
      },
      {
        id: 'ru-disinfo',
        name: 'Spreads disinformation',
        report:
          'Russian-linked networks amplify claims that a Malaysian bank has secretly failed. It has not. Withdrawals spike anyway.',
        weight: 3,
        nodeEffects: [
          { nodeId: 'digital-id', riskLevel: 4 },
          { nodeId: 'kuala-lumpur', riskLevel: 2 },
        ],
        metricEffects: { publicReality: -3, financialContinuity: -1 },
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: 3, momentum: 3, modifier: 'Russian disinformation' },
          { frontId: 'european-pressure-front', intensity: 2, momentum: 2, modifier: 'Russia grey-zone export' },
        ],
        cooldown: 4,
      },
      {
        id: 'ru-energy-discount',
        name: 'Energy discount offer',
        report:
          'Moscow offers discounted crude and LNG swaps "with flexible settlement". US Treasury would like a word if you accept.',
        weight: 2,
        forbidsFlags: ['condemned-russia'],
        metricEffects: { energyAssurance: 2, alignmentPressure: 2 },
        warFrontEffects: [
          { frontId: 'european-pressure-front', intensity: 1, momentum: 2, modifier: 'Russian energy offer' },
          { frontId: 'financial-war-front', intensity: 1, momentum: 1, modifier: 'Flexible settlement risk' },
        ],
        cooldown: 8,
      },
      {
        id: 'ru-cyber-mercenary',
        name: 'Cyber mercenary activity',
        report:
          'A Russian-speaking mercenary crew tests Malaysian financial infrastructure — freelancing, or an advertisement of services.',
        weight: 2,
        incidents: [{ incidentId: 'russian-cyber-mercenary-probe', nodeId: 'payment-rails' }],
        pressureCampaigns: [{ templateId: 'russia-grey-zone-cyber' }],
        phases: [2, 3, 4, 5],
        metricEffects: { cyberResilience: -3, financialContinuity: -1 },
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: 4, momentum: 5, modifier: 'Cyber mercenary activity' },
          { frontId: 'european-pressure-front', intensity: 3, momentum: 4, modifier: 'Russian cyber spillover' },
        ],
        cooldown: 5,
      },
      {
        id: 'ru-retaliation',
        name: 'Retaliates for European support',
        report:
          'After Malaysia\'s pro-European posture, Russian-linked crews hit Malaysian logistics and media with a coordinated grey-zone package.',
        weight: 3,
        incidents: [{ incidentId: 'grey-zone-probe', nodeId: 'cloud-region' }],
        nodeEffects: [{ nodeId: 'european-front', riskLevel: 3 }],
        pressureCampaigns: [{ templateId: 'russia-grey-zone-cyber' }],
        requiresFlags: ['condemned-russia'],
        metricEffects: { cyberResilience: -5, publicReality: -4, energyAssurance: -3 },
        actorEffects: [{ actorId: 'russia-network', pressure: 6, aggression: 5 }],
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: 5, momentum: 6, modifier: 'Russian retaliation package' },
          { frontId: 'european-pressure-front', intensity: 4, momentum: 5, modifier: 'Europe-Russia retaliation' },
        ],
        cooldown: 6,
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    id: 'europe-compact',
    name: 'European Defence Compact',
    short: 'Europe',
    description:
      'Abandoned mid-crisis by its main ally, Europe is rearming in a hurry ' +
      'and demanding the world take Russian aggression seriously. It has ' +
      'intelligence to share and market access to withhold.',
    wants: ['Contain Russia', 'Pressure neutrals', 'Restore credibility without the US'],
    initial: { relationship: 15, pressure: 20, aggression: 30, intent: 'Recruit moral support and sanctions alignment' },
    phaseAggression: { 4: 5, 5: 5 },
    dynamics: [
      { requiresFlags: ['baltic-violation'], multiplier: 1.3 },
      { requiresFlags: ['engaged-europe'], multiplier: 1.2 },
    ],
    moves: [
      {
        id: 'eu-sanctions-request',
        name: 'Requests ASEAN sanctions',
        report:
          'The European Defence Compact formally asks ASEAN states to join expanded Russia sanctions. Jakarta looks at Kuala Lumpur. Kuala Lumpur looks away.',
        weight: 3,
        dynamics: [{ requiresFlags: ['baltic-violation'], multiplier: 1.5 }],
        pressureCampaigns: [{ templateId: 'europe-sanctions-track' }],
        metricEffects: { alignmentPressure: 4 },
        actorEffects: [{ actorId: 'europe-compact', pressure: 5 }],
        warFrontEffects: [
          { frontId: 'european-pressure-front', intensity: 4, momentum: 4, modifier: 'ASEAN sanctions request' },
          { frontId: 'financial-war-front', intensity: 2, momentum: 2, modifier: 'Sanctions market fear' },
        ],
        cooldown: 5,
      },
      {
        id: 'eu-cyber-intel',
        name: 'Offers cyber intelligence',
        report:
          'European agencies share telemetry on Russian grey-zone operations in Asia — a goodwill sample of a larger package.',
        weight: 2,
        metricEffects: { cyberResilience: 3 },
        actorEffects: [{ actorId: 'europe-compact', relationship: 3 }],
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: -2, momentum: -2, modifier: 'European cyber intelligence' },
          { frontId: 'european-pressure-front', intensity: 1, momentum: 1, modifier: 'Europe intelligence link' },
        ],
        cooldown: 6,
      },
      {
        id: 'eu-market-threat',
        name: 'Threatens market restrictions',
        report:
          'Brussels floats "alignment-based" market access reviews for states seen as neutrality-profiteers. Malaysian exporters sweat.',
        weight: 2,
        phases: [3, 4, 5],
        maxRelationship: 20,
        pressureCampaigns: [{ templateId: 'europe-sanctions-track' }],
        metricEffects: { financialContinuity: -3, alignmentPressure: 3 },
        actorEffects: [{ actorId: 'europe-compact', pressure: 5 }],
        warFrontEffects: [
          { frontId: 'european-pressure-front', intensity: 3, momentum: 4, modifier: 'European market restrictions' },
          { frontId: 'financial-war-front', intensity: 3, momentum: 3, modifier: 'Market access threat' },
        ],
        cooldown: 8,
      },
      {
        id: 'eu-condemnation-ask',
        name: 'Asks for condemnation of Russia',
        report:
          'European ambassadors jointly request Malaysia publicly condemn the latest Russian provocation in the Baltics.',
        weight: 2,
        dynamics: [{ requiresFlags: ['baltic-violation'], multiplier: 1.5 }],
        forbidsFlags: ['condemned-russia'],
        metricEffects: { alignmentPressure: 3 },
        actorEffects: [{ actorId: 'europe-compact', pressure: 4 }],
        warFrontEffects: [{ frontId: 'european-pressure-front', intensity: 3, momentum: 3, modifier: 'Condemnation request' }],
        cooldown: 6,
      },
      {
        id: 'eu-instability-warning',
        name: 'Warns of European instability',
        report:
          'European officials privately warn that a second front is possible and supply chains through Europe cannot be guaranteed.',
        weight: 1,
        nodeEffects: [{ nodeId: 'european-front', riskLevel: 5, stability: -3 }],
        phases: [3, 4, 5],
        metricEffects: { financialContinuity: -2, mentalLoad: 3 },
        warFrontEffects: [
          { frontId: 'european-pressure-front', intensity: 4, momentum: 4, modifier: 'European instability warning' },
          { frontId: 'financial-war-front', intensity: 2, momentum: 2, modifier: 'European supply-chain fear' },
        ],
        cooldown: 8,
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    id: 'singapore-authority',
    name: 'Singapore Continuity Authority',
    short: 'Singapore',
    description:
      'The island next door has one plan: continuity. It will cooperate ' +
      'generously with a stable Malaysia and hedge ruthlessly against an ' +
      'unstable one — sometimes in the same afternoon.',
    wants: ['Financial stability', 'Border/logistics continuity', 'Water & food security', 'No Malaysian collapse'],
    initial: { relationship: 35, pressure: 15, aggression: 25, intent: 'Stabilize the neighbour, hedge the downside' },
    phaseAggression: { 4: 10, 5: 5 },
    moves: [
      {
        id: 'sg-banking-coop',
        name: 'Offers banking continuity cooperation',
        report:
          'MAS proposes joint settlement fallback arrangements with BNM — mutual insurance against timing attacks on either system.',
        weight: 3,
        nodeEffects: [{ nodeId: 'bnm-core', riskLevel: -4, stability: 2 }],
        dynamics: [{ metricBelow: { financialContinuity: 50 }, metricAbove: { institutionalTrust: 45 }, multiplier: 2.5 }],
        metricEffects: { financialContinuity: 3 },
        actorEffects: [{ actorId: 'singapore-authority', relationship: 3 }],
        flagsAdded: ['sg-banking-offered'],
        warFrontEffects: [
          { frontId: 'financial-war-front', intensity: -3, momentum: -4, modifier: 'MAS-BNM fallback' },
          { frontId: 'cyber-war-front', intensity: -1, momentum: -1, modifier: 'Cross-border cyber watch' },
        ],
        cooldown: 6,
      },
      {
        id: 'sg-border-tighten',
        name: 'Tightens border posture',
        report:
          'Singapore quietly tightens Causeway and Tuas screening, citing "regional conditions". Johor commuters absorb the cost.',
        weight: 2,
        incidents: [{ incidentId: 'border-liquidity-shift', nodeId: 'singapore-strait' }],
        pressureCampaigns: [{ templateId: 'singapore-continuity-hedge' }],
        dynamics: [
          { metricBelow: { publicReality: 45 }, multiplier: 2 },
          { metricBelow: { institutionalTrust: 45 }, multiplier: 2 },
        ],
        metricEffects: { financialContinuity: -1, publicReality: -1 },
        actorEffects: [{ actorId: 'singapore-authority', pressure: 3 }],
        warFrontEffects: [
          { frontId: 'maritime-war-front', intensity: 1, momentum: 2, modifier: 'Singapore border tightening' },
          { frontId: 'financial-war-front', intensity: 2, momentum: 2, modifier: 'Continuity hedge' },
        ],
        cooldown: 5,
      },
      {
        id: 'sg-capital-attract',
        name: 'Attracts capital flight',
        report:
          'Singaporean banks report record inflows of Malaysian corporate deposits. Nobody calls it capital flight in public.',
        weight: 2,
        nodeEffects: [
          { nodeId: 'bnm-core', riskLevel: 4 },
          { nodeId: 'singapore', stability: 2 },
        ],
        pressureCampaigns: [{ templateId: 'singapore-continuity-hedge' }],
        metricEffects: { financialContinuity: -3 },
        warFrontEffects: [{ frontId: 'financial-war-front', intensity: 4, momentum: 4, modifier: 'Singapore capital inflow' }],
        cooldown: 5,
      },
      {
        id: 'sg-joint-cyber',
        name: 'Requests joint cyber defense',
        report:
          'Singapore proposes a joint cyber defense watch floor for cross-border financial and port infrastructure.',
        weight: 2,
        metricEffects: { cyberResilience: 2 },
        actorEffects: [{ actorId: 'singapore-authority', relationship: 2 }],
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: -2, momentum: -3, modifier: 'Singapore joint cyber floor' },
          { frontId: 'financial-war-front', intensity: -1, momentum: -2, modifier: 'Financial cyber cooperation' },
        ],
        cooldown: 6,
      },
      {
        id: 'sg-instability-pressure',
        name: 'Pressures Malaysia over instability',
        report:
          'Singapore delivers a blunt démarche: stabilize your financial and information environment, or contingency measures follow.',
        weight: 3,
        metricEffects: { institutionalTrust: -3, mentalLoad: 3 },
        actorEffects: [{ actorId: 'singapore-authority', pressure: 6 }],
        warFrontEffects: [{ frontId: 'financial-war-front', intensity: 2, momentum: 3, modifier: 'Singapore contingency pressure' }],
        cooldown: 6,
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    id: 'indonesia-maritime',
    name: 'Indonesia Maritime Command',
    short: 'Indonesia',
    description:
      'Jakarta smells an opportunity to lead ASEAN through the fracture. Its ' +
      'maritime posture is genuinely stabilizing — and genuinely a bid for ' +
      'the chairmanship of whatever comes next.',
    wants: ['ASEAN leadership', 'Maritime security', 'Archipelago stability'],
    initial: { relationship: 30, pressure: 15, aggression: 30, intent: 'Lead ASEAN through the fracture' },
    phaseAggression: { 4: 15 },
    moves: [
      {
        id: 'id-maritime-summit',
        name: 'Calls maritime summit',
        report:
          'Indonesia convenes an emergency maritime security summit in Jakarta. Malaysia is invited — pointedly, as a participant, not co-chair.',
        weight: 3,
        nodeEffects: [{ nodeId: 'jakarta', stability: 2 }],
        metricEffects: { aseanCohesion: 3, maritimeControl: 2 },
        actorEffects: [{ actorId: 'indonesia-maritime', relationship: 2 }],
        warFrontEffects: [
          { frontId: 'maritime-war-front', intensity: -3, momentum: -4, modifier: 'Indonesia maritime summit' },
          { frontId: 'pacific-war-front', intensity: -1, momentum: -2, modifier: 'ASEAN maritime forum' },
        ],
        cooldown: 6,
      },
      {
        id: 'id-patrols',
        name: 'Increases patrols',
        report:
          'Indonesian Navy surges patrols across the archipelagic sea lanes. Piracy drops; so does Malaysian visibility in shared waters.',
        weight: 2,
        nodeEffects: [{ nodeId: 'batam-corridor', stability: 3, riskLevel: -3 }],
        metricEffects: { maritimeControl: -2, aseanCohesion: 2 },
        warFrontEffects: [{ frontId: 'maritime-war-front', intensity: -2, momentum: -3, modifier: 'Indonesian patrol surge' }],
        cooldown: 5,
      },
      {
        id: 'id-asean-shield',
        name: 'Proposes ASEAN Shield',
        report:
          'Jakarta floats "ASEAN Shield" — a collective maritime and cyber defense arrangement. The question is who leads it.',
        weight: 2,
        phases: [3, 4, 5],
        metricEffects: { aseanCohesion: 4 },
        flagsAdded: ['id-shield-proposed'],
        warFrontEffects: [
          { frontId: 'maritime-war-front', intensity: -2, momentum: -3, modifier: 'ASEAN Shield proposal' },
          { frontId: 'pacific-war-front', intensity: -1, momentum: -2, modifier: 'ASEAN defense forum' },
        ],
        cooldown: 10,
      },
      {
        id: 'id-export-restrict',
        name: 'Restricts exports',
        report:
          'Indonesia restricts food and coal exports citing national resilience. Regional prices jump within days.',
        weight: 2,
        phases: [3, 4, 5],
        metricEffects: { energyAssurance: -2, financialContinuity: -1 },
        warFrontEffects: [
          { frontId: 'maritime-war-front', intensity: 1, momentum: 2, modifier: 'Regional export restriction' },
          { frontId: 'financial-war-front', intensity: 2, momentum: 2, modifier: 'Commodity price jump' },
        ],
        cooldown: 8,
      },
      {
        id: 'id-leadership-challenge',
        name: 'Challenges Malaysian leadership',
        report:
          'Indonesian officials brief press that Malaysia "lacks the weight" to anchor ASEAN crisis response. It stings because it might be true.',
        weight: 1,
        phases: [4, 5],
        metricEffects: { aseanCohesion: -3, institutionalTrust: -2 },
        actorEffects: [{ actorId: 'indonesia-maritime', pressure: 4 }],
        cooldown: 8,
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    id: 'financial-markets',
    name: 'Financial Markets',
    short: 'Markets',
    description:
      'Not a government, not a person — a weather system made of money. It ' +
      'rewards stability, punishes ambiguity, and reads every headline twice ' +
      'before you do.',
    wants: ['Stability', 'Returns', 'Predictability'],
    initial: { relationship: 0, pressure: 25, aggression: 35, intent: 'Reprice Malaysian risk continuously' },
    phaseAggression: { 3: 15, 4: 5 },
    moves: [
      {
        id: 'mkt-capital-flight',
        name: 'Capital flight',
        report:
          'Foreign funds rotate out of ringgit assets. The outflow is orderly, which somehow makes it worse.',
        weight: 2,
        incidents: [{ incidentId: 'capital-flight-pressure', nodeId: 'bnm-core' }],
        pressureCampaigns: [{ templateId: 'markets-capital-flight' }],
        dynamics: [{ metricBelow: { financialContinuity: 45 }, multiplier: 2.5 }],
        metricEffects: { financialContinuity: -4 },
        warFrontEffects: [{ frontId: 'financial-war-front', intensity: 5, momentum: 6, modifier: 'Capital flight' }],
        cooldown: 4,
      },
      {
        id: 'mkt-insurance-spike',
        name: 'Insurance spike',
        report:
          'War-risk insurance premiums for Straits transits spike 40%. Shippers begin quietly rerouting.',
        weight: 2,
        nodeEffects: [{ nodeId: 'malacca-strait', riskLevel: 5 }],
        dynamics: [{ metricBelow: { maritimeControl: 45 }, multiplier: 2.5 }],
        phases: [2, 3, 4, 5],
        metricEffects: { maritimeControl: -2, energyAssurance: -1 },
        warFrontEffects: [
          { frontId: 'maritime-war-front', intensity: 4, momentum: 5, modifier: 'War-risk insurance spike' },
          { frontId: 'financial-war-front', intensity: 2, momentum: 2, modifier: 'Shipping insurance repricing' },
        ],
        cooldown: 6,
      },
      {
        id: 'mkt-downgrade-warning',
        name: 'Downgrade warning',
        report:
          'A major rating agency places Malaysia on negative watch, citing "geopolitical positioning uncertainty".',
        weight: 2,
        nodeEffects: [{ nodeId: 'bursa-node', riskLevel: 6, stability: -3 }],
        dynamics: [{ metricBelow: { financialContinuity: 45 }, multiplier: 2 }],
        metricEffects: { financialContinuity: -3, institutionalTrust: -1 },
        warFrontEffects: [{ frontId: 'financial-war-front', intensity: 4, momentum: 4, modifier: 'Downgrade warning' }],
        cooldown: 8,
      },
      {
        id: 'mkt-liquidity-freeze',
        name: 'Liquidity freeze',
        report:
          'Interbank liquidity tightens sharply after rumours of settlement timing anomalies. BNM works the phones all night.',
        weight: 1,
        nodeEffects: [{ nodeId: 'payment-rails', riskLevel: 6, stability: -4 }],
        dynamics: [{ metricBelow: { financialContinuity: 40 }, multiplier: 2 }],
        phases: [3, 4, 5],
        metricEffects: { financialContinuity: -5, mentalLoad: 3 },
        warFrontEffects: [
          { frontId: 'financial-war-front', intensity: 5, momentum: 6, modifier: 'Liquidity freeze' },
          { frontId: 'cyber-war-front', intensity: 1, momentum: 1, modifier: 'Settlement timing anomaly' },
        ],
        cooldown: 8,
      },
      {
        id: 'mkt-confidence-rally',
        name: 'Confidence rally',
        report:
          'Markets reward Malaysian stability with a relief rally. Fund letters use the phrase "quality neutral" approvingly.',
        weight: 3,
        dynamics: [
          { metricAbove: { financialContinuity: 70, institutionalTrust: 60 }, multiplier: 3 },
          { metricBelow: { financialContinuity: 45 }, multiplier: 0.3 },
        ],
        metricEffects: { financialContinuity: 5, institutionalTrust: 2 },
        warFrontEffects: [{ frontId: 'financial-war-front', intensity: -4, momentum: -5, modifier: 'Market confidence rally' }],
        cooldown: 6,
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    id: 'threat-ecosystem',
    name: 'Autonomous Threat Ecosystem',
    short: 'Threat Ecosystem',
    description:
      'AI-driven cybercrime at industrial scale: ransomware cartels, synthetic ' +
      'fraud farms, botnets that negotiate their own ransoms. It has no flag, ' +
      'no ideology, and no off switch.',
    wants: ['Money', 'Chaos as cover', 'Soft targets'],
    initial: { relationship: -50, pressure: 35, aggression: 48, intent: 'Harvest weak infrastructure at scale' },
    phaseAggression: { 3: 15, 5: 10 },
    dynamics: [{ metricBelow: { cyberResilience: 50 }, multiplier: 1.5 }],
    moves: [
      {
        id: 'apt-ransomware-wave',
        name: 'AI ransomware wave',
        report:
          'An automated ransomware wave sweeps Malaysian SMEs and two state agencies. The ransom notes are polite, multilingual, and machine-generated.',
        weight: 3,
        incidents: [{ incidentId: 'cloud-credential-cascade', nodeId: 'cloud-region' }],
        pressureCampaigns: [{ templateId: 'threat-cloud-banking-wave' }],
        dynamics: [{ metricBelow: { financialContinuity: 45 }, multiplier: 1.5 }],
        metricEffects: { cyberResilience: -4, financialContinuity: -2 },
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: 5, momentum: 6, modifier: 'AI ransomware wave' },
          { frontId: 'financial-war-front', intensity: 2, momentum: 2, modifier: 'Ransomware settlement stress' },
        ],
        cooldown: 4,
      },
      {
        id: 'apt-deepfake-minister',
        name: 'Deepfake minister announcement',
        report:
          'A convincing deepfake of a cabinet minister "announcing" bank withdrawal limits goes viral before breakfast.',
        weight: 2,
        incidents: [{ incidentId: 'deepfake-panic-cluster', nodeId: 'kuala-lumpur' }],
        metricEffects: { publicReality: -5, financialContinuity: -2 },
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: 3, momentum: 4, modifier: 'Deepfake panic' },
          { frontId: 'financial-war-front', intensity: 1, momentum: 1, modifier: 'Bank-run rumour' },
        ],
        cooldown: 6,
      },
      {
        id: 'apt-port-ot',
        name: 'Port OT disruption',
        report:
          'Container handling at a Malaysian port stutters after operational technology anomalies. Manual mode. Queues at anchor.',
        weight: 2,
        incidents: [{ incidentId: 'port-ot-degradation', nodeId: 'port-klang' }],
        dynamics: [{ metricBelow: { maritimeControl: 45 }, multiplier: 1.8 }],
        phases: [2, 3, 4, 5],
        metricEffects: { maritimeControl: -3, financialContinuity: -1 },
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: 3, momentum: 4, modifier: 'Port OT disruption' },
          { frontId: 'maritime-war-front', intensity: 3, momentum: 3, modifier: 'Port queue shock' },
        ],
        cooldown: 6,
      },
      {
        id: 'apt-cbdc-panic',
        name: 'CBDC wallet panic',
        report:
          'Coordinated fraud against digital ringgit wallets triggers a panic. Losses are small; screenshots are not.',
        weight: 2,
        nodeEffects: [
          { nodeId: 'digital-id', riskLevel: 6, stability: -3 },
          { nodeId: 'payment-rails', riskLevel: 3 },
        ],
        dynamics: [{ metricBelow: { financialContinuity: 45 }, multiplier: 1.5 }],
        phases: [3, 4, 5],
        metricEffects: { financialContinuity: -3, publicReality: -2 },
        warFrontEffects: [
          { frontId: 'financial-war-front', intensity: 3, momentum: 4, modifier: 'CBDC wallet panic' },
          { frontId: 'cyber-war-front', intensity: 2, momentum: 3, modifier: 'Digital identity fraud' },
        ],
        cooldown: 6,
      },
      {
        id: 'apt-synthetic-fraud',
        name: 'Synthetic identity fraud surge',
        report:
          'Banks report a surge of AI-generated synthetic identities passing onboarding checks. KYC teams request therapy budgets.',
        weight: 2,
        metricEffects: { financialContinuity: -2, institutionalTrust: -1 },
        warFrontEffects: [
          { frontId: 'cyber-war-front', intensity: 2, momentum: 2, modifier: 'Synthetic identity fraud' },
          { frontId: 'financial-war-front', intensity: 2, momentum: 2, modifier: 'Synthetic fraud losses' },
        ],
        cooldown: 5,
      },
    ],
  },
];

export const ACTOR_MAP: Record<ActorId, ActorDef> = Object.fromEntries(
  ACTORS.map((a) => [a.id, a]),
) as Record<ActorId, ActorDef>;
