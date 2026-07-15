const escapeHtml = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

/** Escape HTML, then render *single-asterisk* spans as <em> (for set:html). */
export function emphasize(text: string): string {
	return escapeHtml(text).replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/** Strip the emphasis markers for plain-text contexts like meta descriptions. */
export function plainBlurb(text: string): string {
	return text.replace(/\*([^*]+)\*/g, '$1');
}
