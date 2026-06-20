import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

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
		tags: z.array(z.string()).default([]),
	}),
});

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		blurb: z.string().max(280),
		liveUrl: z.string().url(),
		repoUrl: z.string().url().optional(),
		stack: z.array(z.string()).default([]),
		cover: z.string().optional(),
		pinned: z.boolean().default(false),
		order: z.number().default(0),
		updated: z.coerce.date(),
		note: z.string().optional(),
	}),
});

export const collections = { blog, projects };
