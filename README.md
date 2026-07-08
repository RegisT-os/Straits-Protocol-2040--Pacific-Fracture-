# Straits Protocol 2040: Pacific Fracture

A fictional, turn-based war-game-lite crisis simulator set in 2040. You choose
a playable command perspective and try to survive a fractured global order
without becoming anyone's client state.

Russia won in Ukraine and runs a grey-zone franchise against Europe. The US
pivoted hard to APAC. Taiwan and its allies are fighting a major Pacific war
against a weakened, dangerous China. Cyberattacks are weather. Satellites are
contested. ASEAN cannot decide which meeting room to use.

This is v0.8: Faction-Aware Endings + Campaign Scorecard. Malaysia remains the
default middle-power survival campaign, and the setup flow also supports
Singapore, Indonesia, and Taiwan Allied Command as typed, deterministic,
data-driven playable perspectives. v0.8 keeps role mechanics shared, keeps the
ending triggers compact, and adds faction-specific ending overlays plus a final
campaign evaluation.

## How to play

- 1 turn = 1 week. The campaign runs 104 weeks across 5 phases.
- Pick a playable faction: Malaysia, Singapore, Indonesia, or Taiwan Allied
  Command. Each adjusts starting metrics, map posture, war-front exposure,
  faction labels, unique actions, and a small set of disabled actions.
- Pick a role: Security Consultant, Policy Strategist, Intelligence Officer,
  Finance Operator, or Military Liaison. Each still has different starting
  metrics and role actions, while its setup copy adapts to the selected faction.
- Each week, choose up to 3 actions, advance, watch 2-4 AI actors move, handle
  events, and keep 12 national metrics out of the red.
- Action slots: base 1, +1 while Personal Stamina >= 65, +1 while Institutional
  Trust >= 65, -1 while Mental Load >= 75. Always at least 1, at most 3.
- Difficulty: Analyst is forgiving, Adviser is baseline, Crisis Chair is harsh.
- Delayed consequences: some decisions schedule bills that arrive weeks later.
- Strategic map: 35 nodes in 7 theatres track stability, risk, cyber exposure,
  incidents, tags, and connections.
- Targeted actions: six existing actions require a map target before the week
  can advance.
- Map pressure: sustained theatre risk drains national metrics through modest,
  legible thresholds.

## Playable Factions

v0.7 adds four initial playable command perspectives:

- Malaysia: the original balanced middle-power survival campaign, focused on
  sovereignty, ASEAN cohesion, maritime control, cyber resilience, and financial
  continuity.
- Singapore: a financial fortress and continuity state with stronger finance,
  trust, and cyber posture, but sharper sensitivity to dependency pressure,
  capital flight, and Strait disruption.
- Indonesia: an archipelago maritime power and ASEAN leadership contender with
  stronger maritime and ASEAN tools, plus higher coordination and energy risk.
- Taiwan Allied Command: the frontline war-game perspective, with stronger
  cyber/orbital/front counterplay and higher starting exposure to Pacific,
  orbital, maritime, and alignment pressure.

New faction actions are intentionally narrow: Singapore gets continuity and
financial ringfencing tools; Indonesia gets maritime patrol and ASEAN shield
leadership tools; Taiwan Allied Command gets semiconductor corridor hardening
and counter-blockade cyber tools. Malaysia retains the existing default action
shape.

v0.7.1 makes the shared role archetypes read as seats inside the selected
command perspective. Security, policy, intelligence, finance, and military
cards now reference the appropriate institutions: for example CSA/GovTech/MAS
and SAF/RSN/MPA for Singapore, BSSN/Kemlu/Bank Indonesia/OJK/TNI AL/Bakamla for
Indonesia, and TWCERT/MODA/NSC/MOFA/CBC/TWSE/MND for Taiwan Allied Command.

## Faction-Aware Endings and Scorecard

v0.8 keeps the original ending IDs and trigger logic, then applies a data-driven
faction overlay to the final screen. The same mechanical ending can now read as
Sovereignty Preserved for Malaysia, Continuity Fortress or Financial Lifeboat
State for Singapore, Archipelago Shield or Jakarta Overextension for Indonesia,
and Pacific Holdout, Semiconductor Lifeline, Allied Spearpoint or Blockade
Exhaustion for Taiwan Allied Command.

The ending screen now includes a compact campaign scorecard:

- Strategic Autonomy / Sovereignty
- Financial Continuity
- Cyber Resilience
- Maritime Control or Maritime Continuity
- Orbital Access
- Regional Cohesion
- War Front Stewardship or Pacific War Survival
- Pressure Campaign Management
- Institutional Stability
- Command Burden / Personal Stamina

