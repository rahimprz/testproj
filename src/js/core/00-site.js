/**
 * Site namespace shared by every core and section script.
 * Each file in src/js is wrapped in its own IIFE by tools/build.mjs, so anything
 * meant to be shared must hang off window.Site.
 */
const Site = (window.Site = window.Site || {});
const html = document.documentElement;
const mq = (q) => window.matchMedia(q);

Site.bp = {
  desktop: '(min-width: 900px)',
  mobile: '(max-width: 899px)',
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  fine: '(hover: hover) and (pointer: fine)',
};

Site.flags = {
  reduced: mq(Site.bp.reduce).matches,
  touch: !mq(Site.bp.fine).matches,
  skipPreload: html.classList.contains('no-preload'),
  get desktop() { return mq(Site.bp.desktop).matches; },
};

/* ---------- Section registry ---------- */
Site.sections = [];
/**
 * Site.register('hero', (ctx) => { ... })
 * The callback runs once at boot, in document order, after the section's data-attribute FX.
 * ctx = { el, gsap, ScrollTrigger, SplitText, Flip, Draggable, Observer, lenis, reduced, touch,
 *         desktop, mm, onReveal, q, qa, utils }
 * The section root element must carry data-section="<name>".
 */
Site.register = (name, init) => { Site.sections.push({ name, init }); };

/* ---------- Reveal (fires when the preloader opens, or immediately when skipped) ---------- */
Site.revealed = false;
const revealQueue = [];
Site.onReveal = (fn) => { if (Site.revealed) fn(); else revealQueue.push(fn); };
Site.reveal = () => {
  if (Site.revealed) return;
  Site.revealed = true;
  html.classList.remove('is-loading');
  html.classList.add('is-revealed');
  revealQueue.splice(0).forEach((fn) => {
    try { fn(); } catch (e) { console.error('[reveal]', e); }
  });
};

/* ---------- Utils ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
Site.utils = {
  qs: (s, el = document) => el.querySelector(s),
  qsa: (s, el = document) => Array.from(el.querySelectorAll(s)),
  clamp,
  lerp: (a, b, t) => a + (b - a) * t,
  map: (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a)),
  num: (v, fallback = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; },
  debounce: (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
  pad: (n, len = 2) => String(n).padStart(len, '0'),
};
