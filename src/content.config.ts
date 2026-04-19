import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';
import { hashnodeLoader } from './loaders/hashnode';

const HASHNODE_HOST = process.env.HASHNODE_PUBLICATION_HOST ?? 'drewhoo.hashnode.dev';

const blog = defineCollection({
	loader: hashnodeLoader({ host: HASHNODE_HOST }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		tags: z.array(z.string()).default([]),
		hashnodeId: z.string().optional(),
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
