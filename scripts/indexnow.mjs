// Ping IndexNow so Bing recrawls what actually changed.
//
// IndexNow is a "this URL changed, come look" protocol. Bing, Yandex, Naver
// and Seznam all consume the same submission; DuckDuckGo, Ecosia, Yahoo and
// Copilot inherit it through Bing's index. Google ignores IndexNow entirely
// and still finds the site the slow way, through the sitemap.
//
// The key is meant to be public. Ownership is proved by serving the key back
// from the site root (public/<key>.txt), which is why there is no secret here
// and nothing to configure in GitHub. Rotating it means generating a new hex
// string, renaming that file, and changing KEY below — all three together.
//
// Two modes:
//   --since <sha> --head <sha>   map the push's changed files onto URLs
//   --all                        submit every URL in the live sitemap
//
// --all exists for the cases the diff cannot see: seeding a newly registered
// site, or a layout change that rewrites every page without touching content.
// Do not wire it into the push path. Submitting unchanged URLs on every
// deploy is the one thing the protocol asks you not to do, and Bing responds
// by trusting the signal less.

import { execFileSync } from 'node:child_process';

const KEY = '0fb86ba3cf86fac2435a4cddd10c8f75';
const HOST = 'drewhoover.com';
const ORIGIN = `https://${HOST}`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const SITEMAP = `${ORIGIN}/sitemap-index.xml`;

const args = process.argv.slice(2);
const flag = (name) => {
	const i = args.indexOf(name);
	return i === -1 ? undefined : args[i + 1];
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * GitHub Pages reports a deploy as finished a little before every edge has
 * the new files, so a brand-new post can be missing from the sitemap for a
 * few seconds after this job starts. Retry rather than concluding the URL
 * does not exist.
 */
async function retry(label, attempt) {
	const delays = [0, 5000, 15000, 30000];
	let last;
	for (const delay of delays) {
		if (delay) await sleep(delay);
		try {
			const result = await attempt();
			if (result !== undefined) return result;
		} catch (err) {
			last = err;
		}
	}
	throw last ?? new Error(`${label} did not settle after ${delays.length} attempts.`);
}

/** Every <loc> in the sitemap index, following it into its child sitemaps. */
async function liveSitemapUrls() {
	const read = async (url) => {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`${url} returned ${res.status}`);
		return await res.text();
	};
	const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

	const index = await read(SITEMAP);
	// A sitemap index points at sitemaps; a plain urlset points at pages. Tell
	// them apart by the root element rather than by guessing at the filename.
	if (!/<sitemapindex/.test(index)) return locs(index);

	const children = await Promise.all(locs(index).map(read));
	return children.flatMap(locs);
}

/**
 * Changed files -> the URLs they render.
 *
 * Deliberately narrow. Layouts, components and the dynamic route templates
 * under src/pages/**\/[...slug].astro are skipped: a change to one of those
 * touches every post, and firing eleven URLs at Bing because a margin moved
 * is noise. Use --all when a template change is substantive enough to matter.
 */
function urlsForChangedFiles(files) {
	const urls = new Set();
	let touchedPost = false;
	let touchedProject = false;

	for (const file of files) {
		let m;
		if ((m = file.match(/^src\/content\/blog\/(.+)\.mdx?$/))) {
			urls.add(`${ORIGIN}/blog/${m[1]}/`);
			touchedPost = true;
		} else if ((m = file.match(/^src\/content\/projects\/(.+)\.mdx?$/))) {
			urls.add(`${ORIGIN}/projects/${m[1]}/`);
			touchedProject = true;
		} else if (file === 'src/pages/index.astro') {
			urls.add(`${ORIGIN}/`);
		} else if (file === 'src/pages/projects/index.astro') {
			urls.add(`${ORIGIN}/projects/`);
		} else if ((m = file.match(/^src\/pages\/([^/_][^/]*)\.astro$/))) {
			// A leading underscore means Astro does not route the file at all
			// (src/pages/_job-faq.astro), so the character class above drops it.
			urls.add(`${ORIGIN}/${m[1]}/`);
		}
	}

	// Both listings are generated from the collections they list, so adding or
	// editing an entry really does change them. The homepage is the blog index.
	if (touchedPost) urls.add(`${ORIGIN}/`);
	if (touchedProject) urls.add(`${ORIGIN}/projects/`);

	return [...urls];
}

