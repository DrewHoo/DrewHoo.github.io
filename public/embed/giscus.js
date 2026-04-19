/*
  drewhoover.com giscus comments
  ------------------------------
  Drop-in script for sibling project sites. Mounts a GitHub Discussions-
  powered comment thread, keyed by page pathname, so each project (and
  each page within a project) gets its own thread automatically.

  All comments land in DrewHoo/DrewHoo.github.io Discussions, category
  "Comments". One moderation queue for every sibling site.

  Usage (in any project site's HTML head or end of <body>):
    <script src="https://drewhoover.com/embed/giscus.js" async></script>

  Placement: if the page has <div id="comments">, the widget mounts there.
  Otherwise it is appended to the bottom of <body>.

  Opt out on a page:
    <html data-dhv-giscus="off">  — or —  <body data-dhv-giscus="off">
*/
(function () {
	if (typeof document === 'undefined') return;

	var optOut =
		document.documentElement.getAttribute('data-dhv-giscus') === 'off' ||
		(document.body && document.body.getAttribute('data-dhv-giscus') === 'off');
	if (optOut) return;

	if (document.getElementById('dhv-giscus')) return;

	var container = document.createElement('div');
	container.id = 'dhv-giscus';
	container.style.cssText = [
		'margin:2rem auto',
		'max-width:860px',
		'padding:0 1rem',
		'box-sizing:border-box',
	].join(';');

	var s = document.createElement('script');
	s.src = 'https://giscus.app/client.js';
	s.async = true;
	s.crossOrigin = 'anonymous';
	var attrs = {
		'data-repo': 'DrewHoo/DrewHoo.github.io',
		'data-repo-id': 'R_kgDOSG5Iaw',
		'data-category': 'Comments',
		'data-category-id': 'DIC_kwDOSG5Ia84C7OFV',
		'data-mapping': 'pathname',
		'data-strict': '0',
		'data-reactions-enabled': '1',
		'data-emit-metadata': '0',
		'data-input-position': 'bottom',
		'data-theme': 'preferred_color_scheme',
		'data-lang': 'en',
	};
	for (var k in attrs) s.setAttribute(k, attrs[k]);
	container.appendChild(s);

	var insert = function () {
		if (!document.body) return;
		var slot = document.getElementById('comments');
		if (slot) {
			slot.appendChild(container);
		} else {
			document.body.appendChild(container);
		}
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', insert);
	} else {
		insert();
	}
})();
