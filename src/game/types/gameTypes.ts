// Core type definitions for Straits Protocol 2040: Pacific Fracture.
// All game logic is data-driven and pure; these types are the contract
// between the data files, the engines, and the UI.

export type MetricKey =
  | 'sovereignty'
  | 'alignmentPressure'
  | 'cyberResilience'
  | 'orbitalAccess'
  | 'financialContinuity'
  | 'maritimeControl'
  | 'energyAssurance'
  | 'publicReality'
  | 'aseanCohesion'
  | 'institutionalTrust'
  | 'personalStamina'
  | 'mentalLoad';

/** All metrics are clamped to 0..100. */
export type Metrics = Record<MetricKey, number>;

/** Partial metric deltas applied by actions, events and AI moves. */
export type MetricDelta = Partial<Record<MetricKey, number>>;

export interface MetricInfo {
  key: MetricKey;
  label: string;
  short: string;
  /** true when a HIGH value is bad (e.g. Alignment Pressure, Mental Load). */
  badWhenHigh: boolean;
  description: string;
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

export type PhaseId = 1 | 2 | 3 | 4 | 5;

export interface PhaseInfo {
  id: PhaseId;
  name: string;
  weeks: [number, number];
  description: string;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export type RoleId =
  | 'security-consultant'
  | 'policy-strategist'
  | 'intelligence-officer'
  | 'finance-operator'
  | 'military-liaison';

export interface RoleDef {
  id: RoleId;
  name: string;
  theme: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  /** Applied on top of the base starting metrics. */
  startingModifiers: MetricDelta;
  /** Action ids only this role can use. */
  uniqueActionIds: string[];
  /** True if this role can read AI actor intent directly. */
  seesActorIntent?: boolean;
}

// ---------------------------------------------------------------------------
// AI actors
// ---------------------------------------------------------------------------

export type ActorId =
  | 'us-pacom'
  | 'china-frag'
  | 'taiwan-allied'
  | 'russia-network'
  | 'europe-compact'
  | 'singapore-authority'
  | 'indonesia-maritime'
  | 'financial-markets'
  | 'threat-ecosystem';

export interface ActorEffect {
  actorId: ActorId;
  relationship?: number;
  pressure?: number;
  aggression?: number;
}

export interface AiMoveDef {
  id: string;
  name: string;
  /** Timeline text shown to the player when the move fires. */
  report: string;
  weight: number;
  /** Restrict to these phases; omit for all phases. */
  phases?: PhaseId[];
  metricEffects?: MetricDelta;
  actorEffects?: ActorEffect[];
  flagsAdded?: string[];
  requiresFlags?: string[];
  forbidsFlags?: string[];
  minRelationship?: number;
  maxRelationship?: number;
  /** Weeks before this move can fire again. */
  cooldown?: number;
}

export interface ActorDef {
  id: ActorId;
  name: string;
  short: string;
  description: string;
  wants: string[];
  initial: {
    relationship: number; // -100 hostile .. +100 aligned
    pressure: number; // 0..100 pressure applied on Malaysia
    aggression: number; // 0..100 likelihood of acting on a turn
    intent: string;
  };
  /** Aggression added when a phase begins, keyed by phase id. */
  phaseAggression?: Partial<Record<PhaseId, number>>;
  moves: AiMoveDef[];
}

export interface ActorState {
  id: ActorId;
  relationship: number;
  pressure: number;
  aggression: number;
  intent: string;
  recentMoves: string[];
  cooldowns: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Player actions
// ---------------------------------------------------------------------------

export type ActionCategory =
  | 'cyber'
  | 'diplomacy'
  | 'finance'
  | 'maritime'
  | 'information'
  | 'energy'
  | 'personal'
  | 'strategy';

export interface ActionRisk {
  label: string;
  /** Probability 0..1 that the downside fires. */
  chance: number;
  metricEffects: MetricDelta;
  actorEffects?: ActorEffect[];
  report: string;
}

export interface ActionDef {
  id: string;
  name: string;
  description: string;
  category: ActionCategory;
  roleRestriction?: RoleId[];
  phaseRestriction?: PhaseId[];
  metricEffects: MetricDelta;
  actorEffects?: ActorEffect[];
  flagsAdded?: string[];
  requiresFlags?: string[];
  forbidsFlags?: string[];
  risk?: ActionRisk;
  cooldown?: number;
  /** If set, action can be taken at most once per campaign. */
  once?: boolean;
}

export interface ActionAvailability {
  available: boolean;
  lockedReason?: string;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  metricEffects?: MetricDelta;
  actorEffects?: ActorEffect[];
  flagsAdded?: string[];
  report: string;
}

export interface EventCondition {
  minWeek?: number;
  maxWeek?: number;
  requiresFlags?: string[];
  forbidsFlags?: string[];
  metricBelow?: Partial<Record<MetricKey, number>>;
  metricAbove?: Partial<Record<MetricKey, number>>;
}

export interface EventDef {
  id: string;
  title: string;
  description: string;
  phases: PhaseId[];
  weight: number;
  once?: boolean;
  condition?: EventCondition;
  /** Applied immediately when the event fires (also for choice events). */
  metricEffects?: MetricDelta;
  actorEffects?: ActorEffect[];
  flagsAdded?: string[];
  choices?: EventChoice[];
}

export interface ActiveEvent {
  eventId: string;
  week: number;
  resolved: boolean;
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export type TimelineEntryType =
  | 'player'
  | 'ai'
  | 'event'
  | 'system'
  | 'phase'
  | 'risk';

export interface TimelineEntry {
  id: string;
  week: number;
  phase: PhaseId;
  type: TimelineEntryType;
  actorId?: ActorId;
  title: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Endings
// ---------------------------------------------------------------------------

export type EndingId =
  | 'sovereign-middle-power'
  | 'asean-shield'
  | 'pacific-client-state'
  | 'singapore-dependency'
  | 'digital-emergency-state'
  | 'public-reality-collapse'
  | 'market-funeral-2040'
  | 'quiet-ciso';

export interface EndingDef {
  id: EndingId;
  title: string;
  description: string;
  tone: 'good' | 'mixed' | 'bad';
}

export interface EndingResult {
  endingId: EndingId;
  week: number;
  early: boolean;
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

export type GameStatus = 'setup' | 'active' | 'ended';

export interface CompletedAction {
  week: number;
  actionId: string;
  name: string;
}

export interface GameState {
  campaignId: string;
  seed: number;
  /** Number of RNG draws consumed so far (for deterministic save/load). */
  rngCursor: number;
  turn: number;
  week: number;
  maxWeeks: number;
  phase: PhaseId;
  selectedRole: RoleId | null;
  status: GameStatus;
  metrics: Metrics;
  actors: Record<ActorId, ActorState>;
  activeEvents: ActiveEvent[];
  firedEvents: string[];
  timeline: TimelineEntry[];
  completedActions: CompletedAction[];
  actionCooldowns: Record<string, number>;
  flags: string[];
  ending: EndingResult | null;
}
