import type { EventDef } from '../types/gameTypes';

export const EVENTS: EventDef[] = [
  {
    id: 'baltic-airspace-violation',
    title: 'Baltic Airspace Violation',
    description:
      'Russian aircraft cross Baltic airspace for six full minutes. Europe demands global condemnation. Washington issues a statement about the Indo-Pacific. Kuala Lumpur\'s phones start ringing.',
    phases: [1, 2],
    weight: 3,
    once: true,
    metricEffects: { alignmentPressure: 4, mentalLoad: 2 },
    actorEffects: [{ actorId: 'europe-compact', pressure: 5, aggression: 5 }],
    flagsAdded: ['baltic-violation'],
  },
  {
    id: 'us-refuses-european-surge',
    title: 'US Refuses European Surge',
    description:
      'The White House formally declines to reinforce Europe, citing "Indo-Pacific primacy". European markets wobble. Every small state on Earth quietly updates its threat model: alliances are conditional.',
    phases: [1, 2],
    weight: 3,
    once: true,
    metricEffects: { sovereignty: -2, financialContinuity: -3, alignmentPressure: 3 },
    actorEffects: [
      { actorId: 'europe-compact', aggression: 8 },
      { actorId: 'us-pacom', pressure: 4 },
    ],
  },
  {
    id: 'undersea-cable-sabotage',
    title: 'Undersea Cable Sabotage',
    description:
      'Two submarine cables serving Peninsular Malaysia are severed within hours of each other. An "anchor drag" is blamed. The anchor apparently dragged in a precise zigzag across both cables.',
    phases: [1, 2, 3],
    weight: 3,
    once: true,
    metricEffects: { cyberResilience: -4, financialContinuity: -3, publicReality: -2 },
    flagsAdded: ['cable-sabotage'],
  },
  {
    id: 'gps-spoofing-malacca',
    title: 'GPS Spoofing Over Malacca',
    description:
      'Ships in the Strait of Malacca report positions jumping kilometres inland. Two near-collisions in the traffic separation scheme. Insurers notice before the ministries do.',
    phases: [2, 3],
    weight: 3,
    cooldown: 10,
    metricEffects: { maritimeControl: -5, orbitalAccess: -4, energyAssurance: -2 },
  },
  {
    id: 'ai-ransomware-wave',
    title: 'AI Ransomware Wave',
    description:
      'A self-propagating ransomware campaign hits Malaysian healthcare and logistics simultaneously. The negotiation chatbots are unfailingly polite and completely unyielding.',
    phases: [1, 2, 3, 4, 5],
    weight: 2,
    cooldown: 8,
    metricEffects: { cyberResilience: -5, financialContinuity: -2, mentalLoad: 3 },
    actorEffects: [{ actorId: 'threat-ecosystem', aggression: 3 }],
  },
  {
    id: 'deepfake-minister',
    title: 'Deepfake Minister Announcement',
    description:
      'A flawless deepfake of the Finance Minister "announces" emergency capital controls at 6:47am. By 9am, three bank branches have queues. By noon, the real minister is on live TV proving she has a different mole.',
    phases: [1, 2, 3, 4, 5],
    weight: 2,
    cooldown: 10,
    metricEffects: { publicReality: -6, financialContinuity: -3, institutionalTrust: -2 },
  },
  {
    id: 'singapore-border-tightening',
    title: 'Singapore Border Tightening',
    description:
      'Singapore imposes enhanced screening at the Causeway "in response to regional conditions". Johor\'s morning commute becomes a four-hour geopolitical statement.',
    phases: [2, 3, 4],
    weight: 2,
    once: true,
    metricEffects: { financialContinuity: -3, publicReality: -3 },
    actorEffects: [{ actorId: 'singapore-authority', pressure: 5 }],
  },
  {
    id: 'china-maritime-warning',
    title: 'China Maritime Warning',
    description:
      'Beijing declares a "temporary military activity zone" overlapping Malaysia\'s EEZ near Luconia Shoals and warns vessels to comply with Chinese direction. Petronas has a platform inside the zone.',
    phases: [2, 3, 4, 5],
    weight: 2,
    cooldown: 10,
    metricEffects: { maritimeControl: -5, energyAssurance: -3, sovereignty: -2 },
    actorEffects: [{ actorId: 'china-frag', pressure: 5 }],
  },
  {
    id: 'taiwan-quiet-support',
    title: 'Taiwan Requests Quiet Support',
    description:
      'Through a trusted intermediary, Taiwan Allied Command requests discreet logistics tolerance: hospital ship port calls and semiconductor air corridors. Nothing public. Nothing signed. Nothing deniable if it leaks.',
    phases: [2, 3, 4],
    weight: 3,
    once: true,
    choices: [
      {
        id: 'grant-quietly',
        label: 'Grant it quietly',
        description: 'Humanitarian access, unlogged. Taipei owes us. Beijing must never confirm it.',
        metricEffects: { alignmentPressure: 3 },
        actorEffects: [
          { actorId: 'taiwan-allied', relationship: 10 },
          { actorId: 'china-frag', pressure: 5, aggression: 3 },
        ],
        flagsAdded: ['supported-taiwan'],
        report: 'Malaysia quietly grants Taiwan humanitarian and logistics tolerance. The paper trail is thin by design.',
      },
      {
        id: 'decline-politely',
        label: 'Decline politely',
        description: 'Neutrality means neutrality. Taipei will understand. Probably.',
        metricEffects: { sovereignty: 2 },
        actorEffects: [{ actorId: 'taiwan-allied', relationship: -5 }],
        report: 'Malaysia declines Taiwan\'s quiet request, citing strict neutrality. The intermediary nods and leaves.',
      },
    ],
  },
  {
    id: 'russia-grey-market-offer',
    title: 'Russian Grey-Market Cyber Offer',
    description:
      'A Russian intermediary offers Malaysia access to "proven grey-zone cyber capabilities" — attribution-resistant tooling and mercenary crews — at a substantial discount for early ASEAN adopters.',
    phases: [1, 2, 3, 4],
    weight: 2,
    once: true,
    condition: { forbidsFlags: ['condemned-russia'] },
    choices: [
      {
        id: 'refuse-report',
        label: 'Refuse and log everything',
        description: 'Decline, document the approach, and brief partners. Clean hands, useful intelligence.',
        metricEffects: { institutionalTrust: 3, cyberResilience: 2 },
        actorEffects: [{ actorId: 'russia-network', relationship: -5 }],
        report: 'Malaysia refuses the Russian grey-market offer and quietly circulates the approach to trusted partners.',
      },
      {
        id: 'string-along',
        label: 'String them along',
        description: 'Neither yes nor no. Keep the channel open and learn what they are selling — and to whom.',
        metricEffects: { mentalLoad: 4 },
        actorEffects: [{ actorId: 'russia-network', pressure: 3 }],
        flagsAdded: ['russia-channel-open'],
        schedules: [
          {
            id: 'tooling-attribution-leak',
            delayWeeks: 6,
            title: 'Tooling Attribution Leak',
            description:
              'A regional security blog publishes evidence that Malaysian intermediaries met Russian grey-market brokers. The channel you kept open is now a headline.',
            metricEffects: { institutionalTrust: -4, publicReality: -3 },
            actorEffects: [{ actorId: 'europe-compact', relationship: -4 }],
            requiresFlags: ['russia-channel-open'],
          },
        ],
        report: 'Malaysia keeps the Russian channel ambiguously open. The intelligence take is good. The exposure is real.',
      },
    ],
  },
  {
    id: 'european-cyber-package',
    title: 'European Cyber Intelligence Package',
    description:
      'The European Defence Compact offers a substantial cyber intelligence package on Russian grey-zone operations in Asia — in exchange for a public statement of "shared concern".',
    phases: [2, 3, 4],
    weight: 2,
    once: true,
    choices: [
      {
        id: 'accept-statement',
        label: 'Accept with statement',
        description: 'Take the intelligence, make the statement. Moscow adds Malaysia to a list.',
        metricEffects: { cyberResilience: 6, alignmentPressure: 3 },
        actorEffects: [
          { actorId: 'europe-compact', relationship: 8 },
          { actorId: 'russia-network', aggression: 5 },
        ],
        flagsAdded: ['engaged-europe'],
        report: 'Malaysia accepts the European intelligence package and issues a statement of shared concern. Moscow notices.',
      },
      {
        id: 'decline-package',
        label: 'Decline the package',
        description: 'The intelligence is tempting, but the statement is a side. Malaysia doesn\'t pick sides.',
        metricEffects: { sovereignty: 2, cyberResilience: -1 },
        actorEffects: [{ actorId: 'europe-compact', relationship: -4, pressure: 3 }],
        report: 'Malaysia declines the European package rather than sign the statement. Brussels files it under "neutrality-profiteers".',
      },
    ],
  },
  {
    id: 'markets-downgrade-warning',
    title: 'Financial Markets Downgrade Warning',
    description:
      'Two rating agencies place Malaysia on negative outlook in the same week, citing cyber losses, Straits insurance costs, and "strategic ambiguity premium". The Finance Ministry\'s group chat is not calm.',
    phases: [2, 3, 4, 5],
    weight: 2,
    cooldown: 10,
    condition: { metricBelow: { financialContinuity: 55 } },
    metricEffects: { financialContinuity: -4, institutionalTrust: -2, mentalLoad: 3 },
    actorEffects: [{ actorId: 'financial-markets', aggression: 5 }],
  },
  {
    id: 'asean-emergency-summit',
    title: 'ASEAN Emergency Summit',
    description:
      'An emergency ASEAN summit convenes after three members receive incompatible ultimatums from three different powers. The first four hours are spent debating the agenda. The fifth is spent debating the room.',
    phases: [4, 5],
    weight: 3,
    once: true,
    choices: [
      {
        id: 'push-unity',
        label: 'Push for a unity declaration',
        description: 'Spend Malaysian credibility to force a common position. High cost, high cohesion.',
        metricEffects: { aseanCohesion: 8, personalStamina: -5, institutionalTrust: 2 },
        report: 'Malaysia burns diplomatic capital to force an ASEAN unity declaration. It is watered down, but it exists.',
      },
      {
        id: 'protect-flexibility',
        label: 'Protect national flexibility',
        description: 'Block binding language. Keep Malaysia\'s options open while the region drifts.',
        metricEffects: { sovereignty: 4, aseanCohesion: -5 },
        report: 'Malaysia blocks binding summit language, preserving its own flexibility as ASEAN cohesion frays.',
      },
    ],
  },
  {
    id: 'port-klang-ot-disruption',
    title: 'Port Klang OT Disruption',
    description:
      'Crane control systems at Port Klang begin executing "phantom moves" — containers routed to nonexistent bays. Operations drop to manual. Forty ships wait at anchor while engineers hunt the anomaly.',
    phases: [2, 3, 4, 5],
    weight: 2,
    cooldown: 12,
    condition: { forbidsFlags: ['port-klang-hardened'] },
    metricEffects: { maritimeControl: -5, financialContinuity: -3, cyberResilience: -2 },
    flagsAdded: ['port-ot-incident'],
  },
  {
    id: 'satellite-internet-outage',
    title: 'Satellite Internet Outage',
    description:
      'A major LEO constellation suffers a "software cascade" over Southeast Asia. Rural clinics, fishing fleets, and two brigades of keyboard warriors all go dark simultaneously. Nobody claims responsibility. Three actors deny it unprompted.',
    phases: [3, 4],
    weight: 3,
    cooldown: 10,
    metricEffects: { orbitalAccess: -8, publicReality: -3, financialContinuity: -2 },
  },
  {
    id: 'public-reality-collapse-warning',
    title: 'Public Reality Collapse Warning',
    description:
      'Internal polling shows a majority of Malaysians now believe at least one major fabricated story is true, and — worse — disbelieve one true official statement. The information space is buckling.',
    phases: [3, 4, 5],
    weight: 3,
    cooldown: 12,
    condition: { metricBelow: { publicReality: 40 } },
    metricEffects: { institutionalTrust: -4, mentalLoad: 4 },
    flagsAdded: ['reality-warning'],
  },
];

export function getEvent(id: string): EventDef | undefined {
  return EVENTS.find((e) => e.id === id);
}
