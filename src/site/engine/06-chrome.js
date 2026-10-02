/**
 * Page chrome: scroll progress bar and smooth in-page anchor navigation.
 *   Site.goTo('#work') scrolls to a section and moves focus there for keyboard/screen-reader users.
 */
const Site = window.Site;
const { gsap } = window;
const { qs } = Site.utils;

Site.goTo = (href) => {
  if (!href || href === '#') return;
  if (href === '#top') {
    Site.scrollTo(0);
    return;
  }
  const target = qs(href);
  if (!target) return;
  Site.scrollTo(target, { offset: 0 });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  setTimeout(() => target.focus({ preventScroll: true }), Site.lenis ? 900 : 0);
  if (history.replaceState) history.replaceState(null, '', href);
};

Site.chrome = {
  init() {
    const bar = qs('.scroll-progress__bar');
    if (bar) {
      gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
    }
    document.addEventListener('click', (e) => {
      const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const href = a.getAttribute('href');
      if (href === '#' ) { e.preventDefault(); return; }
      if (href === '#top' || qs(href)) {
        e.preventDefault();
        Site.goTo(href);
      }
    });
  },
};
