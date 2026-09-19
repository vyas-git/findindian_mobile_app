#!/usr/bin/env node
/**
 * App Store iPhone 6.5" (1284×2778) + iPad 12.9" (2048×2732) from chatgpt_enhanced/
 * Output: screenshots/store-chatgpt-enhanced/
 */
import { mkdir, readFile, access, readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const scriptsDir = join(__dirname, 'screenshots');
const sourceDir = join(root, 'screenshots', 'chatgpt_enhanced');
const storeRoot = join(root, 'screenshots', 'store-chatgpt-enhanced');
const enhancedDir = join(storeRoot, 'enhanced');
const appstoreDir = join(storeRoot, 'appstore');
const appstoreIpadDir = join(storeRoot, 'appstore-ipad');
const marketingHtml = `file://${join(scriptsDir, 'marketing-slides.html')}`;

const TARGET_WIDTH = 1170;
const enhancedUrlParam = encodeURIComponent('../../screenshots/store-chatgpt-enhanced/enhanced');

const SLIDE_ORDER = [
  'members',
  'leaderboard',
  'posts',
  'channel',
  'messages',
  'profile',
  'flyers',
  'flyers2',
  'jobs',
];

const APPSTORE_FILES = {
  members: '01-members-iphone-65.png',
  leaderboard: '02-leaderboard-iphone-65.png',
  posts: '03-community-posts-iphone-65.png',
  channel: '04-channel-iphone-65.png',
  messages: '05-direct-messages-iphone-65.png',
  profile: '06-community-menu-iphone-65.png',
  flyers: '07-flyers-iphone-65.png',
  flyers2: '08-flyers-travel-iphone-65.png',
  jobs: '09-jobs-iphone-65.png',
};

const IPAD_FILES = {
  members: '01-members-ipad-129.png',
  leaderboard: '02-leaderboard-ipad-129.png',
  posts: '03-community-posts-ipad-129.png',
  channel: '04-channel-ipad-129.png',
  messages: '05-direct-messages-ipad-129.png',
  profile: '06-community-menu-ipad-129.png',
  flyers: '07-flyers-ipad-129.png',
  flyers2: '08-flyers-travel-ipad-129.png',
  jobs: '09-jobs-ipad-129.png',
};

async function getPuppeteer() {
  const { createRequire } = await import('module');
  return createRequire(import.meta.url)('puppeteer');
}

async function prepareEnhanced(manifest) {
  await mkdir(enhancedDir, { recursive: true });
  for (const id of SLIDE_ORDER) {
    const filename = manifest[id];
    if (!filename) throw new Error(`manifest.json missing key: ${id}`);
    const src = join(sourceDir, filename);
    await access(src);
    await sharp(src).resize({ width: TARGET_WIDTH }).png().toFile(join(enhancedDir, `${id}.png`));
    console.log(`enhanced/${id}.png ← ${filename}`);
  }
}

async function captureMarketingSlides(browser, { format, width, height, outDir, files }) {
  for (const id of SLIDE_ORDER) {
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

async function auditFolder(manifest) {
  const entries = await readdir(sourceDir);
  const pngs = entries.filter((f) => f.toLowerCase().endsWith('.png'));
  const used = new Set(Object.values(manifest));
  const unmapped = pngs.filter((f) => !used.has(f));
  const missing = Object.entries(manifest).filter(([, f]) => !pngs.includes(f));

  console.log('Source: screenshots/chatgpt_enhanced/');
  console.log(`  PNG files in folder: ${pngs.length}`);
  console.log(`  Mapped in manifest.json: ${Object.keys(manifest).length}`);
  if (unmapped.length) {
    console.log('\n  Not in manifest (ignored until you add them):');
    for (const f of unmapped.sort()) console.log(`    - ${f}`);
    console.log('  → Edit screenshots/chatgpt_enhanced/manifest.json to use new files.\n');
  } else {
    console.log('  All PNGs are referenced in manifest.\n');
  }
  if (missing.length) {
    for (const [id, f] of missing) {
      throw new Error(`manifest "${id}" points to missing file: ${f}`);
    }
  }
}

async function main() {
  const manifest = JSON.parse(await readFile(join(sourceDir, 'manifest.json'), 'utf8'));
  await mkdir(appstoreDir, { recursive: true });
  await mkdir(appstoreIpadDir, { recursive: true });
  await auditFolder(manifest);
  await prepareEnhanced(manifest);
  const puppeteer = await getPuppeteer();
  const browser = await puppeteer.launch({ headless: true });
  await captureMarketingSlides(browser, {
    format: 'appstore',
    width: 1284,
    height: 2778,
    outDir: appstoreDir,
    files: APPSTORE_FILES,
  });
  await captureMarketingSlides(browser, {
    format: 'appstore-ipad',
    width: 2048,
    height: 2732,
    outDir: appstoreIpadDir,
    files: IPAD_FILES,
  });
  await browser.close();
  console.log('\nDone.');
  console.log('  screenshots/store-chatgpt-enhanced/enhanced/       — upscaled phone PNGs');
  console.log('  screenshots/store-chatgpt-enhanced/appstore/         — iPhone 6.5" (1284×2778)');
  console.log('  screenshots/store-chatgpt-enhanced/appstore-ipad/    — iPad 12.9" (2048×2732)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
