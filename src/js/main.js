/**
 * Boot sequence:
 *   fonts ready -> smooth scroll (paused) -> chrome, cursor, nav -> every registered section in
 *   document order (data-attribute FX first, then the section's own init) -> refresh -> preloader
 *   -> unlock scroll.
 * Any failure falls back to a fully visible, natively scrolling page.
 */
const Site = window.Site;
const { gsap, ScrollTrigger } = window;
const html = document.documentElement;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function makeCtx(el) {
  return {
    el,
    gsap,
    ScrollTrigger,
    SplitText: window.SplitText,
    Flip: window.Flip,
    Draggable: window.Draggable,
    Observer: window.Observer,
    lenis: Site.lenis,
    reduced: Site.flags.reduced,
    touch: Site.flags.touch,
    desktop: Site.flags.desktop,
    mm: gsap.matchMedia(),
    onReveal: Site.onReveal,
    q: (s) => el.querySelector(s),
    qa: (s) => Array.from(el.querySelectorAll(s)),
    utils: Site.utils,
  };
}

function failsafe(err) {
  if (err) console.error('[boot]', err);
  html.classList.add('is-booted');
  html.classList.remove('is-loading');
  const p = document.querySelector('[data-preloader]');
  if (p) p.style.display = 'none';
  if (Site.lenis) Site.lenis.start();
  if (Site.reveal) Site.reveal();
}

async function boot() {
  html.classList.add('is-booted');
  if (!location.hash) window.scrollTo(0, 0);
  await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);

  const lenis = Site.initSmooth();
  if (lenis) lenis.stop();

  for (const part of ['chrome', 'cursor', 'nav']) {
    try { Site[part] && Site[part].init(); } catch (e) { console.error(`[${part}]`, e); }
  }

  const entries = Site.sections
    .map((s) => ({ ...s, el: document.querySelector(`[data-section="${s.name}"]`) }))
    .filter((s) => {
      if (!s.el) console.warn(`[section:${s.name}] no element with data-section="${s.name}"`);
      return !!s.el;
    })
    .sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  for (const s of entries) {
    try {
      Site.fx.init(s.el);
      s.init(makeCtx(s.el));
    } catch (e) {
      console.error(`[section:${s.name}]`, e);
    }
  }
  Site.fx.init(document);

  ScrollTrigger.sort();
  ScrollTrigger.refresh();

  await Site.preloader.play();
  if (lenis) lenis.start();
  if (location.hash && document.querySelector(location.hash)) Site.scrollTo(location.hash, { immediate: true });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  Site.booted = true;
  document.dispatchEvent(new CustomEvent('site:ready'));
}

const start = () => boot().catch(failsafe);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
