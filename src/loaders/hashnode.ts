import type { Loader } from 'astro/loaders';

const ENDPOINT = 'https://gql.hashnode.com';

const POSTS_QUERY = /* GraphQL */ `
	query PublicationPosts($host: String!, $first: Int!, $after: String) {
		publication(host: $host) {
			posts(first: $first, after: $after) {
				edges {
					node {
						id
						slug
						title
						subtitle
						brief
						publishedAt
						updatedAt
						coverImage {
							url
						}
						tags {
							name
							slug
						}
						content {
							markdown
						}
					}
				}
				pageInfo {
					hasNextPage
					endCursor
				}
			}
		}
	}
`;

type HashnodePost = {
	id: string;
	slug: string;
	title: string;
	subtitle: string | null;
	brief: string | null;
	publishedAt: string;
	updatedAt: string | null;
	coverImage: { url: string } | null;
	tags: { name: string; slug: string }[] | null;
	content: { markdown: string } | null;
};

type Options = {
	host: string;
	pageSize?: number;
};

export function hashnodeLoader({ host, pageSize = 20 }: Options): Loader {
	return {
		name: 'hashnode',
		async load({ store, logger, parseData, generateDigest, renderMarkdown }) {
			store.clear();

			let after: string | null = null;
			let page = 0;
			let total = 0;

			try {
				while (true) {
					page++;
					const res = await fetch(ENDPOINT, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							query: POSTS_QUERY,
							variables: { host, first: pageSize, after },
						}),
					});

					if (!res.ok) {
						throw new Error(`Hashnode API ${res.status}: ${await res.text()}`);
					}

					const json = (await res.json()) as {
						data?: { publication: { posts: { edges: { node: HashnodePost }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } | null };
						errors?: { message: string }[];
					};

					if (json.errors?.length) {
						throw new Error(`Hashnode GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`);
					}

					const publication = json.data?.publication;
					if (!publication) {
						logger.warn(`No Hashnode publication found for host "${host}"`);
						return;
					}

					const { edges, pageInfo } = publication.posts;
					for (const { node } of edges) {
						const body = node.content?.markdown ?? '';
						const data = await parseData({
							id: node.slug,
							data: {
								title: node.title,
								description: node.subtitle?.trim() || node.brief?.trim() || '',
								pubDate: new Date(node.publishedAt),
								updatedDate: node.updatedAt ? new Date(node.updatedAt) : undefined,
								heroImage: node.coverImage?.url,
								tags: node.tags?.map((t) => t.name) ?? [],
								hashnodeId: node.id,
							},
						});
						const rendered = await renderMarkdown(body);
						store.set({
							id: node.slug,
							data,
							body,
							rendered,
							digest: generateDigest({ data, body }),
						});
						total++;
					}

					if (!pageInfo.hasNextPage) break;
					after = pageInfo.endCursor;
				}

				logger.info(`Loaded ${total} Hashnode post${total === 1 ? '' : 's'} from "${host}" (${page} page${page === 1 ? '' : 's'})`);
			} catch (err) {
				// Don't fail the whole site build when the blog backend is flaky.
				// The blog collection will be empty for this build; the next
				// successful sync repopulates it.
				const msg = err instanceof Error ? err.message : String(err);
				logger.warn(`Hashnode load failed (${msg}). Skipping blog content for this build.`);
			}
		},
	};
}
