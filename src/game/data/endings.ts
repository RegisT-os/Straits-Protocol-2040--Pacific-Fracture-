import type { EndingDef, EndingId } from '../types/gameTypes';

export const ENDINGS: EndingDef[] = [
  {
    id: 'sovereign-middle-power',
    title: 'The Sovereign Middle Power',
    tone: 'good',
    description:
      'Malaysia reaches 2042 bruised but unowned. The banks settle, the ports move, the Straits stay open, and no great power holds the keys to Putrajaya. Historians will call it luck. You know it was one hundred and four consecutive weeks of not blinking.',
  },
  {
    id: 'asean-shield',
    title: 'The ASEAN Shield',
    tone: 'good',
    description:
      'Against every precedent, ASEAN held — and Malaysia anchored it. The Shield framework is imperfect, underfunded, and argued over in four languages, but the region now negotiates with great powers as a bloc. The meeting rooms finally agreed on something.',
  },
  {
    id: 'pacific-client-state',
    title: 'The Pacific Client State',
    tone: 'mixed',
    description:
      'Malaysia is safe, wired, and thoroughly spoken for. US sensors watch the Straits, US clocks time the banks, and the embassy reviews the talking points. The lights stayed on. The price was the switch.',
  },
  {
    id: 'singapore-dependency',
    title: 'The Singapore Dependency',
    tone: 'mixed',
    description:
      'The economy survived — routed, cleared, and insured through Singapore. Somewhere along the crisis, contingency became architecture. Malaysia keeps its flag and its anthem; the settlement layer keeps a different address.',
  },
  {
    id: 'digital-emergency-state',
    title: 'The Digital Emergency State',
    tone: 'bad',
    description:
      'The attacks never stopped, so the emergency never ended. Malaysia is governed through incident-response powers that were meant to expire. The network is finally secure. So is everything else.',
  },
  {
    id: 'public-reality-collapse',
    title: 'The Public Reality Collapse',
    tone: 'bad',
    description:
      'The last thing Malaysians agreed on was that nothing could be agreed on. Every announcement is presumed synthetic, every denial presumed confirmation. The state still functions — it just no longer has an audience that believes it.',
  },
  {
    id: 'market-funeral-2040',
    title: 'The Market Funeral 2040',
    tone: 'bad',
    description:
      'The ringgit did not crash so much as evaporate — a week of frozen settlements, a month of capital flight, and a decade of consequences. The crisis communiqués were excellent. Nobody could pay to print them.',
  },
  {
    id: 'quiet-ciso',
    title: 'The Quiet CISO of a Broken Nation',
    tone: 'bad',
    description:
      'You did everything. You slept nowhere. Somewhere around week ninety the country stopped being savable by any one person, and you kept trying anyway. The systems you defended survive you professionally. The inbox does not care.',
  },
];

export function getEnding(id: EndingId): EndingDef {
  const found = ENDINGS.find((e) => e.id === id);
  if (!found) throw new Error(`Unknown ending: ${id}`);
  return found;
}
