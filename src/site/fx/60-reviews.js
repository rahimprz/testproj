/**
 * Reviews carousel: drag or swipe with inertia (snaps to cards), arrow buttons, keyboard arrows,
 * and autoplay every 5 s that pauses on hover, focus, off-screen, and under reduced motion.
 */
Site.register('reviews', ({ el, gsap, ScrollTrigger, Draggable, q, qa, reduced }) => {
  const viewport = q('.reviews__viewport');
  const track = q('[data-reviews-track]');
  const cards = qa('[data-review]');
  const bar = q('[data-reviews-bar]');
  const counter = q('[data-reviews-current]');
  let index = 0;
  let positions = [];
  let maxX = 0;

  const measure = () => {
    const pad = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
    maxX = Math.max(0, track.scrollWidth - (viewport.clientWidth - pad * 2));
    positions = cards.map((c) => -Math.min(c.offsetLeft, maxX));
    positions = positions.filter((p, i) => i === 0 || p !== positions[i - 1]);
  };
  const update = () => {
    counter.textContent = String(index + 1).padStart(2, '0');
    gsap.to(bar, { scaleX: (index + 1) / positions.length, duration: 0.6, ease: 'orchidOut' });
  };
  const goTo = (i, instant) => {
    index = (i + positions.length) % positions.length;
    gsap.to(track, { x: positions[index], duration: instant || reduced ? 0 : 1.1, ease: 'orchid' });
    update();
  };
  measure();
  update();
  window.addEventListener('resize', Site.utils.debounce(() => { measure(); goTo(Math.min(index, positions.length - 1), true); }, 200));

  q('[data-reviews-prev]').addEventListener('click', () => { goTo(index - 1); restart(); });
  q('[data-reviews-next]').addEventListener('click', () => { goTo(index + 1); restart(); });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { goTo(index + 1); restart(); }
    if (e.key === 'ArrowLeft') { goTo(index - 1); restart(); }
  });

  if (Draggable) {
    Draggable.create(track, {
      type: 'x',
      bounds: { minX: -maxX, maxX: 0 },
      inertia: !!window.InertiaPlugin,
      edgeResistance: 0.85,
      snap: { x: (v) => gsap.utils.snap(positions, v) },
      onPress() { stop(); this.applyBounds({ minX: -maxX, maxX: 0 }); },
      onThrowComplete() { index = positions.indexOf(gsap.getProperty(track, 'x')); if (index < 0) index = 0; update(); restart(); },
      onDragEnd() { if (!this.tween) { index = positions.indexOf(gsap.utils.snap(positions, this.x)); update(); } },
    });
  }

  /* Autoplay */
  let timer = null;
  let inView = false;
  let hover = false;
  const stop = () => { clearInterval(timer); timer = null; };
  const restart = () => {
    stop();
    if (reduced || !inView || hover) return;
    timer = setInterval(() => goTo(index + 1), 5000);
  };
  el.addEventListener('pointerenter', () => { hover = true; stop(); });
  el.addEventListener('pointerleave', () => { hover = false; restart(); });
  el.addEventListener('focusin', () => { hover = true; stop(); });
  el.addEventListener('focusout', () => { hover = false; restart(); });
  ScrollTrigger.create({ trigger: el, start: 'top 80%', end: 'bottom 20%', onToggle: (self) => { inView = self.isActive; restart(); } });

  if (!reduced) {
    gsap.from(cards, { y: 80, opacity: 0, rotate: (i) => (i % 2 ? 3 : -3), duration: 1.2, stagger: 0.1, ease: 'orchidOut', scrollTrigger: { trigger: viewport, start: 'top 85%', once: true } });
    gsap.from(qa('.review__stars'), { clipPath: 'inset(0 100% 0 0)', duration: 1.2, stagger: 0.12, ease: 'orchid', scrollTrigger: { trigger: viewport, start: 'top 80%', once: true } });
  }
});
