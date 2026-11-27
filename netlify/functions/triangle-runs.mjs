// Run logs from the Triangle game (public/triangle/), so its developer can play real runs back.
//   POST /api/triangle-runs  {v: 1, install, build, run, replay}  one finished run and its replay
// (the developer reads them back with triangle-runs-admin.mjs)
// Uploads go to the Netlify Blobs store "triangle-runs" under <build>/<day>/<install>/<replay>-<from>;
// "triangle-runs-counts" holds how many each install sent each day.
// Nothing about the sender is stored: no IP, no headers. `install` is a random id the game made.
// Abuse stays cheap: Netlify drops more than 10 posts a minute from one IP (that check is Netlify's,
// and we never see the IP), a body is at most 1 MB, an install gets 40 runs a day, and a
// retry of a run already stored writes nothing.
import { getStore } from '@netlify/blobs';

const MAX_BYTES = 1_000_000;
const PER_INSTALL_PER_DAY = 40;
const ENDS = ['died', 'won', 'left'];

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const isInt = (n) => Number.isInteger(n) && n >= 0;
const isObj = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);

// the reason an upload is refused, or null if it is fine
export function invalid(body) {
  if (!isObj(body) || body.v !== 1) return 'v must be 1';
  const { install, build, run, replay } = body;
  if (typeof install !== 'string' || !/^[a-f0-9]{16,64}$/.test(install)) return 'install';
  if (typeof build !== 'string' || !/^[\w.-]{1,40}$/.test(build)) return 'build';
  if (!isObj(run) || !isObj(replay)) return 'run and replay must be objects';
  if (typeof replay.id !== 'string' || !/^[a-z0-9]{1,16}$/.test(replay.id) || run.replay !== replay.id) return 'replay id';
  if (replay.v !== 1 || !Number.isFinite(replay.seed) || !Array.isArray(replay.unlocked) || !isInt(replay.class) || !isInt(replay.steps)) return 'replay header';
  if (!Array.isArray(replay.log) || !replay.log.every((e) => Array.isArray(e) && typeof e[0] === 'string' && isInt(e[1]))) return 'replay log';
  if (!isInt(run.from) || !isInt(run.to) || run.from > run.to || run.to > replay.steps) return 'run steps';
  if (!ENDS.includes(run.end) || typeof run.class !== 'string' || !Array.isArray(run.rooms)) return 'run fields';
  return null;
}

export async function handle(req, { store, counts, now = new Date() }) {
  if (req.method === 'POST') {
    if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES) return json(413, { error: 'too big' });
    const text = await req.text();
    if (Buffer.byteLength(text) > MAX_BYTES) return json(413, { error: 'too big' });
    let body;
    try { body = JSON.parse(text); } catch { return json(400, { error: 'not json' }); }
    const why = invalid(body);
    if (why) return json(400, { error: why });
    const { install, build, run, replay } = body;
    const day = now.toISOString().slice(0, 10), dir = `${build}/${day}/${install}/`;
    // (a count per install and day, not a list: it is not atomic, but only has to be about right)
    const countKey = `${day}/${install}`, count = (await counts.get(countKey, { type: 'json' })) ?? 0;
    if (count >= PER_INSTALL_PER_DAY) return json(429, { error: 'enough runs from this install today' });
    // only the steps this run needs: a replay plays from step 0 up to run.to
    const kept = { ...replay, log: replay.log.filter((e) => e[1] < run.to) };
    const res = await store.setJSON(`${dir}${replay.id}-${run.from}`, { install, build, received: now.toISOString(), run, replay: kept }, { onlyIfNew: true });
    if (res.modified) await counts.setJSON(countKey, count + 1);
    return json(res.modified ? 201 : 200, { ok: true });
  }
  return json(405, { error: 'POST a run' });
}

export default (req) => handle(req, { store: getStore('triangle-runs'), counts: getStore('triangle-runs-counts') });

export const config = {
  path: '/api/triangle-runs',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
