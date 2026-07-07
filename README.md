# Straits Protocol 2040: Pacific Fracture

A fictional, turn-based war-game-lite Malaysia / ASEAN crisis simulator set in
2040. You advise Malaysia, a middle power trying to survive a fractured global
order without becoming anyone's client state.

Russia won in Ukraine and runs a grey-zone franchise against Europe. The US
pivoted hard to APAC. Taiwan and its allies are fighting a major Pacific war
against a weakened, dangerous China. Cyberattacks are weather. Satellites are
contested. ASEAN cannot decide which meeting room to use.

This is v0.5: the Global War Fronts pass. Malaysia still plays from the ASEAN
command layer, but six off-map world-war fronts now progress every week and
spill pressure into national metrics, strategic map nodes, incidents, and
theatre pressure campaigns. It remains turn-based, data-driven, deterministically
seeded, and verified.

## How to play

- 1 turn = 1 week. The campaign runs 104 weeks across 5 phases.
- Pick a role: Security Consultant, Policy Strategist, Intelligence Officer,
  Finance Operator, or Military Liaison. Each has different starting metrics and
  unique actions.
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
week, and tags.

Status derives from intensity:

- 0-29: stable
- 30-54: escalating
- 55-79: crisis
- 80-100: breaking

Every week, fronts drift using the seeded RNG, current momentum, linked actor
pressure, linked node risk, and linked metric stress. Fronts do not swing wildly
turn to turn; they are pressure systems, not dice explosions.

## Spillover

High-intensity fronts apply modest spillover:

- Pacific raises South China Sea risk, alignment pressure, semiconductor
  exposure, and can trigger China SCS coercion.
- European pressure raises sanctions pressure, Russia/Europe campaign risk,
  market fear, and alignment pressure.
- Orbital pressure hurts Orbital Access, raises orbital node risk, and can spawn
  satellite incidents.
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
raising Pacific alignment risk.

## Theatre Pressure Campaigns

v0.4 pressure campaigns remain intact. Selected AI moves and high-intensity war
fronts can start or intensify existing campaigns without duplicate stacking:
China SCS coercion, capital flight, cloud-banking attack waves, Russian
grey-zone cyber pressure, Singapore continuity hedging, and European sanctions
pressure. Existing player actions disrupt campaigns through matching counter
tags.

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
greedy policies. It fails if metrics, map nodes, campaigns, or war fronts leave
their clamps; if replay determinism breaks; if scheduled effects fail; if map
incidents or targeted actions fail; if pressure campaigns fail to start,
refresh, complete, or disrupt; if war fronts fail to initialize, derive status,
tick deterministically, or spill into campaigns; if save migration v1-v5 fails;
or if the playability floor regresses.

`npm run smoke` serves the built app and drives Chromium through setup, map node
selection, targeted action selection, War Fronts and Active Campaigns rendering,
deterministic campaign injection, 8 turns, front update verification, manual
save, reload, and save/load preservation for map, campaign, and war-front state.
Set `CHROMIUM_PATH` if Chromium is not at the default script path.

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

## Known limitations (v0.5)

- The map is a strategic board, not a geographic SVG map.
- War fronts are off-map abstractions, not province warfare, force ratios, or
  real-time combat.
- Front spillover is rule-based and modest by design.
- There is no large tech tree.
- There is no orbital-specific pressure campaign template yet; orbital pressure
  uses map incidents and metric spillover.
- Incidents are node-local and do not spread along connections.
- Node ownership is static, not contested.
- Pressure campaigns do not choose targets dynamically from live map conditions.
- Completed and disrupted campaigns remain visible for campaign memory.
- Ending logic reads metrics and flags, not map/front state directly.

## Recommended v0.6 scope

- Add front-aware event hooks that branch on front status and campaign outcomes.
- Add limited incident spread along connected nodes for one or two incident
  families, with sim coverage.
- Add end-of-campaign strategic scoring for theatre risk, front trajectories,
  completed campaigns, and disrupted campaigns.
- Consider one small orbital-specific pressure campaign only if v0.5 stays
  balanced.
- Keep geographic map rendering, full diplomacy, province warfare, and large
  tech trees out of v0.6 unless the smaller front/event loop proves stable.

## Content safety

All cyber content is abstract, fictional game language. There is no exploit
code, no attack technique detail, no real targets, and no real persons.
