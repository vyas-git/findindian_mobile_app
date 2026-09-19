#!/usr/bin/env node
/**
 * Renders overlay debug PNGs (members, leaderboard, flyers) for alignment checks.
 * Output: scripts/screenshots/calibration/*.png
 */
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const scriptsDir = join(__dirname, 'screenshots');
const outDir = join(scriptsDir, 'calibration');
const html = `file://${join(scriptsDir, 'device-overlays.html')}`;

const SCREENS = ['members', 'leaderboard', 'flyers'];

async function getPuppeteer() {
  const { createRequire } = await import('module');
  return createRequire(import.meta.url)('puppeteer');
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.launch({ headless: true });
  for (const id of SCREENS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 470, height: 1024, deviceScaleFactor: 1 });
    await page.goto(`${html}?screen=${id}`, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForSelector(`#screen-${id}`, { visible: true });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: join(outDir, `${id}.png`),
      clip: { x: 0, y: 0, width: 470, height: 1024 },
    });
    console.log('calibration/', id + '.png');
    await page.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
