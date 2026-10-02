// GET /api/media?id=...: serves an image uploaded from the admin panel.
import { handle, send, query } from './_lib/http.js';
import { getMedia } from './_lib/store.js';

export default handle(async (req, res) => {
  const { id } = query(req);
  if (!/^img-[a-f0-9]{12}$/.test(String(id || ''))) return send(res, 400, { error: 'Bad id' });
  const m = await getMedia(id);
  if (!m) return send(res, 404, { error: 'Not found' });
  res.statusCode = 200;
  res.setHeader('Content-Type', m.contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(Buffer.from(m.base64, 'base64'));
});
