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

// Drew's own browsers. Visiting any drewhoover.com page with ?notrack=1 sets
// this flag for the browser, and ?notrack=0 clears it. Every site here shares
// the origin, so one visit covers the index and every project. Older events
// from his devices are filtered in Mixpanel by the "Drew's devices" property.
const NOTRACK_KEY = 'dh-notrack';

// Its own try, so blocked storage can't skip the checks after it.
function notrack() {
	try {
		const param = new URLSearchParams(location.search).get('notrack');
		if (param === '1') {
			localStorage.setItem(NOTRACK_KEY, '1');
			console.info('drewhoover.com analytics: off for this browser (?notrack=0 turns it back on)');
		} else if (param === '0') {
			localStorage.removeItem(NOTRACK_KEY);
			console.info('drewhoover.com analytics: on for this browser');
		}
		return localStorage.getItem(NOTRACK_KEY) === '1';
	} catch {
		return false;
	}
}

// True when nothing about this load should reach Mixpanel: local dev
// servers, automated clients, the Small Web embed above, and Drew's own
// browsers.
export function isAutomated() {
	try {
		if (notrack()) return true;
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
// shareable ?state= URLs with replaceState. Returns how many it has fired,
// for `leave`.
export function trackPageviews(mp) {
	let last = '';
	let views = 0;
	const fire = () => {
		const url = location.pathname + location.search;
		if (url === last) return;
		last = url;
		views++;
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
	return () => views;
}

// `leave`, sent as the tab hides (a phone switching apps, a close, back to
// Reddit): how long the page was in view, how far down it got, how many taps
// and how many pageviews. A one-page visit of 40 seconds to the foot of the
// board is a read; 3 seconds at the top is a bounce, and a pageview alone
// can't tell them apart. Same event and fields as puttingupnumbers.com's, so
// one query reads every site. A tab that comes back and hides again sends the
// running totals again, so read the last one for each `load`.
export function trackLeave(mp, views) {
	const load = Math.random().toString(36).slice(2, 10);
	const landing = location.pathname;
	// In view since the page started loading, unless it opened in the
	// background. performance.now() counts from navigation, so the time
	// before this async script loaded is in it.
	let since = document.visibilityState === 'visible' ? 0 : null;
	let seen = 0;
	let deepest = 0;
	let taps = 0;
	const measure = () => {
		const height = document.documentElement.scrollHeight;
		const reached = height > 0 ? (window.scrollY + window.innerHeight) / height : 1;
		deepest = Math.max(deepest, Math.min(1, reached));
	};
	measure();
	window.addEventListener('scroll', measure, { passive: true });
	document.addEventListener('click', () => taps++, { capture: true, passive: true });
	const send = () => {
		if (since === null) return;
		seen += performance.now() - since;
		since = null;
		measure();
		try {
			mp.track(
				'leave',
				{
					load,
					landing,
					page: location.pathname,
					seconds: Math.round(seen / 1000),
					scroll: Math.round(deepest * 20) * 5,
					taps,
					views: views(),
				},
				{ transport: 'sendBeacon', send_immediately: true },
			);
		} catch {}
	};
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') send();
		else if (since === null) since = performance.now();
	});
	// Safari can skip visibilitychange on a close; send() ignores the second
	// of the pair.
	window.addEventListener('pagehide', send);
}
