import type { DifficultyDef, DifficultyId } from '../types/gameTypes';

// Adviser is the v0.1 baseline; Analyst and Crisis Chair scale around it.
export const DIFFICULTIES: DifficultyDef[] = [
  {
    id: 'analyst',
    name: 'Analyst',
    tagline: 'The world is on fire, but the briefings are good.',
    description:
      'Lower AI pressure, softer event damage, stronger passive recovery. ' +
      'For learning the systems and reaching week 104 without heroics.',
    aiWeightMult: 0.85,
    extraActorChance: 0.15,
    eventSeverityMult: 0.75,
    recoveryStep: 2,
    mobilizationThreshold: 35,
    crisisLoadStep: 1,
    startingModifiers: { institutionalTrust: 5, personalStamina: 5 },
  },
  {
    id: 'adviser',
    name: 'Adviser',
    tagline: 'The standard 2040 experience.',
    description:
      'The baseline campaign. Competent play survives; drifting does not. ' +
      'Every strong move has a bill attached.',
    aiWeightMult: 1.0,
    extraActorChance: 0.3,
    eventSeverityMult: 1.0,
    recoveryStep: 1,
    mobilizationThreshold: 30,
    crisisLoadStep: 1,
    startingModifiers: {},
  },
  {
    id: 'crisis-chair',
    name: 'Crisis Chair',
    tagline: 'Everyone is calling. All the lines are red.',
    description:
      'Higher AI pressure, harsher events, weaker recovery, and aggressive ' +
      'actors move more often. Harsh, not instant death — but close.',
    aiWeightMult: 1.2,
    extraActorChance: 0.45,
    eventSeverityMult: 1.2,
    recoveryStep: 1,
    mobilizationThreshold: 25,
    crisisLoadStep: 2,
    startingModifiers: { institutionalTrust: -5, alignmentPressure: 5 },
  },
];

export function getDifficulty(id: DifficultyId): DifficultyDef {
  const found = DIFFICULTIES.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown difficulty: ${id}`);
  return found;
}
