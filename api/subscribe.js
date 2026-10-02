// POST /api/subscribe: newsletter sign-up from the footer.
import { handle, send, readBody, clientIp, fail } from './_lib/http.js';
import { driverName, updateState, rateLimit } from './_lib/store.js';
import { isEmail, newId } from './_lib/validate.js';

export default handle(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (driverName() === 'none') return send(res, 200, { mode: 'demo' });
  const body = await readBody(req, 16 * 1024);
  if (body.website) return send(res, 200, { ok: true });
  const email = String(body.email || '').trim().toLowerCase();
  if (!isEmail(email)) throw fail(400, 'Please enter a valid email address.');
  if (!(await rateLimit(`sub:${clientIp(req)}`, 10, 600))) throw fail(429, 'Too many sign-ups. Please try again later.');
  const already = await updateState((s) => {
    s.subscribers = s.subscribers || [];
    if (s.subscribers.some((x) => x.email === email)) return true;
    s.subscribers.unshift({ id: newId('s'), email, date: new Date().toISOString(), demo: false });
    return false;
  });
  send(res, 200, { ok: true, already });
});
