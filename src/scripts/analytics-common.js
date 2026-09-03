// Shared by analytics.js (this site) and embed-analytics.js (the project
// sites). Kept dependency-free so esbuild can inline it into the embed.

// Headless Chrome, Puppeteer, Playwright and Selenium all set
// navigator.webdriver. Real browsers leave it false. Bots that spoof a
// referrer (a headless crawler in AWS us-east-1 hit one post ~75 times in
// one night claiming to come from kagi.com) show up in reports as visitors
// otherwise, and Mixpanel has no server-side bot filter for free plans.
export function isAutomated() {
	try {
		return navigator.webdriver === true;
	} catch {
		return false;
	}
}

// Mixpanel parses the user agent into $browser/$os and drops the raw
// string, so an unrecognized client is just blank in reports. Keeping the
// raw string lets us name a bot instead of guessing.
export function clientProps() {
	try {
		return { user_agent: navigator.userAgent };
	} catch {
		return {};
	}
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
