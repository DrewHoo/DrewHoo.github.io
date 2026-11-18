/*
  drewhoover.com back-bar
  -----------------------
  Drop-in script for sibling project sites. Adds a sticky top strip with
  "← drewhoover.com" so visitors always have a way home.

  Usage (in any project site's <head> or end of <body>):
    <script src="https://drewhoover.com/embed/back-bar.js" async></script>

  The bar returns the visitor to the drewhoover.com page they came from,
  #fragment included: a lookbook opened from /favorites/#lookbooks goes back
  to that tab, a project opened from /projects/ goes back there. The index
  site saves that page on click (src/scripts/back-bar-return.js); the
  referrer is the fallback. A visitor who arrived from anywhere else gets
  the home page, or the site's section page.

  A site in a section of drewhoover.com links back to that section's page
  instead of the home page:
    <script src="https://drewhoover.com/embed/back-bar.js" data-section="sports" async></script>
  renders "← drewhoover.com/sports" linking to https://drewhoover.com/sports/.

  Colors follow prefers-color-scheme. A page that is always dark (every sports
  site) can pin the bar:
    <html data-dhv-back-bar-theme="dark">   — or "light"; a sports-section bar
  defaults to dark, since every sports site is.

  Opt out on a page:
    <html data-dhv-back-bar="off">  — or —  <body data-dhv-back-bar="off">

  Clicks are reported through the analytics embed, when it is on the page, as
  the event "back bar" with `to` (the first path segment of the target, or
  "home") and `returning` (true when it goes back to where the visitor came
  from, false for the default).

  Read next. A sports site can trade the back link for Putting Up Numbers'
  claims about what the reader is looking at
  (puttingupnumbers' specs/read-next-across-sites.spec.md):
    <script src="https://drewhoover.com/embed/back-bar.js" data-section="sports" data-read-next="cfb" async></script>
  The page names its subject on <html> and changes it as the reader moves:
    <html data-dh-subject="team:alabama">   — a PUN team slug, or
    <html data-dh-subject="coach:kalen-deboer" data-dh-team="alabama">
  A page with none gets the last subject any drewhoover.com sports site set
  (localStorage), else the sport's list. The bar fetches
  <origin>/<sport>/teams/<slug>/links.json, /<sport>/players/<slug>/links.json
  for a coach (then his team's), or /<sport>/links.json, each once a day.
  It drops the page they're on, links into this site and any link this browser
  tapped in the last 30 days, shuffles the rest with a seed of this browser and
  today, and adds the sport's list while there are under three. Under three in
  all, or no answer, and the back link stays; it also holds the bar's height
  until the links land. A phone scrolls every link sideways; a desktop shows
  the ones from the front that fit whole. `data-read-next-origin` on the
  script tag points it at another PUN (a local server, for testing).
  The order goes to the page as window.dhReadNext = { subject, links, tap,
  shown } and a `dh:readnext` event on window each time it's drawn, so the
  page's own block shows the same links and counts them the same way:
  "readnext shown" { from, subject, ids, where } once a pageview a subject,
  and "readnext" { from, to, id, kind, sport, slot, where } on a tap, where
  `where` is "bar" or the page's "block".
*/
(function () {
	if (typeof document === 'undefined') return;

	var attr = function (name) {
		return (
			document.documentElement.getAttribute(name) ||
			(document.body && document.body.getAttribute(name))
		);
	};
	if (attr('data-dhv-back-bar') === 'off') return;

	// Already injected? (e.g. script included twice)
	if (document.getElementById('dhv-back-bar')) return;

	// `data-section` on this script tag. currentScript is set while an async
	// script runs; the selector is the fallback for a script loaded another way.
	var self =
		document.currentScript ||
		document.querySelector('script[src*="/embed/back-bar.js"][data-section]');
	var section = (self && self.getAttribute('data-section')) || '';
	if (!/^[a-z][a-z0-9-]*$/.test(section)) section = '';

	var ORIGIN = 'https://drewhoover.com';
	var fallback = section ? ORIGIN + '/' + section + '/' : ORIGIN + '/';

	// Return to the page the visitor came from, when it was a drewhoover.com
	// page outside this site. On drewhoover.com this site is /<slug>/; a site
	// on its own domain is that whole domain.
	var siteRoot =
		location.origin === ORIGIN
			? ORIGIN + '/' + (location.pathname.split('/')[1] || '') + '/'
			: location.origin + '/';
	var outside = function (url) {
		return (
			typeof url === 'string' && url.indexOf(ORIGIN + '/') === 0 && url.indexOf(siteRoot) !== 0
		);
	};
	// The index site (src/scripts/back-bar-return.js) saves the page and the
	// link of every click. That keeps the #fragment the referrer drops, so a
	// lookbook opened from /favorites/#lookbooks returns to that tab, and it
	// survives navigation inside a multi-page site. It's localStorage, shared
	// by every tab, so trust it only when the click led into this site, was
	// within the hour, and the visitor didn't arrive from another website.
	var back = '';
	try {
		var saved = JSON.parse(localStorage.getItem('dhv-back-bar-return') || 'null');
		var ref = document.referrer;
		if (
			saved &&
			outside(saved.from) &&
			String(saved.to).indexOf(siteRoot) === 0 &&
			Date.now() - saved.at < 60 * 60 * 1000 &&
			(!ref || ref.indexOf(ORIGIN + '/') === 0)
		) {
			back = saved.from;
		}
	} catch (e) {}
	if (!back && outside(document.referrer)) back = document.referrer;

	var href = back || fallback;
	// Name the section, not the page: "drewhoover.com/favorites",
	// "drewhoover.com/blog", or "drewhoover.com" for the front page.
	var place = href.slice(ORIGIN.length).split('/')[1] || '';
	place = place.split('#')[0].split('?')[0];
	var label = place ? 'drewhoover.com/' + place : 'drewhoover.com';

	// The index site's palette, both schemes (src/styles/global.css).
	var themes = {
		light: { paper: '#f2ead3', ink: '#141210', rule: '#1b1814', hot: '#ff4a1c' },
		dark: { paper: '#141210', ink: '#f2ead3', rule: '#f2ead3', hot: '#ff7a4f' },
	};
	var pinned = attr('data-dhv-back-bar-theme');
	if (pinned !== 'light' && pinned !== 'dark') pinned = section === 'sports' ? 'dark' : '';
	var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
	var theme = function () {
		return pinned || (media && media.matches ? 'dark' : 'light');
	};

	var bar = document.createElement('div');
	bar.id = 'dhv-back-bar';
	bar.setAttribute('role', 'navigation');
	bar.setAttribute('aria-label', 'back to ' + label);

	var link = document.createElement('a');
	link.href = href;
	link.textContent = '← ' + label;
	bar.appendChild(link);

	// Read next (data-read-next="<sport>" on the script tag): the bar holds
	// Putting Up Numbers' links for the page's subject in place of the back link.
	var sport = (self && self.getAttribute('data-read-next')) || '';
	if (!/^[a-z]+$/.test(sport)) sport = '';
	var punOrigin = ((self && self.getAttribute('data-read-next-origin')) || 'https://puttingupnumbers.com').replace(
		/\/+$/,
		'',
	);
	// The links on the bar once they've landed, [{ a, l }], else null (the back link shows)
	var rn = null;
	var narrowQuery = window.matchMedia ? window.matchMedia('(max-width: 700px)') : null;
	var narrow = function () {
		return narrowQuery ? narrowQuery.matches : window.innerWidth <= 700;
	};

	var paint = function () {
		var t = themes[theme()];
		var css = [
			'position:sticky',
			'top:0',
			'left:0',
			'right:0',
			'z-index:2147483000',
			'width:100%',
			'margin:0',
			'padding:6px 14px',
			'background:' + t.paper,
			'color:' + t.ink,
			'border-bottom:2px solid ' + t.rule,
			"font-family:'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
			'text-align:left',
			'box-sizing:border-box',
		];
		// One line of 12px links, the back link's 13px line height, so the bar
		// is the same height either way.
		if (rn) {
			css.push(
				'font-size:12px',
				'line-height:18.2px',
				'display:flex',
				'gap:26px',
				'white-space:nowrap',
				'overflow-y:hidden',
				'overflow-x:' + (narrow() ? 'auto' : 'hidden'),
				'scrollbar-width:none',
			);
		} else {
			css.push('font-size:13px', 'line-height:1.4');
		}
		bar.style.cssText = css.join(';');
		link.style.cssText = [
			'color:' + t.ink,
			'text-decoration:underline',
			'text-decoration-thickness:2px',
			'text-decoration-color:' + t.hot,
			'text-underline-offset:3px',
			'font-weight:700',
		].join(';');
		if (rn) {
			rn.forEach(function (x) {
				x.a.style.color = t.ink;
				x.a.style.textDecoration = 'underline';
				x.a.style.textDecorationThickness = '1px';
				x.a.style.textDecorationColor = t.hot;
				x.a.style.textUnderlineOffset = '3px';
				x.a.style.fontWeight = '700';
				x.a.style.flex = 'none';
			});
		}
	};
	paint();
	if (media && !pinned) {
		if (media.addEventListener) media.addEventListener('change', paint);
		else if (media.addListener) media.addListener(paint);
	}

	link.addEventListener('click', function () {
		try {
			if (window.dhAnalytics) window.dhAnalytics.track('back bar', { to: place || 'home', returning: !!back });
		} catch (e) {}
	});

	// The bar's layout once it's on the page. A phone scrolls the links
	// sideways with the right edge faded until the end; a desktop shows the
	// ones from the front that fit whole.
	var fade = function () {
		var more = !!rn && narrow() && bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 2;
		var mask = more ? 'linear-gradient(90deg,#000 calc(100% - 36px),transparent)' : 'none';
		bar.style.webkitMaskImage = mask;
		bar.style.maskImage = mask;
	};
	var pendingShown = false;
	var fit = function () {
		if (!rn || !bar.isConnected) return;
		bar.style.overflowX = narrow() ? 'auto' : 'hidden';
		rn.forEach(function (x) {
			x.a.style.display = '';
		});
		if (!narrow()) {
			bar.scrollLeft = 0;
			var right = bar.getBoundingClientRect().right - 14;
			var cut = false;
			rn.forEach(function (x) {
				if (!cut && x.a.getBoundingClientRect().right > right + 0.5) cut = true;
				if (cut) x.a.style.display = 'none';
			});
		}
		fade();
		if (pendingShown) {
			pendingShown = false;
			var ids = [];
			rn.forEach(function (x) {
				if (x.a.style.display !== 'none') ids.push(x.l.id);
			});
			if (window.dhReadNext) window.dhReadNext.shown('bar', ids);
		}
	};
	var fitSoon = (function () {
		var queued = false;
		return function () {
			if (queued) return;
			queued = true;
			(window.requestAnimationFrame || setTimeout)(function () {
				queued = false;
				fit();
			});
		};
	})();

	if (sport) readNext();

	var insert = function () {
		if (!document.body) return;
		// Prepend so it sticks to the top of the layout.
		document.body.insertBefore(bar, document.body.firstChild);
		fit();
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', insert);
	} else {
		insert();
	}

	function readNext() {
		var K = {
			who: 'dh-readnext-browser',
			subject: 'dh-readnext-subject',
			files: 'dh-readnext-files',
			taps: 'dh-readnext-taps',
		};
		var load = function (k) {
			try {
				return JSON.parse(localStorage.getItem(k) || 'null');
			} catch (e) {
				return null;
			}
		};
		var save = function (k, v) {
			try {
				localStorage.setItem(k, JSON.stringify(v));
				return true;
			} catch (e) {
				return false;
			}
		};
		// The site's slug, the first path segment on drewhoover.com
		var from = location.pathname.split('/')[1] || 'index';
		var pad = function (n) {
			return (n < 10 ? '0' : '') + n;
		};
		var now = new Date();
		var day = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

		// The draw's seed: this browser and today, so a reload shows the same
		// order and tomorrow another
		var who = load(K.who);
		if (typeof who !== 'string') {
			who = Math.random().toString(36).slice(2) + Date.now().toString(36);
			save(K.who, who);
		}
		var hash = function (s) {
			var h = 2166136261;
			for (var i = 0; i < s.length; i++) {
				h ^= s.charCodeAt(i);
				h = Math.imul(h, 16777619);
			}
			h ^= h >>> 16;
			h = Math.imul(h, 0x85ebca6b);
			h ^= h >>> 13;
			h = Math.imul(h, 0xc2b2ae35);
			h ^= h >>> 16;
			return h >>> 0;
		};

		var send = function (name, props) {
			var tries = 0;
			(function go() {
				if (window.dhAnalytics) {
					try {
						window.dhAnalytics.track(name, props);
					} catch (e) {}
				} else if (++tries < 20) setTimeout(go, 500);
			})();
		};

		// The subject: the page's (`data-dh-subject` on <html>, with
		// `data-dh-team` for a coach's team), else the last one any
		// drewhoover.com sports site set, else none (the sport's list)
		var SUBJECT = /^(team|coach):[a-z0-9][a-z0-9-]*$/;
		var SLUG = /^[a-z0-9][a-z0-9-]*$/;
		var subjectNow = function () {
			var el = document.documentElement;
			var s = el.getAttribute('data-dh-subject') || '';
			var t = el.getAttribute('data-dh-team') || '';
			if (SUBJECT.test(s)) {
				var mine = { subject: s, team: SLUG.test(t) ? t : '' };
				save(K.subject, mine);
				return mine;
			}
			var had = load(K.subject);
			if (had && SUBJECT.test(had.subject)) return { subject: had.subject, team: SLUG.test(had.team || '') ? had.team : '' };
			return { subject: '', team: '' };
		};

		// Each file once a day: today's are kept, so a later pageview draws
		// before the page paints. A 404 is kept as 0 (no file for that subject).
		var files = load(K.files);
		if (!files || files.day !== day || files.origin !== punOrigin || typeof files.got !== 'object') {
			files = { day: day, origin: punOrigin, got: {} };
		}
		var file = function (path, cb) {
			if (Object.prototype.hasOwnProperty.call(files.got, path)) return cb(files.got[path] || null);
			if (!window.fetch) return cb(null);
			fetch(punOrigin + path, { credentials: 'omit' })
				.then(function (r) {
					if (r.status === 404) return 0;
					if (!r.ok) throw new Error('read next: ' + r.status);
					return r.json();
				})
				.then(
					function (data) {
						if (data !== 0 && !(data && Array.isArray(data.links))) return null;
						if (Object.keys(files.got).length >= 24) files.got = {};
						files.got[path] = data;
						if (!save(K.files, files)) {
							files.got = {};
							files.got[path] = data;
							save(K.files, files);
						}
						return data || null;
					},
					function () {
						return null;
					},
				)
				.then(cb);
		};

		var MONTH = 30 * 864e5;
		var taps = function () {
			var had = load(K.taps) || {};
			var out = {};
			for (var id in had) if (Date.now() - had[id] < MONTH) out[id] = had[id];
			return out;
		};
		// Not the page they're on, not this site, and not one this browser
		// tapped in the last 30 days
		var keep = function (l, tapped) {
			if (!l || typeof l.id !== 'string' || typeof l.href !== 'string' || typeof l.short !== 'string') return false;
			if (tapped[l.id]) return false;
			var u;
			try {
				u = new URL(l.href);
			} catch (e) {
				return false;
			}
			if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
			if (u.host === location.host && u.pathname === location.pathname) return false;
			if ((u.host === 'drewhoover.com' || u.host === location.host) && u.pathname.split('/')[1] === from) return false;
			return true;
		};

		var hostOf = function (href) {
			try {
				return new URL(href).host;
			} catch (e) {
				return '';
			}
		};
		var punHosts = ['puttingupnumbers.com', hostOf(punOrigin)];
		// A link's short form, with each {team:<slug>} as that team's mark
		var anchor = function (l, teams) {
			var a = document.createElement('a');
			a.href = l.href;
			if (punHosts.indexOf(hostOf(l.href)) >= 0) a.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
			var afterMark = false;
			l.short.split(/(\{team:[a-z0-9-]+\})/).forEach(function (part) {
				var m = /^\{team:([a-z0-9-]+)\}$/.exec(part);
				if (!m) {
					var words = afterMark ? part.replace(/^ /, '') : part;
					if (words) a.appendChild(document.createTextNode(words));
					afterMark = false;
					return;
				}
				var t = teams[m[1]];
				if (t && t.mark) {
					var img = document.createElement('img');
					img.src = t.mark;
					img.alt = t.name || '';
					img.style.cssText =
						'display:inline;height:15px;width:auto;vertical-align:-3px;margin:0 6px 0 0;border:0;padding:0';
					img.addEventListener('load', fitSoon);
					a.appendChild(img);
					afterMark = true;
				} else if (t && t.name) {
					a.appendChild(document.createTextNode(t.name));
				}
			});
			return a;
		};

		var said = {};
		var shown = function (where, ids) {
			var api = window.dhReadNext;
			if (!api || !ids.length || said[where + ' ' + api.subject]) return;
			said[where + ' ' + api.subject] = true;
			send('readnext shown', { from: from, subject: api.subject, ids: ids, where: where });
		};
		var tap = function (l, slot, where) {
			var t = taps();
			t[l.id] = Date.now();
			save(K.taps, t);
			send('readnext', { from: from, to: l.href, id: l.id, kind: l.kind, sport: l.sport, slot: slot, where: where });
		};

		var show = function (subject, links, teams) {
			window.dhReadNext = {
				subject: subject,
				links: links.map(function (l) {
					return { id: l.id, kind: l.kind, sport: l.sport, site: l.site, href: l.href, text: l.text, short: l.short };
				}),
				// for the page's own block: a tap and a sighting, counted the bar's way
				tap: tap,
				shown: shown,
			};
			bar.textContent = '';
			if (links.length) {
				rn = links.map(function (l, i) {
					var a = anchor(l, teams);
					a.addEventListener('click', function () {
						tap(l, i + 1, 'bar');
					});
					bar.appendChild(a);
					return { a: a, l: l };
				});
				bar.setAttribute('aria-label', 'Read next');
				pendingShown = true;
			} else {
				rn = null;
				bar.appendChild(link);
				bar.setAttribute('aria-label', 'back to ' + label);
			}
			paint();
			fit();
			try {
				window.dispatchEvent(new CustomEvent('dh:readnext', { detail: window.dhReadNext }));
			} catch (e) {}
		};

		// The draw: the subject's links (a coach's, then his team's), shuffled
		// by the seed, then the sport's after them while there are under three.
		// Under three in all, the back link stays.
		var drawn = null;
		var token = 0;
		var draw = function () {
			var s = subjectNow();
			if (s.subject + ' ' + s.team === drawn) return;
			drawn = s.subject + ' ' + s.team;
			var mine = ++token;
			var m = /^(team|coach):(.+)$/.exec(s.subject);
			var paths = [];
			if (m) paths.push('/' + sport + (m[1] === 'team' ? '/teams/' : '/players/') + m[2] + '/links.json');
			if (m && m[1] === 'coach' && s.team) paths.push('/' + sport + '/teams/' + s.team + '/links.json');
			paths.push('/' + sport + '/links.json');
			var seed = who + ' ' + day;
			var tapped = taps();
			var out = [];
			var had = {};
			var teams = {};
			var next = function (i) {
				if (mine !== token) return;
				if (out.length >= 3 || i === paths.length) return show(s.subject || 'national', out.length >= 3 ? out : [], teams);
				file(paths[i], function (data) {
					if (data) {
						data.links
							.filter(function (l) {
								return keep(l, tapped);
							})
							.map(function (l) {
								return { l: l, k: hash(seed + ' ' + l.id) };
							})
							.sort(function (a, b) {
								return a.k - b.k;
							})
							.forEach(function (x) {
								if (had[x.l.id] || had[x.l.href]) return;
								had[x.l.id] = had[x.l.href] = true;
								out.push(x.l);
							});
						var t = data.teams || {};
						for (var k in t) if (!teams[k]) teams[k] = t[k];
					}
					next(i + 1);
				});
			};
			next(0);
		};

		var style = document.createElement('style');
		style.textContent = '#dhv-back-bar::-webkit-scrollbar{display:none}';
		(document.head || document.documentElement).appendChild(style);
		bar.addEventListener('scroll', fade, { passive: true });
		window.addEventListener('resize', fitSoon);
		if (narrowQuery && narrowQuery.addEventListener) narrowQuery.addEventListener('change', function () {
			paint();
			fit();
		});
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSoon);
		if (window.MutationObserver) {
			new MutationObserver(draw).observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-dh-subject', 'data-dh-team'],
			});
		}
		draw();
	}
})();
