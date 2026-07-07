import type { RoleDef } from '../types/gameTypes';

export const ROLES: RoleDef[] = [
  {
    id: 'security-consultant',
    name: 'Security Consultant',
    theme: 'Cyber resilience, technical response, governance reform.',
    description:
      'You advise NACSA, BNM and the port operators. When the ransomware waves ' +
      'come — and they will — you are the one on the 3am bridge call. You harden ' +
      'systems others take for granted, but nobody hardens you.',
    strengths: [
      'Stronger cyber defense posture from day one',
      'Better banking and port hardening',
      'Better event detection instincts',
    ],
    weaknesses: [
      'Higher mental load — you see every incident report',
      'Weaker diplomatic influence',
    ],
    startingModifiers: {
      cyberResilience: 12,
      financialContinuity: 5,
      mentalLoad: 10,
      aseanCohesion: -5,
    },
    uniqueActionIds: ['coordinate-asean-cert'],
  },
  {
    id: 'policy-strategist',
    name: 'Policy Strategist',
    theme: 'Legitimacy, diplomacy, public trust, ASEAN coordination.',
    description:
      'You work the meeting rooms — Putrajaya, Jakarta, the ASEAN Secretariat. ' +
      'Your weapon is the carefully worded joint statement. Your nightmare is ' +
      'a chair shortage at an emergency summit nobody can agree to host.',
    strengths: [
      'Better ASEAN cohesion and coordination',
      'Better institutional trust',
      'Better public reality recovery',
    ],
    weaknesses: ['Weaker direct cyber response'],
    startingModifiers: {
      aseanCohesion: 12,
      institutionalTrust: 8,
      publicReality: 5,
      cyberResilience: -8,
    },
    uniqueActionIds: ['quiet-asean-backchannel'],
  },
  {
    id: 'intelligence-officer',
    name: 'Intelligence Officer',
    theme: 'Forecasting, hidden intent, counter-influence.',
    description:
      'You read the traffic others cannot see. You know which "fishing fleet" ' +
      'carries antennas and which minister video is synthetic. The cost of ' +
      'knowing everything is that exposure would burn everything.',
    strengths: [
      'Reads AI actor intent directly — no guessing',
      'Stronger counter-disinformation',
      'Better warning before events land',
    ],
    weaknesses: ['Higher scandal and blowback risk on covert actions'],
    startingModifiers: {
      publicReality: 8,
      cyberResilience: 5,
      institutionalTrust: -5,
      mentalLoad: 5,
    },
    uniqueActionIds: ['hunt-threat-networks'],
    seesActorIntent: true,
  },
  {
    id: 'finance-operator',
    name: 'Finance Operator',
    theme: 'Markets, BNM continuity, liquidity, capital controls.',
    description:
      'You sit between Bank Negara, the exchanges and the sovereign funds. ' +
      'When settlement timing wobbles because a satellite clock drifted, ' +
      'you are the person who decides whether Malaysia blinks.',
    strengths: [
      'Stronger financial continuity',
      'Better market response and confidence management',
      'Better crisis funding options',
    ],
    weaknesses: ['Austerity instincts can bleed public trust'],
    startingModifiers: {
      financialContinuity: 12,
      energyAssurance: 5,
      publicReality: -5,
      institutionalTrust: 3,
    },
    uniqueActionIds: ['bnm-confidence-briefing'],
  },
  {
    id: 'military-liaison',
    name: 'Military Liaison',
    theme: 'Maritime control, deterrence, port security.',
    description:
      'You coordinate the RMN, MMEA and allied attachés. The Straits are ' +
      'your inheritance and your problem. Every patrol you launch reassures ' +
      'someone and provokes someone else.',
    strengths: [
      'Stronger maritime control',
      'Better South China Sea response',
      'Stronger logistics protection',
    ],
    weaknesses: ['Higher escalation and alignment pressure'],
    startingModifiers: {
      maritimeControl: 12,
      energyAssurance: 5,
      alignmentPressure: 8,
      sovereignty: 3,
    },
    uniqueActionIds: ['deploy-drone-patrols'],
  },
];

export function getRole(id: string): RoleDef | undefined {
  return ROLES.find((r) => r.id === id);
}
