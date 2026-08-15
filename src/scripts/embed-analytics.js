/*
  Source for public/embed/analytics.js — the drop-in analytics the sibling
  project sites load, alongside back-bar.js and giscus.js. Build it with:

    npm run gen:embed

  Each project site is its own GitHub Pages deployment, so none of them inherit
  this site's bundled Mixpanel; before this embed existed, a project reported
  events only if someone had npm-installed mixpanel-browser into that repo.

  Why bundle rather than load Mixpanel's CDN build: mixpanel-2-latest.min.js
  expects the official bootstrap snippet to have already put a `mixpanel` stub
  on window, and errors with "mixpanel object not initialized" without it.
  Bundling the npm package sidesteps that, keeps the file same-origin (no
  third-party CDN on every project page), and leaves this source readable.
*/
import mixpanel from 'mixpanel-browser';

// Public by design: write-only event ingestion, no PII.
const TOKEN = '1c6a0f45b8a5768185a8d9a2f4d65452';

const optOut = (el) => el && el.getAttribute('data-dhv-analytics') === 'off';

if (
	typeof window !== 'undefined' &&
	!optOut(document.documentElement) &&
	!optOut(document.body) &&
	// A page that bundles mixpanel-browser itself would otherwise double-count
	// every pageview.
	!window.dhAnalytics
) {
	let ready = false;
	const queue = [];

	// Exposed before init so a project page can call track() during its own
	// startup without caring whether Mixpanel has loaded yet.
	window.dhAnalytics = {
		track(name, props) {
			if (ready) {
				try {
					mixpanel.track(name, props);
				} catch {}
			} else if (queue.length < 50) {
				queue.push([name, props]);
			}
		},
	};

	try {
		mixpanel.init(TOKEN, {
			// One pageview on load and one per history change — the shareable
			// ?state= URLs on these sites are written with replaceState.
			track_pageview: 'url-with-path-and-query-string',
			persistence: 'localStorage',
		});
		// Same origin as drewhoover.com, so distinct_id carries over from the
		// index site and a visit that starts on the homepage and continues into
		// a project reads as one person. `site` splits them back apart in
		// reports without anyone parsing pathnames.
		mixpanel.register({ site: location.pathname.split('/')[1] || 'index' });
		ready = true;
		for (const [name, props] of queue) {
			try {
				mixpanel.track(name, props);
			} catch {}
		}
	} catch {
		// Never let analytics break a page.
	}
	queue.length = 0;
}
