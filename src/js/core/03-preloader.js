/**
 * Preloader: draws the bloom mark, rolls a counter to 100 while the page loads,
 * then lifts five columns to reveal the page. Site.reveal() fires as the columns start
 * moving, so the hero intro overlaps the curtain.
 */
const Site = window.Site;
const { gsap } = window;
const { qs, qsa, pad } = Site.utils;
const html = document.documentElement;

const loaded = new Promise((resolve) => {
  if (document.readyState === 'complete') resolve();
  else window.addEventListener('load', resolve, { once: true });
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function makeCounter(root) {
  const slots = qsa('.preloader__digit', root);
  let current = '000';
  return (n) => {
    const next = pad(Math.round(n), 3);
    slots.forEach((slot, i) => {
      if (next[i] === current[i]) return;
      const old = slot.lastElementChild;
      const span = document.createElement('span');
      span.textContent = next[i];
      slot.appendChild(span);
      gsap.fromTo(span, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'orchid' });
      if (old) gsap.to(old, { yPercent: -100, duration: 0.55, ease: 'orchid', onComplete: () => old.remove() });
    });
    current = next;
  };
}

Site.preloader = {
  async play() {
    const root = qs('[data-preloader]');
    if (!root || Site.flags.skipPreload || Site.flags.reduced) {
      if (root) root.style.display = 'none';
      Site.reveal();
      return;
    }

    const setCount = makeCounter(root);
    const bar = qs('.preloader__bar span', root);
    const petals = qsa('.preloader__petal', root);
    const core = qs('.preloader__core', root);
    const steps = [0, 9, 23, 37, 54, 68, 79, 91];

    const intro = gsap.timeline();
    intro
      .from(qsa('.preloader__top .preloader__mask > *', root), { yPercent: 110, duration: 0.9, stagger: 0.08, ease: 'orchidOut' })
      .from(qsa('.preloader__tag .preloader__mask > *', root), { yPercent: 110, duration: 1, stagger: 0.08, ease: 'orchidOut' }, 0.1)
      .from(qsa('.preloader__digit', root), { yPercent: 100, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'orchidOut' }, 0.15)
      .fromTo(petals, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 1.6, stagger: 0.12, ease: 'orchid' }, 0.1)
      .from(core, { scale: 0, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(3)' }, 0.9)
      .to(petals, { attr: { 'fill-opacity': 1 }, duration: 0.9, stagger: 0.06, ease: 'soft' }, 1.25)
      .to(qs('.preloader__petals', root), { rotate: 36, duration: 2.6, ease: 'soft' }, 0.1);
    steps.forEach((n, i) => {
      intro.call(() => setCount(n), null, 0.2 + i * 0.24);
      intro.to(bar, { scaleX: n / 100, duration: 0.35, ease: 'soft' }, 0.2 + i * 0.24);
    });

    await Promise.all([intro.then ? intro : wait(2200), Promise.race([loaded, wait(3500)])]);
    setCount(100);
    await gsap.to(bar, { scaleX: 1, duration: 0.45, ease: 'soft' });

    await new Promise((resolve) => {
      gsap.timeline({ onComplete: resolve })
        .to(qsa('.preloader__mask > *, .preloader__digit > span', root), { yPercent: -110, duration: 0.8, stagger: 0.025, ease: 'orchid' }, 0.15)
        .to(qs('.preloader__bar', root), { scaleX: 0, transformOrigin: '100% 50%', duration: 0.7, ease: 'orchid' }, 0.1)
        .to(qs('.preloader__mark', root), { scale: 0.4, rotate: 120, opacity: 0, duration: 1, ease: 'orchid' }, 0.1)
        .to(qs('.preloader__glow', root), { opacity: 0, duration: 0.8 }, 0.2)
        .add(() => Site.reveal(), 0.75)
        .to(qsa('.preloader__col', root), { yPercent: -101, duration: 1.15, stagger: { each: 0.07, from: 'center' }, ease: 'orchid' }, 0.6)
        .set(root, { display: 'none' });
    });
  },
};
