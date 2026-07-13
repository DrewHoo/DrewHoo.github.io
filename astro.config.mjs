// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

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
	integrations: [mdx(), sitemap()],
});
