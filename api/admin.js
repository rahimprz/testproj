/**
 * /api/admin?action=...  Admin panel API.
 *   GET  session                          -> { mode, configured, authed }
 *   POST login { password } | logout
 *   GET  state                            -> full store
 *   POST savePost { post } | deletePost { id }
 *   POST saveReview { review } | deleteReview { id } | reorderReviews { ids }
 *   POST setMessageRead { id, read } | deleteMessage { id }
 *   POST deleteSubscriber { id } | saveSettings { settings } | reset
 *   POST upload { dataUrl }               -> { url }
 * Mutations require the session cookie and the X-Requested-With: admin header (blocks cross-site form posts).
 */
import { handle, send, readBody, query, clientIp, fail } from './_lib/http.js';
import { driverName, getState, updateState, resetState, putMedia, deleteMedia, rateLimit } from './_lib/store.js';
import { adminConfigured, checkPassword, sessionCookie, clearCookie, isAdmin } from './_lib/auth.js';
import { cleanPost, cleanReview, cleanSettings, newId, slugify } from './_lib/validate.js';
import { randomBytes } from 'node:crypto';

const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;

export default handle(async (req, res) => {
  const { action } = query(req);
  const mode = driverName() === 'none' ? 'demo' : 'live';

  if (action === 'session') return send(res, 200, { mode, configured: adminConfigured(), authed: mode === 'live' && isAdmin(req) });
  if (mode === 'demo') return send(res, 200, { mode });
  if (req.method !== 'POST' && action !== 'state') throw fail(405, 'Method not allowed');

  if (action === 'login') {
    if (!adminConfigured()) throw fail(503, 'Set the ADMIN_PASSWORD environment variable in Vercel first.');
    if (!(await rateLimit(`login:${clientIp(req)}`, 8, 900))) throw fail(429, 'Too many attempts. Try again in 15 minutes.');
    const { password } = await readBody(req, 4096);
    if (!checkPassword(password)) throw fail(401, 'That password is not correct.');
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req) });
  }
  if (action === 'logout') return send(res, 200, { ok: true }, { 'Set-Cookie': clearCookie() });

  if (!isAdmin(req)) throw fail(401, 'Please sign in again.');
  if (action === 'state') return send(res, 200, await getState());
  if (req.headers['x-requested-with'] !== 'admin') throw fail(403, 'Missing admin header.');

  const body = await readBody(req);
  switch (action) {
    case 'savePost': {
      const post = await updateState((s) => {
        const existing = s.posts.find((p) => p.id === body.post?.id);
        const next = cleanPost(body.post || {}, existing);
        let slug = next.slug, n = 2;
        while (s.posts.some((p) => p.slug === slug && p.id !== next.id)) slug = `${slugify(next.slug)}-${n++}`;
        next.slug = slug;
        if (existing) Object.assign(existing, next); else s.posts.unshift(next);
        if (next.featured) s.posts.forEach((p) => { if (p.id !== next.id) p.featured = false; });
        return next;
      });
      return send(res, 200, { post });
    }
    case 'deletePost':
      await updateState((s) => { s.posts = s.posts.filter((p) => p.id !== body.id); });
      return send(res, 200, { ok: true });
    case 'saveReview': {
      const review = await updateState((s) => {
        const existing = s.reviews.find((r) => r.id === body.review?.id);
        const next = cleanReview(body.review || {}, existing);
        if (existing) Object.assign(existing, next); else s.reviews.push(next);
        return next;
      });
      return send(res, 200, { review });
    }
    case 'deleteReview':
      await updateState((s) => { s.reviews = s.reviews.filter((r) => r.id !== body.id); });
      return send(res, 200, { ok: true });
    case 'reorderReviews':
      await updateState((s) => {
        const order = new Map((body.ids || []).map((id, i) => [id, i]));
        s.reviews.sort((a, b) => (order.get(a.id) ?? 1e9) - (order.get(b.id) ?? 1e9));
      });
      return send(res, 200, { ok: true });
    case 'setMessageRead':
      await updateState((s) => { const m = s.messages.find((x) => x.id === body.id); if (m) m.read = Boolean(body.read); });
      return send(res, 200, { ok: true });
    case 'deleteMessage':
      await updateState((s) => { s.messages = s.messages.filter((m) => m.id !== body.id); });
      return send(res, 200, { ok: true });
    case 'deleteSubscriber':
      await updateState((s) => { s.subscribers = s.subscribers.filter((m) => m.id !== body.id); });
      return send(res, 200, { ok: true });
    case 'saveSettings': {
      const settings = await updateState((s) => (s.settings = cleanSettings(body.settings || {}, s.settings)));
      return send(res, 200, { settings });
    }
    case 'reset':
      return send(res, 200, await resetState());
    case 'upload': {
      const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.dataUrl || ''));
      if (!m) throw fail(400, 'Upload a JPG, PNG, WebP or GIF image.');
      if (Buffer.byteLength(m[2], 'base64') > MAX_IMAGE_BYTES) throw fail(413, 'That image is too large. Keep it under 2.5 MB.');
      const id = `img-${randomBytes(6).toString('hex')}`;
      await putMedia(id, m[1], m[2]);
      return send(res, 200, { url: `api/media?id=${id}` });
    }
    case 'deleteMedia':
      if (/^img-[a-f0-9]{12}$/.test(String(body.id))) await deleteMedia(body.id);
      return send(res, 200, { ok: true });
    default:
      throw fail(404, 'Unknown action');
  }
});
