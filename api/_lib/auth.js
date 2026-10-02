// Stateless admin session: an HMAC-signed token in an httpOnly cookie.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getCookie } from './http.js';

const COOKIE = 'wh_admin';
const DAYS = 7;

const secret = () => process.env.SESSION_SECRET || `${process.env.ADMIN_PASSWORD || ''}::whalford-session`;
const sign = (payload) => createHmac('sha256', secret()).update(payload).digest('base64url');

export function adminConfigured() { return Boolean(process.env.ADMIN_PASSWORD); }

export function checkPassword(input) {
  const expected = Buffer.from(String(process.env.ADMIN_PASSWORD || ''));
  const given = Buffer.from(String(input || ''));
  if (!expected.length || expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export function sessionCookie(req) {
  const exp = Date.now() + DAYS * 864e5;
  const payload = `admin.${exp}`;
  const token = `${payload}.${sign(payload)}`;
  const secure = String(req.headers['x-forwarded-proto'] || '').includes('https') || process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${DAYS * 86400}${secure}`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;

export function isAdmin(req) {
  const token = getCookie(req, COOKIE);
  if (!token || !adminConfigured()) return false;
  const i = token.lastIndexOf('.');
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const good = sign(payload);
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return false;
  const exp = Number(payload.split('.')[1]);
  return Number.isFinite(exp) && exp > Date.now();
}
