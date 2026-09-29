const escapeHtml = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

/** Escape HTML, then render *single-asterisk* spans as <em> and ~~tilde~~ spans as <s> (for set:html). */
export function emphasize(text: string): string {
	return escapeHtml(text)
		.replace(/~~([^~]+)~~/g, '<s>$1</s>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/** Strip the markers for plain-text contexts like meta descriptions; struck text drops out. */
export function plainBlurb(text: string): string {
	return text.replace(/~~[^~]+~~ ?/g, '').replace(/\*([^*]+)\*/g, '$1');
}
