/*
  drewhoover.com sports-nav
  -------------------------
  Drop-in "more sports from drewhoover.com" list for a sports site that does
  not render it at build time. Fetches /sports/index.json (every entry with
  `section: sports` on the index site) and lists the others, so no site keeps
  its own hand-written list of its siblings.

  Usage:
    <script src="https://drewhoover.com/embed/sports-nav.js" async></script>

  Placement: mounts into <div id="sports-nav"> when the page has one, else
  just before <div id="comments">, else at the end of <body>. The list
  inherits the page's font and color; the few styles set here are layout.

  Opt out on a page:
    <html data-dhv-sports-nav="off">  — or —  <body data-dhv-sports-nav="off">

  Sites built from the dataviz-project-template render the same list at
  build time in scripts/prerender.mjs instead, so the links are in the HTML
  for crawlers; this script is for the sites that predate that.
*/
(function () {
	if (typeof document === 'undefined' || typeof fetch !== 'function') return;

	var attr = function (name) {
		return (
			document.documentElement.getAttribute(name) ||
			(document.body && document.body.getAttribute(name))
		);
	};
	if (attr('data-dhv-sports-nav') === 'off') return;
	if (document.getElementById('dhv-sports-nav')) return;

	var ORIGIN = 'https://drewhoover.com';
	// The site's slug is the first path segment: drewhoover.com/<slug>/...
	var here = (location.pathname.split('/')[1] || '').toLowerCase();

	var render = function (manifest) {
		var sites = (manifest && manifest.sites) || [];
		var others = [];
		for (var i = 0; i < sites.length; i++) {
			var slug = String(sites[i].url || '').replace(/^https?:\/\/[^/]+\//, '').split('/')[0].toLowerCase();
			if (slug !== here) others.push(sites[i]);
		}
		if (!others.length) return;

		var nav = document.createElement('nav');
		nav.id = 'dhv-sports-nav';
		nav.setAttribute('aria-label', 'more sports from drewhoover.com');
		nav.style.cssText = 'max-width:720px;margin:48px auto 24px;padding:0 16px;font:inherit;color:inherit;box-sizing:border-box';

		var h = document.createElement('h2');
		h.style.cssText = 'font-size:1em;font-weight:600;margin:0 0 10px;opacity:0.85';
		var hl = document.createElement('a');
		hl.href = (manifest && manifest.index) || ORIGIN + '/sports/';
		hl.textContent = 'More sports from drewhoover.com';
		hl.style.cssText = 'color:inherit';
		h.appendChild(hl);
		nav.appendChild(h);

		var ul = document.createElement('ul');
		ul.style.cssText = 'list-style:none;margin:0;padding:0';
		for (var j = 0; j < others.length; j++) {
			var s = others[j];
			var li = document.createElement('li');
			li.style.cssText = 'margin:0 0 8px;line-height:1.45';
			var a = document.createElement('a');
			a.href = s.url;
			a.textContent = s.title;
			a.style.cssText = 'color:inherit;font-weight:600';
			a.setAttribute('data-slug', s.slug || '');
			li.appendChild(a);
			if (s.line) li.appendChild(document.createTextNode(' — ' + s.line));
			ul.appendChild(li);
		}
		nav.appendChild(ul);

		nav.addEventListener('click', function (e) {
			var t = e.target && e.target.closest ? e.target.closest('a[data-slug]') : null;
			if (!t) return;
			try {
				if (window.dhAnalytics) window.dhAnalytics.track('sports nav', { to: t.getAttribute('data-slug') });
			} catch (err) {}
		});

		var mount = document.getElementById('sports-nav');
		var comments = document.getElementById('comments');
		if (mount) mount.appendChild(nav);
		else if (comments && comments.parentNode) comments.parentNode.insertBefore(nav, comments);
		else document.body.appendChild(nav);
	};

	var start = function () {
		fetch(ORIGIN + '/sports/index.json', { mode: 'cors', credentials: 'omit' })
			.then(function (r) {
				return r.ok ? r.json() : null;
			})
			.then(render)
			.catch(function () {});
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}
})();
