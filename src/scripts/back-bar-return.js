// The index site's half of the back bar (public/embed/back-bar.js).
//
// A sibling site's back bar should return a visitor to the page they left,
// tab and all: a lookbook opened from /favorites/#lookbooks goes back there,
// a project opened from /projects/ goes back to /projects/. The referrer can't
// carry that, because browsers drop the #fragment from it. So on every click
// here, write where the visitor is, where they're going and when to
// localStorage. It's same-origin with every drewhoover.com/<slug>/ site, so
// the back bar there reads it. localStorage rather than sessionStorage: the
// project cards open in a new tab, and a noopener tab starts with empty
// sessionStorage.

const KEY = 'dhv-back-bar-return';

document.addEventListener(
	'click',
	(e) => {
		const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
		if (!a) return;
		try {
			localStorage.setItem(KEY, JSON.stringify({ from: location.href, to: a.href, at: Date.now() }));
		} catch {
			// storage blocked: the back bar falls back to the referrer
		}
	},
	{ capture: true },
);
