#!/usr/bin/env node
/**
 * Splits scripts/screenshots/avatars/sheet.jpg into w01–w10, m01–m06 PNGs.
 */
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const avatarsDir = join(__dirname, 'screenshots', 'avatars');
const sheetPath = join(avatarsDir, 'sheet.jpg');

const W = 1024;
const H = 682;
const rowH = H / 3;

/** @type {{ id: string; col: number; cols: number; row: number }[]} */
const cells = [];
for (let c = 0; c < 5; c++) cells.push({ id: `w${String(c + 1).padStart(2, '0')}`, col: c, cols: 5, row: 0 });
for (let c = 0; c < 5; c++) cells.push({ id: `w${String(c + 6).padStart(2, '0')}`, col: c, cols: 5, row: 1 });
for (let c = 0; c < 6; c++) cells.push({ id: `m${String(c + 1).padStart(2, '0')}`, col: c, cols: 6, row: 2 });

async function extractFace({ id, col, cols, row }) {
  const cellW = W / cols;
  const left = Math.round(col * cellW);
  const top = Math.round(row * rowH);
  const size = Math.round(Math.min(cellW, rowH) * 0.88);
  const cx = left + cellW / 2;
  const cy = top + rowH / 2;
  const extractLeft = Math.max(0, Math.round(cx - size / 2));
  const extractTop = Math.max(0, Math.round(cy - size / 2));

  const out = join(avatarsDir, `${id}.png`);
  await sharp(sheetPath)
    .extract({
      left: extractLeft,
      top: extractTop,
      width: Math.min(size, W - extractLeft),
      height: Math.min(size, H - extractTop),
    })
    .resize(256, 256, { fit: 'cover' })
    .png()
    .toFile(out);
  return out;
}

async function main() {
  await mkdir(avatarsDir, { recursive: true });
  for (const cell of cells) {
    await extractFace(cell);
    console.log('avatar:', cell.id);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
