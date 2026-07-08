import type { PlayableFactionId, RoleDef, RolePresentation } from '../types/gameTypes';

function presentation(role: RoleDef, factionId: PlayableFactionId): Required<RolePresentation> {
  const override = role.presentationOverrides?.[factionId] ?? {};
  return {
    name: override.name ?? role.name,
    theme: override.theme ?? role.theme,
    description: override.description ?? role.description,
    strengths: override.strengths ?? role.strengths,
    weaknesses: override.weaknesses ?? role.weaknesses,
    commandSeat: override.commandSeat ?? role.commandSeat,
  };
}

export const ROLES: RoleDef[] = [
  {
    id: 'security-consultant',
    name: 'Security Consultant',
    theme: 'Cyber resilience, technical response, governance reform.',
    commandSeat: 'NACSA / BNM / port-operator crisis bridge',
    description:
      'You advise NACSA, BNM and the port operators. When the ransomware waves ' +
      'come - and they will - you are the one on the 3am bridge call. You harden ' +
      'systems others take for granted, but nobody hardens you.',
    strengths: [
      'Stronger cyber defense posture from day one',
      'Better banking and port hardening',
      'Better event detection instincts',
    ],
    weaknesses: [
      'Higher mental load - you see every incident report',
      'Weaker diplomatic influence',
    ],
    presentationOverrides: {
      singapore: {
        commandSeat: 'CSA / GovTech / MAS cyber resilience bridge',
        description:
          'You advise CSA, GovTech, MAS cyber resilience teams and PSA port systems. ' +
          'When settlement rails, identity services or cranes start behaving strangely, ' +
          'you are the one joining the 3am continuity bridge.',
        strengths: [
          'Stronger cyber defense posture from day one',
          'Better MAS, identity and port-system hardening',
          'Better event detection instincts',
        ],
        weaknesses: [
          'Higher mental load - every continuity incident reaches you',
          'Weaker diplomatic influence',
        ],
      },
      indonesia: {
        commandSeat: 'BSSN / digital identity / port-energy systems bridge',
        description:
          'You advise BSSN, national cyber resilience teams, digital identity operators, ' +
          'ports and energy systems across the archipelago. Scale is your advantage, ' +
          'and the reason every incident report arrives with three maps.',
        strengths: [
          'Stronger cyber defense posture from day one',
          'Better identity, port and energy-system hardening',
          'Better event detection instincts',
        ],
        weaknesses: [
          'Higher mental load - archipelago incidents multiply fast',
          'Weaker diplomatic influence',
        ],
      },
      'taiwan-allied-command': {
        commandSeat: 'TWCERT / MODA / semiconductor corridor defense cell',
        description:
          'You advise TWCERT, MODA, critical infrastructure teams and semiconductor ' +
          'corridor defenders. Every intrusion may be a criminal probe, a PLA prelude, ' +
          'or both at once.',
        strengths: [
          'Stronger cyber defense posture from day one',
          'Better critical-infrastructure and chip-corridor hardening',
          'Better event detection instincts',
        ],
        weaknesses: [
          'Higher mental load - frontline alerts do not stop',
          'Weaker diplomatic influence',
        ],
      },
      'us-pacific-command': {
        commandSeat: 'INDOPACOM / Cyber Command / orbital support bridge',
        description:
          'You advise INDOPACOM cyber defenders, orbital command liaisons and allied logistics networks. Every intrusion could be criminal noise, China probing, or a warning that the Taiwan support corridor is about to get harder.',
        strengths: [
          'Stronger cyber defense posture from day one',
          'Better orbital and logistics-system hardening',
          'Better event detection instincts',
        ],
        weaknesses: [
          'Higher mental load - allied incident reports do not stop',
          'Weaker coalition diplomacy influence',
        ],
      },
      'european-defence-compact': {
        commandSeat: 'Brussels / cyber resilience teams / sanctions security desk',
        description:
          'You advise European cyber resilience teams, Brussels coordination cells and infrastructure operators facing Russian grey-zone pressure. Coalition networks are only as strong as the least ready member state.',
        strengths: [
          'Stronger cyber defense posture from day one',
          'Better sanctions, finance and infrastructure hardening',
          'Better event detection instincts',
        ],
        weaknesses: [
          'Higher mental load - every member-state incident becomes political',
          'Slower direct military response',
        ],
      },
      'russia-eurasian-network': {
        commandSeat: 'Eurasian cyber units / grey-zone operator desk',
        description:
          'You coordinate cyber units, deniable operators and information-security cells across the Eurasian pressure network. The hard part is keeping pressure deniable after it starts working.',
        strengths: [
          'Stronger cyber and disinformation pressure posture',
          'Better sanctions-evasion network hardening',
          'Better event detection instincts',
        ],
        weaknesses: [
          'Higher blowback and isolation risk',
          'Weaker institutional legitimacy',
        ],
      },
    },
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
    commandSeat: 'Putrajaya / Jakarta / ASEAN Secretariat rooms',
    description:
      'You work the meeting rooms - Putrajaya, Jakarta, the ASEAN Secretariat. ' +
      'Your weapon is the carefully worded joint statement. Your nightmare is ' +
      'a chair shortage at an emergency summit nobody can agree to host.',
    strengths: [
      'Better ASEAN cohesion and coordination',
      'Better institutional trust',
      'Better public reality recovery',
    ],
    weaknesses: ['Weaker direct cyber response'],
    presentationOverrides: {
      singapore: {
        theme: 'Continuity diplomacy, legitimacy, neutrality, regional trust.',
        commandSeat: 'MFA / PMO / ASEAN continuity diplomacy desk',
        description:
          'You work MFA, PMO and regional continuity diplomacy channels. Your weapon ' +
          'is the neutral sentence that keeps trade, evacuation, finance and ASEAN ' +
          'coordination moving without making Singapore look captured.',
        strengths: [
          'Better regional continuity coordination',
          'Better institutional trust',
          'Better public reality recovery',
        ],
        weaknesses: ['Weaker direct cyber response'],
      },
      indonesia: {
        theme: 'ASEAN leadership, legitimacy, regional balancing, public trust.',
        commandSeat: 'Jakarta / Kemlu / ASEAN leadership channel',
        description:
          'You work Jakarta, Kemlu and the ASEAN leadership track. Your weapon is the ' +
          'regional formula that lets Indonesia lead without making every neighbor feel ' +
          'managed.',
        strengths: [
          'Better ASEAN leadership and coordination',
          'Better institutional trust',
          'Better public reality recovery',
        ],
        weaknesses: ['Weaker direct cyber response'],
      },
      'taiwan-allied-command': {
        theme: 'Allied coordination, continuity diplomacy, legitimacy, public trust.',
        commandSeat: 'NSC / MOFA / allied continuity coordination cell',
        description:
          'You work the NSC, MOFA and allied coordination channels. Your weapon is the ' +
          'continuity arrangement that keeps aid, logistics and recognition moving while ' +
          'the front tries to narrow every option.',
        strengths: [
          'Better allied coordination and continuity diplomacy',
          'Better institutional trust',
          'Better public reality recovery',
        ],
        weaknesses: ['Weaker direct cyber response'],
      },
      'us-pacific-command': {
        theme: 'Alliance management, deterrence legitimacy, Pacific coordination.',
        commandSeat: 'INDOPACOM / allied logistics / Taiwan support corridor desk',
        description:
          'You work INDOPACOM, allied capitals and the Taiwan support corridor. Your weapon is the assurance package that keeps partners aligned without making them feel occupied.',
        strengths: [
          'Better allied coordination and logistics legitimacy',
          'Better institutional trust',
          'Better public mandate recovery',
        ],
        weaknesses: ['Weaker direct cyber response'],
      },
      'european-defence-compact': {
        theme: 'Coalition legitimacy, sanctions politics, public trust.',
        commandSeat: 'Brussels / European Defence Compact / NATO coordination rooms',
        description:
          'You work Brussels, compact members and NATO coordination channels where appropriate. Your weapon is the coalition formula that keeps sanctions, energy and defense moving together.',
        strengths: [
          'Better coalition cohesion and coordination',
          'Better institutional trust',
          'Better public reality recovery',
        ],
        weaknesses: ['Weaker direct cyber response'],
      },
      'russia-eurasian-network': {
        theme: 'Pressure politics, information operations, sanctions ambiguity.',
        commandSeat: 'Eurasian pressure network / information operations desk',
        description:
          'You work pressure-network principals, energy leverage channels and information operations. Your weapon is the ambiguity that makes opponents argue with themselves before they answer you.',
        strengths: [
          'Better pressure-network coordination',
          'Better public reality manipulation',
          'Better strategic leverage recovery',
        ],
        weaknesses: ['Weaker direct cyber defense'],
      },
    },
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
    commandSeat: 'Covert pressure / synthetic media warning cell',
    description:
      'You read the traffic others cannot see. You know which "fishing fleet" ' +
      'carries antennas and which minister video is synthetic. The cost of ' +
      'knowing everything is that exposure would burn everything.',
    strengths: [
      'Reads AI actor intent directly - no guessing',
      'Stronger counter-disinformation',
      'Better warning before events land',
    ],
    weaknesses: ['Higher scandal and blowback risk on covert actions'],
    presentationOverrides: {
      singapore: {
        commandSeat: 'Regional traffic / market manipulation warning cell',
        description:
          'You read regional traffic, market manipulation signals, synthetic influence ' +
          'and grey-zone intent before they become public problems. The cost of knowing ' +
          'early is deciding what can be revealed without triggering the run.',
        strengths: [
          'Reads AI actor intent directly - no guessing',
          'Stronger counter-disinformation and market-signal warning',
          'Better warning before events land',
        ],
        weaknesses: ['Higher scandal and blowback risk on covert actions'],
      },
      indonesia: {
        commandSeat: 'Archipelago threat traffic / maritime intent cell',
        description:
          'You read archipelago threat traffic, separatist and disinformation risk, and ' +
          'maritime grey-zone intent. The pattern is never in one place; it is in the ' +
          'timing between islands, ports and feeds.',
        strengths: [
          'Reads AI actor intent directly - no guessing',
          'Stronger counter-disinformation and maritime warning',
          'Better warning before events land',
        ],
        weaknesses: ['Higher scandal and blowback risk on covert actions'],
      },
      'taiwan-allied-command': {
        commandSeat: 'PLA indicators / orbital warning / deception cell',
        description:
          'You read PLA movement indicators, orbital warning, cyber deception and ' +
          'synthetic escalation signals. The hard part is not finding warnings; it is ' +
          'knowing which ones are meant to make the command overreact.',
        strengths: [
          'Reads AI actor intent directly - no guessing',
          'Stronger cyber deception and escalation-signal warning',
          'Better warning before events land',
        ],
        weaknesses: ['Higher scandal and blowback risk on covert actions'],
      },
      'us-pacific-command': {
        commandSeat: 'INDOPACOM warning / orbital command / naval deterrence cell',
        description:
          'You read PLA movement indicators, allied logistics anomalies, orbital warning and cyber deception aimed at the Pacific command picture. More collection is not the same as clarity.',
        strengths: [
          'Reads AI actor intent directly - no guessing',
          'Stronger counter-deception and escalation warning',
          'Better warning before events land',
        ],
        weaknesses: ['Higher scandal and escalation risk on covert actions'],
      },
      'european-defence-compact': {
        commandSeat: 'Brussels warning / sanctions intelligence / disinfo cell',
        description:
          'You read Russian grey-zone traffic, sanctions evasion signals, energy pressure and coalition disinformation before they hit the public agenda.',
        strengths: [
          'Reads AI actor intent directly - no guessing',
          'Stronger counter-disinformation and sanctions warning',
          'Better warning before events land',
        ],
        weaknesses: ['Higher scandal and blowback risk on covert actions'],
      },
      'russia-eurasian-network': {
        commandSeat: 'Grey-zone intent / sanctions evasion / influence cell',
        description:
          'You read European fracture points, sanctions enforcement gaps, cyber openings and influence conditions. The question is not what is true; it is which truth can be used.',
        strengths: [
          'Reads AI actor intent directly - no guessing',
          'Stronger disinformation and evasion warning',
          'Better warning before events land',
        ],
        weaknesses: ['Higher exposure and sanctions blowback risk'],
      },
    },
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
    commandSeat: 'Bank Negara / exchanges / sovereign funds desk',
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
    presentationOverrides: {
      singapore: {
        theme: 'MAS continuity, SGX stability, liquidity corridors, reserves.',
        commandSeat: 'MAS / SGX / sovereign reserves continuity desk',
        description:
          'You sit between MAS, SGX, liquidity corridors and sovereign reserves. ' +
          'When timing rails wobble or capital starts hunting exits, you decide how ' +
          'Singapore keeps clearing without looking trapped.',
        strengths: [
          'Stronger financial continuity',
          'Better market response and confidence management',
          'Better liquidity and reserve options',
        ],
        weaknesses: ['Continuity controls can bleed public trust'],
      },
      indonesia: {
        theme: 'Bank Indonesia, OJK, rupiah liquidity, energy/export stability.',
        commandSeat: 'Bank Indonesia / OJK / export-liquidity desk',
        description:
          'You sit between Bank Indonesia, OJK, rupiah liquidity channels and energy ' +
          'or export stability. When markets price the archipelago as too big to ' +
          'coordinate, you prove the rails still clear.',
        strengths: [
          'Stronger financial continuity',
          'Better market response and confidence management',
          'Better liquidity and export-stability options',
        ],
        weaknesses: ['Austerity instincts can bleed public trust'],
      },
      'taiwan-allied-command': {
        theme: 'CBC, TWSE, semiconductor finance, liquidity, insurance corridors.',
        commandSeat: 'CBC / TWSE / semiconductor finance continuity desk',
        description:
          'You sit between CBC, TWSE, semiconductor finance, emergency liquidity and ' +
          'insurance corridors. When blockade risk hits payment timing, you keep the ' +
          'war economy legible enough to insure.',
        strengths: [
          'Stronger financial continuity',
          'Better market response and confidence management',
          'Better emergency liquidity and insurance options',
        ],
        weaknesses: ['War-economy triage can bleed public trust'],
      },
      'us-pacific-command': {
        theme: 'Allied sustainment finance, logistics funding, mandate pressure.',
        commandSeat: 'INDOPACOM sustainment / allied funding / logistics desk',
        description:
          'You sit between Pacific sustainment, allied burden-sharing and emergency logistics finance. The corridor survives only if fuel, insurance, ports and politics clear on time.',
        strengths: [
          'Stronger financial continuity',
          'Better logistics funding and confidence management',
          'Better crisis sustainment options',
        ],
        weaknesses: ['Overstretch and burden-sharing fights can bleed public trust'],
      },
      'european-defence-compact': {
        theme: 'Sanctions finance, market stability, industrial resilience.',
        commandSeat: 'Brussels sanctions cells / market authority / industrial desk',
        description:
          'You sit between sanctions cells, market authorities, industrial finance and energy support packages. Every sanction that bites Moscow also tests European balance sheets.',
        strengths: [
          'Stronger financial continuity',
          'Better sanctions-market response',
          'Better crisis funding options',
        ],
        weaknesses: ['Austerity and energy tradeoffs can bleed public trust'],
      },
      'russia-eurasian-network': {
        theme: 'Sanctions evasion, energy leverage, opaque liquidity.',
        commandSeat: 'Evasion corridors / energy leverage / settlement desk',
        description:
          'You sit between sanctions evasion desks, energy leverage channels and opaque settlement corridors. The network survives if money keeps moving without becoming too visible.',
        strengths: [
          'Stronger sanctions-survival continuity',
          'Better energy and liquidity workarounds',
          'Better crisis funding options',
        ],
        weaknesses: ['Isolation and corruption can bleed institutional trust'],
      },
    },
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
    commandSeat: 'RMN / MMEA / allied attache coordination cell',
    description:
      'You coordinate the RMN, MMEA and allied attaches. The Straits are ' +
      'your inheritance and your problem. Every patrol you launch reassures ' +
      'someone and provokes someone else.',
    strengths: [
      'Stronger maritime control',
      'Better South China Sea response',
      'Stronger logistics protection',
    ],
    weaknesses: ['Higher escalation and alignment pressure'],
    presentationOverrides: {
      singapore: {
        theme: 'SAF, RSN, MPA, Strait deterrence, port-capital continuity.',
        commandSeat: 'SAF / RSN / MPA Singapore Strait coordination cell',
        description:
          'You coordinate SAF, RSN, MPA and the port-capital corridor. The Singapore ' +
          'Strait is narrow enough for every patrol to be seen and important enough ' +
          'that doing nothing is also a signal.',
        strengths: [
          'Stronger maritime control',
          'Better Singapore Strait response',
          'Stronger port-capital logistics protection',
        ],
        weaknesses: ['Higher escalation and alignment pressure'],
      },
      indonesia: {
        theme: 'TNI AL, Bakamla, archipelago patrols, sea-lane coordination.',
        commandSeat: 'TNI AL / Bakamla / Natuna-Sunda-Malacca cell',
        description:
          'You coordinate TNI AL, Bakamla, archipelago patrols and Natuna, Sunda and ' +
          'Malacca sea-lane coverage. Every patrol adds presence; every gap invites ' +
          'someone to test the map.',
        strengths: [
          'Stronger maritime control',
          'Better Natuna, Sunda and Malacca response',
          'Stronger logistics protection',
        ],
        weaknesses: ['Higher escalation and alignment pressure'],
      },
      'taiwan-allied-command': {
        theme: 'MND, naval/air defense coordination, counter-blockade logistics.',
        commandSeat: 'MND / Navy-Air Defense / allied strike liaison cell',
        description:
          'You coordinate MND, Navy and Air Defense channels, counter-blockade logistics ' +
          'and allied strike liaison. Every convoy, patrol and air-defense handoff is a ' +
          'military move and a political message.',
        strengths: [
          'Stronger maritime control',
          'Better counter-blockade response',
          'Stronger logistics protection',
        ],
        weaknesses: ['Higher escalation and alignment pressure'],
      },
      'us-pacific-command': {
        theme: 'Naval deterrence, allied logistics, Pacific posture.',
        commandSeat: 'INDOPACOM / naval deterrence / allied logistics cell',
        description:
          'You coordinate naval deterrence, allied logistics and the Taiwan support corridor. Every deployment reassures allies, tests China and spends mandate.',
        strengths: [
          'Stronger maritime control',
          'Better Pacific deterrence response',
          'Stronger logistics protection',
        ],
        weaknesses: ['Higher escalation and alignment pressure'],
      },
      'european-defence-compact': {
        theme: 'NATO coordination, industrial support, slower deterrence.',
        commandSeat: 'European Defence Compact / NATO coordination / industry cell',
        description:
          'You coordinate compact defense planners, NATO channels where appropriate and industrial support. Europe can move, but only after the coalition agrees what movement means.',
        strengths: [
          'Stronger logistics protection',
          'Better European front coordination',
          'Better industrial resilience',
        ],
        weaknesses: ['Slower response and higher coalition friction'],
      },
      'russia-eurasian-network': {
        theme: 'Grey-zone operators, energy leverage, coercive logistics.',
        commandSeat: 'Eurasian pressure network / grey-zone operators / energy desk',
        description:
          'You coordinate grey-zone operators, energy leverage and coercive logistics. Every pressure move can fracture opponents or expose the network.',
        strengths: [
          'Stronger grey-zone pressure',
          'Better energy leverage',
          'Stronger coercive logistics protection',
        ],
        weaknesses: ['Higher blowback and overextension pressure'],
      },
    },
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

export function getRolePresentation(role: RoleDef, factionId: PlayableFactionId): Required<RolePresentation> {
  return presentation(role, factionId);
}
