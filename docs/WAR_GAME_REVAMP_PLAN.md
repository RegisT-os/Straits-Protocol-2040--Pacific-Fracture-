# Straits Protocol 2040 — War Game Revamp Plan

Status: adopted at v0.9.2. This document is the master plan for turning the
crisis-dashboard game into a war-room command game without becoming Hearts
of Iron.

## 1. Current Game State

Implemented and verified as of `13341a4` (v0.9):

- **Playable factions (7)**: Malaysia, Singapore, Indonesia, Taiwan Allied
  Command, US Pacific Command, European Defence Compact, Russia Eurasian
  Network. Each has starting metric/map/front modifiers, unique and disabled
  actions, primary metrics, strategic priorities, collapse risks, and a
  victory focus (`data/playableFactions.ts`).
- **Role archetypes (5)** with per-faction presentation overrides
  (`data/roles.ts`): Security Consultant, Policy Strategist, Intelligence
  Officer, Finance Operator, Military Liaison.
- **Strategic map**: 35 nodes across 7 theatres with stability / riskLevel /
  cyberExposure, connections, tags (`data/mapNodes.ts`, `engine/mapEngine.ts`).
- **Incidents**: 12 templates with onset + weekly grind + expiry, spawned by
  AI moves and events (`data/incidents.ts`).
- **Pressure campaigns**: 7 multi-week campaign templates with weekly node and
  metric effects, counter-action tags, completion/disruption outcomes
  (`data/pressureCampaigns.ts`, `engine/pressureCampaignEngine.ts`).
- **Global war fronts (6)**: Pacific, European Pressure, Orbital, Cyber,
  Maritime, Financial — intensity/momentum/escalation/status, ticked weekly,
  can spawn campaigns, moved by actions/events (`engine/warFrontEngine.ts`).
- **Orbital/PNT counterplay** (v0.6) wired through actions and the PNT
  Degradation Cycle campaign.
- **Faction-aware endings + scorecard** (v0.8): 8 endings with per-faction
  overlays, graded scorecard, war-front outcome phrases, defining decisions
  (`data/endings.ts`, `engine/scorecardEngine.ts`).
- **Verification harness**: `npm run sim` (all factions × roles ×
  difficulties, determinism, clamping, campaign/front invariants, greedy
  playability floors) and `npm run smoke` (browser flow incl. faction copy,
  map, campaigns, fronts, scorecard).
- **Save/load**: versioned envelope at v6 with stepwise migrations from v1.

## 2. Current Product Gap

The systems are war-shaped; the experience is still dashboard-shaped. The
player reads twelve metric chips, three stacked panels and a timeline. What is
missing:

- **Military presence.** There are wars on three fronts and the player owns no
  visible force. Nothing on screen looks like a fleet.
- **A war-room interface.** Every panel is permanently visible at equal
  weight; nothing feels like a main plot with supporting instruments.
- **Interactive map/fleet panels.** The map is inspectable but nothing on it
  is *commanded*.
- **Obvious military operations.** "Deploy Maritime Drone Patrols" is one
  action card among twenty; it should feel like tasking a force.
- **Clear front ↔ campaign ↔ node relationships.** The data links exist
  (fronts list linked nodes; campaigns target nodes) but the UI never draws
  the line for the player.
- **Faction command feel.** Faction changes numbers and copy, but the screen
  a US PACOM commander sees is the same screen a Malaysian CISO sees.

## 3. Revised Target Identity

**Straits Protocol 2040: Pacific Fracture is a lightweight turn-based
war-room strategy game.** Different command seats survive, exploit, or
reshape a global fracture through:

