/**
 * Data layer shared by the public site and the admin panel.
 *
 * Live mode: the Vercel functions under /api have storage (Upstash Redis, or STORE_FILE locally).
 * Demo mode: no storage is connected (or there is no server, e.g. a static preview). Everything runs on
 *            the bundled demo data and is saved in this browser's localStorage, so the admin panel and
 *            the site stay in sync on this device.
 */
import demo from '../data/demo.json';

const DEMO_KEY = 'whalford-demo-v1';
export const DEMO_PASSWORD = 'demo';
const clone = (v) => JSON.parse(JSON.stringify(v));
const uid = (p) => `${p}-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`;

/** Resolves bundled image paths against the deploy base; leaves URLs, data URIs and API media alone. */
export function asset(path) {
  if (!path) return '';
  if (/^(data:|https?:|blob:)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

export function slugify(v) {
  return String(v || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'post';
}

export function publicView(state) {
  return {
    settings: state.settings || {},
    posts: (state.posts || []).filter((p) => p.status === 'published').sort((a, b) => b.date.localeCompare(a.date)),
    reviews: (state.reviews || []).filter((r) => r.visible),
  };
}

/* ---------------- mode detection ---------------- */
let probe;
export function detect() {
  probe ||= fetch('api/content', { cache: 'no-store', headers: { Accept: 'application/json' } })
    .then(async (r) => {
      const type = r.headers.get('content-type') || '';
      if (!r.ok || !type.includes('json')) return { mode: 'demo' };
      const j = await r.json();
      return j.mode === 'live' ? j : { mode: 'demo' };
    })
    .catch(() => ({ mode: 'demo' }));
  return probe;
}

/* ---------------- demo store (localStorage) ---------------- */
export function loadDemo() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return clone(demo);
}
function saveDemo(state) {
  state.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(state));
  } catch {
    throw new Error('This browser has no room left for demo changes. Use smaller images or reset the demo data.');
  }
  return state;
}
function editDemo(fn) {
  const s = loadDemo();
  const out = fn(s);
  saveDemo(s);
  return clone(out === undefined ? s : out);
}

/* ---------------- public site ---------------- */
export async function loadSiteData() {
  const d = await detect();
  if (d.mode === 'live') return { mode: 'live', settings: d.settings, posts: d.posts, reviews: d.reviews };
  return { mode: 'demo', ...publicView(loadDemo()) };
}

async function postJSON(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Could not send. Please try again.');
  return j;
}

export async function submitContact(form) {
  const d = await detect();
  if (d.mode === 'live') { await postJSON('api/contact', form); return { ok: true, mode: 'live' }; }
  editDemo((s) => {
    s.messages.unshift({
      id: uid('m'), demo: false, read: false, date: new Date().toISOString(),
      firstName: form.firstName || '', lastName: form.lastName || '', email: form.email || '', phone: form.phone || '', message: form.message || '',
    });
  });
  return { ok: true, mode: 'demo' };
}

export async function subscribe(email) {
  const d = await detect();
  const e = String(email || '').trim().toLowerCase();
  if (d.mode === 'live') { const j = await postJSON('api/subscribe', { email: e }); return { ok: true, already: j.already, mode: 'live' }; }
  let already = false;
  editDemo((s) => {
    if (s.subscribers.some((x) => x.email === e)) { already = true; return; }
    s.subscribers.unshift({ id: uid('s'), email: e, date: new Date().toISOString(), demo: false });
  });
  return { ok: true, already, mode: 'demo' };
}

/* ---------------- images ---------------- */
/** Downscales an image file in the browser and returns a WebP (or JPEG) data URL. */
export function compressImage(file, maxSide = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { reject(new Error('Choose a JPG, PNG, WebP or GIF image.')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let out = c.toDataURL('image/webp', quality);
      if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', quality);
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')); };
    img.src = url;
  });
}

