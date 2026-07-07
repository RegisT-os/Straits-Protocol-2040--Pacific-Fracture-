# Straits Protocol 2040: Pacific Fracture

A fictional, turn-based **Malaysia / ASEAN crisis simulator** set in 2040. You advise
Malaysia — a middle power trying to survive a fractured global order without becoming
anyone's client state.

> Russia won in Ukraine and runs a grey-zone franchise against Europe. The US pivoted
> hard to APAC. Taiwan and its allies are fighting a major Pacific war against a
> weakened, dangerous China. Cyberattacks are weather. Satellites are contested.
> ASEAN cannot decide which meeting room to use.

This is **v0.3** — the strategic map pass. On top of the v0.2 gameplay-depth
systems (action slots, difficulty, delayed consequences, dynamic AI), the game
now has a node-based strategic map: 35 nodes across 7 theatres, map incidents,
map-targeted actions, AI moves that land on real infrastructure, and map
pressure that feeds back into the national metrics — still turn-based,
data-driven, deterministically seeded, and verified.

## How to play

- **1 turn = 1 week**, campaign runs **104 weeks** across 5 phases.
- Pick a role (Security Consultant, Policy Strategist, Intelligence Officer,
  Finance Operator, Military Liaison) — each has different starting metrics and
  unique actions.
- Each week: choose **up to 3 actions** (see action slots below), advance,
  watch 2–4 AI actors move, handle events, keep 12 national metrics out of
  the red.
- **Action slots**: base 1, +1 while Personal Stamina ≥ 65, +1 while
  Institutional Trust ≥ 65, −1 while Mental Load ≥ 75 (always at least 1,
  at most 3). Selected actions apply in the order you picked them.
- **Difficulty**: *Analyst* (softer AI pressure and events, stronger recovery),
  *Adviser* (the baseline), *Crisis Chair* (harder AI pressure, harsher
  events, weaker recovery, aggressive actors act more often).
- **Delayed consequences**: some decisions schedule a bill that arrives weeks
  later — condemning Russia invites a retaliation probe, accepting the US
  cyber package triggers a sovereignty backlash, a public reality campaign
  compounds into stabilization. The timeline announces them when set in
  motion and when they land.
- **Strategic map**: 35 nodes in 7 theatres — Malaysia Core, Malacca Strait,
  South China Sea, Cyber-Financial Layer, Orbital Layer, ASEAN Region, and
  External Pressure. Each node tracks stability, risk, and cyber exposure
  (0–100, clamped). Click a node for details, incidents, tags, and connected
  nodes; theatre risk summaries sit in the map header.
- **Incidents**: AI moves and events spawn incidents on nodes (China Maritime
  Shadowing, Capital Flight Pressure, Cloud Credential Cascade, Port OT
  Degradation, …). Incidents hit on landing, grind weekly, and expire on a
  timer; quiet nodes slowly recover toward their baseline.
- **Targeted actions**: six actions (Harden Port Klang, Maritime Drone
  Patrols, ASEAN CERT Fusion Cell, Energy Assurance Plan, Public Reality
  Campaign, US Orbital Support) require a map target — pick the node in the
  Command Panel; the week can't advance until every targeted action has one.
- **Map pressure on metrics**: sustained theatre risk drains metrics —
  cyber-financial risk hits Financial Continuity and Public Reality, Strait
  risk hits Maritime Control, orbital degradation hits Orbital Access, energy
  node instability hits Energy Assurance, regional instability hits ASEAN
  Cohesion, domestic instability hits Institutional Trust. Modest, legible
  thresholds — tension, not random death.
- Every strong action has tradeoffs. US help costs sovereignty. Condemning Russia
  invites retaliation. Neutrality annoys everyone.
- The game ends early if Financial Continuity, Public Reality, Sovereignty, or
  Cyber Resilience collapse — or you burn out. Survive to week 104 and your final
  posture decides the ending.