- faction command seats (7 today, China later),
- global war fronts (the weather of WW3.5),
- a strategic theatre map (nodes, incidents, risk),
- pressure campaigns (the enemy's multi-week plans),
- **military assets** (named, visible, ownable forces),
- **a fleet/warship showcase UI** (stylized silhouettes, not photos),
- **operations assignment** (task a force, wait for results, absorb the bill),
- faction-specific outcomes (endings, scorecard, victory framing),
- **no province warfare** — the map is strategic, never tactical.

The player should feel like they are standing in a command room, not reading
a risk report.

## 4. Enlarged Map Direction

Current theatres (keep): Malaysia Core, Malacca Strait, South China Sea,
Cyber-Financial Layer, Orbital Layer, ASEAN Region, External Pressure.

Future enlarged theatre direction (do **not** implement yet):

- Pacific Battlespace
- Taiwan Strait
- Philippine Sea
- Indian Ocean Approach
- European Front
- Baltic / North Sea Pressure
- Arctic Pressure Route
- Middle East Energy Corridor
- Global Orbital Layer
- Global Cyber-Financial Layer
- Global Maritime Insurance Layer

Example future nodes:

**Pacific Battlespace**: Guam Logistics Hub, Philippine Sea Corridor, Japan
Forward Base Network, Taiwan Strait Kill Zone, First Island Chain Sensor Belt.

**European Front**: Baltic Defence Line, Poland Logistics Gate, Black Sea
Pressure Zone, North Sea Energy Grid, Brussels Coalition Core.

**Middle East / Energy**: Gulf Energy Insurance Node, Red Sea Bypass
Corridor, Indian Ocean Tanker Route.

**Global Orbital**: Allied PNT Mesh, Commercial LEO Constellation, Military
ISR Layer, Anti-Satellite Debris Corridor.

**Global Cyber-Financial**: Cross-Border Payment Grid, Sovereign Bond Market
Layer, Cloud Identity Backbone, AI Disinformation Exchange.

**How to add these later without a full geographic map:** the map is already
a theatre-grouped node grid, so expansion is purely data + grouping UI:

1. Extend `TheatreId` and `MapNodeId` unions; add node defs to
   `data/mapNodes.ts` with `initial` values, connections and tags.
2. Add a save migration that injects new nodes into existing `state.map`
   (same pattern as v2→v3 map initialization — merge, don't replace).
3. Add **theatre tabs / map mode filters** in the Strategic Map UI so 60+
   nodes stay readable (group tabs: Home / Region / Global Layers / Fronts).
4. Wire a handful of AI moves, events and operations to the new nodes; the
   engines (`mapEngine`, `pressureCampaignEngine`, `warFrontEngine`) need no
   changes — they are already id-driven.
5. Extend sim clamping loops (they iterate `MAP_NODES`, so they pick up new
   nodes automatically).

## 5. Military Operations Layer

The military layer is **assets + operations**, nothing lower-level. No units
on hexes, no combat resolution, no attrition modeling beyond four 0–100
gauges per asset.

**Asset catalogue** (types, not all used at launch): carrier groups,
destroyer screens, submarine groups, patrol fleets, drone squadrons,
cyber-EW cells, orbital recon detachments, port-defense cells, convoy escort
groups, amphibious logistics groups, air-defense coordination cells,
logistics fleets.

**Every asset tracks**: readiness, strength, logistics, exposure (0–100),
mission (display label), status (ready / on-mission / refitting / strained),
theatre, assigned nodes, faction ownership, tags, showcase text.

**Operations catalogue** (v0.9.2 ships the first 8; the rest are reserved):
Maritime Patrol Surge, Convoy Escort Corridor, Counter-Blockade Screen, Port
Defense Lockdown, Subsurface Deterrence Patrol, Orbital Recon Support,
Cyber-EW Maritime Shield, Humanitarian Corridor Escort — plus later: Allied
Logistics Surge, Sanctions Enforcement Patrol, Grey-Zone Naval Pressure,
Emergency Evacuation Corridor.

**How operations interact with existing systems:**

- **War fronts** — success applies `WarFrontEffect[]` through the existing
  `applyWarFrontEffects` (intensity/momentum/escalation deltas, counterplay
  boost included). Military is the strongest front-counter tool, and the
  most expensive.
- **Pressure campaigns** — each operation carries `campaignCounterTags`; on
  success, matching active campaigns lose intensity (same semantics as
  action-based disruption, sourced to the asset).
- **Map nodes** — operations apply a `NodeDelta` to the asset's assigned
  nodes (and optionally fixed `nodeEffects`), so a Port Defense Lockdown is
  visible on the map.
- **Metrics** — modest success/failure metric deltas through
  `applyMetricDelta`; some successes still carry costs (e.g. Alignment
  Pressure from a Counter-Blockade Screen).
- **Timeline** — new `military` entry type: launch, completion, failure, and
  campaign-counter entries all name the asset and the operation.
- **Scorecard** — v0.9.2 records outcomes in the timeline; v0.9.4 adds a
  military stewardship scorecard item (operations completed vs assets left
  strained).
- **Endings** — no direct hook in v0.9.2; military only moves the metrics
  and fronts the ending logic already reads. v0.9.4 may add flags (e.g.
  `blockade-broken`) that endings can inspect.

## 6. Fleet / Warship Showcase UI

Feasible in React with **no external images**: every asset marker is an
inline SVG silhouette (~120×36) built from a handful of paths — hull, deck,
island, sail, chevrons — tinted by faction accent and status.

Components: asset cards with a silhouette header, readiness/strength/
logistics/exposure bars, mission badge, theatre label, active-operation
countdown, and an operation preview (duration, costs, exposure, risk, effect
chips) before assignment.

Named showcase examples shipping in v0.9.2: Carrier Strike Group Pacific
(US), Counter-Blockade Escort Group (Taiwan), Littoral Patrol Group
(Malaysia), Subsurface Pressure Group (Russia), Expeditionary Escort Group
(Europe), Straitline Naval Continuity Group (Singapore), Maritime Drone
Squadron (Malaysia), Cyber-EW Detachment (Russia), Orbital Recon Detachment
(US).

## 7. Interaction Design

Click-to-select only. No drag-and-drop.

Player flow: open the **Military** board mode → inspect asset cards → click
an asset → the assignment panel lists eligible operations with a full
cost/risk/benefit preview → click **Assign** → the asset shows an active
mission with an ETA → weekly results land in the timeline → on completion
the asset refits and recovers readiness/logistics while exposure bleeds off.

Assignment happens outside the action-slot economy (operations spend the
asset's own readiness/logistics, not an action slot) and is never required
to advance the week.

## 8. Balance Philosophy

Military operations should:

- reduce front pressure and counter campaigns *modestly* (a patrol surge is
  worth roughly one good action, not three),
- stabilize assigned nodes,
- improve a small number of metrics on success,
- create exposure — repeated operations raise the chance of failure and
  escalatory side effects,
- consume readiness/logistics so an asset cannot operate continuously,
- increase command burden if overused (failure effects hit trust/stamina).

Military must **not** become an instant-win button: costs are paid up front,
benefits arrive weeks later, success is probabilistic (seeded), and the
strongest operations raise Alignment Pressure or escalation as a side
effect even when they succeed.

## 9. Roadmap

- **v0.9.2 — War Room UI Revamp + Military Operations Foundation** *(this
  slice)*: command bar, board modes, situation panel, timeline filters,
  military assets (3 per faction), 8 operations, fleet showcase, sim/smoke.
- **v0.9.3 — Expanded Theatre Map Prep**: theatre tabs, map mode filters,
  node grouping for future global theatres, no full geo map yet.
- **v0.9.4 — Military Operation Outcomes + Fleet Balance**: richer
  success/failure branches, exposure consequences (assets forced to refit,
  escalation events), deeper front/campaign integration, military scorecard
  item.
- **v1.0 — Release Candidate**: how-to-play, polish, balance pass,
  deployment checklist, release tag.
- **Post-v1.0**: v1.1 China Playable Expansion · v1.2 Actor Escalation
  Ladders and AI Memory · v1.3 Doctrine / light tech track · v1.4 Scenario
  Packs.

## 10. Implementation Guardrails

- Deterministic simulation: engines only draw from the seeded `Rng`; same
  seed + same inputs = same campaign.
- Every new `GameState` field ships with a save migration **and** repair of
  invalid values.
- `scripts/sim.ts` and `scripts/smoke.mjs` are updated in the same commit as
  the feature; all four gates (`build`, `lint`, `sim`, `smoke`) must pass.
- No game rules inside React components — components render state and call
  engine functions.
- No huge feature explosions: each slice ships one coherent layer.
- No full province warfare, no real-time battle engine, no 3D.
- China does not become playable in this slice.
