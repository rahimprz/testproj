/**
 * Storage for the whole site state (settings, posts, reviews, messages, subscribers) plus uploaded images.
 *
 * Drivers, picked from environment variables:
 *   redis  KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *          (Vercel Marketplace -> Upstash for Redis sets these automatically)
 *   file   STORE_FILE=./.data/store.json  (local development or a single-server host)
 *   none   no persistent storage: the site runs in demo mode in the browser
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import demo from '../../src/data/demo.json' with { type: 'json' };

const PREFIX = process.env.STORE_PREFIX || 'whalford';
const KEY = `${PREFIX}:state`;
const clone = (v) => JSON.parse(JSON.stringify(v));

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

export function driverName() {
  if (redisConfig()) return 'redis';
  if (process.env.STORE_FILE) return 'file';
  return 'none';
}

async function redis(cmd) {
  const { url, token } = redisConfig();
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || json.error) throw new Error(`Redis error: ${json.error || r.status}`);
  return json.result;
}

// ---- file driver (keeps everything, media included, in one JSON file) ----
let fileCache = null;
async function fileLoad() {
  if (fileCache) return fileCache;
  try { fileCache = JSON.parse(await readFile(process.env.STORE_FILE, 'utf8')); } catch { fileCache = { kv: {}, counters: {} }; }
  return fileCache;
}
async function fileSave() {
  await mkdir(dirname(process.env.STORE_FILE), { recursive: true });
  await writeFile(process.env.STORE_FILE, JSON.stringify(fileCache));
}

async function kvGet(key) {
  const d = driverName();
  if (d === 'redis') return redis(['GET', key]);
  if (d === 'file') return (await fileLoad()).kv[key] ?? null;
  return null;
}
async function kvSet(key, value) {
  const d = driverName();
  if (d === 'redis') return redis(['SET', key, value]);
  if (d === 'file') { (await fileLoad()).kv[key] = value; return fileSave(); }
  throw Object.assign(new Error('No storage configured'), { status: 503 });
}
async function kvDel(key) {
  const d = driverName();
  if (d === 'redis') return redis(['DEL', key]);
  if (d === 'file') { delete (await fileLoad()).kv[key]; return fileSave(); }
}

/** First read seeds the store with the demo content so the admin panel starts with examples. */
export async function getState() {
  const raw = await kvGet(KEY);
  if (raw) return JSON.parse(raw);
  const seeded = clone(demo);
  if (driverName() !== 'none') await kvSet(KEY, JSON.stringify(seeded));
  return seeded;
}

export async function saveState(state) {
  state.updatedAt = new Date().toISOString();
  await kvSet(KEY, JSON.stringify(state));
  return state;
}

/** Read-modify-write helper. */
export async function updateState(fn) {
  const state = await getState();
  const result = await fn(state);
  await saveState(state);
  return result;
}

export async function resetState() {
  const seeded = clone(demo);
  await saveState(seeded);
  return seeded;
}

// ---- media (uploaded images, stored separately so the state stays small) ----
export const mediaKey = (id) => `${PREFIX}:media:${id}`;
export async function putMedia(id, contentType, base64) { await kvSet(mediaKey(id), JSON.stringify({ contentType, base64 })); }
export async function getMedia(id) { const raw = await kvGet(mediaKey(id)); return raw ? JSON.parse(raw) : null; }
export async function deleteMedia(id) { await kvDel(mediaKey(id)); }

// ---- fixed-window rate limit; fails open if storage is unavailable ----
export async function rateLimit(name, limit, windowSec) {
  const d = driverName();
  const key = `${PREFIX}:rl:${name}`;
  try {
    if (d === 'redis') {
      const n = await redis(['INCR', key]);
      if (n === 1) await redis(['EXPIRE', key, windowSec]);
      return n <= limit;
    }
    if (d === 'file') {
      const f = await fileLoad();
      const now = Date.now();
      const c = f.counters[key];
      if (!c || c.reset < now) f.counters[key] = { n: 1, reset: now + windowSec * 1000 };
      else c.n += 1;
      await fileSave();
      return f.counters[key].n <= limit;
    }
  } catch (e) { console.error(e); }
  return true;
}
