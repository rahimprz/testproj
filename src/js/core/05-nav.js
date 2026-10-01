/**
 * Navigation: hide on scroll down / show on scroll up, theme that follows the section under it,
 * active link tracking, local time, and the fullscreen mobile menu.
 * Any element with data-theme="dark|light|orchid" drives the nav colour while it is under the bar.
 */
const Site = window.Site;
const { gsap, ScrollTrigger } = window;
const { qs, qsa, pad } = Site.utils;
const html = document.documentElement;

function themeTracking() {
  const sections = qsa('[data-theme]').filter((el) => !el.closest('[data-nav], [data-menu], [data-preloader]'));
  html.dataset.navTheme = 'dark';
  const probe = () => (parseFloat(getComputedStyle(html).getPropertyValue('--nav-h')) || 76) / 2;
  sections.forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: () => `top top+=${probe()}`,
      end: () => `bottom top+=${probe()}`,
      onToggle: (self) => { if (self.isActive) html.dataset.navTheme = el.dataset.theme; },
    });
  });
}

function hideOnScroll(nav) {
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      if (html.classList.contains('menu-open')) return;
      if (y < 160) nav.classList.remove('is-hidden');
      else if (self.direction === 1 && Math.abs(self.getVelocity()) > 40) nav.classList.add('is-hidden');
      else if (self.direction === -1) nav.classList.remove('is-hidden');
    },
  });
}

function activeLinks(nav) {
  const links = qsa('[data-nav-link]', nav);
  links.forEach((a) => {
    const target = qs(a.getAttribute('href'));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        a.classList.toggle('is-active', self.isActive);
        if (self.isActive) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      },
    });
  });
}

function localTime() {
  const els = qsa('[data-local-time]');
  if (!els.length) return;
  const tick = () => {
    els.forEach((el) => {
      const tz = el.dataset.tz;
      try {
        el.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz || undefined }).format(new Date());
      } catch {
        const d = new Date();
        el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    });
  };
  tick();
  setInterval(tick, 15000);
}

function menu() {
  const toggle = qs('[data-menu-toggle]');
  const panel = qs('[data-menu]');
  if (!toggle || !panel) return;
  const label = qs('[data-menu-label]', toggle);
  const links = qsa('.menu__link', panel);
  const texts = qsa('.menu__text, .menu__index', panel);
  const foot = qsa('.menu__foot > *', panel);
  let open = false;
  let tl;

  const setOpen = (next, { focus = true } = {}) => {
    if (next === open) return;
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Close menu' : 'Open menu';
    html.classList.toggle('menu-open', open);
    Site.lockScroll(open);
    if (tl) tl.kill();
    if (open) {
      panel.hidden = false;
      const r = toggle.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
      tl = gsap.timeline();
      if (Site.flags.reduced) {
        tl.set(panel, { opacity: 1, clipPath: 'none' });
      } else {
        tl.fromTo(panel, { clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${radius}px at ${cx}px ${cy}px)`, duration: 0.9, ease: 'orchid' })
          .fromTo(texts, { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.05, ease: 'orchidOut' }, 0.3)
          .fromTo(links, { '--line': 0 }, { '--line': 1, duration: 1, stagger: 0.05 }, 0.3)
          .fromTo(foot, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.5);
      }
      if (focus) setTimeout(() => links[0] && links[0].focus({ preventScroll: true }), 50);
    } else {
      tl = gsap.timeline({ onComplete: () => { panel.hidden = true; } });
      if (Site.flags.reduced) tl.set(panel, {});
      else {
        const r = toggle.getBoundingClientRect();
        tl.to(texts, { yPercent: -110, duration: 0.5, stagger: 0.02, ease: 'orchid' })
          .to(panel, { clipPath: `circle(0px at ${r.left + r.width / 2}px ${r.top + r.height / 2}px)`, duration: 0.7, ease: 'orchid' }, 0.2);
      }
      if (focus) toggle.focus({ preventScroll: true });
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
  panel.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    const href = a.getAttribute('href');
    setOpen(false, { focus: false });
    setTimeout(() => Site.goTo(href), 450);
  });
  window.addEventListener('resize', () => { if (open && window.innerWidth >= 900) setOpen(false, { focus: false }); });
}

Site.nav = {
  init() {
    const nav = qs('[data-nav]');
    if (!nav) return;
    themeTracking();
    hideOnScroll(nav);
    activeLinks(nav);
    localTime();
    menu();
  },
};
