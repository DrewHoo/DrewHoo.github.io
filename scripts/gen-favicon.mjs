// Generate the drewhoover.com favicon set from one SVG source. Run with:
//   npm run gen:favicon
// Writes to public/:
//   favicon.svg          — modern browsers (vector)
//   favicon.ico          — 16/32/48 for anything that probes the root .ico
//   favicon-32.png       — small-pixel fallback
//   favicon-192.png      — Android / PWA
//   apple-touch-icon.png — iOS home screen (180x180)
//
// The mark is the "dh" monogram set in Space Mono Bold (the wordmark font),
// on an opaque ink plate with the wordmark's orange underline. Letters are
// converted to path outlines here so the SVG never depends on installed fonts.

import sharp from 'sharp';
import opentype from 'opentype.js';
import { decompress } from 'wawoff2';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'public');

// Site palette (light-mode tokens from src/styles/global.css).
const INK = '#141210';
const PAPER = '#f2ead3';
const HOT = '#ff4a1c';

const woff2 = readFileSync(resolve(pub, 'fonts/space-mono-bold.woff2'));
const ttf = await decompress(woff2);
const font = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength));

const SIZE = 64;
const FONT_SIZE = 40;
const text = 'dh';
const TRACK = -0.04; // em, matches the wordmark's tight letter-spacing

// Lay the glyphs out by hand: opentype.js's text shaper chokes on this
// font's GSUB table, and Space Mono is monospace anyway.
function layout(x0, y0) {
  const scale = FONT_SIZE / font.unitsPerEm;
  const p = new opentype.Path();
  let x = x0;
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    p.extend(g.getPath(x, y0, FONT_SIZE));
    x += g.advanceWidth * scale + TRACK * FONT_SIZE;
  }
  return p;
}

const bb = layout(0, 0).getBoundingBox();
const glyphW = bb.x2 - bb.x1;
const glyphH = bb.y2 - bb.y1;

// Center the ink of the letters horizontally; sit them a little high so the
// underline bar has room below.
const barH = 5;
const gap = 4;
const blockH = glyphH + gap + barH;
const top = (SIZE - blockH) / 2;
const dx = (SIZE - glyphW) / 2 - bb.x1;
const dy = top - bb.y1;
const d = layout(dx, dy).toPathData(2);
const barY = top + glyphH + gap;
const barX = (SIZE - glyphW) / 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="12" fill="${INK}"/>
  <path d="${d}" fill="${PAPER}"/>
  <rect x="${barX.toFixed(2)}" y="${barY.toFixed(2)}" width="${glyphW.toFixed(2)}" height="${barH}" fill="${HOT}"/>
</svg>
`;

writeFileSync(resolve(pub, 'favicon.svg'), svg);
console.log('wrote favicon.svg');

const png = (size) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 });

for (const { name, size } of [
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
]) {
  await png(size).toFile(resolve(pub, name));
  console.log(`wrote ${name}`);
}

const icoSources = await Promise.all([16, 32, 48].map((s) => png(s).toBuffer()));
writeFileSync(resolve(pub, 'favicon.ico'), await pngToIco(icoSources));
console.log('wrote favicon.ico');