function changedFiles(since, head) {
	// A force-push or a first-run base can leave `since` unreachable; the
	// caller treats an empty list as "nothing to submit" rather than failing
	// the deploy over a recrawl hint.
	const out = execFileSync('git', ['diff', '--name-only', `${since}..${head}`], {
		encoding: 'utf8',
	});
	return out.split('\n').filter(Boolean);
}

async function main() {
	const all = args.includes('--all');
	const dryRun = args.includes('--dry-run');

	let candidates = null;
	if (!all) {
		const since = flag('--since');
		const head = flag('--head') ?? 'HEAD';
		if (!since) throw new Error('need --since <sha>, or --all');
		candidates = urlsForChangedFiles(changedFiles(since, head));
		if (!candidates.length) {
			console.log('nothing changed that IndexNow cares about.');
			return;
		}
	}

	// Only ever submit URLs the sitemap actually publishes. This is the
	// backstop for a mapping bug above: a URL that is not in the sitemap is
	// either unpublished or misspelled, and either way Bing should not hear
	// about it. Retry while any candidate is missing, since a missing URL
	// right after a deploy is more likely edge lag than a bad mapping.
	let urlList = [];
	let dropped = [];
	await retry('sitemap', async () => {
		const live = await liveSitemapUrls();
		// Compare without the trailing slash so /about and /about/ are one URL.
		const canonical = new Map(live.map((u) => [u.replace(/\/$/, ''), u]));
		urlList = [];
		dropped = [];
		for (const url of candidates ?? live) {
			const match = canonical.get(url.replace(/\/$/, ''));
			if (match) urlList.push(match);
			else dropped.push(url);
		}
		// undefined asks retry() for another attempt; anything else is done.
		return dropped.length ? undefined : true;
	}).catch(() => {
		// Out of attempts with some URLs still absent. Submit the ones that are
		// really there and report the rest instead of failing the deploy.
	});

	if (dropped.length) {
		console.log(`not in sitemap, skipped:\n  ${dropped.join('\n  ')}`);
	}
	if (!urlList.length) {
		console.log('nothing changed that IndexNow cares about.');
		return;
	}

	console.log(`submitting ${urlList.length} URL(s):\n  ${urlList.join('\n  ')}`);
	if (dryRun) {
		console.log('--dry-run, not submitting.');
		return;
	}

	// Prove the key file is actually being served before claiming ownership
	// with it. A 404 here means the deploy that carries the key has not landed,
	// and submitting anyway would just earn a 403.
	const keyUrl = `${ORIGIN}/${KEY}.txt`;
	await retry('key file', async () => {
		const keyRes = await fetch(keyUrl);
		const keyBody = keyRes.ok ? (await keyRes.text()).trim() : '';
		if (keyBody !== KEY) {
			throw new Error(
				`${keyUrl} returned ${keyRes.status} and did not contain the key. ` +
					'IndexNow will reject the submission until that file is live.',
			);
		}
		return true;
	});

	const res = await fetch(ENDPOINT, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
		body: JSON.stringify({ host: HOST, key: KEY, keyLocation: keyUrl, urlList }),
	});

	// 200 accepted, 202 accepted with the key still being validated. Everything
	// else is worth failing on so it shows up in the Actions log rather than
	// silently never reaching Bing.
	const body = await res.text();
	if (res.status !== 200 && res.status !== 202) {
		throw new Error(`IndexNow returned ${res.status}: ${body || '(empty body)'}`);
	}
	console.log(`IndexNow returned ${res.status}.`);
}

await main();
