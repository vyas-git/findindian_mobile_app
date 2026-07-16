#!/usr/bin/env node
/**
 * 1. Renders enhanced in-app screens (Indian names + mock avatars)
 * 2. Wraps them in Play Store marketing frames (1080x1920)
 */
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shotsDir = join(root, 'screenshots');
const enhancedDir = join(__dirname, 'screenshots', 'enhanced');
const playstoreDir = join(shotsDir, 'playstore');
const enhancedHtml = `file://${join(__dirname, 'screenshots', 'enhanced-ui.html')}`;
const playstoreHtml = `file://${join(__dirname, 'screenshots', 'playstore-slides.html')}`;

const ENHANCED_SCREENS = [
  'members',
  'sidebar',
  'posts',
  'channel',
  'jobs',
  'messages',
  'dark',
];

const PLAYSTORE_SLIDES = [
  'members',
  'sidebar',
  'posts',
  'channel',
  'jobs',
  'messages',
  'dark',
];

const PLAYSTORE_FILES = {
  members: '01-members.png',
  sidebar: '02-sidebar-guides.png',
  posts: '03-community-posts.png',
  channel: '04-general-chat.png',
  jobs: '05-jobs.png',
  messages: '06-messaging.png',
  dark: '07-dark-mode.png',
};

async function getPuppeteer() {
  try {
    return (await import('puppeteer')).default;
  } catch {
    const { execSync } = await import('child_process');
    execSync('npm install --no-save puppeteer@23', { cwd: root, stdio: 'inherit' });
    return (await import('puppeteer')).default;
  }
}

async function main() {
  await mkdir(enhancedDir, { recursive: true });
  await mkdir(playstoreDir, { recursive: true });

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.launch({ headless: true });

  // Capture enhanced in-app UI (390x844)
  for (const id of ENHANCED_SCREENS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(`${enhancedHtml}?screen=${id}`, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForSelector(`#screen-${id}`, { visible: true });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: join(enhancedDir, `${id}.png`),
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log(`Enhanced: ${id}.png`);
    await page.close();
  }

  // Capture Play Store frames (1080x1920)
  for (const id of PLAYSTORE_SLIDES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.goto(`${playstoreHtml}?slide=${id}`, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForSelector(`#slide-${id}.active`, { visible: true });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({
      path: join(playstoreDir, PLAYSTORE_FILES[id]),
      clip: { x: 0, y: 0, width: 1080, height: 1920 },
    });
    console.log(`Play Store: ${PLAYSTORE_FILES[id]}`);
    await page.close();
  }

  await browser.close();
  console.log(`\nDone! Play Store images → screenshots/playstore/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