/* ---------------- admin API (same calls in both modes) ---------------- */
async function adminCall(action, body) {
  const r = await fetch(`api/admin?action=${action}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-Requested-With': 'admin' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'Request failed.'), { status: r.status });
  return j;
}

const demoAuthKey = 'whalford-demo-auth';
function cleanPostClient(p, s) {
  const words = String(p.body || '').split(/\s+/).filter(Boolean).length;
  let slug = slugify(p.slug || p.title), n = 2;
  const base = slug;
  while (s.posts.some((x) => x.slug === slug && x.id !== p.id)) slug = `${base}-${n++}`;
  return {
    id: p.id || uid('p'), slug, title: String(p.title || 'Untitled post').slice(0, 160), category: p.category || 'News',
    date: /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : new Date().toISOString().slice(0, 10),
    status: p.status === 'published' ? 'published' : 'draft', featured: Boolean(p.featured), demo: false,
    cover: p.cover || '', excerpt: String(p.excerpt || '').slice(0, 400), body: String(p.body || ''),
    readMinutes: Math.max(1, Math.round(words / 220)),
  };
}

export const admin = {
  /** { mode, configured, authed } */
  async session() {
    const d = await detect();
    if (d.mode === 'demo') {
      let authed = false;
      try { authed = sessionStorage.getItem(demoAuthKey) === '1'; } catch {}
      return { mode: 'demo', configured: true, authed };
    }
    return adminCall('session');
  },
  async login(password) {
    const d = await detect();
    if (d.mode === 'demo') {
      if (password !== DEMO_PASSWORD) throw new Error(`In demo mode the password is "${DEMO_PASSWORD}".`);
      try { sessionStorage.setItem(demoAuthKey, '1'); } catch {}
      return { ok: true };
    }
    return adminCall('login', { password });
  },
  async logout() {
    const d = await detect();
    if (d.mode === 'demo') { try { sessionStorage.removeItem(demoAuthKey); } catch {} return { ok: true }; }
    return adminCall('logout', {});
  },
  async getState() {
    const d = await detect();
    return d.mode === 'demo' ? loadDemo() : adminCall('state');
  },
  async savePost(post) {
    const d = await detect();
    if (d.mode === 'live') return (await adminCall('savePost', { post })).post;
    return editDemo((s) => {
      const next = cleanPostClient(post, s);
      const i = s.posts.findIndex((x) => x.id === next.id);
      if (i >= 0) s.posts[i] = next; else s.posts.unshift(next);
      if (next.featured) s.posts.forEach((p) => { if (p.id !== next.id) p.featured = false; });
      return next;
    });
  },
  async deletePost(id) {
    const d = await detect();
    if (d.mode === 'live') return adminCall('deletePost', { id });
    editDemo((s) => { s.posts = s.posts.filter((p) => p.id !== id); });
  },
  async saveReview(review) {
    const d = await detect();
    if (d.mode === 'live') return (await adminCall('saveReview', { review })).review;
    return editDemo((s) => {
      const next = {
        id: review.id || uid('r'), title: String(review.title || '').slice(0, 160), name: String(review.name || '').slice(0, 80),
        rating: Math.min(5, Math.max(1, Math.round(Number(review.rating) || 5))), visible: review.visible !== false, text: String(review.text || '').slice(0, 2000),
      };
      const i = s.reviews.findIndex((x) => x.id === next.id);
      if (i >= 0) s.reviews[i] = next; else s.reviews.push(next);
      return next;
    });
  },
  async deleteReview(id) {
    const d = await detect();
    if (d.mode === 'live') return adminCall('deleteReview', { id });
    editDemo((s) => { s.reviews = s.reviews.filter((r) => r.id !== id); });
  },
  async reorderReviews(ids) {
    const d = await detect();
    if (d.mode === 'live') return adminCall('reorderReviews', { ids });
    editDemo((s) => { const o = new Map(ids.map((id, i) => [id, i])); s.reviews.sort((a, b) => (o.get(a.id) ?? 1e9) - (o.get(b.id) ?? 1e9)); });
  },
  async setMessageRead(id, read) {
    const d = await detect();
    if (d.mode === 'live') return adminCall('setMessageRead', { id, read });
    editDemo((s) => { const m = s.messages.find((x) => x.id === id); if (m) m.read = read; });
  },
  async deleteMessage(id) {
    const d = await detect();
    if (d.mode === 'live') return adminCall('deleteMessage', { id });
    editDemo((s) => { s.messages = s.messages.filter((m) => m.id !== id); });
  },
  async deleteSubscriber(id) {
    const d = await detect();
    if (d.mode === 'live') return adminCall('deleteSubscriber', { id });
    editDemo((s) => { s.subscribers = s.subscribers.filter((m) => m.id !== id); });
  },
  async saveSettings(settings) {
    const d = await detect();
    if (d.mode === 'live') return (await adminCall('saveSettings', { settings })).settings;
    return editDemo((s) => (s.settings = { ...s.settings, ...settings }));
  },
  /** Compresses the file, then stores it (server media in live mode, data URL in demo mode). Returns a URL. */
  async uploadImage(file) {
    const d = await detect();
    const dataUrl = await compressImage(file, d.mode === 'live' ? 1600 : 1200, d.mode === 'live' ? 0.82 : 0.72);
    if (d.mode === 'live') return (await adminCall('upload', { dataUrl })).url;
    return dataUrl;
  },
  async reset() {
    const d = await detect();
    if (d.mode === 'live') return adminCall('reset', {});
    try { localStorage.removeItem(DEMO_KEY); } catch {}
    return loadDemo();
  },
};
