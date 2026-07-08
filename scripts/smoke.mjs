// Browser smoke test — drives the built app end to end.
//
// Run with: npm run build && npm run smoke
//
// Requires a Chromium binary. Resolution order:
//   1. CHROMIUM_PATH env var
//   2. /opt/pw-browsers/chromium (preinstalled in some CI/cloud images)
//   3. `npx playwright install chromium` default location is NOT probed —
//      set CHROMIUM_PATH if your browser lives elsewhere.
//
// Flow: serve dist/ via `vite preview`, then in a real browser:
// pick a faction + role + difficulty, start a campaign, verify the war-room
// shell (command bar, board-mode tabs, strategic map, situation panel), open
// the War Fronts board mode, fire a map-targeted action, inject a v6 save to
// confirm military assets migrate in, open the Military board mode (asset
// card + silhouette + operation assignment), exercise a timeline filter, play
// turns (resolving interactive events), save/reload to confirm military
// operation state survives, and finally render the ending scorecard — all
// with zero console errors.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const PORT = 4173;
const executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

if (!existsSync(executablePath)) {
  console.error(
    `Chromium not found at ${executablePath}.\n` +
      'Set CHROMIUM_PATH to a Chromium/Chrome binary and re-run.',
  );
  process.exit(1);
}
if (!existsSync(new URL('../dist/index.html', import.meta.url))) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
if (!existsSync(viteCli)) {
  console.error('Vite CLI not found — run `npm install` first.');
  process.exit(1);
}

const server = spawn(process.execPath, [viteCli, 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  detached: false,
});

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`preview server did not start on ${url}`);
}

