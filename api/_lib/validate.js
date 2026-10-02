// Normalises everything the admin panel and public forms send, so stored data always has a known shape.
import { randomBytes } from 'node:crypto';

export const newId = (p) => `${p}-${randomBytes(6).toString('hex')}`;
const str = (v, max) => String(v ?? '').replace(/\u0000/g, '').trim().slice(0, max);
const bool = (v) => v === true || v === 'true' || v === 1 || v === '1';
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '')) && String(v).length <= 254;

export function slugify(v) {
  return String(v || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'post';
}

// Links: http(s), mailto, in-page anchors, or site-relative paths only.
export function safeUrl(v, max = 600) {
  const s = str(v, max);
  if (!s) return '';
  if (/^(https?:\/\/|mailto:)/i.test(s) || s.startsWith('#') || /^[a-z0-9/_.-]+$/i.test(s)) return s;
  return '';
}

// Images: bundled paths, uploaded media, or https URLs.
export function safeImage(v) {
  const s = str(v, 600);
  if (!s) return '';
  if (/^(img|api\/media)[a-z0-9/_.?=&-]*$/i.test(s) || /^https:\/\//i.test(s)) return s;
  return '';
}

export function cleanPost(input, existing) {
  const title = str(input.title, 160) || 'Untitled post';
  const body = str(input.body, 60000);
  const words = body.split(/\s+/).filter(Boolean).length;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.date)) ? input.date : new Date().toISOString().slice(0, 10);
  return {
    id: existing?.id || newId('p'),
    slug: slugify(input.slug || title),
    title,
    category: str(input.category, 40) || 'News',
    date,
    status: input.status === 'published' ? 'published' : 'draft',
    featured: bool(input.featured),
    demo: false,
    cover: safeImage(input.cover),
    excerpt: str(input.excerpt, 400),
    body,
    readMinutes: Math.max(1, Math.round(words / 220)),
  };
}

export function cleanReview(input, existing) {
  const rating = Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5)));
  return {
    id: existing?.id || newId('r'),
    title: str(input.title, 160),
    name: str(input.name, 80),
    rating,
    visible: input.visible === undefined ? true : bool(input.visible),
    text: str(input.text, 2000),
  };
}

export function cleanSettings(input, current = {}) {
  return {
    amazonUrl: safeUrl(input.amazonUrl ?? current.amazonUrl),
    orderUrl: safeUrl(input.orderUrl ?? current.orderUrl),
    instagramUrl: safeUrl(input.instagramUrl ?? current.instagramUrl),
    facebookUrl: safeUrl(input.facebookUrl ?? current.facebookUrl),
    contactEmail: isEmail(input.contactEmail ?? current.contactEmail) ? str(input.contactEmail ?? current.contactEmail, 254) : '',
    announcement: str(input.announcement ?? current.announcement, 200),
  };
}

export function cleanMessage(input) {
  return {
    id: newId('m'),
    firstName: str(input.firstName, 80),
    lastName: str(input.lastName, 80),
    email: str(input.email, 254),
    phone: str(input.phone, 40),
    message: str(input.message, 2000),
    date: new Date().toISOString(),
    read: false,
    demo: false,
  };
}

/** What the public site may see: no drafts, no hidden reviews, no messages or subscribers. */
export function publicView(state) {
  return {
    settings: state.settings || {},
    posts: (state.posts || []).filter((p) => p.status === 'published').sort((a, b) => b.date.localeCompare(a.date)),
    reviews: (state.reviews || []).filter((r) => r.visible),
  };
}
