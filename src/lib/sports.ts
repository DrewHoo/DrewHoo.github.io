import { getCollection, type CollectionEntry } from 'astro:content';

export type SportsEntry = CollectionEntry<'projects'>;

/** The sports entries, in the order the /sports list shows them (highest `order` first). */
export async function getSportsSites(): Promise<SportsEntry[]> {
	return (await getCollection('projects', (p) => p.data.section === 'sports')).sort(
		(a, b) => b.data.order - a.data.order,
	);
}

// Blog tags that put a post on /sports. Matched case-insensitively.
const SPORTS_TAGS = new Set(['sports', 'college football', 'nfl', 'wnba', 'soccer', 'ncaa']);

export async function getSportsPosts(): Promise<CollectionEntry<'blog'>[]> {
	return (
		await getCollection('blog', (post) =>
			post.data.tags.some((t) => SPORTS_TAGS.has(t.toLowerCase())),
		)
	).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** One row of the manifest at /sports/index.json, which the sports sites read for their "more sports" links. */
export function manifestRow(site: SportsEntry) {
	const { title, line, league, span, liveUrl, repoUrl, updated } = site.data;
	return {
		slug: site.id,
		title,
		line: line ?? null,
		league: league ?? null,
		span: span ?? null,
		url: liveUrl,
		repo: repoUrl ?? null,
		updated: updated.toISOString().slice(0, 10),
	};
}
