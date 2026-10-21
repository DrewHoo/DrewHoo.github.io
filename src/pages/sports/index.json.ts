// The sports manifest: every entry with `section: sports`, as JSON. The sports
// sites fetch it at build time (the template's prerender step) or at runtime
// (public/embed/sports-nav.js) to render "more sports from drewhoover.com"
// without each repo keeping its own hand-written list of the others.
import type { APIRoute } from 'astro';
import { getSportsSites, manifestRow } from '../../lib/sports';

export const GET: APIRoute = async () => {
	const sites = (await getSportsSites()).map(manifestRow);
	return new Response(JSON.stringify({ index: 'https://drewhoover.com/sports/', sites }, null, '\t'), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
