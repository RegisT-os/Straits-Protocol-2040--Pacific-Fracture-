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
// pick a faction + role + difficulty, start a campaign, verify the strategic map
// (node selection + detail), fire a map-targeted action with a chosen
// target, verify the War Fronts and Active Campaigns panels, inject a
// deterministic pressure campaign, play 8 turns (resolving interactive
// events), save, reload, load the save, verify map/campaign/front state
// survived, and assert zero console errors.

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
  await page.waitForSelector('button:has-text("Singapore")');
  console.log('setup screen ok');

  await page.click('button:has-text("Singapore")');
  await page.click('text=Security Consultant');
  await page.click('text=Analyst');
  await page.click('button:has-text("Start Campaign")');
  await page.waitForSelector('text=Week 1/104');
  await page.waitForSelector('text=Singapore');
  await page.waitForSelector('text=Actions selected:');
  await page.waitForSelector('h2:has-text("War Fronts")');
  await page.waitForSelector('text=Pacific War Front');
  await page.waitForSelector('text=Drivers:');
  await page.waitForSelector('text=Singapore impact:');
  await page.waitForSelector('text=Counterplay:');
  await page.waitForSelector('text=Campaign risk:');
  await page.waitForSelector('text=Trend:');
  await page.waitForSelector('text=Spawn window:');
  await page.waitForSelector('text=Counter tags:');
  await page.waitForSelector('text=Recent shift:');
  await page.waitForSelector('h2:has-text("Active Campaigns")');
  await page.waitForSelector('text=Activate Continuity Authority');
  await page.waitForSelector('text=Ringfence Financial Flows');
  await page.waitForSelector('text=Activate Terrestrial Navigation Backup');
  await page.waitForSelector('text=Harden Financial Timing Backup');
  await page.waitForSelector('text=Lease Allied Orbital Coverage');
  console.log('Singapore campaign started (Analyst difficulty, slot counter and war fronts visible)');

  // Strategic map renders; a node can be selected and shows detail.
  await page.waitForSelector('h2:has-text("Strategic Map")');
  const mapSection = page.locator('section', { has: page.locator('h2:has-text("Strategic Map")') });
  await mapSection.locator('button:has-text("Port Klang")').first().click();
  await page.waitForSelector('text=Connected');
  console.log('strategic map renders, node detail opens');

  // Map-targeted action: select it, pick a target, advance.
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
    if (envelope.state.playableFactionId !== 'singapore') {
      throw new Error(`expected Singapore save, got ${envelope.state.playableFactionId}`);
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
  await page.waitForSelector('text=Singapore');
  await page.waitForSelector('text=PNT Degradation Cycle');
  await page.waitForSelector('text=INT 1');
  console.log('active campaigns panel renders orbital campaign and save/load works');

  const frontBeforeTurns = await page.evaluate(() => {
    const raw = localStorage.getItem('straits-protocol-2040-save');
    if (!raw) throw new Error('save missing before front snapshot');
    return JSON.parse(raw).state.warFronts['pacific-war-front'].intensity;
  });

  for (let i = 0; i < 7; i++) {
    if (await page.locator('text=Decision required').count()) {
      await page.locator('div.fixed button').first().click();
      console.log('  resolved interactive event');
    }
    await page.locator('section button:not([disabled])').first().click();
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

  await page.reload();
  await page.click('button:has-text("Load saved campaign")');
  await page.waitForSelector('text=Week 9/104');
  await page.waitForSelector('text=Singapore');
  await page.waitForSelector('h2:has-text("Strategic Map")');
  await page.waitForSelector('h2:has-text("War Fronts")');
  await page.waitForSelector('text=Pacific War Front');
  await page.waitForSelector('text=Counterplay:');
  await page.waitForSelector('text=Counter tags:');
  await page.waitForSelector('h2:has-text("Active Campaigns")');
  const mapAfterLoad = page.locator('section', { has: page.locator('h2:has-text("Strategic Map")') });
  if ((await mapAfterLoad.locator('button:has-text("Malacca Strait")').count()) === 0) {
    throw new Error('map state missing after reload');
  }
  if ((await page.locator('text=PNT Degradation Cycle').count()) === 0) {
    throw new Error('orbital campaign state missing after reload');
  }
  const frontsAfterLoad = await page.evaluate(() => {
    const raw = localStorage.getItem('straits-protocol-2040-save');
    if (!raw) throw new Error('save missing after reload');
    const state = JSON.parse(raw).state;
    if (state.playableFactionId !== 'singapore') {
      throw new Error(`expected Singapore faction after reload, got ${state.playableFactionId}`);
    }
    return Object.keys(state.warFronts ?? {}).length;
  });
  if (frontsAfterLoad !== 6) throw new Error(`expected 6 war fronts after reload, got ${frontsAfterLoad}`);
  console.log('save/load round-trip ok - map, campaign, and war front state survived');

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
