# Military Operations Design

Technical design for the military layer shipped in v0.9.2. This is the
implementation contract; deviations should update this document.

## 1. Goals

Add visible, ownable military presence — named assets, assignable
operations, weekly consequences — **without** tactical combat, unit stacks,
hex movement, or attrition simulation. An asset is four gauges, a mission,
and a silhouette. An operation is a bet: pay readiness/logistics now,
receive front/campaign/node/metric relief (or blowback) in N weeks.

## 2. Data Types

All in `src/game/types/gameTypes.ts`:

- `MilitaryAssetType` — union of the 12 asset archetypes
  (`carrier-group`, `destroyer-screen`, `submarine-group`, `patrol-fleet`,
  `drone-squadron`, `cyber-ew-cell`, `orbital-recon`, `port-defense`,
  `convoy-escort`, `amphibious-logistics`, `air-defense-cell`,
  `logistics-fleet`).
- `MilitaryStatus` — `'ready' | 'on-mission' | 'refitting' | 'strained'`.
- `MilitaryMission` — display string (`'Holding station'` or the active
  operation name); kept a string on purpose, status is the machine field.
- `MilitaryAssetDef` — static template (data side).
- `MilitaryAssetState` — live instance in `GameState.militaryAssets`.
- `MilitaryOperationTemplate` — operation definition (data side).
- Active operations are **not** a separate collection: an asset stores
  `activeOperationId` + `operationEndsWeek`, which is sufficient for one
  operation per asset and keeps save/repair simple.

## 3. Asset State Fields

```ts
interface MilitaryAssetState {
  id: string;                 // instance id (templateId at creation)
  templateId: string;
  factionId: PlayableFactionId;
  name: string;
  type: MilitaryAssetType;
  theatre: TheatreId;
  assignedNodeIds: MapNodeId[];
  readiness: number;          // 0..100 — ability to act now
  strength: number;           // 0..100 — hulls/kit; slow-moving
  logistics: number;          // 0..100 — sustainment margin
  exposure: number;           // 0..100 — how visible/targetable it has become
  mission: string;            // display label
  status: MilitaryStatus;
  activeOperationId?: string;
  operationEndsWeek?: number;
  tags: string[];
  showcaseText: string;       // one-line fleet-showcase flavor
}
```

All numeric gauges clamp 0–100 via `clampMilitaryAsset`.

## 4. Operation Template Fields

```ts
interface MilitaryOperationTemplate {
  id: string;
  name: string;
  description: string;
  eligibleAssetTypes: MilitaryAssetType[];
  eligibleFactionIds?: PlayableFactionId[]; // omit = all factions
  targetTheatres?: TheatreId[];             // informational in v0.9.2
  durationWeeks: number;
  readinessCost: number;      // paid on assignment
  logisticsCost: number;      // paid on assignment
  exposureChange: number;     // applied on assignment
  successMetricEffects?: MetricDelta;
  failureMetricEffects?: MetricDelta;
  assignedNodeDelta?: NodeDelta;      // applied to the asset's nodes on success
  nodeEffects?: NodeEffectDef[];      // fixed extra nodes on success
  warFrontEffects?: WarFrontEffect[]; // applied on success
  campaignCounterTags?: string[];     // matched against counterActionTags
  risk: number;               // 0..1 baseline failure pressure
  riskLabel: string;
  tags: string[];
}
```

## 5. Engine Functions

`src/game/engine/militaryEngine.ts` (pure over `GameState` + `Rng`):

- `createInitialMilitaryAssets(factionId)` — 3 assets from the faction's
  templates.
- `getEligibleOperations(asset, state)` — type + faction match, asset not
  on mission, readiness/logistics can cover the costs.
- `assignMilitaryOperation(state, assetId, operationId)` — clones state,
  validates eligibility, pays costs, sets mission/status/ETA, timeline
  entry (`military`).
- `tickMilitaryOperations(state, rng)` — resolves operations whose
  `operationEndsWeek <= week`. Success chance =
  `0.85 − risk + (readiness−50)/250 + (logistics−50)/300 − (exposure−40)/250`,
  clamped to 0.15–0.95, rolled on the campaign `Rng` (deterministic).
  Success applies metric/node/front effects and campaign counters; failure
  applies `failureMetricEffects` and +6 exposure. Either way the asset
  enters `refitting` with a timeline entry.
- `applyMilitaryCampaignCounters(state, tags, source)` — same semantics as
  action-driven disruption: −2 intensity per matching campaign, disruption
  outcome when intensity hits 0.
- `recoverMilitaryAssets(state)` — weekly: idle/refitting assets regain
  readiness +3 / logistics +3, shed exposure −2; `refitting → ready` at
  readiness ≥ 60 and logistics ≥ 50; `strained` while readiness < 30.
- `clampMilitaryAsset(asset)` / `repairMilitaryAssets(state)` — clamp
  gauges, coerce invalid status/mission, drop dangling operation refs
  (used by both the engine and save migration).

Turn order integration (`turnEngine.advanceTurn`): military ticks in step 2
after `tickWarFronts` and before `applyMapPressureOnMetrics`; recovery runs
in the same step. Operations never consume action slots and are never
required to advance.

## 6. UI Components

- `MilitaryOperationsPanel` — board-mode host: asset card grid + selected
  asset detail + assignment panel.
- `MilitaryAssetCard` — silhouette, name, type/theatre, four gauge bars,
  status + mission badges, active-operation ETA.
- `MilitaryAssetSilhouette` — inline SVG per asset type (see UI plan §6).
- `OperationAssignmentPanel` — eligible operation list with duration, costs,
  exposure, risk %, effect chips, counter tags; Assign button.
- Operation preview is embedded in the assignment panel (no separate modal).
- Status badge styling shared through the panel (ready = emerald,
  on-mission = cyan, refitting = amber, strained = red).

## 7. Sim/Smoke Requirements

**sim (`scripts/sim.ts`):**

- every playable faction initializes exactly 3 assets with clamped gauges;
- every asset has at least one eligible operation at start;
- assigning an operation pays costs and sets an ETA;
- ticking to the ETA completes the operation deterministically (same seed →
  same success/failure and same effects);
- a completed operation with matching counter tags reduces an active
  pressure campaign's intensity;
- war fronts, metrics, map nodes and asset gauges stay clamped throughout;
- save migration from v6 initializes `militaryAssets` for the saved faction;
- full campaigns (all factions × roles × difficulties) still terminate and
  replay deterministically; greedy runs report operation completion counts.

**smoke (`scripts/smoke.mjs`):**

- war-room layout renders (command bar + board tabs);
- Military mode opens; an asset card and its SVG silhouette are visible;
- selecting an asset lists eligible operations;
- assigning an operation shows the active mission on the card;
- a timeline filter narrows the feed;
- save/reload preserves assets and the active operation;
- zero console errors.
