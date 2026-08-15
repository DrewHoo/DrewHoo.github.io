// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';

// The sibling project apps (drewhoover.com/<slug>/) are separate GitHub Pages
// deployments — Astro never builds them, so nothing put them in a sitemap. The
// /projects/<slug>/ detail pages were listed; the actual sites were not.
// Harvest the live URLs off the project cards so they ride along in this one.
//
// Some cards still point at drewhoo.github.io/<slug>/, which serves the same
// content (the CNAME makes drewhoover.com canonical). A sitemap may only list
// URLs on its own host, so those are normalised here rather than dropped.
const projectDir = new URL('./src/content/projects/', import.meta.url);
const siblingSites = [
	...new Set(
		fs
			.readdirSync(projectDir)
			.filter((f) => /\.mdx?$/.test(f))
			.map(
				(f) => fs.readFileSync(new URL(f, projectDir), 'utf8').match(/^liveUrl:\s*(\S+)/m)?.[1],
			)
			.filter((u) => typeof u === 'string')
			.map((u) => u.replace('https://drewhoo.github.io/', 'https://drewhoover.com/'))
			.filter((u) => u.startsWith('https://drewhoover.com/'))
			// skip anything Astro already emits: the root and /blog/*
			.filter((u) => u !== 'https://drewhoover.com/' && !u.includes('/blog/')),
	),
];

// https://astro.build/config
export default defineConfig({
	site: 'https://drewhoover.com',
	// Old Hashnode-era permalinks (drewhoover.com/<slug>) now live under /blog/.
	// Redirect the originals so existing links and search results keep working.
	redirects: {
		// The blog listing moved to the site root; posts still live at /blog/<slug>/.
		'/blog': '/',
		// Hashnode-era static page URLs (drewhoover.com/page/<slug>).
		'/page/about': '/about',
		'/page/job-faq': '/job-faq',
		'/questions-i-like-to-ask-my-interviewer':
			'/blog/questions-i-like-to-ask-my-interviewer/',
		'/going-deep-on-type-checking-mock-resolvers-for-graphql-test-fixtures':
			'/blog/going-deep-on-type-checking-mock-resolvers-for-graphql-test-fixtures/',
		'/how-to-write-simple-expressive-and-powerful-test-fixtures-for-graphql-applications':
			'/blog/how-to-write-simple-expressive-and-powerful-test-fixtures-for-graphql-applications/',
		'/how-to-make-a-good-side-project': '/blog/how-to-make-a-good-side-project/',
		'/drews-mentoring-maxims': '/blog/drews-mentoring-maxims/',
		'/why-deadlines-are-hard-and-why-forecasts-are-better':
			'/blog/why-deadlines-are-hard-and-why-forecasts-are-better/',
	},
	integrations: [mdx(), sitemap({ customPages: siblingSites })],
});
