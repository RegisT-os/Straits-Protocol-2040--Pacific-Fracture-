import type { ActionDef } from '../types/gameTypes';

// Every action is a tradeoff. Nothing here is purely good.
// One exception: 'monitor-situation' has no cooldown and no restrictions,
// guaranteeing the player always has at least one selectable action.
export const ACTIONS: ActionDef[] = [
  {
    id: 'monitor-situation',
    name: 'Monitor the Situation',
    description:
      'Hold posture and watch the boards: no initiatives, no exposure. A week of dashboards, coffee, and letting other people make the mistakes.',
    category: 'strategy',
    metricEffects: { mentalLoad: -2, personalStamina: 1 },
  },
  {
    id: 'national-cyber-shield',
    name: 'Activate National Cyber Shield',
    description:
      'Stand up the national cyber defense coordination posture: mandatory reporting, sector watch floors, surge staffing.',
    category: 'cyber',
    nodeEffects: [
      { nodeId: 'payment-rails', riskLevel: -4, cyberExposure: -4 },
      { nodeId: 'digital-id', riskLevel: -3 },
    ],
    metricEffects: { cyberResilience: 8, institutionalTrust: 2, mentalLoad: 4, financialContinuity: -2 },
    cooldown: 6,
  },
  {
    id: 'bnm-confidence-briefing',
    name: 'BNM Confidence Briefing',
    description:
      'Coordinate a Bank Negara market confidence operation: liquidity signalling, settlement reassurance, quiet calls to primary dealers.',
    category: 'finance',
    nodeEffects: [
      { nodeId: 'bnm-core', riskLevel: -8, stability: 5 },
      { nodeId: 'bursa-node', riskLevel: -5 },
    ],
    roleRestriction: ['finance-operator'],
    metricEffects: { financialContinuity: 8, institutionalTrust: 3, publicReality: 2, personalStamina: -4 },
    actorEffects: [{ actorId: 'financial-markets', pressure: -6 }],
    cooldown: 4,
  },
  {
    id: 'quiet-asean-backchannel',
    name: 'Quiet ASEAN Backchannel',
    description:
      'Work the informal channels — Jakarta, Bangkok, Hanoi, Manila — to keep ASEAN talking even when the formal track stalls.',
    category: 'diplomacy',
    roleRestriction: ['policy-strategist'],
    metricEffects: { aseanCohesion: 8, institutionalTrust: 2, personalStamina: -3 },
    actorEffects: [{ actorId: 'indonesia-maritime', relationship: 4 }],
    cooldown: 3,
  },
  {
    id: 'harden-port-klang',
    name: 'Harden Port Klang OT Network',
    description:
      'Segment and harden the operational technology behind Port Klang container and fuel handling before someone else maps it first.',
    category: 'cyber',
    targeting: {
      nodeIds: ['port-klang'],
      effect: { stability: 8, riskLevel: -10, cyberExposure: -12 },
      hint: 'Harden the OT network at',
    },
    metricEffects: { cyberResilience: 5, maritimeControl: 4, financialContinuity: -2, mentalLoad: 2 },
    flagsAdded: ['port-klang-hardened'],
    once: true,
  },
  {
    id: 'public-reality-campaign',
    name: 'Launch Public Reality Campaign',
    description:
      'A national pre-bunking and verification campaign: deepfake literacy, official-channel verification, rumour response cells.',
    category: 'information',
    targeting: {
      nodeIds: ['digital-id', 'kuala-lumpur', 'putrajaya'],
      effect: { riskLevel: -8, stability: 5 },
      hint: 'Focus the campaign on',
    },
    metricEffects: { publicReality: 8, institutionalTrust: 3, personalStamina: -5, mentalLoad: 3 },
    schedules: [
      {
        id: 'public-trust-stabilization',
        delayWeeks: 3,
        title: 'Public Trust Stabilization',
        description:
          'The pre-bunking campaign compounds: verification habits stick, rumour half-life drops, and official channels regain ground.',
        metricEffects: { publicReality: 3, institutionalTrust: 2 },
      },
    ],
    cooldown: 5,
  },
  {
    id: 'request-us-orbital',
    name: 'Request US Orbital Support',
    description:
      'Ask US PACOM for backup positioning, timing and satellite communications coverage. The help is real. So is the invoice.',
    category: 'strategy',
    targeting: {
      nodeIds: ['asean-microsat', 'commercial-satnet', 'financial-timing-link', 'maritime-imaging', 'emergency-nav-mesh'],
      effect: { stability: 10, riskLevel: -8 },
      hint: 'Anchor US coverage on',
    },
    metricEffects: { orbitalAccess: 10, cyberResilience: 2, sovereignty: -4, alignmentPressure: 8 },
    actorEffects: [
      { actorId: 'us-pacom', relationship: 6 },
      { actorId: 'china-frag', pressure: 5 },
    ],
    flagsAdded: ['aligned-us'],
    schedules: [
      {
        id: 'alignment-dependency-debate',
        delayWeeks: 5,
        title: 'Alignment Dependency Debate',
        description:
          'Parliament debates what happens to Malaysian navigation and banking if Washington ever switches the coverage off. Nobody likes the answer.',
        metricEffects: { sovereignty: -2, publicReality: -2, alignmentPressure: 3 },
      },
    ],
    cooldown: 8,
  },
  {
    id: 'strict-neutrality',
    name: 'Preserve Strict Neutrality',
    description:
      'Publicly reaffirm non-alignment: no basing, no blocs, no condemnations. Sovereign, principled, and mildly infuriating to everyone.',
    category: 'diplomacy',
    metricEffects: { sovereignty: 6, alignmentPressure: -6, aseanCohesion: 2 },
    actorEffects: [
      { actorId: 'us-pacom', relationship: -3 },
      { actorId: 'europe-compact', relationship: -3 },
      { actorId: 'china-frag', pressure: -3 },
    ],
    flagsAdded: ['strict-neutrality'],
    cooldown: 4,
  },
  {
    id: 'condemn-russia',
    name: 'Condemn Russian Provocation',
    description:
      'Join the formal condemnation of Russian hybrid operations in Europe. Brussels applauds. Moscow takes notes.',
    category: 'diplomacy',
    forbidsFlags: ['condemned-russia'],
    metricEffects: { alignmentPressure: 3, institutionalTrust: 2 },
    actorEffects: [
      { actorId: 'europe-compact', relationship: 8, pressure: -5 },
      { actorId: 'russia-network', relationship: -10, aggression: 8 },
    ],
    flagsAdded: ['condemned-russia'],
    schedules: [
      {
        id: 'russian-cyber-retaliation-probe',
        delayWeeks: 3,
        title: 'Russian Cyber Retaliation Probe',
        description:
          'Three weeks after the condemnation, Russian-linked crews probe Malaysian media and logistics networks. The timing is not a coincidence and is not meant to look like one.',
        metricEffects: { cyberResilience: -4, publicReality: -3 },
        actorEffects: [{ actorId: 'russia-network', pressure: 4 }],
      },
    ],
    once: true,
  },
  {
    id: 'engage-europe',
    name: 'Engage European Defence Compact',
    description:
      'Open a structured cooperation track with Europe: cyber intelligence exchange, sanctions dialogue, market access assurances.',
    category: 'diplomacy',
    metricEffects: { cyberResilience: 4, financialContinuity: 2, alignmentPressure: 4 },
    actorEffects: [
      { actorId: 'europe-compact', relationship: 6, pressure: -4 },
      { actorId: 'russia-network', pressure: 3 },
    ],
    flagsAdded: ['engaged-europe'],
    cooldown: 6,
  },
  {
    id: 'singapore-continuity-channel',
    name: 'Open Singapore Continuity Channel',
    description:
      'Formalize the BNM–MAS continuity channel: mutual settlement fallback, joint incident response, shared liquidity signalling.',
    category: 'finance',
    nodeEffects: [
      { nodeId: 'bnm-core', riskLevel: -4 },
      { nodeId: 'singapore', stability: 2 },
    ],
    metricEffects: { financialContinuity: 7, cyberResilience: 3, sovereignty: -3 },
    actorEffects: [{ actorId: 'singapore-authority', relationship: 8, pressure: -4 }],
    flagsAdded: ['singapore-lifeline'],
    cooldown: 8,
  },
  {
    id: 'propose-asean-shield',
    name: 'Propose ASEAN Shield',
    description:
      'Put Malaysia\'s name on the collective ASEAN maritime-cyber defense framework. Leadership is expensive and visible.',
    category: 'strategy',
    phaseRestriction: [3, 4, 5],
    metricEffects: { aseanCohesion: 10, sovereignty: 3, alignmentPressure: -3, personalStamina: -4 },
    actorEffects: [
      { actorId: 'indonesia-maritime', relationship: 5 },
      { actorId: 'china-frag', pressure: 4 },
    ],
    flagsAdded: ['asean-shield'],
    once: true,
  },
  {
    id: 'deploy-drone-patrols',
    name: 'Deploy Maritime Drone Patrols',
    description:
      'Surge autonomous surface and aerial patrols across the Straits and EEZ approaches. Presence is deterrence — and provocation.',
    category: 'maritime',
    targeting: {
      nodeIds: ['malacca-strait', 'malaysian-eez', 'scs-air-sea-corridor'],
      effect: { stability: 6, riskLevel: -10 },
      hint: 'Surge patrols over',
    },
    roleRestriction: ['military-liaison'],
    metricEffects: { maritimeControl: 8, energyAssurance: 2, alignmentPressure: 2 },
    actorEffects: [{ actorId: 'china-frag', pressure: 4 }],
    risk: {
      label: 'At-sea incident with Chinese militia',
      chance: 0.25,
      metricEffects: { maritimeControl: -3, mentalLoad: 5 },
      actorEffects: [{ actorId: 'china-frag', aggression: 5 }],
      report: 'A drone patrol and Chinese maritime militia vessel collide near Luconia. Both sides film everything.',
    },
    cooldown: 4,
  },
  {
    id: 'energy-assurance-plan',
    name: 'Emergency Energy Assurance Plan',
    description:
      'Activate strategic reserves, diversify LNG routing, and pre-position fuel for the grid. Expensive insurance against dark weeks.',
    category: 'energy',
    targeting: {
      nodeIds: ['bintulu-lng', 'brunei-energy-corridor'],
      effect: { stability: 8, riskLevel: -8 },
      hint: 'Pre-position reserves at',
    },
    metricEffects: { energyAssurance: 9, financialContinuity: -4, institutionalTrust: 2 },
    cooldown: 8,
  },
  {
    id: 'hunt-threat-networks',
    name: 'Hunt Autonomous Threat Networks',
    description:
      'Run a coordinated national takedown of ransomware infrastructure and synthetic fraud farms operating against Malaysian targets.',
    category: 'cyber',
    nodeEffects: [
      { nodeId: 'cloud-region', riskLevel: -6, cyberExposure: -4 },
      { nodeId: 'payment-rails', riskLevel: -4 },
    ],
    roleRestriction: ['intelligence-officer', 'security-consultant'],
    metricEffects: { cyberResilience: 6, financialContinuity: 2, personalStamina: -4 },
    actorEffects: [{ actorId: 'threat-ecosystem', aggression: -8, pressure: -5 }],
    risk: {
      label: 'Attribution scandal',
      chance: 0.3,
      metricEffects: { institutionalTrust: -4, publicReality: -3 },
      report: 'A takedown operation is publicly linked to surveillance overreach. The opposition demands an inquiry.',
    },
    cooldown: 5,
  },
  {
    id: 'strategic-autonomy',
    name: 'Begin Strategic Autonomy Program',
    description:
      'A long-horizon program: domestic cyber capacity, sovereign cloud, local PNT augmentation, defense industrial base. Slow, real power.',
    category: 'strategy',
    metricEffects: { sovereignty: 8, cyberResilience: 3, orbitalAccess: 3, financialContinuity: -5, personalStamina: -3 },
    flagsAdded: ['strategic-autonomy'],
    once: true,
  },
  {
    id: 'accept-us-package',
    name: 'Accept US Cyber Package',
    description:
      'Take the US cyber defense package — sensors, threat feeds, liaison cell. Capability now; dependency later.',
    category: 'cyber',
    requiresFlags: ['us-package-offered'],
    metricEffects: { cyberResilience: 10, orbitalAccess: 4, sovereignty: -6, alignmentPressure: 10 },
    actorEffects: [
      { actorId: 'us-pacom', relationship: 10 },
      { actorId: 'china-frag', pressure: 6, aggression: 4 },
    ],
    flagsAdded: ['aligned-us', 'us-package-accepted'],
    schedules: [
      {
        id: 'sovereignty-review-backlash',
        delayWeeks: 4,
        title: 'Sovereignty Review Backlash',
        description:
          'A parliamentary review of the US cyber package leaks: foreign sensors on national networks, foreign analysts with standing access. The opposition has questions. So does the public.',
        metricEffects: { institutionalTrust: -3, sovereignty: -2, publicReality: -2 },
      },
    ],
    once: true,
  },
  {
    id: 'reject-alignment',
    name: 'Reject Great Power Alignment',
    description:
      'Formally decline outstanding alignment offers from all major powers. A sovereignty statement with a price tag.',
    category: 'strategy',
    metricEffects: { sovereignty: 8, alignmentPressure: -10, cyberResilience: -2, orbitalAccess: -2 },
    actorEffects: [
      { actorId: 'us-pacom', relationship: -5, pressure: 3 },
      { actorId: 'europe-compact', relationship: -4 },
      { actorId: 'china-frag', relationship: 2, pressure: -3 },
    ],
    flagsAdded: ['rejected-alignment'],
    cooldown: 10,
  },
  {
    id: 'coordinate-asean-cert',
    name: 'Coordinate ASEAN CERT Fusion Cell',
    description:
      'Build the regional incident-response fusion cell you keep proposing in workshops: shared telemetry, joint playbooks, real hotlines.',
    category: 'cyber',
    targeting: {
      nodeIds: ['bnm-core', 'payment-rails', 'bursa-node', 'cloud-region', 'digital-id'],
      effect: { riskLevel: -10, cyberExposure: -8, stability: 4 },
      hint: 'Fuse defenses around',
    },
    nodeEffects: [{ nodeId: 'jakarta', stability: 2 }],
    roleRestriction: ['security-consultant'],
    metricEffects: { cyberResilience: 7, aseanCohesion: 5, mentalLoad: 4 },
    actorEffects: [{ actorId: 'threat-ecosystem', pressure: -4 }],
    flagsAdded: ['asean-cert-cell'],
    cooldown: 6,
  },
  {
    id: 'stabilize-routine',
    name: 'Stabilize Personal Routine',
    description:
      'Sleep before midnight. Actual meals. Delegate the 3am calls once. The crisis will still be there tomorrow; make sure you are too.',
    category: 'personal',
    metricEffects: { personalStamina: 8, mentalLoad: -8 },
    cooldown: 3,
  },
  {
    id: 'recovery-week',
    name: 'Take Recovery Week',
    description:
      'Step back entirely for a week. The machine runs without you — slightly worse, but it runs. You come back human.',
    category: 'personal',
    metricEffects: { personalStamina: 15, mentalLoad: -15, institutionalTrust: -2, cyberResilience: -2 },
    cooldown: 8,
  },
];

export function getAction(id: string): ActionDef | undefined {
  return ACTIONS.find((a) => a.id === id);
}
