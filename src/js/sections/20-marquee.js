/**
 * 20 — Marquee
 * Two counter-running rows on an orchid band plus a crossing ink tape.
 *  - Seamless loop: each track holds N copies of its group (copies are aria-hidden) and wraps by one group width.
 *  - Speed follows Site.velocity (faster while scrolling, direction flips when scrolling up) with a velocity skew.
 *  - Petal separators turn a quarter while the band is hovered (CSS).
 *  - Fine pointers can grab the stage and throw the tape (Observer); hovering slows it down.
 *  - Entry scrub: the band and tape swing in from steeper angles, like tape being pressed down.
 *  - The ticker only runs while the section is on screen. Reduced motion: static rows, no listeners.
 */
Site.register('marquee', (ctx) => {
  const { el, gsap, ScrollTrigger, Observer, reduced, touch, q, qa, utils } = ctx;
  const stage = q('[data-mq-stage]');
  const band = q('[data-mq-band]');
  const tape = q('[data-mq-tape]');
  const readout = q('[data-mq-readout]');
  const arrow = q('[data-mq-arrow]');
  const hint = q('[data-mq-hint]');

  if (reduced) {
    if (readout) readout.textContent = '×0.00';
    if (hint) hint.textContent = 'Motion reduced';
    return;
  }
  if (hint && !touch) hint.textContent = 'Drag or scroll to steer';

  /* ---------- Rows ---------- */
  const rows = qa('[data-mq-row]').map((row) => {
    const track = row.querySelector('[data-mq-track]');
    const first = track.firstElementChild;
    return {
      row,
      track,
      first,
      dir: utils.num(row.dataset.dir, -1),
      speed: utils.num(row.dataset.speed, 50),
      drag: utils.num(row.dataset.drag, 1),
      x: 0,
      w: 1,
      setX: gsap.quickSetter(track, 'x', 'px'),
      setSkew: gsap.quickSetter(track, 'skewX', 'deg'),
    };
  });

  const measure = () => {
    rows.forEach((r) => {
      const groups = Array.from(r.track.children);
      // width of one loop = distance between the starts of two consecutive copies
      r.w = groups.length > 1 ? groups[1].offsetLeft - groups[0].offsetLeft : groups[0].offsetWidth;
      if (r.w < 1) r.w = groups[0].offsetWidth || 1;
      // make sure the copies always cover the (rotated, over-wide) row plus one loop
      const need = r.row.offsetWidth + r.w;
      let total = groups.length * r.w;
      while (total < need && groups.length < 12) {
        const clone = r.first.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('aria-label');
        r.track.appendChild(clone);
        groups.push(clone);
        total += r.w;
      }
      r.x = gsap.utils.wrap(-r.w, 0, r.x);
    });
  };
  measure();
  // start each row at a different phase so the separators never line up
  rows.forEach((r, i) => { r.x = -r.w * (0.18 + i * 0.27); r.x = gsap.utils.wrap(-r.w, 0, r.x); r.setX(r.x); });

  /* ---------- State ---------- */
  let inView = false;
  let steer = 1;          // 1 = default direction, -1 = reversed (after scrolling up)
  let factor = 1;         // smoothed speed multiplier (signed)
  let skew = 0;
  let hoverMul = 1;
  let hoverTarget = 1;
  let dragging = false;
  let dragDelta = 0;
  let throwV = 0;
  let lastReadout = '';
  let frame = 0;

  const tick = (time, deltaTime) => {
    if (!inView) return;
    const dt = Math.min(deltaTime, 50) / 1000;
    const v = Site.velocity || 0;

    if (v > 25) steer = 1;
    else if (v < -25) steer = -1;
    const boost = Math.min(Math.abs(v) / 210, 7);
    const target = dragging ? 0 : steer * (1 + boost);
    factor += (target - factor) * (Math.abs(target) > Math.abs(factor) ? 0.12 : 0.05);
    hoverMul += (hoverTarget - hoverMul) * 0.06;

    const skewTarget = utils.clamp(-v / 210, -7, 7) + utils.clamp(throwV / -320, -6, 6);
    skew += (skewTarget - skew) * 0.1;
    if (Math.abs(skew) < 0.01) skew = 0;

    throwV *= Math.pow(0.04, dt); // ~ quick exponential decay
    if (Math.abs(throwV) < 1) throwV = 0;

    for (const r of rows) {
      r.x += r.dir * r.speed * factor * hoverMul * dt + (dragDelta + throwV * dt) * r.drag;
      r.x = gsap.utils.wrap(-r.w, 0, r.x);
      r.setX(r.x);
      r.setSkew(skew);
    }
    dragDelta = 0;

    if (readout && (frame++ % 6 === 0)) {
      const live = Math.abs(factor * hoverMul) + Math.abs(throwV) / 120;
      const text = `×${live.toFixed(2)}`;
      if (text !== lastReadout) { readout.textContent = text; lastReadout = text; }
      if (arrow) arrow.classList.toggle('is-flipped', factor < 0 || (dragging && throwV > 0));
    }
  };
  gsap.ticker.add(tick);

  ScrollTrigger.create({
    trigger: el,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => { inView = self.isActive; },
    onRefresh: (self) => { inView = self.isActive; },
  });

  const onResize = utils.debounce(measure, 180);
  window.addEventListener('resize', onResize);

  /* ---------- Hover + drag (fine pointers) ---------- */
  if (!touch && Observer) {
    stage.setAttribute('data-cursor-label', 'Drag');
    stage.addEventListener('pointerenter', () => { hoverTarget = 0.32; });
    stage.addEventListener('pointerleave', () => { hoverTarget = 1; });
    Observer.create({
      target: stage,
      type: 'pointer',
      dragMinimum: 3,
      onPress: () => { dragging = true; throwV = 0; stage.classList.add('is-grabbing'); },
      onDrag: (self) => { dragDelta += self.deltaX; },
      onRelease: (self) => {
        dragging = false;
        stage.classList.remove('is-grabbing');
        throwV = utils.clamp(self.velocityX || 0, -4000, 4000);
        // continue in the thrown direction afterwards
        if (Math.abs(throwV) > 200) steer = throwV < 0 ? 1 : -1;
      },
    });
  }

  /* ---------- Entry scrub: tape pressed down onto the band ---------- */
  ctx.mm.add({ isDesktop: Site.bp.desktop, isMobile: Site.bp.mobile }, (c) => {
    const { isDesktop } = c.conditions;
    const bandRot = -2;
    const tapeRot = isDesktop ? 6.5 : 9;
    gsap.set(band, { rotate: bandRot });
    gsap.set(tape, { rotate: tapeRot });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.9, invalidateOnRefresh: true },
    });
    tl.fromTo(band, { rotate: bandRot - 5, yPercent: 26, scale: 1.04 }, { rotate: bandRot, yPercent: 0, scale: 1, ease: 'power2.out', duration: 0.5 }, 0)
      .fromTo(tape, { rotate: tapeRot + 9, yPercent: -160, xPercent: 4 }, { rotate: tapeRot, yPercent: 0, xPercent: 0, ease: 'power2.out', duration: 0.5 }, 0)
      .to(band, { rotate: bandRot - 1.4, yPercent: -12, ease: 'none', duration: 0.5 }, 0.5)
      .to(tape, { rotate: tapeRot + 2.2, yPercent: 40, ease: 'none', duration: 0.5 }, 0.5);
    tl.from(qa('.marquee__meta'), { opacity: 0, y: 24, ease: 'power2.out', duration: 0.22, stagger: 0.06 }, 0.06);
    return () => { gsap.set([band, tape], { clearProps: 'transform' }); };
  });
});
