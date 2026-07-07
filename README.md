# Straits Protocol 2040: Pacific Fracture

A fictional, turn-based **Malaysia / ASEAN crisis simulator** set in 2040. You advise
Malaysia — a middle power trying to survive a fractured global order without becoming
anyone's client state.

> Russia won in Ukraine and runs a grey-zone franchise against Europe. The US pivoted
> hard to APAC. Taiwan and its allies are fighting a major Pacific war against a
> weakened, dangerous China. Cyberattacks are weather. Satellites are contested.
> ASEAN cannot decide which meeting room to use.

This is **v0.1** — a playable skeleton proving the game loop: clean architecture,
data-driven content, deterministic seeded RNG, rules-based AI actors, save/load,
and eight endings.

## How to play

- **1 turn = 1 week**, campaign runs **104 weeks** across 5 phases.
- Pick a role (Security Consultant, Policy Strategist, Intelligence Officer,
  Finance Operator, Military Liaison) — each has different starting metrics and
  unique actions.
- Each week: choose **one action**, advance, watch 2–4 AI actors move, handle
  events, keep 12 national metrics out of the red.
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
```

No backend, no database, no external APIs. Saves live in `localStorage`.

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
      actions.ts           # 20 player actions with tradeoffs/risks/locks
      events.ts            # 16 events (4 interactive with choices)
      endings.ts           # 8 endings
      initialState.ts      # metrics, phases, starting state factory
    engine/                # pure functions over GameState, no React
      rng.ts               # seeded deterministic RNG (mulberry32 + cursor)
      turnEngine.ts        # weekly turn sequence + passive drift rules
      aiEngine.ts          # actor selection & move resolution
      eventEngine.ts       # event triggering & choice resolution
      actionEngine.ts      # action availability, effects, risk rolls
      endingEngine.ts      # collapse checks + final evaluation
      saveEngine.ts        # versioned localStorage save/load
  ui/                      # React components, no game rules
    CampaignSetup.tsx  GameShell.tsx  MetricsBar.tsx  CommandPanel.tsx
    ActorPanel.tsx  TimelineFeed.tsx  EventModal.tsx  EndingScreen.tsx
```

Determinism: the state stores `seed` and `rngCursor`; a loaded save replays the
exact same future. Engines never call `Math.random`.

## Content safety

All cyber content is abstract, fictional game language — no exploit code, no
attack techniques, no real targets, no real persons.

## Roadmap (post-v0.1)

- Node-based strategic map of the Straits and ASEAN.
- Multiple action slots per turn based on role/stamina/institutional capacity.
- Deeper AI actor goal systems and inter-actor dynamics.
- Event chains with delayed consequences.
- Difficulty settings and scoring.
