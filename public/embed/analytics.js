/*
  drewhoover.com analytics
  ------------------------
  Drop-in Mixpanel for sibling project sites, alongside back-bar.js and
  giscus.js. Each project site is its own GitHub Pages deployment, so none of
  them inherit the index site's bundled analytics — before this, a project only
  reported events if someone had remembered to npm-install mixpanel-browser
  into that repo. Most had not.

  Usage (in any project site's <head>):
    <script src="https://drewhoover.com/embed/analytics.js" async></script>

  Same shared Mixpanel project as the index site. The token is public by
  design: write-only event ingestion, no PII. Same origin as drewhoover.com,
  so distinct_id carries across from the index site and a visit that starts on
  the homepage and continues into a project reads as one person.

  Auto-fires a pageview on load and on every history change (pushState /
  replaceState / popstate), so shareable ?state= URLs each count as their own
  view.

  Structured events from a project page:
    window.dhAnalytics && window.dhAnalytics.track('Song selected', { id: 'roar' })

  Calls made before Mixpanel finishes loading are queued, then flushed. If it
  never loads — adblockers routinely block anything matching /mixpanel/ — the
  queue is dropped silently. Analytics failure must never break a page.

  Opt out on a page:
    <html data-dhv-analytics="off">  — or —  <body data-dhv-analytics="off">
*/
(function () {
	if (typeof window === 'undefined' || typeof document === 'undefined') return;

	var optOut =
		document.documentElement.getAttribute('data-dhv-analytics') === 'off' ||
		(document.body && document.body.getAttribute('data-dhv-analytics') === 'off');
	if (optOut) return;

	// Guard against a page that both bundles mixpanel-browser itself and loads
	// this embed — double-init means every pageview counted twice.
	if (window.dhAnalytics || window.mixpanel) return;
	var TOKEN = '1c6a0f45b8a5768185a8d9a2f4d65452';

	var mp = null;
	var queue = [];

	function track(name, props) {
		if (mp) {
			try {
				mp.track(name, props);
			} catch {}
		} else if (queue.length < 50) {
			queue.push([name, props]);
		}
	}

	window.dhAnalytics = { track: track };

	var s = document.createElement('script');
	s.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
	s.async = true;

	s.onload = function () {
		try {
			mp = window.mixpanel;
			mp.init(TOKEN, {
				// One pageview on load, and one per history change — the shareable
				// URL patterns on these sites use replaceState.
				track_pageview: 'url-with-path-and-query-string',
				persistence: 'localStorage',
			});
			// Lets a Mixpanel report separate the project sites from the index
			// site without parsing pathnames.
			mp.register({ site: location.pathname.split('/')[1] || 'index' });
			for (var i = 0; i < queue.length; i++) {
				try {
					mp.track(queue[i][0], queue[i][1]);
				} catch {}
			}
		} catch {}
		queue = [];
	};

	s.onerror = function () {
		// Blocked or offline. Drop what's queued and stay out of the way.
		queue = [];
	};

	(document.head || document.documentElement).appendChild(s);
})();
