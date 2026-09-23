// Shared by analytics.js (this site) and embed-analytics.js (the project
// sites). Kept dependency-free so esbuild can inline it into the embed.

// Headless Chrome, Puppeteer, Playwright and Selenium all set
// navigator.webdriver. Real browsers leave it false. Crawlers that execute
// JavaScript without setting it are only recognizable by user agent.
// Mixpanel has no server-side bot filter on free plans, so the checks live
// here.
const CRAWLER_UA =
	/bot|crawl|spider|slurp|externalagent|externalhit|externalfetcher|headless|lighthouse|python-requests|curl\/|wget\//i;

// Kagi's Small Web (kagi.com/smallweb) embeds every listed blog's new posts
// in an iframe, and a crawler loads that page around the clock: in Sept 2026
// it was ~230 loads in two weeks, each a fresh identity, all one user agent
// string and one screen width, none scrolling. It changed its user agent
// once already (meta-externalagent, then plain Chrome), so it is matched by
// where it loads from, not what it claims to be. A person who finds a post
// through Small Web and clicks through to the site is a top-level load and
// still counts.
const EMBED_REFERRERS = /^https?:\/\/([^/]+\.)?kagi\.com\//i;

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[::1\]|.*\.local|.*\.localhost)$/i;

function framed() {
	try {
		return window.self !== window.top;
	} catch {
		return true;
	}
}

// True when nothing about this load should reach Mixpanel: local dev
// servers, automated clients, and the Small Web embed above.
export function isAutomated() {
	try {
		if (LOCAL_HOSTS.test(location.hostname) || location.hostname === '') return true;
		if (navigator.webdriver === true) return true;
		if (CRAWLER_UA.test(navigator.userAgent)) return true;
		if (framed() && EMBED_REFERRERS.test(document.referrer)) return true;
	} catch {}
	return false;
}

// Mixpanel parses the user agent into $browser/$os and drops the raw
// string, so an unrecognized client is just blank in reports. Keeping the
// raw string lets us name a bot instead of guessing.
//
// `framed` is true when the page is loaded inside another site's iframe.
// Kagi's Small Web (kagi.com/smallweb) embeds every listed blog's new posts
// that way, and every Kagi surface sends the bare origin as the referrer,
// so a kagi.com referrer alone can't tell an embed from a search click.
export function clientProps() {
	const props = {};
	try {
		props.user_agent = navigator.userAgent;
	} catch {}
	props.framed = framed();
	return props;
}

// Mixpanel's own `track_pageview` config fires the first pageview inside
// init(), before anything registered afterwards can attach to it, so the
// first (usually only) pageview of a visit would miss `site` and
// `user_agent`. Init with track_pageview off, register, then call this.
// Fires once now and once per history change, the same as the library's
// 'url-with-path-and-query-string' mode; the project sites write their
// shareable ?state= URLs with replaceState.
export function trackPageviews(mp) {
	let last = '';
	const fire = () => {
		const url = location.pathname + location.search;
		if (url === last) return;
		last = url;
		try {
			mp.track_pageview();
		} catch {}
	};
	fire();
	for (const method of ['pushState', 'replaceState']) {
		const original = history[method];
		history[method] = function (...args) {
			const result = original.apply(this, args);
			fire();
			return result;
		};
	}
	window.addEventListener('popstate', fire);
}
