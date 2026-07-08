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

export interface RolePresentation {
  name?: string;
  theme?: string;
  description?: string;
  strengths?: string[];
  weaknesses?: string[];
  commandSeat?: string;
}

export interface RoleDef {
  id: RoleId;
  name: string;
  theme: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  commandSeat: string;
  presentationOverrides?: Partial<Record<PlayableFactionId, RolePresentation>>;
  /** Applied on top of the base starting metrics. */
  startingModifiers: MetricDelta;
  /** Action ids only this role can use. */
  uniqueActionIds: string[];
  /** True if this role can read AI actor intent directly. */
  seesActorIntent?: boolean;
}

// ---------------------------------------------------------------------------
// Strategic map
// ---------------------------------------------------------------------------

export type TheatreId =
  | 'malaysia-core'
  | 'malacca-strait'
  | 'south-china-sea'
  | 'cyber-financial'
  | 'orbital'
  | 'asean-region'
  | 'external';

export interface TheatreInfo {
  id: TheatreId;
  name: string;
  description: string;
}

export type MapNodeId =
  // Malaysia Core
  | 'kuala-lumpur'
  | 'putrajaya'
  | 'port-klang'
  | 'johor-bahru'
  | 'penang'
  | 'bintulu-lng'
  | 'sabah'
  | 'sarawak'
  // Malacca Strait
  | 'malacca-strait'
  | 'singapore-strait'
  | 'batam-corridor'
  | 'cable-landing-zone'
  // South China Sea
  | 'malaysian-eez'
  | 'luconia-shoals'
  | 'scs-air-sea-corridor'
  | 'brunei-energy-corridor'
  // Cyber-Financial Layer
  | 'bnm-core'
  | 'payment-rails'
  | 'bursa-node'
  | 'cloud-region'
  | 'digital-id'
  // Orbital Layer
  | 'asean-microsat'
  | 'commercial-satnet'
  | 'financial-timing-link'
  | 'maritime-imaging'
  | 'emergency-nav-mesh'
  // ASEAN Region
  | 'singapore'
  | 'jakarta'
  | 'bangkok'
  | 'manila'
  // External Pressure
  | 'taipei-command'
  | 'china-coastal-warzone'
  | 'us-pacom-node'
  | 'european-front'
  | 'russia-network-node';

export type MapNodeType =
  | 'capital'
  | 'city'
  | 'port'
  | 'energy'
  | 'sea-lane'
  | 'eez'
  | 'infrastructure'
  | 'financial'
  | 'orbital'
  | 'external';

/** Deltas applied to a node's dynamic values (all clamped 0..100). */
export interface NodeDelta {
  stability?: number;
  riskLevel?: number;
  cyberExposure?: number;
}

export interface NodeEffectDef extends NodeDelta {
  nodeId: MapNodeId;
}

export interface IncidentSpawnDef {
  incidentId: string;
  nodeId: MapNodeId;
}

/** Data-side incident template. */
export interface IncidentDef {
  id: string;
  title: string;
  /** 1 minor, 2 major, 3 severe. */
  severity: 1 | 2 | 3;
  /** Weeks the incident stays active on the node. */
  duration: number;
  /** Applied to the node once, when the incident lands. */
  onset: NodeDelta;
  /** Applied to the node every week while active. */
  weekly?: NodeDelta;
  tags: string[];
}

/** State-side incident instance attached to a node. */
export interface MapIncident {
  id: string;
  incidentId: string;
  title: string;
  severity: 1 | 2 | 3;
  source: string;
  startedWeek: number;
  expiresWeek: number;
  tags: string[];
}

export interface MapNodeDef {
  id: MapNodeId;
  name: string;
  theatre: TheatreId;
  type: MapNodeType;
  /** Who effectively controls or dominates the node (display/logic label). */
  owner: string;
  /** Static strategic values 0..100 (0 = irrelevant on that axis). */
  maritimeValue: number;
  financialValue: number;
  orbitalValue: number;
  energyValue: number;
  connectedNodes: MapNodeId[];
  tags: string[];
  initial: { stability: number; riskLevel: number; cyberExposure: number };
}

export interface MapNodeState {
  id: MapNodeId;
  stability: number;
  riskLevel: number;
  cyberExposure: number;
  activeIncidents: MapIncident[];
}

