import { getCollection, type CollectionEntry } from 'astro:content';

export type SportsEntry = CollectionEntry<'projects'>;

/** The sports entries, in the order the /sports list shows them (highest `order` first). */
export async function getSportsSites(): Promise<SportsEntry[]> {
	return (await getCollection('projects', (p) => p.data.section === 'sports')).sort(
		(a, b) => b.data.order - a.data.order,
	);
}

// Blog tags that put a post on /sports. Matched case-insensitively.
const SPORTS_TAGS = new Set(['sports', 'college football', 'nfl', 'wnba', 'nhl', 'soccer', 'ncaa']);

export async function getSportsPosts(): Promise<CollectionEntry<'blog'>[]> {
	return (
		await getCollection('blog', (post) =>
			post.data.tags.some((t) => SPORTS_TAGS.has(t.toLowerCase())),
		)
	).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// The one-color organization mark for a league, under public/sports/logos/.
// Made with the ink-density pipeline from cfb-streak-king/scripts/gen-logos.mjs
// (NBA, NFL and WNBA from ESPN's league marks, the NCAA disc from Wikimedia Commons,
// the NCAA Football ball-and-pennant from Wikipedia). The row paints it through
// a CSS mask, so it takes the ink color in either scheme.
const LEAGUE_MARK: Record<string, string> = {
	NBA: 'nba',
	NFL: 'nfl',
	NHL: 'nhl',
	WNBA: 'wnba',
	NCAA: 'ncaa',
	CFB: 'ncaa-football',
};

export function leagueMark(league: string | undefined): string | null {
	return league ? (LEAGUE_MARK[league.toUpperCase()] ?? null) : null;
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