let failed = false;
try {
  await waitForServer(`http://localhost:${PORT}`);

  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto(`http://localhost:${PORT}`);
  await page.waitForSelector('text=Pacific Fracture');
  await page.waitForSelector('text=Step 1');
  await page.waitForSelector('text=Playable Faction');
  await page.waitForSelector('button:has-text("US Pacific Command")');
  await page.waitForSelector('button:has-text("Russia Eurasian Network")');
  console.log('setup screen ok');

  await page.click('button:has-text("US Pacific Command")');
  await page.waitForSelector('text=US PACOM Command Seat');
  await page.waitForSelector('text=INDOPACOM');
  await page.waitForSelector('text=orbital command');
  await page.waitForSelector('text=naval deterrence');
  const malaysiaAgencyText =
    (await page.locator('text=NACSA').count()) +
    (await page.locator('text=Bank Negara').count()) +
    (await page.locator('text=RMN').count());
  if (malaysiaAgencyText > 0) {
    throw new Error('US PACOM role copy still shows Malaysia-specific agencies');
  }
  console.log('US PACOM role copy adapts away from Malaysia agencies');

  await page.click('button:has-text("Russia Eurasian Network")');
  await page.waitForSelector('text=Russia Network Command Seat');
  await page.waitForSelector('text=Eurasian pressure network');
  await page.waitForSelector('text=grey-zone');
  await page.waitForSelector('text=sanctions evasion');
  console.log('Russia role copy shows pressure-network language');

  await page.click('button:has-text("US Pacific Command")');
  await page.click('text=Security Consultant');
  await page.click('text=Analyst');
  await page.click('button:has-text("Start Campaign")');
  await page.waitForSelector('text=Week 1/104');
  await page.waitForSelector('[data-testid="command-bar"]');
  await page.waitForSelector('text=US PACOM');
  await page.waitForSelector('text=Actions selected:');
  await page.waitForSelector('h2:has-text("Command Panel")');
  await page.waitForSelector('[data-testid="situation-panel"]');
  console.log('war-room shell renders (command bar, command panel, situation panel)');

  // Board-mode tabs: all five modes present. Scope to the tab bar because the
  // labels ("Military", "War Fronts") also appear in the timeline filter/panels.
  const boardTabs = page.locator('[data-testid="board-mode-tabs"]');
  await page.waitForSelector('[data-testid="board-mode-tabs"]');
  for (const tab of ['Strategic Map', 'War Fronts', 'Military', 'Campaigns', 'Intelligence']) {
    if ((await boardTabs.locator(`button:has-text("${tab}")`).count()) === 0) {
      throw new Error(`board mode tab missing: ${tab}`);
    }
  }
  console.log('board mode tabs render (map/fronts/military/campaigns/intelligence)');

  // Default mode is the strategic map; a node can be selected and shows detail.
  await page.waitForSelector('h2:has-text("Strategic Map")');
  const mapSection = page.locator('section', { has: page.locator('h2:has-text("Strategic Map")') });
  await mapSection.locator('button:has-text("Port Klang")').first().click();
  await page.waitForSelector('text=Connected');
  console.log('strategic map renders, node detail opens');

  // War Fronts board mode: open the tab and verify the full front panel.
  await boardTabs.locator('button:has-text("War Fronts")').click();
  await page.waitForSelector('h2:has-text("War Fronts")');
  await page.waitForSelector('text=Pacific War Front');
  await page.waitForSelector('text=Counterplay:');
  await page.waitForSelector('text=Counter tags:');
  console.log('war fronts board mode renders with front detail');

  // Back to the map for the targeted action flow.
  await boardTabs.locator('button:has-text("Strategic Map")').click();
  await page.waitForSelector('h2:has-text("Strategic Map")');

  // Map-targeted action: select it in the command panel, pick a target, advance.
  await page.locator('button:has-text("Coordinate ASEAN CERT Fusion Cell")').first().click();
  await page.waitForSelector('select');
  await page.selectOption('select', 'bnm-core');
  await page.locator('button:has-text("Advance Week")').click();
  await page.waitForSelector('text=Week 2/104');
  const targetedEntry = await page.locator('text=Coordinate ASEAN CERT Fusion Cell — BNM Continuity Core').count();
  if (targetedEntry === 0) throw new Error('targeted action did not appear in timeline with its node');
  console.log('targeted action applied at chosen node');

  await page.evaluate(() => {
    const key = 'straits-protocol-2040-save';
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error('save missing before campaign injection');
    const envelope = JSON.parse(raw);
    envelope.version = 6;
    if (envelope.state.playableFactionId !== 'us-pacific-command') {
      throw new Error(`expected US PACOM save, got ${envelope.state.playableFactionId}`);
    }
    envelope.state.activePressureCampaigns = [
      {
        id: 'smoke-pnt-degradation-cycle',
        templateId: 'pnt-degradation-cycle',
        actorId: 'threat-ecosystem',
        title: 'PNT Degradation Cycle',
        description: 'Smoke-test orbital campaign state.',
        theatre: 'orbital',
        targetNodeIds: [
          'emergency-nav-mesh',
          'financial-timing-link',
          'maritime-imaging',
          'commercial-satnet',
          'asean-microsat',
        ],
        startedWeek: envelope.state.week,
        durationWeeks: 4,
        currentWeek: 0,
        intensity: 1,
        status: 'active',
        tags: ['orbital', 'pnt', 'satellite', 'resilience'],
        counterActionTags: ['orbital', 'cyber', 'maritime', 'finance', 'resilience', 'neutrality'],
        weeklyNodeEffects: { riskLevel: 1, stability: -0.35 },
        weeklyMetricEffects: { orbitalAccess: -0.35, maritimeControl: -0.1, financialContinuity: -0.1 },
        completionEffects: { metricEffects: { orbitalAccess: -1.5 } },
        disruptionEffects: { metricEffects: { orbitalAccess: 2 } },
      },
    ];
    localStorage.setItem(key, JSON.stringify(envelope));
  });
  await page.reload();
  await page.click('button:has-text("Load saved campaign")');
  await page.waitForSelector('text=US PACOM');
  // The injected save is version 6 (pre-military); loading it must migrate a
  // fresh military roster in. Confirm via the Campaigns then Military tabs.
  const boardTabsAfterLoad = page.locator('[data-testid="board-mode-tabs"]');
  await boardTabsAfterLoad.locator('button:has-text("Campaigns")').click();
  await page.waitForSelector('h2:has-text("Active Campaigns")');
  await page.waitForSelector('text=PNT Degradation Cycle');
  console.log('active campaigns board mode renders orbital campaign after v6 load');

  await boardTabsAfterLoad.locator('button:has-text("Military")').click();
  await page.waitForSelector('[data-testid="military-panel"]');
  await page.waitForSelector('[data-testid="military-panel"] button:has-text("Carrier Strike Group Pacific")');
  if ((await page.locator('[data-testid="military-panel"] svg[data-silhouette]').count()) === 0) {
    throw new Error('military asset silhouette did not render after v6 migration');
  }
  console.log('v6 save migrated military assets in; asset card and silhouette render');

  // Select the carrier and assign its eligible operation.
  await page.locator('[data-testid="military-panel"] button:has-text("Carrier Strike Group Pacific")').click();
  await page.waitForSelector('text=Eligible operations');
  await page.locator('[data-testid="military-panel"] button:has-text("Counter-Blockade Screen")').first().click();
  await page.locator('button:has-text("Assign Counter-Blockade Screen")').click();
  await page.locator('[data-testid="military-panel"]').getByText('On mission').first().waitFor();
  const launched = await page.locator('text=Operation launched: Counter-Blockade Screen').count();
  if (launched === 0) throw new Error('operation launch did not appear in timeline');
  console.log('military operation assigned; carrier shows active mission');

  // Timeline filter: narrow to Military and confirm the launch entry survives.
  const timelineControls = page.locator('[data-testid="timeline-controls"]');
  await timelineControls.locator('button:has-text("Military")').click();
  await page.waitForSelector('text=Operation launched: Counter-Blockade Screen');
  await timelineControls.locator('button:has-text("All")').click();
  console.log('timeline military filter works');

  // Save/reload must preserve the active military operation.
  await page.click('button:has-text("Save")');
  await page.waitForSelector('text=Saved ✓');
  await page.reload();
  await page.click('button:has-text("Load saved campaign")');
  await page.waitForSelector('text=US PACOM');
  await page.locator('[data-testid="board-mode-tabs"] button:has-text("Military")').click();
  await page.locator('[data-testid="military-panel"]').getByText('On mission').first().waitFor();
  const missionSurvived = await page.evaluate(() => {
    const raw = localStorage.getItem('straits-protocol-2040-save');
    const carrier = JSON.parse(raw).state.militaryAssets.find(
      (a) => a.id === 'us-carrier-group-pacific',
    );
    return carrier && carrier.activeOperationId === 'counter-blockade-screen';
  });
  if (!missionSurvived) throw new Error('active military operation did not survive save/reload');
  console.log('military operation state survives save/reload');

  // Return to the map so the turn loop selects command-panel actions cleanly.
  await page.locator('[data-testid="board-mode-tabs"] button:has-text("Strategic Map")').click();
  await page.waitForSelector('h2:has-text("Strategic Map")');

  const frontBeforeTurns = await page.evaluate(() => {
    const raw = localStorage.getItem('straits-protocol-2040-save');
    if (!raw) throw new Error('save missing before front snapshot');
    return JSON.parse(raw).state.warFronts['pacific-war-front'].intensity;
  });

  const commandPanel = page.locator('section', { has: page.locator('h2:has-text("Command Panel")') });
  for (let i = 0; i < 7; i++) {
    if (await page.locator('text=Decision required').count()) {
      await page.locator('div.fixed button').first().click();
      console.log('  resolved interactive event');
    }
    // "Monitor the Situation" is always available and never needs a target.
    await commandPanel.locator('button:has-text("Monitor the Situation")').first().click();
    const advance = page.locator('button:has-text("Advance Week")');
    if (await advance.isDisabled()) {
      await page.locator('div.fixed button').first().click();
    }
    await advance.click();
    await page.waitForTimeout(100);
  }
  const week = (await page.locator('span:has-text("Week")').first().textContent())?.trim();
  console.log(`after 8 turns: ${week}`);
  if (!week?.startsWith('Week 9/')) throw new Error(`expected Week 9, got "${week}"`);
  const frontAfterTurns = await page.evaluate(() => {
    const raw = localStorage.getItem('straits-protocol-2040-save');
    if (!raw) throw new Error('save missing after front turns');
    return JSON.parse(raw).state.warFronts['pacific-war-front'].intensity;
  });
  const frontShiftEntries = await page.locator('text=War front shift').count();
  if (frontAfterTurns === frontBeforeTurns && frontShiftEntries === 0) {
    throw new Error('war fronts did not update or report a shift after turns');
  }
  console.log('war fronts update over turns');

  if (await page.locator('text=Decision required').count()) {
    await page.locator('div.fixed button').first().click();
    console.log('  resolved final interactive event before save');
  }
  await page.click('button:has-text("Save")');
  await page.waitForSelector('text=Saved ✓');
  console.log('manual save ok');

  // The 4-week operation assigned at week 2 completes within the loop.
  const opResolved = await page.locator('text=/Operation (complete|failed): Counter-Blockade Screen/').count();
  if (opResolved === 0) throw new Error('military operation did not resolve during the turn loop');
  console.log('military operation resolved during play');

  await page.reload();
  await page.click('button:has-text("Load saved campaign")');
  await page.waitForSelector('text=Week 9/104');
  await page.waitForSelector('text=US PACOM');
  await page.waitForSelector('h2:has-text("Strategic Map")');
  const finalBoardTabs = page.locator('[data-testid="board-mode-tabs"]');
  const mapAfterLoad = page.locator('section', { has: page.locator('h2:has-text("Strategic Map")') });
  if ((await mapAfterLoad.locator('button:has-text("Malacca Strait")').count()) === 0) {
    throw new Error('map state missing after reload');
  }
  await finalBoardTabs.locator('button:has-text("War Fronts")').click();
  await page.waitForSelector('h2:has-text("War Fronts")');
  await page.waitForSelector('text=Pacific War Front');
  await page.waitForSelector('text=Counter tags:');
  await finalBoardTabs.locator('button:has-text("Campaigns")').click();
  await page.waitForSelector('h2:has-text("Active Campaigns")');
  if ((await page.locator('text=PNT Degradation Cycle').count()) === 0) {
    throw new Error('orbital campaign state missing after reload');
  }
  const frontsAfterLoad = await page.evaluate(() => {
    const raw = localStorage.getItem('straits-protocol-2040-save');
    if (!raw) throw new Error('save missing after reload');
    const state = JSON.parse(raw).state;
    if (state.playableFactionId !== 'us-pacific-command') {
      throw new Error(`expected US PACOM faction after reload, got ${state.playableFactionId}`);
    }
    return Object.keys(state.warFronts ?? {}).length;
  });
  if (frontsAfterLoad !== 6) throw new Error(`expected 6 war fronts after reload, got ${frontsAfterLoad}`);
  console.log('save/load round-trip ok - map, campaign, and war front state survived');

  await page.evaluate(() => {
    const key = 'straits-protocol-2040-save';
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error('save missing before ending injection');
    const envelope = JSON.parse(raw);
    envelope.state.status = 'ended';
    envelope.state.week = 104;
    envelope.state.ending = { endingId: 'sovereign-middle-power', week: 104, early: false };
    envelope.state.completedActions = [
      ...(envelope.state.completedActions ?? []),
      { week: 80, actionId: 'surge-allied-pacific-logistics', name: 'Surge Allied Pacific Logistics' },
      { week: 84, actionId: 'expand-orbital-deterrence-net', name: 'Expand Orbital Deterrence Net' },
    ];
    envelope.state.activePressureCampaigns = [
      ...(envelope.state.activePressureCampaigns ?? []),
      {
        id: 'smoke-disrupted-capital-flight',
        templateId: 'markets-capital-flight',
        actorId: 'financial-markets',
        title: 'Capital Flight Cycle',
        description: 'Smoke-test disrupted campaign state.',
        theatre: 'cyber-financial',
        targetNodeIds: ['bnm-core', 'bursa-node', 'payment-rails'],
        startedWeek: 70,
        durationWeeks: 4,
        currentWeek: 2,
        intensity: 2,
        status: 'disrupted',
        tags: ['markets', 'finance', 'confidence'],
        counterActionTags: ['finance', 'confidence', 'singapore'],
        weeklyNodeEffects: { riskLevel: 1.5, stability: -0.5 },
        weeklyMetricEffects: { financialContinuity: -0.35 },
        completionEffects: { metricEffects: { financialContinuity: -1.5, institutionalTrust: -1 } },
        disruptionEffects: { metricEffects: { financialContinuity: 3, institutionalTrust: 1 } },
      },
    ];
    localStorage.setItem(key, JSON.stringify(envelope));
  });
  await page.reload();
  await page.click('button:has-text("Load saved campaign")');
  await page.waitForSelector('text=Pacific Shield Holds');
  await page.waitForSelector('text=US PACOM');
  await page.waitForSelector('text=Campaign Scorecard');
  await page.waitForSelector('text=War Front Outcomes');
  await page.waitForSelector('text=Pressure Campaign Outcomes');
  await page.waitForSelector('text=Defining Decisions');
  await page.waitForSelector('text=Financial Continuity');
  await page.waitForSelector('text=Capital Flight Cycle');
  console.log('ending scorecard renders for selected faction');

  if (errors.length) throw new Error(`console errors:\n${errors.join('\n')}`);
  console.log('no console errors');
  await browser.close();
  console.log('\nSMOKE TEST PASSED');
} catch (err) {
  console.error(`\nSMOKE TEST FAILED: ${err.message ?? err}`);
  failed = true;
} finally {
  server.kill();
}
process.exit(failed ? 1 : 0);
