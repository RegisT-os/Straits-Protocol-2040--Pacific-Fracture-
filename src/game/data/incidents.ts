import type { IncidentDef } from '../types/gameTypes';

// Incident templates. `onset` hits the node once when the incident lands;
// `weekly` grinds it while active; expiry is announced in the timeline.
export const INCIDENTS: IncidentDef[] = [
  {
    id: 'gps-spoofing-malacca',
    title: 'GPS Spoofing Cluster',
    severity: 2,
    duration: 3,
    onset: { riskLevel: 12, stability: -6 },
    weekly: { riskLevel: 2 },
    tags: ['pnt', 'shipping'],
  },
  {
    id: 'port-ot-degradation',
    title: 'Port OT Degradation',
    severity: 2,
    duration: 4,
    onset: { riskLevel: 10, stability: -8, cyberExposure: 5 },
    weekly: { stability: -1 },
    tags: ['ot-systems', 'logistics'],
  },
  {
    id: 'capital-flight-pressure',
    title: 'Capital Flight Pressure',
    severity: 2,
    duration: 3,
    onset: { riskLevel: 10, stability: -6 },
    weekly: { riskLevel: 2 },
    tags: ['capital', 'confidence'],
  },
  {
    id: 'deepfake-panic-cluster',
    title: 'Deepfake Panic Cluster',
    severity: 2,
    duration: 3,
    onset: { riskLevel: 10, stability: -6 },
    weekly: { stability: -1 },
    tags: ['synthetic-media', 'panic'],
  },
  {
    id: 'satellite-internet-interruption',
    title: 'Satellite Internet Interruption',
    severity: 2,
    duration: 2,
    onset: { riskLevel: 12, stability: -10 },
    tags: ['connectivity', 'orbital'],
  },
  {
    id: 'undersea-cable-instability',
    title: 'Undersea Cable Instability',
    severity: 3,
    duration: 4,
    onset: { riskLevel: 14, stability: -10 },
    weekly: { riskLevel: 1 },
    tags: ['cables', 'internet'],
  },
  {
    id: 'china-maritime-shadowing',
    title: 'China Maritime Shadowing',
    severity: 2,
    duration: 4,
    onset: { riskLevel: 10, stability: -5 },
    weekly: { riskLevel: 1 },
    tags: ['coast-guard', 'grey-zone'],
  },
  {
    id: 'russian-cyber-mercenary-probe',
    title: 'Russian Cyber-Mercenary Probe',
    severity: 2,
    duration: 3,
    onset: { riskLevel: 10, cyberExposure: 8, stability: -4 },
    tags: ['mercenary', 'probing'],
  },
  {
    id: 'border-liquidity-shift',
    title: 'Border Liquidity Shift',
    severity: 1,
    duration: 3,
    onset: { riskLevel: 8, stability: -4 },
    tags: ['border', 'capital'],
  },
  {
    id: 'asean-summit-deadlock',
    title: 'ASEAN Summit Deadlock',
    severity: 1,
    duration: 2,
    onset: { riskLevel: 8, stability: -5 },
    tags: ['diplomacy', 'paralysis'],
  },
  {
    id: 'cloud-credential-cascade',
    title: 'Cloud Credential Cascade',
    severity: 3,
    duration: 3,
    onset: { riskLevel: 14, cyberExposure: 8, stability: -8 },
    weekly: { riskLevel: 2 },
    tags: ['cloud', 'credentials'],
  },
  {
    id: 'grey-zone-probe',
    title: 'Grey-Zone Probe',
    severity: 1,
    duration: 2,
    onset: { riskLevel: 8, stability: -4 },
    tags: ['grey-zone', 'attribution-unclear'],
  },
];

export function getIncident(id: string): IncidentDef | undefined {
  return INCIDENTS.find((i) => i.id === id);
}
