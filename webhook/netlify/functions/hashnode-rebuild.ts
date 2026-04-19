import crypto from 'node:crypto';
import type { Handler } from '@netlify/functions';

const MAX_AGE_SECONDS = 10 * 60;
const DEFAULT_REPO = 'DrewHoo/DrewHoo.github.io';
const DEFAULT_EVENT = 'hashnode-post-published';

export const handler: Handler = async (event) => {
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, body: 'method not allowed' };
	}

	const secret = process.env.HASHNODE_WEBHOOK_SECRET;
	const ghToken = process.env.GITHUB_DISPATCH_TOKEN;
	const repo = process.env.GITHUB_REPO ?? DEFAULT_REPO;
	const eventType = process.env.GITHUB_EVENT_TYPE ?? DEFAULT_EVENT;

	if (!secret || !ghToken) {
		return { statusCode: 500, body: 'webhook not configured' };
	}

	const sigHeader = event.headers['x-hashnode-signature'];
	const body = event.body ?? '';
	if (!sigHeader) return { statusCode: 401, body: 'missing signature' };

	// Hashnode sends: "t=<unix-seconds>,v1=<hex-hmac-sha256>"
	const parts = Object.fromEntries(
		sigHeader.split(',').map((s) => {
			const [k, ...rest] = s.trim().split('=');
			return [k, rest.join('=')];
		}),
	) as { t?: string; v1?: string };

	if (!parts.t || !parts.v1) return { statusCode: 401, body: 'malformed signature' };

	const age = Math.abs(Math.floor(Date.now() / 1000) - Number.parseInt(parts.t, 10));
	if (!Number.isFinite(age) || age > MAX_AGE_SECONDS) {
		return { statusCode: 401, body: 'stale or invalid timestamp' };
	}

	const signed = `${parts.t}.${body}`;
	const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
	const a = Buffer.from(expected, 'utf8');
	const b = Buffer.from(parts.v1, 'utf8');
	if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
		return { statusCode: 401, body: 'invalid signature' };
	}

	// Optional: include event metadata in the payload so the workflow can log it.
	let metadata: unknown = null;
	try {
		metadata = JSON.parse(body);
	} catch {
		/* body isn't JSON — fine */
	}

	const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${ghToken}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json',
			'User-Agent': 'hashnode-rebuild-trampoline',
		},
		body: JSON.stringify({
			event_type: eventType,
			client_payload: { source: 'hashnode', metadata },
		}),
	});

	if (!res.ok) {
		const text = await res.text();
		return { statusCode: 502, body: `GitHub dispatch failed: ${res.status} ${text}` };
	}

	return { statusCode: 202, body: 'queued' };
};
