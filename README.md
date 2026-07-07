# Straits Protocol 2040: Pacific Fracture

A fictional, turn-based **Malaysia / ASEAN crisis simulator** set in 2040. You advise
Malaysia — a middle power trying to survive a fractured global order without becoming
anyone's client state.

> Russia won in Ukraine and runs a grey-zone franchise against Europe. The US pivoted
> hard to APAC. Taiwan and its allies are fighting a major Pacific war against a
> weakened, dangerous China. Cyberattacks are weather. Satellites are contested.
> ASEAN cannot decide which meeting room to use.

This is **v0.2** — the gameplay-depth pass on the v0.1 skeleton: multiple
action slots per turn, three difficulty levels, delayed consequences, AI actors
that react to world state, and event repeat control — still clean architecture,
data-driven content, deterministic seeded RNG, and save/load.

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
  reproducing the same outcome, if scheduled effects fail to queue/resolve, or
  if the playability floor regresses (greedy must reach week 104 in ≥70% of
  Analyst runs, ≥50% of Adviser runs, and at least once on Crisis Chair).
- **`npm run smoke`** (`scripts/smoke.mjs`) serves `dist/` and drives a real
  Chromium through role selection, 8 turns, interactive-event resolution, and a
  save/reload round-trip, failing on any console error. It needs a Chromium
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
      endings.ts           # 8 endings
      initialState.ts      # metrics, phases, starting state factory
    engine/                # pure functions over GameState, no React
      rng.ts               # seeded deterministic RNG (mulberry32 + cursor)
      turnEngine.ts        # weekly turn sequence + passive drift rules
      aiEngine.ts          # actor selection & dynamic move weighting
      eventEngine.ts       # event triggering, severity scaling, repeat control
      scheduleEngine.ts    # delayed consequences (queue + resolution)
      actionEngine.ts      # action availability, slots, effects, risk rolls
      endingEngine.ts      # collapse checks + final evaluation
      saveEngine.ts        # versioned localStorage save/load
  ui/                      # React components, no game rules
    CampaignSetup.tsx  GameShell.tsx  MetricsBar.tsx  CommandPanel.tsx
    ActorPanel.tsx  TimelineFeed.tsx  EventModal.tsx  EndingScreen.tsx
scripts/
  sim.ts                   # headless engine verification harness (npm run sim)
  smoke.mjs                # browser smoke test (npm run smoke)
```

Determinism: the state stores `seed` and `rngCursor`; a loaded save replays the
exact same future. Engines never call `Math.random`.

## Content safety

All cyber content is abstract, fictional game language — no exploit code, no
attack techniques, no real targets, no real persons.

## Known limitations (v0.2)

- No strategic map yet — the dashboard is the whole interface.
- AI actors react to world state via weight multipliers, but do not pursue
  multi-week goals or interact with each other directly.
- Delayed consequences are single-shot; there are no branching chains yet.
- Random play on Adviser usually survives to week 104 (with bad endings) —
  the multi-slot system empowers even bad play; Crisis Chair is the pressure
  test.
- Ending variety still skews toward alignment/dependency outcomes under
  mechanical play.

## Roadmap (v0.3)

- Node-based strategic map of the Straits and ASEAN (ports, cables, sea
  lanes) with map-targeted actions and events.
- Multi-step event chains with branching follow-ups.
- Inter-actor dynamics (US–China escalation ladder, ASEAN bloc formation).
- Scoring and end-of-campaign summary breakdown.
- Sound/visual feedback polish and accessibility pass.
