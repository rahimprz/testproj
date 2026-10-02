// POST /api/contact: stores a message from the "Connect With the Author" form.
import { handle, send, readBody, clientIp, fail } from './_lib/http.js';
import { driverName, updateState, rateLimit } from './_lib/store.js';
import { cleanMessage, isEmail } from './_lib/validate.js';

export default handle(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (driverName() === 'none') return send(res, 200, { mode: 'demo' });
  const body = await readBody(req, 64 * 1024);
  if (body.website) return send(res, 200, { ok: true }); // honeypot: silently accept bots
  const msg = cleanMessage(body);
  if (!msg.firstName || !msg.message) throw fail(400, 'Please add your first name and a message.');
  if (!isEmail(msg.email)) throw fail(400, 'Please enter a valid email address.');
  if (!(await rateLimit(`contact:${clientIp(req)}`, 5, 600))) throw fail(429, 'Too many messages. Please try again in a few minutes.');
  await updateState((s) => { s.messages = [msg, ...(s.messages || [])].slice(0, 2000); });
  send(res, 200, { ok: true });
});
