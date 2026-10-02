// GET /api/content: public site data. mode "demo" tells the browser to use its local demo store instead.
import { handle, send } from './_lib/http.js';
import { driverName, getState } from './_lib/store.js';
import { publicView } from './_lib/validate.js';

export default handle(async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  if (driverName() === 'none') return send(res, 200, { mode: 'demo' });
  send(res, 200, { mode: 'live', ...publicView(await getState()) }, { 'Cache-Control': 's-maxage=15, stale-while-revalidate=60' });
});
