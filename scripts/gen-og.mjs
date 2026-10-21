// Generate the site-level share image. Run with:
//   npm run gen:og
// Writes public/og-default.png (1200x630), the og:image / twitter:image for
// every page that has no cover of its own: the front page, /sports, /projects,
// /about. A blog post with a heroImage keeps using that instead (see
// src/components/BaseHead.astro).
//
// Same approach as gen-favicon.mjs: the text is converted to path outlines
// through opentype.js so the SVG never depends on installed fonts, and sharp
// rasterizes it. The output is committed; CI does not regenerate it.

import sharp from 'sharp';
import opentype from 'opentype.js';
import { decompress } from 'wawoff2';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'public');

// Dark-mode tokens from src/styles/global.css.
const PAPER = '#141210';
const INK = '#f2ead3';
const INK_SOFT = '#c8bfa6';
const HOT = '#ff7a4f';

const W = 1200;
const H = 630;

const woff2 = readFileSync(resolve(pub, 'fonts/space-mono-bold.woff2'));
const ttf = await decompress(woff2);
const mono = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength));
// opentype.js reads WOFF 1.0 directly.
const sans = opentype.parse(readFileSync(resolve(pub, 'fonts/atkinson-regular.woff')).buffer.slice(0));

// Lay glyphs out by hand (opentype.js's shaper chokes on Space Mono's GSUB
// table) with the font's own kerning pairs, one <path> per glyph. `track` is
// in em.
//
// opentype.js is pinned to 1.3.4, the same pin the sports sites carry: 2.x
// mangles some of Space Mono Bold's outlines (the w, the m, an o) at any
// size, and gen-favicon.mjs only ever asked it for "dh".
function layout(font, str, size, track = 0) {
	const scale = size / font.unitsPerEm;
	const glyphs = [];
	let x = 0;
	let prev = null;
	let box = null;
	for (const ch of str) {
		const g = font.charToGlyph(ch);
		if (prev) x += font.getKerningValue(prev, g) * scale;
		const path = g.getPath(x, 0, size);
		const b = path.getBoundingBox();
		if (b.x2 > b.x1) {
			box = box
				? { x1: Math.min(box.x1, b.x1), y1: Math.min(box.y1, b.y1), x2: Math.max(box.x2, b.x2), y2: Math.max(box.y2, b.y2) }
				: { ...b };
		}
		glyphs.push(path.toPathData(2));
		x += g.advanceWidth * scale + track * size;
		prev = g;
	}
	return { glyphs, width: x - track * size, box };
}

const paths = (run, fill) => run.glyphs.map((d) => `<path d="${d}" fill="${fill}"/>`).join('');

const wordmark = layout(mono, 'drewhoover.com', 100, -0.02);
const tagline = layout(sans, 'Figured out, written down.', 46);

// The wordmark as the header sets it: bold mono with the orange underline
// sitting just under the letters. Tagline below. The whole block is centered.
const wmBox = wordmark.box;
const wmH = wmBox.y2 - wmBox.y1;
const barH = 9;
const barGap = 14;
const tagGap = 64;
const tagBox = tagline.box;
const tagH = tagBox.y2 - tagBox.y1;
const blockH = wmH + barGap + barH + tagGap + tagH;
const top = (H - blockH) / 2;

const wmX = (W - wordmark.width) / 2;
const wmY = top - wmBox.y1;
const barY = top + wmH + barGap;
const tagX = (W - tagline.width) / 2;
const tagY = barY + barH + tagGap - tagBox.y1;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <g transform="translate(${wmX.toFixed(2)} ${wmY.toFixed(2)})">${paths(wordmark, INK)}</g>
  <rect x="${wmX.toFixed(2)}" y="${barY.toFixed(2)}" width="${wordmark.width.toFixed(2)}" height="${barH}" fill="${HOT}"/>
  <g transform="translate(${tagX.toFixed(2)} ${tagY.toFixed(2)})">${paths(tagline, INK_SOFT)}</g>
</svg>
`;

const out = resolve(pub, 'og-default.png');
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
console.log(`wrote og-default.png (${W}x${H})`);
