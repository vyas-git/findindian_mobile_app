#!/usr/bin/env node
/**
 * Upscale ChatGPT store mockups → screenshots/store-device-ui/enhanced/{id}.png
 */
import { mkdir, access } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const chatgptDir = join(root, 'screenshots', 'chatgpt_generated');
const outDir = join(root, 'screenshots', 'store-device-ui', 'enhanced');

/** Slide id → source filename in chatgpt_generated/ */
export const CHATGPT_MAP = {
  members: '03_members.png',
  leaderboard: '04_profile.png',
  posts: '05_posts.png',
  channel: '02_chat.png',
  flyers: '06_flyers.png',
  messages: '02_chat.png',
  jobs: '01_jobs.png',
};

const TARGET_WIDTH = 1170;

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function prepareChatGptEnhanced() {
  await mkdir(outDir, { recursive: true });
  const written = new Set();

  for (const [id, filename] of Object.entries(CHATGPT_MAP)) {
    const src = join(chatgptDir, filename);
    if (!(await fileExists(src))) {
      throw new Error(`Missing ChatGPT asset: ${src}`);
    }
    const outPath = join(outDir, `${id}.png`);
    if (written.has(filename)) {
      await sharp(src).resize({ width: TARGET_WIDTH }).png().toFile(outPath);
      console.log(`enhanced/${id}.png (from ${filename})`);
      continue;
    }
    await sharp(src).resize({ width: TARGET_WIDTH }).png().toFile(outPath);
    written.add(filename);
    console.log(`enhanced/${id}.png ← ${filename}`);
  }
}

if (process.argv[1]?.endsWith('prepare-chatgpt-screenshots.mjs')) {
  prepareChatGptEnhanced().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
