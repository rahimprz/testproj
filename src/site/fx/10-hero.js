/**
 * Hero: twinkling starfield (canvas), intro choreography on reveal, pointer tilt on the book,
 * and a scrubbed scroll-out where the book rises, the sun disc swells and the copy drifts away.
 */
Site.register('hero', ({ el, gsap, ScrollTrigger, SplitText, reduced, touch, q, qa, mm }) => {
  /* ---------- Starfield ---------- */
  const canvas = q('.hero__stars');
  const ctx2d = canvas.getContext('2d');
  let stars = [];
  let w = 0, h = 0, dpr = 1, running = false, raf = 0, t0 = performance.now();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    w = el.clientWidth; h = el.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const count = Math.round((w * h) / 5200);
    stars = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() < 0.08 ? 1.6 + Math.random() : 0.4 + Math.random() * 0.9,
      z: 0.2 + Math.random() * 0.8, p: Math.random() * Math.PI * 2, s: 0.6 + Math.random() * 1.8,
      warm: i % 9 === 0,
    }));
    draw(performance.now());
  };
  const draw = (now) => {
    const t = (now - t0) / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2d.clearRect(0, 0, w, h);
    for (const s of stars) {
      const tw = reduced ? 0.8 : 0.55 + 0.45 * Math.sin(t * s.s + s.p);
      const x = (s.x + pointer.x * 18 * s.z + t * 4 * s.z) % w;
      const y = s.y + pointer.y * 12 * s.z;
      ctx2d.globalAlpha = tw * (0.35 + s.z * 0.65);
      ctx2d.fillStyle = s.warm ? '#ffd38a' : '#ffffff';
      ctx2d.beginPath();
      ctx2d.arc(x < 0 ? x + w : x, y, s.r, 0, Math.PI * 2);
      ctx2d.fill();
    }
    ctx2d.globalAlpha = 1;
  };
  const loop = (now) => { draw(now); if (running) raf = requestAnimationFrame(loop); };
  const setRunning = (on) => {
    if (reduced) return;
    if (on && !running && !document.hidden) { running = true; raf = requestAnimationFrame(loop); }
    if (!on) { running = false; cancelAnimationFrame(raf); }
  };
  resize();
  window.addEventListener('resize', Site.utils.debounce(resize, 200));
  document.addEventListener('visibilitychange', () => setRunning(!document.hidden && ScrollTrigger.isInViewport(el)));
  ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (self) => setRunning(self.isActive) });

  /* ---------- Intro ---------- */
  const title = q('.hero__title');
  const book = q('.hero__book');
  const disc = q('.hero__disc');
  if (!reduced) {
    const split = SplitText.create(title, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' });
    gsap.set(split.words, { yPercent: 115 });
    gsap.set([q('.hero__lead'), q('.hero__facts')], { opacity: 0, y: 30 });
    gsap.set(qa('.hero__cta'), { opacity: 0, y: 30 });
    gsap.set(disc, { scale: 0 });
    gsap.set(book, { clipPath: 'inset(0% 0% 0% 100%)', x: 80 });
    gsap.set(qa('.hero__orbits *'), { drawSVG: '0%' });
    gsap.set(qa('.hero__planet'), { scale: 0 });
    gsap.set(q('.hero__eyebrow'), { opacity: 0 });

    Site.onReveal(() => {
      const tl = gsap.timeline({ defaults: { ease: 'orchidOut' } });
      tl.to(q('.hero__eyebrow'), { opacity: 1, duration: 0.6 }, 0)
        .to(q('.hero__eyebrow-text'), { duration: 1.4, scrambleText: { text: '{original}', chars: 'upperCase', speed: 0.6 } }, 0)
        .to(split.words, { yPercent: 0, duration: 1.3, stagger: 0.06 }, 0.1)
        .to(q('.hero__lead'), { opacity: 1, y: 0, duration: 1.1 }, 0.55)
        .to(qa('.hero__cta'), { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.7)
        .to(q('.hero__facts'), { opacity: 1, y: 0, duration: 1 }, 0.9)
        .to(disc, { scale: 1, duration: 1.6, ease: 'elastic.out(1, 0.75)' }, 0.25)
        .to(qa('.hero__orbits *'), { drawSVG: '100%', duration: 2, stagger: 0.15, ease: 'orchid' }, 0.4)
        .to(book, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 1.5, ease: 'orchid' }, 0.5)
        .to(qa('.hero__planet'), { scale: 1, duration: 0.9, stagger: 0.15, ease: 'back.out(3)' }, 1.2)
        .add(() => {
          gsap.to(book, { y: -16, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
          gsap.to(q('.hero__orbits'), { rotate: 360, duration: 90, ease: 'none', repeat: -1 });
          gsap.set(book, { clearProps: 'clipPath' });
        });
    });
  }

  /* ---------- Pointer parallax ---------- */
  if (!reduced && !touch) {
    const tiltX = gsap.quickTo(book, 'rotationY', { duration: 1, ease: 'power3' });
    const tiltY = gsap.quickTo(book, 'rotationX', { duration: 1, ease: 'power3' });
    const discX = gsap.quickTo(disc, 'x', { duration: 1.4, ease: 'power3' });
    const discY = gsap.quickTo(disc, 'y', { duration: 1.4, ease: 'power3' });
    gsap.set(book, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      pointer.tx = nx; pointer.ty = ny;
      tiltX(nx * 14); tiltY(-ny * 10); discX(nx * -30); discY(ny * -24);
    });
    el.addEventListener('pointerleave', () => { pointer.tx = pointer.ty = 0; tiltX(0); tiltY(0); discX(0); discY(0); });
  }

  /* ---------- Scroll-out ---------- */
  if (!reduced) {
    mm.add(Site.bp.desktop, () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
      tl.to(q('.hero__copy'), { y: -120, opacity: 0.1, ease: 'none' }, 0)
        .to(q('.hero__visual'), { yPercent: -18, ease: 'none' }, 0)
        .to(disc, { scale: 1.25, ease: 'none' }, 0)
        .to(q('.hero__bg-media'), { yPercent: 12, scale: 1.08, ease: 'none' }, 0)
        .to(q('.hero__suns'), { yPercent: 30, opacity: 0.4, ease: 'none' }, 0);
    });
  }
});
