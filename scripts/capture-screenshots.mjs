#!/usr/bin/env node
/**
 * Capture App Store / Play Store style screenshots from HTML mockups.
 * Usage: node scripts/capture-screenshots.mjs
 */
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'screenshots');
const mockupsPath = join(__dirname, 'screenshots', 'mockups.html');
const mockupsUrl = `file://${mockupsPath}`;

const SCREENS = [
  { id: 'screen-login', file: '01-login.png' },
  { id: 'screen-members', file: '02-members.png' },
  { id: 'screen-posts', file: '03-posts.png' },
  { id: 'screen-channel', file: '04-channel.png' },
  { id: 'screen-jobs', file: '05-jobs.png' },
  { id: 'screen-messages', file: '06-messages.png' },
  { id: 'screen-dm', file: '07-dm-chat.png' },
];

async function captureWithPuppeteer() {
  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
    puppeteer = puppeteer.default;
  } catch {
    console.log('Installing puppeteer (one-time)...');
    const { execSync } = await import('child_process');
    execSync('npm install --no-save puppeteer@23', { cwd: root, stdio: 'inherit' });
    puppeteer = (await import('puppeteer')).default;
  }

  await mkdir(outDir, { recursive: true });
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const { id, file } of SCREENS) {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(mockupsUrl, { waitUntil: 'networkidle0' });
    await page.evaluate((targetId) => {
      document.querySelectorAll('.phone').forEach((el) => {
        const show = el.id === targetId;
        el.style.position = 'fixed';
        el.style.left = '0';
        el.style.top = '0';
        el.style.display = show ? 'flex' : 'none';
        el.style.zIndex = show ? '1' : '0';
      });
      document.body.style.background = '#111';
    }, id);
    await page.screenshot({
      path: join(outDir, file),
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log(`Saved ${file}`);
  }

  await browser.close();
}

captureWithPuppeteer().catch((err) => {
  console.error(err);
  process.exit(1);
});