## Run locally

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build
npm run preview  # serve the production build
npm run lint     # oxlint
```

No backend, no database, no external APIs. Saves live in `localStorage`.

## Verification checks

```bash
npm run sim                    # headless engine harness (no browser needed)
npm run build && npm run smoke # browser smoke test against the built app
```

- **`npm run sim`** (`scripts/sim.ts`) runs full 104-week campaigns for every
  role × difficulty under a random policy and a competent "greedy" policy
  (both using all action slots). It fails (exit 1) if a campaign doesn't
  terminate with an ending, if any metric leaves 0–100, if the same seed stops
  reproducing the same outcome, if scheduled effects fail to queue/resolve,
  if map node values leave 0–100, if incidents fail to fire, if targeted
  actions don't land on their node, if v2 save migration doesn't initialize
  map state, or if the playability floor regresses (greedy must reach week
  104 in ≥70% of Analyst runs, ≥50% of Adviser runs, and at least once on
  Crisis Chair).
- **`npm run smoke`** (`scripts/smoke.mjs`) serves `dist/` and drives a real
  Chromium through role selection, map node selection + detail, a targeted
  action with a chosen node, 8 turns, interactive-event resolution, and a
  save/reload round-trip that must preserve map state, failing on any console
  error. It needs a Chromium
  binary: set `CHROMIUM_PATH=/path/to/chromium` if it isn't at the default
  `/opt/pw-browsers/chromium` (any local Chrome/Chromium works).

## Deploy on Vercel

The app is a static Vite SPA — Vercel detects it automatically:

1. Import the repository in Vercel.
2. Framework preset: **Vite** (auto-detected). Build command `npm run build`,
   output directory `dist` (defaults).
3. Deploy. No environment variables needed.

## Architecture

```
src/
  game/
    types/gameTypes.ts     # every shared type — the contract between layers
    data/                  # all content is data, no logic
      roles.ts             # 5 player roles
      actors.ts            # 9 AI actors, 3–5 rule-based moves each
      actions.ts           # 21 player actions with tradeoffs/risks/locks/delays
      events.ts            # 16 events (4 interactive with choices)
      difficulty.ts        # 3 difficulty levels (AI pressure, severity, recovery)
      mapNodes.ts          # 35 strategic map nodes across 7 theatres
      incidents.ts         # map incident templates
      endings.ts           # 8 endings
      initialState.ts      # metrics, phases, starting state factory
    engine/                # pure functions over GameState, no React
      rng.ts               # seeded deterministic RNG (mulberry32 + cursor)
      turnEngine.ts        # weekly turn sequence + passive drift rules
      aiEngine.ts          # actor selection & dynamic move weighting
      eventEngine.ts       # event triggering, severity scaling, repeat control
      scheduleEngine.ts    # delayed consequences (queue + resolution)
      mapEngine.ts         # node deltas, incidents, theatre summaries, map->metric pressure
      actionEngine.ts      # action availability, slots, effects, risk rolls
      endingEngine.ts      # collapse checks + final evaluation
      saveEngine.ts        # versioned localStorage save/load
  ui/                      # React components, no game rules
    CampaignSetup.tsx  GameShell.tsx  MetricsBar.tsx  CommandPanel.tsx
    StrategicMap.tsx  ActorPanel.tsx  TimelineFeed.tsx  EventModal.tsx
    EndingScreen.tsx
scripts/
  sim.ts                   # headless engine verification harness (npm run sim)
  smoke.mjs                # browser smoke test (npm run smoke)
```

Determinism: the state stores `seed` and `rngCursor`; a loaded save replays the
exact same future. Engines never call `Math.random`.

## Content safety

All cyber content is abstract, fictional game language — no exploit code, no
attack techniques, no real targets, no real persons.

## Known limitations (v0.3)

- The map is a strategic board (theatre grid), not a geographic SVG map yet.
- Only six actions are map-targeted; the rest affect fixed nodes or none.
- Incidents are node-local — they do not spread along connections.
- Node ownership/influence is a static label, not a contested value.
- AI actors hit nodes per-move but do not pursue map-level campaigns.
- Delayed consequences are single-shot; no branching chains yet.
- Ending logic reads metrics and flags, not map state directly.

## Roadmap (v0.4)

- Geographic SVG map view with node positions and connection lines.
- Incident spread along connected nodes (cascading failures).
- Contested node influence (Malaysia vs great-power sway per node).
- Map-level AI campaigns (multi-week pressure on a chosen theatre).
- Branching event chains keyed to node states.
- End-of-campaign scoring breakdown including map stewardship.
