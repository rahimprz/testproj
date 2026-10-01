/**
 * Custom cursor for fine pointers.
 *   data-cursor-label="View"  -> large filled cursor with a label
 *   data-cursor-hide          -> hide the custom cursor over this element
 * Links and buttons get a soft hover state automatically.
 */
const Site = window.Site;
const { gsap } = window;
const { qs } = Site.utils;
const html = document.documentElement;

Site.cursor = {
  init() {
    if (Site.flags.touch || Site.flags.reduced) return;
    const root = qs('.cursor');
    if (!root) return;
    html.classList.add('has-cursor');
    const dot = qs('.cursor__dot', root);
    const ring = qs('.cursor__ring', root);
    const label = qs('.cursor__label', root);
    gsap.set([dot, ring], { x: -100, y: -100 });
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      root.classList.remove('is-hidden');
    }, { passive: true });
    document.addEventListener('pointerdown', () => root.classList.add('is-down'));
    document.addEventListener('pointerup', () => root.classList.remove('is-down'));
    document.documentElement.addEventListener('mouseleave', () => root.classList.add('is-hidden'));

    let lastLabel = '';
    document.addEventListener('pointerover', (e) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return;
      const hide = t.closest('[data-cursor-hide], input, textarea, select, iframe');
      const labelled = t.closest('[data-cursor-label]');
      const link = t.closest('a, button, [role="button"], label, summary, [data-cursor-link]');
      root.classList.toggle('is-hidden', !!hide);
      root.classList.toggle('is-label', !!labelled && !hide);
      root.classList.toggle('is-link', !!link && !labelled && !hide);
      const text = labelled ? labelled.getAttribute('data-cursor-label') : '';
      if (text !== lastLabel) { label.textContent = text; lastLabel = text; }
    });
  },
};
