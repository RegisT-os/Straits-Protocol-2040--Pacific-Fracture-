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
// pick a role, start a campaign, play 8 turns (resolving interactive
// events), save, reload, load the save, and assert zero console errors.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
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

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
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
  console.log('setup screen ok');

  await page.click('text=Security Consultant');
  await page.click('text=Analyst');
  await page.click('button:has-text("Start Campaign")');
  await page.waitForSelector('text=Week 1/104');
  await page.waitForSelector('text=Actions selected:');
  console.log('campaign started (Analyst difficulty, slot counter visible)');

  for (let i = 0; i < 8; i++) {
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

  await page.click('button:has-text("Save")');
  await page.waitForSelector('text=Saved ✓');
  console.log('manual save ok');

  await page.reload();
  await page.click('button:has-text("Load saved campaign")');
  await page.waitForSelector('text=Week 9/104');
  console.log('save/load round-trip ok');

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
