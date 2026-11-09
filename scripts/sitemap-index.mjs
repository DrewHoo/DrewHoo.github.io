// Postbuild: list each sibling site's own sitemap in dist/sitemap-index.xml.
//
// robots.txt registers one sitemap, sitemap-index.xml, and that is the one
// Search Console and Bing know about. @astrojs/sitemap writes it with only its
// own children (sitemap-0.xml), and astro.config.mjs gets each project card's
// liveUrl into sitemap-0.xml as a single URL. A sibling site that publishes its
// own sitemap (cfb-streak-king's has ~1,100 game and team pages) was never
// reached from there. A project card names that file as `sitemapUrl`, and this
// step appends it to the index as a <sitemap> entry, so the one registered
// index leads a crawler to every page a sibling site publishes.
//
// Runs after `astro build` (see the build script in package.json). No
// dependencies: node:fs only.

import fs from 'node:fs';

const projectDir = new URL('../src/content/projects/', import.meta.url);
const indexFile = new URL('../dist/sitemap-index.xml', import.meta.url);

if (!fs.existsSync(indexFile)) {
	console.error(
		'sitemap-index.mjs: dist/sitemap-index.xml is missing. Run `astro build` first; ' +
			'this step only rewrites what @astrojs/sitemap wrote.',
	);
	process.exit(1);
}

// The five comparators moved to puttingupnumbers.com on 2026-10-26. Their
// project cards were deleted the day before, and their sitemaps left this
// index with them. Every address in those sitemaps now answers 301, and a
// crawler only learns that by fetching the old address again; listing the old
// sitemaps is how Google's site-move guide asks for that recrawl. On
// 2026-11-09 Search Console showed 68 of 70 old addresses not crawled since
// the move and still indexed as live pages. Take a sport out once Search
// Console reports its old addresses as "Page with redirect".
const movedSitemaps = ['cfb', 'nfl', 'nba', 'nhl', 'wnba'].map(
	(sport) => `https://drewhoover.com/${sport}-comparator/sitemap.xml`,
);

// Same shape as the liveUrl harvest in astro.config.mjs: a frontmatter line.
const siblingSitemaps = [
	...new Set([
		...fs
			.readdirSync(projectDir)
			.filter((f) => /\.mdx?$/.test(f))
			.map(
				(f) =>
					fs.readFileSync(new URL(f, projectDir), 'utf8').match(/^sitemapUrl:\s*(\S+)/m)?.[1],
			)
			.filter((u) => typeof u === 'string'),
		...movedSitemaps,
	]),
];

const xml = fs.readFileSync(indexFile, 'utf8');
if (!/<sitemapindex[\s>]/.test(xml)) {
	console.error('sitemap-index.mjs: dist/sitemap-index.xml is not a <sitemapindex>; refusing to rewrite it.');
	process.exit(1);
}

const already = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
const added = siblingSitemaps.filter((u) => !already.has(u));

const escape = (s) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const entries = added.map((u) => `<sitemap><loc>${escape(u)}</loc></sitemap>`).join('');

const closing = xml.lastIndexOf('</sitemapindex>');
if (closing === -1) {
	console.error('sitemap-index.mjs: no </sitemapindex> close tag in dist/sitemap-index.xml.');
	process.exit(1);
}
fs.writeFileSync(indexFile, xml.slice(0, closing) + entries + xml.slice(closing));

console.log(
	`sitemap-index.mjs: ${already.size} own sitemap(s) kept, ${added.length} sibling sitemap(s) added` +
		(added.length ? `:\n  ${added.join('\n  ')}` : '.'),
);
