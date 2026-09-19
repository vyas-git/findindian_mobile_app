#!/usr/bin/env node
/**
 * Store marketing assets: Play Store (1080×1920) + App Store 6.5" (1284×2778).
 *
 * Default: ChatGPT mockups in screenshots/chatgpt_generated/ → enhanced → framed slides.
 * Legacy puppeteer mockups: SCREENSHOTS_SOURCE=puppeteer npm run screenshots:store
 */
import { mkdir, access } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { prepareChatGptEnhanced } from './prepare-chatgpt-screenshots.mjs';

const DEVICE_COMPOSITE_SCREENS = new Set(['members', 'leaderboard', 'flyers']);
const DEVICE_W = 470;
const DEVICE_H = 1024;

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const scriptsDir = join(__dirname, 'screenshots');
const STORE_OUT = 'store-device-ui';
const storeRoot = join(root, 'screenshots', STORE_OUT);
const enhancedDir = join(storeRoot, 'enhanced');
const playstoreDir = join(storeRoot, 'playstore');
const appstoreDir = join(storeRoot, 'appstore');
const chatgptDir = join(root, 'screenshots', 'chatgpt_generated');
const enhancedUrlParam = encodeURIComponent(`../../screenshots/${STORE_OUT}/enhanced`);

const enhancedHtml = `file://${join(scriptsDir, 'enhanced-ui.html')}`;
const deviceOverlaysHtml = `file://${join(scriptsDir, 'device-overlays.html')}`;
const marketingHtml = `file://${join(scriptsDir, 'marketing-slides.html')}`;

const USE_PUPPETEER = process.env.SCREENSHOTS_SOURCE === 'puppeteer';

const SCREENS = [
  'members',
  'leaderboard',
  'posts',
  'channel',
  'flyers',
  'messages',
  'jobs',
];

const MARKETING_SLIDES = SCREENS;

const PLAYSTORE_FILES = {
  members: '01-members-map.png',
  leaderboard: '02-leaderboard.png',
  posts: '03-community-posts.png',
  channel: '04-channel.png',
  flyers: '05-flyers.png',
  messages: '06-messaging.png',
  jobs: '07-jobs.png',
};

const APPSTORE_FILES = {
  members: '01-members-map-iphone-65.png',
  leaderboard: '02-leaderboard-iphone-65.png',
  posts: '03-community-posts-iphone-65.png',
  channel: '04-channel-iphone-65.png',
  flyers: '05-flyers-iphone-65.png',
  messages: '06-messaging-iphone-65.png',
  jobs: '07-jobs-iphone-65.png',
};

function runNodeScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(__dirname, scriptName)], {
      cwd: root,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${scriptName} exited ${code}`))));
  });
}

async function chatgptAssetsPresent() {
  try {
    await access(join(chatgptDir, '03_members.png'));
    return true;
  } catch {
    return false;
  }
}

async function getPuppeteer() {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  try {
    return require('puppeteer');
  } catch {
    const { execSync } = await import('child_process');
    execSync('npm install --no-save puppeteer@23', { cwd: root, stdio: 'inherit' });
    return require('puppeteer');
  }
}

async function captureEnhanced(browser) {
  for (const id of SCREENS) {
    const page = await browser.newPage();
    const isDevice = DEVICE_COMPOSITE_SCREENS.has(id);
    const w = isDevice ? DEVICE_W : 390;
    const h = isDevice ? DEVICE_H : 844;
    const html = isDevice ? deviceOverlaysHtml : enhancedHtml;
    const dpr = isDevice ? 1 : 2;
    await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
    await page.goto(`${html}?screen=${id}`, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.waitForSelector(`#screen-${id}`, { visible: true });
    await new Promise((r) => setTimeout(r, isDevice ? 600 : 700));
    await page.screenshot({
      path: join(enhancedDir, `${id}.png`),
      clip: { x: 0, y: 0, width: w, height: h },
    });
    console.log(`Mockup: enhanced/${id}.png${isDevice ? ' (device composite)' : ''}`);
    await page.close();
  }
}

async function captureMarketing(browser, format, outDir, files, width, height) {
  for (const id of MARKETING_SLIDES) {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    const url = `${marketingHtml}?format=${format}&slide=${id}&enhanced=${enhancedUrlParam}`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.waitForSelector(`#slide-${id}.active`, { visible: true });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({
      path: join(outDir, files[id]),
      clip: { x: 0, y: 0, width, height },
    });
    console.log(`${format}: ${files[id]}`);
    await page.close();
  }
}

async function main() {
  await mkdir(enhancedDir, { recursive: true });
  await mkdir(playstoreDir, { recursive: true });
  await mkdir(appstoreDir, { recursive: true });

  const useChatGpt = !USE_PUPPETEER && (await chatgptAssetsPresent());

  if (useChatGpt) {
    console.log('Using ChatGPT mockups from screenshots/chatgpt_generated/\n');
    await prepareChatGptEnhanced();
  } else {
    if (!USE_PUPPETEER) {
      console.warn('No chatgpt_generated assets; falling back to puppeteer mockups.\n');
    }
    try {
      await runNodeScript('split-avatar-sheet.mjs');
    } catch (e) {
      console.warn('Avatar split skipped:', e.message);
    }
    const puppeteer = await getPuppeteer();
    const browser = await puppeteer.launch({ headless: true });
    await captureEnhanced(browser);
    await browser.close();
  }

  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.launch({ headless: true });
  await captureMarketing(browser, 'playstore', playstoreDir, PLAYSTORE_FILES, 1080, 1920);
  await captureMarketing(browser, 'appstore', appstoreDir, APPSTORE_FILES, 1284, 2778);
  await browser.close();

  console.log('\nDone.');
  console.log(`  screenshots/${STORE_OUT}/enhanced/   — phone mockups (source for frames)`);
  console.log(`  screenshots/${STORE_OUT}/playstore/ — Google Play (1080×1920)`);
  console.log(`  screenshots/${STORE_OUT}/appstore/  — App Store 6.5" (1284×2778)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
