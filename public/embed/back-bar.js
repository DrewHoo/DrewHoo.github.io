/*
  drewhoover.com back-bar
  -----------------------
  Drop-in script for sibling project sites. Adds a sticky top strip with
  "← drewhoover.com" so visitors always have a way home.

  Usage (in any project site's <head> or end of <body>):
    <script src="https://drewhoover.com/embed/back-bar.js" async></script>

  Opt out on a page:
    <html data-dhv-back-bar="off">  — or —  <body data-dhv-back-bar="off">
*/
(function () {
	if (typeof document === 'undefined') return;

	var optOut =
		document.documentElement.getAttribute('data-dhv-back-bar') === 'off' ||
		(document.body && document.body.getAttribute('data-dhv-back-bar') === 'off');
	if (optOut) return;

	// Already injected? (e.g. script included twice)
	if (document.getElementById('dhv-back-bar')) return;

	var bar = document.createElement('div');
	bar.id = 'dhv-back-bar';
	bar.setAttribute('role', 'navigation');
	bar.setAttribute('aria-label', 'back to drewhoover.com');
	bar.style.cssText = [
		'position:sticky',
		'top:0',
		'left:0',
		'right:0',
		'z-index:2147483000',
		'width:100%',
		'margin:0',
		'padding:6px 14px',
		'background:#f2ead3',
		'color:#141210',
		'border-bottom:2px solid #1b1814',
		"font-family:'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
		'font-size:13px',
		'line-height:1.4',
		'text-align:left',
		'box-sizing:border-box',
	].join(';');

	var link = document.createElement('a');
	link.href = 'https://drewhoover.com/';
	link.textContent = '← drewhoover.com';
	link.style.cssText = [
		'color:#141210',
		'text-decoration:underline',
		'text-decoration-thickness:2px',
		'text-decoration-color:#ff4a1c',
		'text-underline-offset:3px',
		'font-weight:700',
	].join(';');

	bar.appendChild(link);

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