Each category receives an A-F grade, a 0-100 score, a short explanation, and a
faction-critical marker when it matters most to the selected command
perspective. The ending screen also summarizes all six war fronts, pressure
campaign outcomes, and up to five defining decisions derived from completed
actions, faction actions, campaign disruptions, front outcomes, and the ending
trigger.

## Global War Fronts

v0.5 adds six off-map fronts:

- Pacific War Front: Taiwan Allied Command vs China Fragmenting Command.
- European Pressure Front: Russia Eurasian Network vs European Defence Compact.
- Orbital War Front: US, Taiwan, China, and Russia contest PNT, timing,
  satellite internet, and maritime imaging.
- Cyber War Front: state actors plus the autonomous threat ecosystem.
- Maritime War Front: South China Sea, Malacca, and Pacific shipping conflict.
- Financial War Front: markets, sanctions, currency, capital, CBDC, and
  insurance pressure.

Each front tracks intensity, momentum, escalation level, dominant side, status,
linked actors, linked map nodes, linked metrics, active modifiers, last shift
week, recent shift summary, and tags.

Status derives from intensity:

- 0-29: stable
- 30-54: escalating
- 55-79: crisis
- 80-100: breaking

Every week, fronts drift using the seeded RNG, current momentum, linked actor
pressure, linked node risk, and linked metric stress. Fronts do not swing wildly
turn to turn; they are pressure systems, not dice explosions.

The War Fronts panel now explains each front with compact fields:

- Drivers: why the front is moving.
- Faction impact: the main metrics and map nodes under pressure, labelled for
  the current faction.
- Counterplay: existing player actions that can reduce front pressure.
- Campaign risk: pressure campaigns that may start when intensity gets high.
- Trend: whether front pressure is rising, stable, or decaying.
- Spawn window: whether a front-driven campaign is cooling down or ready.
- Counter tags: compact tags that indicate which action families disrupt linked
  campaigns.
- Recent shift: the latest major front change recorded in state.

## Spillover

High-intensity fronts apply modest spillover:

- Pacific raises South China Sea risk, alignment pressure, semiconductor
  exposure, and can trigger China SCS coercion.
- European pressure raises sanctions pressure, Russia/Europe campaign risk,
  market fear, and alignment pressure.
- Orbital pressure hurts Orbital Access, raises orbital node risk, can spawn
  satellite incidents, and can trigger the PNT Degradation Cycle.
- Cyber pressure hurts Cyber Resilience and Public Reality, stresses cloud,
  identity, payment, and BNM nodes, and can trigger cloud-banking campaigns.
- Maritime pressure hurts Maritime Control and Energy Assurance, stresses
  Malacca, Singapore Strait, Malaysian EEZ, Luconia, and Port Klang.
- Financial pressure hurts Financial Continuity and Sovereignty, stresses BNM,
  Bursa, payment rails, and Singapore, and can trigger capital flight or
  Singapore continuity hedging.

Player actions now nudge fronts too. BNM confidence lowers Financial pressure,
Cyber Shield and ASEAN CERT lower Cyber pressure, drone patrols and energy
assurance lower Maritime pressure, neutrality and ASEAN backchannels lower
diplomatic escalation, and US orbital support improves the Orbital front while
raising Pacific alignment risk. In v0.5.1, counterpressure is slightly stronger
and weekly front spillover is slightly softer, so fronts remain dangerous without
crowding out competent play. Front-driven campaign starts are also throttled per
front so high-intensity fronts do not flood the timeline every few turns.

## Orbital Resilience

v0.6 adds one orbital pressure campaign:

- PNT Degradation Cycle: pressure against emergency navigation, financial timing,
  maritime imaging, commercial satellite internet, and the ASEAN MicroSat grid.

The campaign raises orbital node risk, lowers orbital stability, and applies
modest Orbital Access pressure. At higher intensity, its scaled weekly effects
can also nick Maritime Control and Financial Continuity. It can be started by
China escalation, Russian retaliation, autonomous port disruption, or a
high-intensity Orbital War Front. Duplicate starts refresh the active campaign
instead of stacking separate copies.

New orbital counterplay actions:

- Activate Terrestrial Navigation Backup: strengthens Emergency Navigation Mesh
  and reduces Orbital War pressure, with a small continuity/stamina cost.
- Harden Financial Timing Backup: hardens Financial Timing Satellite Link and
  BNM continuity against timing disruption.
- Lease Allied Orbital Coverage: quickly improves orbital coverage with a small
  sovereignty and alignment tradeoff.

## Theatre Pressure Campaigns

v0.4 pressure campaigns remain intact. Selected AI moves and high-intensity war
fronts can start or intensify existing campaigns without duplicate stacking:
China SCS coercion, capital flight, cloud-banking attack waves, PNT degradation,
Russian grey-zone cyber pressure, Singapore continuity hedging, and European
sanctions pressure. Existing player actions disrupt campaigns through matching
counter tags.

