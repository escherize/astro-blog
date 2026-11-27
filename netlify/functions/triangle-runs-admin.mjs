// The developer's side of triangle-runs.mjs: list and download the uploaded Triangle runs.
//   GET /api/triangle-runs/admin              -> {keys}      every stored upload
//   GET /api/triangle-runs/admin?key=<key>    -> one upload  {install, build, received, run, replay}
// Both need `Authorization: Bearer $TRIANGLE_RUNS_TOKEN`; with that env var unset, everything is refused.
// The game repo's tools/fetch-runs.mjs calls this.
import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function authorized(req, token) {
  const got = Buffer.from(req.headers.get('authorization') ?? ''), want = Buffer.from(`Bearer ${token}`);
  return !!token && got.length === want.length && timingSafeEqual(got, want);
}

export async function handle(req, { store, token }) {
  if (req.method !== 'GET') return json(405, { error: 'GET only' });
  if (!authorized(req, token)) return json(401, { error: 'token' });
  const key = new URL(req.url).searchParams.get('key');
  if (key) {
    const v = await store.get(key, { type: 'json' });
    return v ? json(200, v) : json(404, { error: 'no such key' });
  }
  const keys = [];
  for await (const page of store.list({ paginate: true })) keys.push(...page.blobs.map((b) => b.key));
  return json(200, { keys });
}

export default (req) => handle(req, { store: getStore('triangle-runs'), token: process.env.TRIANGLE_RUNS_TOKEN });

// (a wrong token costs a guesser a minute per 300 tries; fetch-runs needs one call per run)
export const config = { path: '/api/triangle-runs/admin', rateLimit: { windowLimit: 300, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
