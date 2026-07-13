// Lazy-loaded Mixpanel, same pattern and project token as the sibling
// data-viz sites (see dataviz-pages-site skill, references/analytics.md).
// The token is public by design: write-only event ingestion, no PII.
const TOKEN = '1c6a0f45b8a5768185a8d9a2f4d65452';

let mp = null;
const queue = [];

function flush() {
	for (const args of queue) {
		try {
			mp.track(...args);
		} catch {}
	}
	queue.length = 0;
}

if (typeof window !== 'undefined') {
	import('mixpanel-browser')
		.then((m) => {
			mp = m.default;
			mp.init(TOKEN, {
				track_pageview: 'url-with-path-and-query-string',
			});
			flush();
		})
		.catch(() => {
			// Adblockers commonly block scripts with 'mixpanel' in the URL.
			// Analytics failure must never break the page.
			queue.length = 0;
		});
}

export function track(name, props) {
	if (mp) {
		try {
			mp.track(name, props);
		} catch {}
	} else {
		queue.push([name, props]);
	}
}
