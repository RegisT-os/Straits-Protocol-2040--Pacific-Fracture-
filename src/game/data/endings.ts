import type { EndingDef, EndingFactionOverlay, EndingId, PlayableFactionId } from '../types/gameTypes';

const OVERLAYS: Record<EndingId, Record<PlayableFactionId, EndingFactionOverlay>> = {
  'sovereign-middle-power': {
    malaysia: {
      titleOverride: 'Sovereignty Preserved',
      subtitle: 'Malaysia survives unowned.',
      description: 'Malaysia reaches 2042 bruised but unowned: ports moving, banks settling, ASEAN still usable, and no great power holding Putrajaya keys.',
      interpretation: 'A middle-power survival win. Autonomy held because no single dependency became permanent.',
      strategicLesson: 'Balanced hedging, maritime control and financial continuity can beat cleaner but narrower alignments.',
      victoryFraming: 'A sovereign middle power remains on the board.',
    },
    singapore: {
      titleOverride: 'Continuity Fortress',
      subtitle: 'Singapore keeps clearing while the region burns.',
      description: 'Singapore reaches 2042 as a compact fortress of settlement, ports and trust. The region is damaged, but the continuity state did not become anyone else\'s switchboard.',
      interpretation: 'A resilience win. Wealth, discipline and credible neutrality bought room to maneuver.',
      strategicLesson: 'Continuity is strategic power only when it avoids becoming dependency management for everyone else.',
      victoryFraming: 'The fortress stayed open without being captured.',
    },
    indonesia: {
      titleOverride: 'Archipelago Shield',
      subtitle: 'Indonesia turns scale into strategic autonomy.',
      description: 'Indonesia reaches 2042 with sea lanes usable, ASEAN channels alive and Jakarta able to coordinate the archipelago without surrendering the agenda.',
      interpretation: 'A scale-and-coordination win. Maritime depth became leverage instead of drag.',
      strategicLesson: 'Archipelago power works when patrols, energy and diplomacy move together.',
      victoryFraming: 'Jakarta kept the islands connected and the bloc negotiable.',
    },
    'taiwan-allied-command': {
      titleOverride: 'Pacific Holdout',
      subtitle: 'The frontline survives without strategic capture.',
      description: 'Taiwan Allied Command reaches 2042 still connected to orbital coverage, cyber defense, logistics and financial timing. The front is ugly, but it remains survivable.',
      interpretation: 'A frontline resilience win. The command preserved options under direct war pressure.',
      strategicLesson: 'Coalition survival depends on redundant timing, cyber discipline and logistics that can absorb shock.',
      victoryFraming: 'The spearpoint held long enough to matter.',
    },
  },
  'asean-shield': {
    malaysia: {
      titleOverride: 'ASEAN Shield',
      subtitle: 'Malaysia anchors a damaged but functioning bloc.',
      description: 'The Shield framework is imperfect, underfunded and argued over in several languages, but ASEAN now negotiates with great powers as a bloc.',
      interpretation: 'A regional-cohesion win. Malaysia turned restraint into convening power.',
      strategicLesson: 'The best shield was not a treaty. It was enough trust to keep everyone in the room.',
      victoryFraming: 'ASEAN bent, but it did not fold.',
    },
    singapore: {
      titleOverride: 'Regional Dependency Broker',
      subtitle: 'Singapore becomes the trusted continuity broker.',
      description: 'Singapore\'s finance, ports and crisis channels become the practical bridge between fragmented neighbors. It is influence, and also responsibility.',
      interpretation: 'A brokered-cohesion win. Singapore\'s credibility held because others still trusted the rails.',
      strategicLesson: 'A continuity hub must share enough resilience that neighbors do not see it as extraction.',
      victoryFraming: 'The island became a hinge instead of a bunker.',
    },
    indonesia: {
      titleOverride: 'ASEAN Maritime Mandate',
      subtitle: 'Jakarta leads because it kept the sea lanes real.',
      description: 'Indonesia turns patrol coordination, energy assurance and diplomacy into a practical ASEAN maritime mandate. Not everyone loves it. Everyone uses it.',
      interpretation: 'A leadership win. Scale became a regional service, not just a national claim.',
      strategicLesson: 'ASEAN leadership follows whoever can keep movement possible under pressure.',
      victoryFraming: 'The archipelago became the shield\'s spine.',
    },
    'taiwan-allied-command': {
      titleOverride: 'Allied Spearpoint',
      subtitle: 'The coalition holds a wider support architecture.',
      description: 'Taiwan Allied Command survives because regional support, logistics and cyber warning became organized enough to outlast the first shock.',
      interpretation: 'A coalition-cohesion win. The frontline was not left to fight as an isolated island.',
      strategicLesson: 'Allied support works when regional continuity is treated as warfighting infrastructure.',
      victoryFraming: 'The spearpoint stayed connected to the shield behind it.',
    },
  },
  'pacific-client-state': {
    malaysia: {
      titleOverride: 'Pacific Client State',
      subtitle: 'The lights stayed on. The switch moved.',
      description: 'Malaysia is safer, wired and thoroughly spoken for. External sensors watch the Straits, external clocks time the banks, and autonomy became conditional.',
      interpretation: 'A dependency outcome. Survival came with a strategic landlord.',
      strategicLesson: 'Capability borrowed too long becomes architecture.',
      collapseExplanation: 'Sovereignty or alignment pressure crossed the point where hedging no longer looked credible.',
    },
    singapore: {
      titleOverride: 'Financial Lifeboat State',
      subtitle: 'Singapore survives by carrying too much of the region.',
      description: 'Singapore remains rich, trusted and indispensable, but continuity became a lifeboat business with outside powers setting more terms than anyone admits.',
      interpretation: 'A dependency outcome. The fortress held, but its operating model narrowed.',
      strategicLesson: 'Being indispensable is leverage until every partner treats it as an entitlement.',
      collapseExplanation: 'Dependency pressure overtook neutrality and made continuity look like alignment.',
    },
    indonesia: {
      titleOverride: 'Jakarta Overextension',
      subtitle: 'Indonesia leads until leadership becomes constraint.',
      description: 'Indonesia remains central to regional security, but foreign support, market pressure and maritime commitments now define what Jakarta can safely choose.',
      interpretation: 'A dependency outcome. Scale did not prevent strategic capture; it made the capture expensive.',
      strategicLesson: 'Leadership without recoverable reserves becomes exposure.',
      collapseExplanation: 'Alignment pressure and coordination strain outpaced strategic autonomy.',
    },
    'taiwan-allied-command': {
      titleOverride: 'Allied Spearpoint',
      subtitle: 'The command survives as the front edge of someone else\'s plan.',
      description: 'Taiwan Allied Command holds enough systems to keep fighting, but allied dependency now decides tempo, targeting, finance and orbital access.',
      interpretation: 'A frontline dependency outcome. Survival and autonomy diverged.',
      strategicLesson: 'Coalition support must preserve command agency or the spearpoint becomes a tool.',
      collapseExplanation: 'Alignment pressure and war exposure narrowed the command\'s independent choices.',
    },
  },
  'singapore-dependency': {
    malaysia: {
      titleOverride: 'Singapore Dependency',
      subtitle: 'Contingency became architecture.',
      description: 'The economy survived routed, cleared and insured through Singapore. Malaysia keeps its flag; the settlement layer keeps a different address.',
      interpretation: 'A continuity dependency. The bridge worked so well that it became the road.',
      strategicLesson: 'Emergency rails need exit ramps.',
      collapseExplanation: 'Financial continuity survived by leaning too permanently on Singapore.',
    },
    singapore: {
      titleOverride: 'Regional Dependency Broker',
      subtitle: 'Everyone needs Singapore. That is not the same as freedom.',
      description: 'Singapore\'s continuity channels become the region\'s default fallback. The city-state is trusted, rich and overloaded by everyone else\'s risk.',
      interpretation: 'A mixed continuity outcome. Broker power grew, but so did dependency pressure.',
      strategicLesson: 'A hub must price resilience without becoming a regional hostage.',
      collapseExplanation: 'Continuity-heavy play made Singapore indispensable and exposed.',
    },
    indonesia: {
      titleOverride: 'Fragmented Islands, External Rails',
      subtitle: 'Archipelago coordination leans on someone else\'s settlement layer.',
      description: 'Indonesia keeps ports and energy moving, but too much finance and timing runs through external continuity channels.',
      interpretation: 'A mixed coordination outcome. Maritime scale survived; financial autonomy thinned.',
      strategicLesson: 'Archipelago power needs its own trusted rails.',
      collapseExplanation: 'Financial stress pushed Jakarta toward external continuity architecture.',
    },
    'taiwan-allied-command': {
      titleOverride: 'Semiconductor Lifeline',
      subtitle: 'The chip corridor survives through external continuity rails.',
      description: 'Semiconductor logistics and war finance keep moving, but the command depends heavily on outside settlement, insurance and timing channels.',
      interpretation: 'A mixed lifeline outcome. The corridor stayed alive at the price of leverage.',
      strategicLesson: 'Critical supply chains need redundant finance, not just redundant ships.',
      collapseExplanation: 'Financial timing pressure made external continuity unavoidable.',
    },
  },
  'digital-emergency-state': {
    malaysia: {
      titleOverride: 'Digital Emergency State',
      subtitle: 'Security outlived legitimacy.',
      description: 'The attacks never stopped, so the emergency never ended. The network is finally secure. So is everything else.',
      interpretation: 'A cyber-governance failure. Defense became rule by exception.',
      strategicLesson: 'Cyber resilience without accountable trust corrodes the state it protects.',
      collapseExplanation: 'Cyber systems fell low enough that emergency powers became permanent.',
    },
    singapore: {
      titleOverride: 'Locked Continuity State',
      subtitle: 'The fortress closed from the inside.',
      description: 'Singapore keeps core systems running through emergency controls, but trust becomes procedural rather than political.',
      interpretation: 'A cyber-continuity failure. Discipline saved systems while narrowing society.',
      strategicLesson: 'Continuity controls need release valves before they become the constitution.',
      collapseExplanation: 'Cyber pressure turned resilience into permanent lockdown logic.',
    },
    indonesia: {
      titleOverride: 'Fragmented Islands, Fragmented Bloc',
      subtitle: 'Cyber emergency powers spread unevenly across the archipelago.',
      description: 'Indonesia\'s systems keep functioning in patches, but emergency cyber control fractures between islands, agencies and political centers.',
      interpretation: 'A coordination failure. The cyber state arrived faster than the trust to govern it.',
      strategicLesson: 'Archipelago resilience needs legitimacy at the edge, not just command at the center.',
      collapseExplanation: 'Cyber resilience collapsed before national coordination could stabilize.',
    },
    'taiwan-allied-command': {
      titleOverride: 'Cyber Blindfall',
      subtitle: 'The command secures fragments after losing the whole picture.',
      description: 'Taiwan Allied Command keeps some hardened systems alive, but deception, outages and emergency controls fracture the command picture.',
      interpretation: 'A cyber-front failure. The war did not need to destroy every node; it only had to break trust in the feed.',
      strategicLesson: 'Frontline cyber defense must preserve confidence in decisions, not just uptime.',
      collapseExplanation: 'Cyber resilience fell below the threshold for coherent command.',
    },
  },
  'public-reality-collapse': {
    malaysia: {
      titleOverride: 'Public Reality Collapse',
      subtitle: 'The state functions. Its audience is gone.',
      description: 'The last thing Malaysians agreed on was that nothing could be agreed on. Every announcement is presumed synthetic.',
      interpretation: 'An information legitimacy failure. Facts lost their coordinating power.',
      strategicLesson: 'Public reality is infrastructure.',
      collapseExplanation: 'Public trust in shared facts hit zero.',
    },
    singapore: {
      titleOverride: 'Rich Island, Burning Region',
      subtitle: 'Continuity holds, but belief leaks out.',
      description: 'Singapore keeps services running, yet regional panic, market rumors and synthetic influence make every official signal look priced or staged.',
      interpretation: 'An information-continuity failure. Operational trust outlived public trust.',
      strategicLesson: 'Markets need facts as much as liquidity.',
      collapseExplanation: 'Public reality collapsed under synthetic pressure and regional panic.',
    },
    indonesia: {
      titleOverride: 'Fragmented Islands, Fragmented Bloc',
      subtitle: 'The information space splits faster than Jakarta can bind it.',
      description: 'Archipelago rumor, separatist narratives and synthetic influence overwhelm national coordination. The map still exists; the shared story does not.',
      interpretation: 'A legitimacy failure across scale. Coordination needs a common reality.',
      strategicLesson: 'A large state must defend information trust locally and nationally at once.',
      collapseExplanation: 'Public reality collapsed before regional leadership could stabilize.',
    },
    'taiwan-allied-command': {
      titleOverride: 'Synthetic Escalation Spiral',
      subtitle: 'The command cannot tell signal from bait fast enough.',
      description: 'PLA indicators, synthetic media and cyber deception flood the theatre until even true warnings arrive suspect.',
      interpretation: 'An escalation-signals failure. The frontline lost confidence in the information environment.',
      strategicLesson: 'Warning systems must authenticate reality, not merely collect more data.',
      collapseExplanation: 'Public reality fell below the threshold for coherent crisis communication.',
    },
  },
  'market-funeral-2040': {
    malaysia: {
      titleOverride: 'Market Funeral 2040',
      subtitle: 'The ringgit did not crash so much as evaporate.',
      description: 'A week of frozen settlements, a month of capital flight and a decade of consequences bury the crisis strategy.',
      interpretation: 'A financial-continuity failure. No policy survived the payment layer stopping.',
      strategicLesson: 'Financial continuity is national security in executable form.',
      collapseExplanation: 'Financial continuity reached zero.',
    },
    singapore: {
      titleOverride: 'Straitline Collapse',
      subtitle: 'The rails everyone trusted finally jammed.',
      description: 'Settlement, port confidence and border liquidity seize together. Singapore remains capable, but the continuity brand takes a historic wound.',
      interpretation: 'A hub failure. Concentrated trust became concentrated exposure.',
      strategicLesson: 'A financial fortress still needs regional firebreaks.',
      collapseExplanation: 'Financial continuity failed despite Singapore\'s stronger starting posture.',
    },
    indonesia: {
      titleOverride: 'Energy-Strait Breakdown',
      subtitle: 'Liquidity, exports and energy confidence fail together.',
      description: 'Rupiah pressure, export uncertainty and sea-lane disruption converge. Indonesia\'s scale becomes harder to finance than to defend.',
      interpretation: 'A financial-energy failure. The archipelago could not coordinate liquidity fast enough.',
      strategicLesson: 'Maritime resilience and financial resilience have to clear on the same clock.',
      collapseExplanation: 'Financial continuity failed under market and logistics pressure.',
    },
    'taiwan-allied-command': {
      titleOverride: 'Semiconductor Lifeline Severed',
      subtitle: 'The war economy loses its trusted clearing layer.',
      description: 'Chip finance, insurance, emergency liquidity and timing corridors fail together. Hardware remains; confidence in movement does not.',
      interpretation: 'A war-finance failure. The frontline could not insure or clear the supply chain.',
      strategicLesson: 'Semiconductor resilience is financial timing as much as fabrication.',
      collapseExplanation: 'Financial continuity fell to zero under blockade and timing pressure.',
    },
  },
  'quiet-ciso': {
    malaysia: {
      titleOverride: 'The Quiet CISO of a Broken Nation',
      subtitle: 'You kept trying after the system stopped being savable by one person.',
      description: 'The inbox survives you professionally. Somewhere around week ninety, the country stopped being a problem any one command seat could carry.',
      interpretation: 'A command-burden failure. Human endurance became the limiting system.',
      strategicLesson: 'A crisis architecture that requires heroics has already failed.',
      collapseExplanation: 'Personal stamina collapsed under severe mental load.',
    },
    singapore: {
      titleOverride: 'Continuity Burnout',
      subtitle: 'The machine ran because the command seat did not stop.',
      description: 'Singapore\'s systems remain disciplined, but the human layer pays the bill. Every bridge call became permanent.',
      interpretation: 'A command-burden failure. Operational excellence hid exhaustion until it became strategy.',
      strategicLesson: 'Continuity states need succession and rest as real infrastructure.',
      collapseExplanation: 'Command burden overwhelmed personal stamina.',
    },
    indonesia: {
      titleOverride: 'Jakarta Overextension',
      subtitle: 'The archipelago needed more command capacity than one seat could provide.',
      description: 'Indonesia keeps answering incidents across islands, ports, energy corridors and diplomacy until the command burden outruns the state\'s rhythm.',
      interpretation: 'A command-burden failure at scale. Coordination depended too much on central stamina.',
      strategicLesson: 'Archipelago resilience needs distributed authority before the center burns out.',
      collapseExplanation: 'Personal stamina collapsed while mental load remained severe.',
    },
    'taiwan-allied-command': {
      titleOverride: 'Blockade Exhaustion',
      subtitle: 'The frontline survives pieces of the war, but not the tempo.',
      description: 'Taiwan Allied Command holds too many feeds, logistics calls, cyber alerts and allied demands for too long. The front keeps moving; the command seat does not.',
      interpretation: 'A frontline-burden failure. Tempo became the weapon.',
      strategicLesson: 'Coalition command must absorb tempo, not merely respond faster.',
      collapseExplanation: 'Personal stamina failed under frontline mental load.',
    },
  },
};