export interface MapState {
  nodes: Record<MapNodeId, MapNodeState>;
}

/** Map-targeting spec on an action: player picks one node from the list. */
export interface ActionTargeting {
  nodeIds: MapNodeId[];
  effect: NodeDelta;
  hint: string;
}

// ---------------------------------------------------------------------------
// Playable factions
// ---------------------------------------------------------------------------

export type PlayableFactionId =
  | 'malaysia'
  | 'singapore'
  | 'indonesia'
  | 'taiwan-allied-command'
  | 'us-pacific-command'
  | 'european-defence-compact'
  | 'russia-eurasian-network';

export interface PlayableFactionLabelOverrides {
  impactLabel?: string;
  endingSubtitle?: string;
}

export interface PlayableFactionDef {
  id: PlayableFactionId;
  name: string;
  shortName: string;
  description: string;
  commandPerspective: string;
  difficultyFlavor: string;
  startingMetricModifiers: MetricDelta;
  startingMapNodeModifiers: NodeEffectDef[];
  startingWarFrontModifiers: WarFrontEffect[];
  uniqueActionIds: string[];
  disabledActionIds?: string[];
  primaryMetrics: MetricKey[];
  strategicPriorities: string[];
  collapseRisks: string[];
  victoryFocus: string;
  factionLabelOverrides?: PlayableFactionLabelOverrides;
}

// ---------------------------------------------------------------------------
// Global war fronts
// ---------------------------------------------------------------------------

export type WarFrontId =
  | 'pacific-war-front'
  | 'european-pressure-front'
  | 'orbital-war-front'
  | 'cyber-war-front'
  | 'maritime-war-front'
  | 'financial-war-front';

export type WarFrontStatus = 'stable' | 'escalating' | 'crisis' | 'breaking';

export interface WarFrontEffect {
  frontId: WarFrontId;
  intensity?: number;
  momentum?: number;
  escalation?: number;
  modifier?: string;
}

export interface WarFrontDef {
  id: WarFrontId;
  name: string;
  description: string;
  theatre: TheatreId;
  intensity: number;
  momentum: number;
  escalationLevel: 1 | 2 | 3 | 4 | 5;
  dominantSide: string;
  linkedActors: ActorId[];
  linkedMapNodes: MapNodeId[];
  linkedMetrics: MetricKey[];
  activeModifiers: string[];
  tags: string[];
}

export interface WarFrontState {
  id: WarFrontId;
  name: string;
  description: string;
  theatre: TheatreId;
  intensity: number;
  momentum: number;
  escalationLevel: 1 | 2 | 3 | 4 | 5;
  dominantSide: string;
  status: WarFrontStatus;
  linkedActors: ActorId[];
  linkedMapNodes: MapNodeId[];
  linkedMetrics: MetricKey[];
  activeModifiers: string[];
  lastShiftWeek: number;
  lastShiftSummary: string;
  tags: string[];
}

export type WarFrontStateMap = Record<WarFrontId, WarFrontState>;

// ---------------------------------------------------------------------------
// Theatre pressure campaigns
// ---------------------------------------------------------------------------

export type PressureCampaignTemplateId =
  | 'china-scs-coercion'
  | 'markets-capital-flight'
  | 'threat-cloud-banking-wave'
  | 'russia-grey-zone-cyber'
  | 'singapore-continuity-hedge'
  | 'europe-sanctions-track'
  | 'pnt-degradation-cycle';

export type PressureCampaignStatus = 'active' | 'completed' | 'disrupted';

export interface PressureCampaignOutcomeEffects {
  metricEffects?: MetricDelta;
  nodeEffects?: NodeEffectDef[];
  flagsAdded?: string[];
}

export interface PressureCampaignStartDef {
  templateId: PressureCampaignTemplateId;
  intensity?: number;
  durationWeeks?: number;
}

export interface PressureCampaignDef {
  id: PressureCampaignTemplateId;
  actorId: ActorId;
  title: string;
  description: string;
  theatre: TheatreId;
  targetNodeIds: MapNodeId[];
  durationWeeks: number;
  intensity: number;
  tags: string[];
  counterActionTags: string[];
  weeklyNodeEffects: NodeDelta;
  weeklyMetricEffects: MetricDelta;
  completionEffects: PressureCampaignOutcomeEffects;
  disruptionEffects: PressureCampaignOutcomeEffects;
  flagsAddedOnStart?: string[];
  flagsAddedOnCompletion?: string[];
}

