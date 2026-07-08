# War Room UI Revamp Plan

Companion to `WAR_GAME_REVAMP_PLAN.md`. Scope: UI/UX only; engine work lives
in `MILITARY_OPERATIONS_DESIGN.md`.

## 1. Current UI Issues

- **Too many permanently visible dashboard panels.** Command panel, map,
  actors, fronts, campaigns and timeline all render at once at equal visual
  weight; nothing is the "main screen".
- **The strategic map is useful but not cinematic.** It reads as a status
  grid; selecting a node feels like opening a spreadsheet row.
- **War fronts are readable but not visually central.** The most dramatic
  system in the game lives in a one-third-height stacked panel.
- **The military/fleet layer is missing entirely.**
- **Faction identity is not visually strong.** A faction changes one chip in
  the header; the room should feel like *your* command room.
- **Actions, campaigns, fronts and nodes are not visually connected.** The
  data model links them; the UI never shows the player the thread.
- **No "what is happening / what should I do" guidance.** New players face
  twelve metrics and five panels with no prioritization.

## 2. Target War Room Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ COMMAND BAR: title · faction · role · difficulty · week · phase     │
│              crisis chip · actions x/y · save · abandon · advance   │
├────────────────────────────────────────────────────────────────────┤
│ METRICS STRIP (existing MetricsBar, unchanged)                      │
├──────────────┬──────────────────────────────────┬──────────────────┤
│ COMMAND      │ MAIN THEATRE BOARD               │ SITUATION / INTEL│
│ DECISIONS    │ ┌ tabs: Map · Fronts · Military ┐│ selected detail  │
│ pending      │ │        Campaigns · Intel      ││ fronts summary   │
│ actions,     │ │                               ││ campaigns        │
│ slots,       │ │  (mode content)               ││ actor activity   │
│ targets      │ └───────────────────────────────┘│                  │
├──────────────┴──────────────────────────────────┴──────────────────┤
│ TIMELINE: filter chips (all/player/ai/event/map/front/campaign/    │
│           military/scheduled) · collapsible feed                    │
└────────────────────────────────────────────────────────────────────┘
```

Responsive behaviour: below `lg` the three columns stack (command decisions,
board, situation, timeline in that order); the command bar wraps; no
horizontal overflow. Sticky top bar is a nice-to-have, not required.

## 3. Interaction Model

Plain React `useState` in `GameShell` — no global state library:

- `activeBoardMode: 'map' | 'fronts' | 'military' | 'campaigns' | 'intelligence'`
- `selectedMilitaryAssetId: string | null` (transient, not saved)
- `selectedOperationId: string | null` (local to the assignment panel)
- `timelineFilter: TimelineFilterId` (transient)
- selected map node stays in `GameState.selectedNode` (already persisted)
- `selectedFrontId` is reserved for v0.9.3 front drill-down

State mutations still flow exclusively through App-level handlers calling
engine functions (`assignMilitaryOperation`, `togglePendingAction`, …).

## 4. Visual Style

- Dark command room: slate-950 base, slate-900 panels, thin slate-800 rules.
- Risk language: cyan = friendly/selected, emerald = healthy, amber =
  strained, red = critical/hostile, purple = delayed, teal = map/world.
- Faction accent chips next to owned things (assets, unique actions).
- Military silhouettes: single-color inline SVG, no gradients, no images.
- Compact labels, mono for numbers, data-dense but scannable.
- Hover/focus states on every clickable card; `title` tooltips for depth.
- Contrast: keep text at slate-200+ on panels; never color-only signals
  (status is always word + color).

## 5. Main Theatre Board Modes

1. **Strategic Map** — existing `StrategicMap` component unchanged: node
   grid, theatre summaries, node detail, incidents.
2. **War Fronts** — existing `WarFrontsPanel` promoted to full-board size:
   intensity bars, momentum, escalation, status, modifiers, linked nodes.
3. **Military** — new `MilitaryOperationsPanel`: asset showcase cards,
   selected-asset detail, eligible operations, preview, assign.
4. **Campaigns** — existing `ActiveCampaignsPanel` at full size: active
   pressure campaigns, intensity, targets, remaining weeks, counter hints.
5. **Intelligence** — new `IntelligencePanel`: top 5 risks, suggested
   counterplay categories, hottest front, worst campaign, most exposed
   asset, most fragile node, faction-specific warning line. Derived from
   current state only (`engine/intelligenceEngine.ts`, pure).

## 6. Fleet Showcase Visuals

No external images; one `MilitaryAssetSilhouette` component switching on
asset type, each a hand-rolled inline SVG (~120×36 viewBox):

- **carrier group** — long flat deck, offset island, escort dashes
- **destroyer screen** — angular hull, mast, forward gun step
- **submarine group** — teardrop hull, sail, dive planes
- **patrol fleet** — two small stacked hulls
- **drone squadron** — three chevrons in echelon
- **cyber-EW cell** — waveform in a rounded chassis
- **orbital recon** — satellite body, solar wings, dish
- **port defense** — shield outline over pier blocks
- **convoy/logistics** — boxy hull with container stack
- **amphibious logistics** — flat bow ramp hull
- **air-defense cell** — radar fan over launcher box

Faction accent tints the silhouette; status tints the card border.

## 7. Implementation Phasing

- **Phase 1 (v0.9.2, this slice)**: board-mode state, `CommandBar`,
  `BoardModeTabs`, `MainTheatreBoard` hosting existing panels,
  `SituationPanel`, timeline filter foundation (`TimelineControls`), and the
  real Military mode (assets + operations shipping together — no
  placeholder needed).
- **Phase 2 (v0.9.3)**: theatre tabs inside the map mode, front drill-down
  in the situation panel, node grouping for future global theatres.
- **Phase 3 (v0.9.4+)**: richer intelligence mode (trend arrows, projected
  escalations), first-turn guidance/tutorial hints, faction-accent theming
  across the whole shell.