export const ENDINGS: EndingDef[] = [
  {
    id: 'sovereign-middle-power',
    title: 'The Sovereign Middle Power',
    tone: 'good',
    description:
      'Malaysia reaches 2042 bruised but unowned. The banks settle, the ports move, the Straits stay open, and no great power holds the keys to Putrajaya.',
    factionOverlays: OVERLAYS['sovereign-middle-power'],
  },
  {
    id: 'asean-shield',
    title: 'The ASEAN Shield',
    tone: 'good',
    description:
      'Against every precedent, ASEAN held, and Malaysia anchored it. The Shield framework is imperfect, but the region now negotiates with great powers as a bloc.',
    factionOverlays: OVERLAYS['asean-shield'],
  },
  {
    id: 'pacific-client-state',
    title: 'The Pacific Client State',
    tone: 'mixed',
    description:
      'Malaysia is safe, wired, and thoroughly spoken for. The lights stayed on. The price was the switch.',
    factionOverlays: OVERLAYS['pacific-client-state'],
  },
  {
    id: 'singapore-dependency',
    title: 'The Singapore Dependency',
    tone: 'mixed',
    description:
      'The economy survived, routed, cleared, and insured through Singapore. Somewhere along the crisis, contingency became architecture.',
    factionOverlays: OVERLAYS['singapore-dependency'],
  },
  {
    id: 'digital-emergency-state',
    title: 'The Digital Emergency State',
    tone: 'bad',
    description:
      'The attacks never stopped, so the emergency never ended. The network is finally secure. So is everything else.',
    factionOverlays: OVERLAYS['digital-emergency-state'],
  },
  {
    id: 'public-reality-collapse',
    title: 'The Public Reality Collapse',
    tone: 'bad',
    description:
      'The last thing Malaysians agreed on was that nothing could be agreed on. The state still functions, but shared reality does not.',
    factionOverlays: OVERLAYS['public-reality-collapse'],
  },
  {
    id: 'market-funeral-2040',
    title: 'The Market Funeral 2040',
    tone: 'bad',
    description:
      'The ringgit did not crash so much as evaporate: a week of frozen settlements, a month of capital flight, and a decade of consequences.',
    factionOverlays: OVERLAYS['market-funeral-2040'],
  },
  {
    id: 'quiet-ciso',
    title: 'The Quiet CISO of a Broken Nation',
    tone: 'bad',
    description:
      'You did everything. You slept nowhere. The systems you defended survive you professionally. The inbox does not care.',
    factionOverlays: OVERLAYS['quiet-ciso'],
  },
];

export function getEnding(id: EndingId): EndingDef {
  const found = ENDINGS.find((e) => e.id === id);
  if (!found) throw new Error(`Unknown ending: ${id}`);
  return found;
}

export function getEndingOverlay(id: EndingId, factionId: PlayableFactionId): EndingFactionOverlay {
  return getEnding(id).factionOverlays[factionId];
}
