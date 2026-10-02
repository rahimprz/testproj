/**
 * GSAP + Lenis setup. Registers every plugin, the house eases, and smooth scrolling.
 *   Eases: 'orchid' (expo-ish in-out), 'orchidOut' (fast out, long settle), 'soft'.
 */
const Site = window.Site;
const { gsap } = window;
if (!gsap) throw new Error('GSAP failed to load');

const pluginNames = [
  'ScrollTrigger', 'SplitText', 'CustomEase', 'Flip', 'DrawSVGPlugin', 'MorphSVGPlugin', 'MotionPathPlugin',
  'Observer', 'ScrambleTextPlugin', 'Draggable', 'InertiaPlugin',
];
gsap.registerPlugin(...pluginNames.map((n) => window[n]).filter(Boolean));

window.CustomEase.create('orchid', '0.76,0,0.24,1');
window.CustomEase.create('orchidOut', '0.16,1,0.3,1');
window.CustomEase.create('soft', '0.45,0,0.15,1');
gsap.defaults({ ease: 'orchidOut', duration: 1.1 });
window.ScrollTrigger.config({ ignoreMobileResize: true });

/* ---------- Smooth scroll ---------- */
Site.lenis = null;
Site.initSmooth = () => {
  if (Site.flags.reduced || !window.Lenis) return null;
  const lenis = new window.Lenis({
    lerp: 0.09,
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.4,
    autoRaf: false,
  });
  lenis.on('scroll', window.ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  Site.lenis = lenis;
  return lenis;
};

Site.scrollY = () => (Site.lenis ? Site.lenis.scroll : window.scrollY);

Site.scrollTo = (target, opts = {}) => {
  if (Site.lenis) {
    Site.lenis.scrollTo(target, { duration: 1.6, easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)), ...opts });
    return;
  }
  let top = 0;
  if (typeof target === 'number') top = target;
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    top = el.getBoundingClientRect().top + window.scrollY + (opts.offset || 0);
  }
  window.scrollTo({ top, behavior: Site.flags.reduced || opts.immediate ? 'auto' : 'smooth' });
};

Site.lockScroll = (locked) => {
  document.documentElement.classList.toggle('is-locked', locked);
  if (Site.lenis) locked ? Site.lenis.stop() : Site.lenis.start();
};

/* ---------- Smoothed scroll velocity (px/s), for skew / marquee effects ---------- */
Site.velocity = 0;
let lastY = 0;
let lastT = performance.now();
gsap.ticker.add(() => {
  const now = performance.now();
  const y = Site.scrollY();
  const dt = Math.max(8, now - lastT);
  const v = ((y - lastY) / dt) * 1000;
  lastY = y;
  lastT = now;
  Site.velocity += (v - Site.velocity) * 0.12;
  if (Math.abs(Site.velocity) < 0.5) Site.velocity = 0;
});