export interface ActivePressureCampaign {
  id: string;
  templateId: PressureCampaignTemplateId;
  actorId: ActorId;
  title: string;
  description: string;
  theatre: TheatreId;
  targetNodeIds: MapNodeId[];
  startedWeek: number;
  durationWeeks: number;
  currentWeek: number;
  intensity: number;
  status: PressureCampaignStatus;
  tags: string[];
  counterActionTags: string[];
  weeklyNodeEffects: NodeDelta;
  weeklyMetricEffects: MetricDelta;
  completionEffects: PressureCampaignOutcomeEffects;
  disruptionEffects: PressureCampaignOutcomeEffects;
  flagsAddedOnStart?: string[];
  flagsAddedOnCompletion?: string[];
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
  /** Map node deltas applied when the move fires. */
  nodeEffects?: NodeEffectDef[];
  /** Map incidents spawned when the move fires. */
  incidents?: IncidentSpawnDef[];
  /** Theatre pressure campaigns started or intensified when the move fires. */
  pressureCampaigns?: PressureCampaignStartDef[];
  /** Global war-front pressure changes caused by this move. */
  warFrontEffects?: WarFrontEffect[];
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
  | 'orbital'
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
  factionRestriction?: PlayableFactionId[];
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
  /** Untargeted map node deltas applied when the action is taken. */
  nodeEffects?: NodeEffectDef[];
  /** Map incidents spawned when the action is taken. */
  incidents?: IncidentSpawnDef[];
  /** If set, the player must pick one target node from the list. */
  targeting?: ActionTargeting;
  /** Global war-front pressure changes caused by this action. */
  warFrontEffects?: WarFrontEffect[];
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
  nodeEffects?: NodeEffectDef[];
  incidents?: IncidentSpawnDef[];
  pressureCampaigns?: PressureCampaignStartDef[];
  warFrontEffects?: WarFrontEffect[];
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
  nodeEffects?: NodeEffectDef[];
  incidents?: IncidentSpawnDef[];
  pressureCampaigns?: PressureCampaignStartDef[];
  warFrontEffects?: WarFrontEffect[];
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
  | 'scheduled'
  | 'map';

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
  factionOverlays: Record<PlayableFactionId, EndingFactionOverlay>;
}

export interface EndingResult {
  endingId: EndingId;
  week: number;
  early: boolean;
}

export interface EndingFactionOverlay {
  titleOverride?: string;
  subtitle: string;
  description: string;
  interpretation: string;
  strategicLesson: string;
  collapseExplanation?: string;
  victoryFraming?: string;
}

export type ScoreGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ScorecardItem {
  id: string;
  label: string;
  grade: ScoreGrade;
  score: number;
  explanation: string;
  factionCritical: boolean;
}

export interface WarFrontOutcomeItem {
  id: WarFrontId;
  name: string;
  status: WarFrontStatus;
  intensity: number;
  escalationLevel: 1 | 2 | 3 | 4 | 5;
  phrase: 'contained' | 'endured' | 'unstable' | 'lost control';
}

export interface PressureCampaignOutcomeSummary {
  completed: number;
  disrupted: number;
  active: number;
  worstUnresolved: string | null;
  bestDisrupted: string | null;
}

export interface DefiningDecision {
  label: string;
  detail: string;
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
  playableFactionId: PlayableFactionId;
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
  /** Chosen map targets for pending targeted actions, keyed by action id. */
  pendingTargets: Record<string, MapNodeId>;
  /** The strategic map. */
  map: MapState;
  /** Node currently inspected in the map UI (persisted for convenience). */
  selectedNode: MapNodeId | null;
  /** Delayed consequences waiting to resolve. */
  scheduledEffects: ScheduledEffect[];
  /** Multi-week theatre or node pressure campaigns currently tracked. */
  activePressureCampaigns: ActivePressureCampaign[];
  /** Off-map world-war fronts that spill pressure into Malaysia and ASEAN. */
  warFronts: WarFrontStateMap;
  flags: string[];
  ending: EndingResult | null;
}