## Run locally

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

No backend, no database, no external APIs. Saves live in localStorage.

## Verification checks

```bash
npm run sim
npm run build && npm run smoke
```

`npm run sim` runs full campaigns for every role and difficulty under random and
greedy policies. It also initializes every playable faction and runs all
factions x roles x difficulties through a one-seed greedy sweep. It fails if
metrics, map nodes, campaigns, or war fronts leave their clamps; if replay
determinism breaks; if faction replay determinism breaks; if scheduled effects
fail; if map incidents or targeted actions fail; if pressure campaigns fail to
start, refresh, complete, or disrupt; if war fronts fail to initialize, derive
status, tick deterministically, or spill into campaigns; if save migration
v1-v6 fails; if faction-specific actions are missing or wrongly visible; or if
the faction ending overlays, scorecards, war-front summaries, pressure campaign
summaries or defining-decision summaries fail to generate; or if the Malaysia
playability floor regresses. The retained greedy floor is 14/15 Analyst, 10/15
Adviser, and 4/15 Crisis Chair campaigns reaching week 104.

`npm run smoke` serves the built app and drives Chromium through setup, map node
selection, faction-aware role-copy checks, faction-specific action visibility,
targeted action selection, War Fronts and Active Campaigns rendering, front
readability text, deterministic orbital campaign injection, 8 turns, front
update verification, manual save, reload, save/load preservation for faction,
map, campaign, and war-front state, then injects a deterministic ending save to
verify the faction-aware ending screen, campaign scorecard, war-front outcome
summary, pressure campaign summary, and defining decisions. Set `CHROMIUM_PATH`
if Chromium is not at the default script path.

## Architecture

```text
src/
  game/
    types/gameTypes.ts
    data/
      roles.ts
      actors.ts
      actions.ts
      events.ts
      difficulty.ts
      playableFactions.ts
      mapNodes.ts
      incidents.ts
      pressureCampaigns.ts
      warFronts.ts
      endings.ts
      initialState.ts
    engine/
      rng.ts
      turnEngine.ts
      aiEngine.ts
      eventEngine.ts
      scheduleEngine.ts
      mapEngine.ts
      pressureCampaignEngine.ts
      warFrontEngine.ts
      actionEngine.ts
      endingEngine.ts
      saveEngine.ts
  ui/
    CampaignSetup.tsx
    GameShell.tsx
    MetricsBar.tsx
    CommandPanel.tsx
    StrategicMap.tsx
    ActorPanel.tsx
    WarFrontsPanel.tsx
    ActiveCampaignsPanel.tsx
    TimelineFeed.tsx
    EventModal.tsx
    EndingScreen.tsx
scripts/
  sim.ts
  smoke.mjs
```

Determinism: the state stores `seed` and `rngCursor`; loaded saves replay the
same future. Engines never call `Math.random`.

## Known limitations (v0.8)

- The map is a strategic board, not a geographic SVG map.
- War fronts are off-map abstractions, not province warfare, force ratios, or
  real-time combat.
- Playable factions are command perspectives, not full national simulations.
- Role mechanics remain shared across factions; v0.7.1 adapts presentation
  copy only.
- Ending triggers remain shared and metric/flag-driven; v0.8 adapts the
  presentation layer rather than creating a full faction-specific ending tree.
- Scorecard grades are deterministic heuristics, not a full strategic analytics
  model.
- Endings have a faction-aware overlay, but full faction-specific ending logic
  is deferred.
- Most events still use Malaysia/ASEAN-flavored text and have not been rewritten
  for every faction.
- Front spillover is rule-based and modest by design.
- Front counterplay is explicit but still coarse; actions reduce pressure by
  front tags, not by a full negotiation or operational model.
- There is no large tech tree.
- Orbital resilience is a focused PNT slice, not a full space warfare model.
- Incidents are node-local and do not spread along connections.
- Node ownership is static, not contested.
- Pressure campaigns do not choose targets dynamically from live map conditions.
- Completed and disrupted campaigns remain visible for campaign memory.
- Ending logic reads metrics and flags, not map/front/faction state directly.

## Recommended v0.9 scope

- Add a small number of faction-aware event text variants where Malaysia-only
  wording is most visible.
- Add one or two faction-specific event hooks or pressure-campaign outcome
  events, with sim coverage.
- Let scorecard results influence a small set of ending epilogue lines.
- Review Singapore Adviser/Crisis Chair balance after more playtesting.
- Keep geographic map rendering, full diplomacy, province warfare, and large
  tech trees out of v0.9 unless the faction foundation proves stable.

## Content safety

All cyber content is abstract, fictional game language. There is no exploit
code, no attack technique detail, no real targets, and no real persons.
