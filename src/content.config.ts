import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';
import { PROJECT_TAGS } from './consts';

// Posts are local Markdown/MDX under src/content/blog. (Previously sourced from
// the Hashnode GraphQL API, which became a paid-only offering in May 2026 — see
// src/loaders/hashnode.ts, kept for reference but no longer wired up.)
const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		// card thumbnail on the blog index when it should differ from the
		// og:image (heroImage) — e.g. bfme2's box art vs its share card
		cardImage: z.string().optional(),
		tags: z.array(z.string()).default([]),
		aiWritten: z.boolean().default(false),
	}),
});

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		// Which index page lists the entry. 'projects' is the card grid at
		// /projects; 'sports' is the list at /sports, which also feeds the
		// manifest at /sports/index.json that the sports sites read for their
		// "more sports" links. A sports entry has no detail page.
		section: z.enum(['projects', 'sports']).default('projects'),
		// *single asterisks* in a blurb render as <em> on cards and detail pages
		blurb: z.string().max(500),
		// One sentence for a list row (the blurb is a paragraph). Sports only.
		line: z.string().max(160).optional(),
		// Sports only: the league (CFB, NFL, WNBA, NCAA) and the seasons covered
		// ("1936–present", "through 2025"), shown beside the title.
		league: z.string().optional(),
		span: z.string().optional(),
		liveUrl: z.string().url(),
		// A sibling site that writes its own sitemap names it here; the
		// postbuild step (scripts/sitemap-index.mjs) adds it to sitemap-index.xml
		sitemapUrl: z.string().url().optional(),
		repoUrl: z.string().url().optional(),
		tags: z.array(z.enum(PROJECT_TAGS)).default([]),
		stack: z.array(z.string()).default([]),
		cover: z.string().optional(),
		coverAlt: z.string().optional(),
		pinned: z.boolean().default(false),
		order: z.number().default(0),
		// repo creation date — the default sort key for the projects grid
		created: z.coerce.date(),
		updated: z.coerce.date(),
	}),
});

export const collections = { blog, projects };
