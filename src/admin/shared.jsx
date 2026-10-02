import { formatDate } from '../lib/markdown.js';

export const COVERS = [
  { path: 'img/posts/book-plum.jpg', label: 'Book on plum' },
  { path: 'img/posts/author-desk.jpg', label: 'Author at desk' },
  { path: 'img/posts/prince-throne.jpg', label: 'Prince on throne' },
  { path: 'img/posts/trailer-heights.jpg', label: 'Trailer: the heights' },
  { path: 'img/posts/books-dusk.jpg', label: 'Books at dusk' },
  { path: 'img/brand/book.webp', label: 'Book cover' },
  { path: 'img/brand/books.webp', label: 'Two-book mockup' },
];

export function StatusPill({ status }) {
  const pub = status === 'published';
  return <span className={`pill ${pub ? 'pill--pub' : 'pill--draft'}`}>{pub ? 'Published' : 'Draft'}</span>;
}

export const fullName = (m) => [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email || 'Unknown sender';

/** "Today 3:42 PM", "Yesterday", "Sep 24", or with year when not this year. */
export function shortDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 864e5);
  if (diff === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diff === 1) return 'Yesterday';
  return formatDate(iso, d.getFullYear() === now.getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}

export function longDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const isHttpUrl = (v) => {
  if (!/^https?:\/\//i.test(v)) return false;
  try { const u = new URL(v); return Boolean(u.hostname && u.hostname.includes('.')); } catch { return false; }
};
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '')) && String(v).length <= 254;
