/*
  drewhoover.com back-bar
  -----------------------
  Drop-in script for sibling project sites. Adds a sticky top strip with
  "← drewhoover.com" so visitors always have a way home.

  Usage (in any project site's <head> or end of <body>):
    <script src="https://drewhoover.com/embed/back-bar.js" async></script>

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
  the event "back bar" with `to` ("home" or the section).
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
	var href = section ? ORIGIN + '/' + section + '/' : ORIGIN + '/';
	var label = section ? 'drewhoover.com/' + section : 'drewhoover.com';

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

	var paint = function () {
		var t = themes[theme()];
		bar.style.cssText = [
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
			'font-size:13px',
			'line-height:1.4',
			'text-align:left',
			'box-sizing:border-box',
		].join(';');
		link.style.cssText = [
			'color:' + t.ink,
			'text-decoration:underline',
			'text-decoration-thickness:2px',
			'text-decoration-color:' + t.hot,
			'text-underline-offset:3px',
			'font-weight:700',
		].join(';');
	};
	paint();
	if (media && !pinned) {
		if (media.addEventListener) media.addEventListener('change', paint);
		else if (media.addListener) media.addListener(paint);
	}

	link.addEventListener('click', function () {
		try {
			if (window.dhAnalytics) window.dhAnalytics.track('back bar', { to: section || 'home' });
		} catch (e) {}
	});

	var insert = function () {
		if (!document.body) return;
		// Prepend so it sticks to the top of the layout.
		document.body.insertBefore(bar, document.body.firstChild);
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', insert);
	} else {
		insert();
	}
})();
