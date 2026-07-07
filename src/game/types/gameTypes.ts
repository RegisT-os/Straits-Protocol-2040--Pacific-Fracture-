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
// Difficulty
// ---------------------------------------------------------------------------

export type DifficultyId = 'analyst' | 'adviser' | 'crisis-chair';

export interface DifficultyDef {
  id: DifficultyId;
  name: string;
  tagline: string;
  description: string;
  /** Multiplier on AI actor selection weight (how often actors act on Malaysia). */
  aiWeightMult: number;
  /** Chance of one extra actor acting per turn. */
  extraActorChance: number;
  /** Scales negative metric effects of automatic events. */
  eventSeverityMult: number;
  /** Points restored by each passive recovery rule per week. */
  recoveryStep: number;
  /** Metric floor below which crisis mobilization kicks in (+1/week). */
  mobilizationThreshold: number;
  /** Weekly Mental Load gain while core systems are in crisis. */
  crisisLoadStep: number;
  /** Applied on top of base + role starting metrics. */
  startingModifiers: MetricDelta;
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
// Delayed consequences (scheduled effects)
// ---------------------------------------------------------------------------

/** Data-side definition: a delayed consequence attached to an action/move/choice. */
export interface ScheduleDef {
  id: string;
  /** Weeks after the scheduling week at which the effect resolves. */
  delayWeeks: number;
  title: string;
  description: string;
  metricEffects?: MetricDelta;
  actorEffects?: ActorEffect[];
  flagsAdded?: string[];
  /** If set, the effect only resolves while the condition still holds. */
  requiresFlags?: string[];
  forbidsFlags?: string[];
}

/** State-side instance: a scheduled effect waiting in the game state. */
export interface ScheduledEffect {
  id: string;
  dueWeek: number;
  /** What set this in motion (action/event/move name), for the timeline. */
  source: string;
  title: string;
  description: string;
  metricEffects?: MetricDelta;
  actorEffects?: ActorEffect[];
  flagsAdded?: string[];
  requiresFlags?: string[];
  forbidsFlags?: string[];
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

/**
 * A world-state condition that scales a weight when it matches.
 * All listed conditions must hold (AND) for the multiplier to apply;
 * several dynamics on one item multiply together.
 */
export interface WeightDynamic {
  requiresFlags?: string[];
  forbidsFlags?: string[];
  /** Matches when every listed metric is strictly below its threshold. */
  metricBelow?: Partial<Record<MetricKey, number>>;
  /** Matches when every listed metric is strictly above its threshold. */
  metricAbove?: Partial<Record<MetricKey, number>>;
  multiplier: number;
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
  /** World-state reactions: multiply this move's weight when matched. */
  dynamics?: WeightDynamic[];
  /** Delayed consequences set in motion by this move. */
  schedules?: ScheduleDef[];
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
  /** World-state reactions: multiply this actor's chance of acting when matched. */
  dynamics?: WeightDynamic[];
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
  /** Delayed consequences set in motion by taking this action. */
  schedules?: ScheduleDef[];
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
  /** Delayed consequences set in motion by this choice. */
  schedules?: ScheduleDef[];
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
  /** Weeks before a repeatable event may fire again (default applies if unset). */
  cooldown?: number;
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
  | 'risk'
  | 'scheduled';

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
  difficulty: DifficultyId;
  status: GameStatus;
  metrics: Metrics;
  actors: Record<ActorId, ActorState>;
  activeEvents: ActiveEvent[];
  firedEvents: string[];
  /** Week each event last fired, for repeat-cooldown control. */
  lastEventWeek: Record<string, number>;
  timeline: TimelineEntry[];
  completedActions: CompletedAction[];
  actionCooldowns: Record<string, number>;
  /** Actions selected for this turn but not yet executed (survives save/load). */
  pendingActions: string[];
  /** Delayed consequences waiting to resolve. */
  scheduledEffects: ScheduledEffect[];
  flags: string[];
  ending: EndingResult | null;
}
