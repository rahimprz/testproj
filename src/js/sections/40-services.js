/**
 * 40 — Services
 *  - Header: split title (words rise in masked lines; the letters of "grow" sprout from the baseline),
 *    hairline strip draws in.
 *  - Desktop (motion): the stage pins and four cards stack. Each incoming card slides up over the
 *    previous one; covered cards scale down, tilt back in 3D, lift slightly (so their edges peek
 *    out as a deep stack) and dim. Ambient light cross-fades to each card's accent. A HUD shows a
 *    rolling counter and step bars (buttons jump to a card).
 *  - Each card owns an art controller: an intro (DrawSVG lines, petals fanning open, bars growing,
 *    pops) that plays the first time the card becomes active, and loops (rotating rings, a film
 *    reel, a motion-path dot, pulses, floats) that only run while that card is active and on screen.
 *  - Mobile (motion): native position: sticky stacking (no pin); covered cards scale/dim by scrub.
 *  - Reduced motion / no JS: plain vertical list, every element in its final state.
 */
Site.register('services', (ctx) => {
  const { el, gsap, ScrollTrigger, SplitText, reduced, q, qa, mm } = ctx;
  const { clamp } = Site.utils;
  if (reduced) return;

  const stage = q('[data-svc-stage]');
  const deck = q('[data-svc-deck]');
  const cards = qa('[data-svc-card]');
  const n = cards.length;
  if (!stage || !deck || !n) return;

  /* ---------- Header: strip + split title ---------- */
  const strip = q('.services__strip');
  if (strip) {
    gsap.timeline({ scrollTrigger: { trigger: strip, start: 'top 90%', once: true } })
      .from(strip.querySelectorAll('.services__strip-rule'), { scaleX: 0, duration: 1.6, ease: 'orchid', stagger: 0.12 })
      .from(strip.querySelectorAll('.services__strip-item'), { opacity: 0, y: 14, duration: 1, stagger: 0.08 }, 0.2);
  }

  const title = q('[data-svc-title]');
  if (title && SplitText) {
    SplitText.create(title, {
      type: 'lines,words,chars',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit(self) {
        const em = title.querySelector('em');
        const isEm = (w) => em && em.contains(w);
        const plain = self.words.filter((w) => !isEm(w));
        const sprout = self.chars.filter((c) => em && em.contains(c));
        const tl = gsap.timeline({ scrollTrigger: { trigger: title, start: 'top 85%', once: true } });
        tl.from(plain, { yPercent: 120, rotate: 3, duration: 1.3, stagger: 0.06, ease: 'orchidOut' }, 0);
        if (sprout.length) {
          tl.from(sprout, {
            yPercent: 110, scaleY: 0.2, transformOrigin: '50% 100%',
            duration: 1.25, stagger: 0.07, ease: 'back.out(2.2)',
          }, 0.25);
        }
        return tl;
      },
    });
  }

  /* ---------- Per-card art controllers ---------- */
  const shapesOf = (node) => (node.matches('g')
    ? Array.from(node.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect'))
    : [node]);

  const buildArt = (card) => {
    const svg = card.querySelector('.svc-art');
    const intro = gsap.timeline({ paused: true, defaults: { ease: 'orchidOut' } });
    const loops = [];
    if (!svg) return { play() {}, setLoops() {}, intro, played: false };
    const all = (sel) => Array.from(svg.querySelectorAll(sel));

    all('[data-svc-draw]').forEach((node, i) => {
      const end = node.getAttribute('data-svc-draw') || '100%';
      intro.fromTo(shapesOf(node), { drawSVG: '0%' }, { drawSVG: end, duration: 1.8, stagger: 0.05, ease: 'orchid' }, 0.05 + i * 0.12);
    });
    const fades = all('[data-svc-fade]');
    if (fades.length) intro.from(fades, { opacity: 0, duration: 1.4, stagger: 0.12, ease: 'soft' }, 0.5);
    const rises = all('[data-svc-rise]');
    if (rises.length) intro.from(rises, { y: '+=46', opacity: 0, duration: 1.4, stagger: 0.09 }, 0.1);
    const petals = all('[data-svc-petal]');
    if (petals.length) {
      intro.from(petals, {
        rotation: (i, t) => -Number(t.getAttribute('data-svc-petal') || 0),
        scale: 0.35, opacity: 0, transformOrigin: '50% 100%',
        duration: 1.9, stagger: 0.06, ease: 'expo.out',
      }, 0.35);
    }
    const grows = all('[data-svc-grow]');
    if (grows.length) intro.from(grows, { scaleY: 0, transformOrigin: '50% 100%', duration: 1.4, stagger: 0.07, ease: 'expo.out' }, 0.2);
    const pops = all('[data-svc-pop]');
    if (pops.length) intro.from(pops, { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 1.1, stagger: 0.08, ease: 'back.out(1.8)' }, 0.7);

    /* Loops (created paused) */
    all('[data-svc-spin]').forEach((node) => {
      const secs = Number(node.getAttribute('data-svc-spin')) || 60;
      loops.push(gsap.to(node, {
        rotation: secs > 0 ? 360 : -360, svgOrigin: node.getAttribute('data-origin') || '350 350',
        duration: Math.abs(secs), ease: 'none', repeat: -1, paused: true,
      }));
    });
    all('[data-svc-float]').forEach((node, i) => {
      const amp = Number(node.getAttribute('data-svc-float')) || 6;
      loops.push(gsap.fromTo(node, { y: -amp * 0.5 }, {
        y: amp * 0.5, duration: 2.4 + (i % 3) * 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true, immediateRender: false,
      }));
    });
    all('[data-svc-pulse]').forEach((node) => {
      const delay = Number(node.getAttribute('data-svc-pulse')) || 0;
      loops.push(gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay, paused: true })
        .fromTo(node, { scale: 0.6, opacity: 0.9, transformOrigin: '50% 50%' }, { scale: 2, opacity: 0, duration: 1.8, ease: 'power2.out' }));
    });
    all('[data-svc-path]').forEach((node) => {
      const path = svg.querySelector(node.getAttribute('data-svc-path'));
      if (!path || !window.MotionPathPlugin) return;
      loops.push(gsap.timeline({ repeat: -1, repeatDelay: 0.5, paused: true })
        .fromTo(node, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 0 } }, {
          motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
          duration: 1.9, ease: 'orchidOut', immediateRender: false,
        }));
    });
    all('[data-svc-reel]').forEach((node) => {
      const dist = Number(node.getAttribute('data-svc-reel')) || 544;
      loops.push(gsap.fromTo(node, { y: 0 }, { y: -dist, duration: 9, ease: 'none', repeat: -1, paused: true, immediateRender: false }));
    });

    let running = false;
    return {
      intro,
      played: false,
      play() {
        if (this.played) return;
        this.played = true;
        intro.play(0);
      },
      setLoops(on) {
        if (on === running) return;
        running = on;
        loops.forEach((t) => (on ? t.play() : t.pause()));
      },
    };
  };

  const arts = cards.map(buildArt);

  /* Section visibility gates every loop */
  let inView = false;
  let active = -1;
  let mode = 'list';
  let tNow = 0; // desktop timeline time: card i is on screen while |i - tNow| < 1
  const syncLoops = () => {
    arts.forEach((a, i) => {
      const live = mode === 'mobile' ? a.visible : active >= 0 && Math.abs(i - tNow) < 1;
      a.setLoops(inView && !document.hidden && live);
    });
  };
  ScrollTrigger.create({
    trigger: el, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { inView = self.isActive; syncLoops(); },
  });
  document.addEventListener('visibilitychange', syncLoops);

  /* HUD refs */
  const roll = q('[data-svc-roll]');
  const steps = qa('[data-svc-step]');
  const fills = qa('[data-svc-fill]');
  const glows = qa('[data-svc-glow]');

  const setActive = (idx) => {
    idx = clamp(idx, 0, n - 1);
    if (idx === active) return;
    active = idx;
    cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
    steps.forEach((s, i) => {
      s.classList.toggle('is-active', i === idx);
      if (i === idx) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
    });
    el.classList.toggle('is-last', idx === n - 1);
    if (roll) gsap.to(roll, { yPercent: (-100 / n) * idx, duration: 0.9, ease: 'orchid', overwrite: true });
    arts[idx].play();
    syncLoops();
  };

  const navOffset = () => (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76);

  /* ==========================================================================
     Responsive variants
     ========================================================================== */
  mm.add({ isDesktop: Site.bp.desktop, isMobile: Site.bp.mobile }, (c) => {
    const { isDesktop } = c.conditions;
    return isDesktop ? desktopStack() : mobileStack();
  });

  /* ---------- Desktop: pinned 3D stack ---------- */
  function desktopStack() {
    mode = 'desktop';
    el.classList.add('services--pin');
    const shades = cards.map((card) => card.querySelector('.svc-card__shade'));
    const artInner = cards.map((card) => card.querySelector('[data-svc-art]'));
    const parts = cards.map((card) => Array.from(card.querySelectorAll('[data-svc-part]')));

    gsap.set(cards, { zIndex: (i) => i + 1, transformOrigin: '50% 0%', force3D: true });
    const depth = (d) => ({
      scale: 1 - 0.052 * d,
      y: () => -Math.round(Math.min(window.innerHeight * 0.024, 22) * d),
      rotationX: -Math.min(4 + 3.5 * d, 13),
    });

    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.addLabel('c0', 0);
    for (let i = 1; i < n; i++) {
      const at = i - 1;
      tl.fromTo(cards[i], { yPercent: 126, rotationX: 9 }, { yPercent: 0, rotationX: 0, duration: 1, ease: 'power2.inOut' }, at);
      if (artInner[i]) tl.fromTo(artInner[i], { scale: 1.32, yPercent: -10 }, { scale: 1, yPercent: 0, duration: 1, ease: 'power2.out' }, at);
      tl.fromTo(parts[i], { y: 90 }, { y: 0, duration: 0.9, stagger: 0.035, ease: 'power3.out' }, at + 0.05);
      for (let j = 0; j < i; j++) {
        const d = i - j;
        tl.to(cards[j], { ...depth(d), duration: 1, ease: 'power2.inOut' }, at);
        tl.to(shades[j], { opacity: Math.min(0.3 + 0.24 * (d - 1), 0.82), duration: 1, ease: 'power1.inOut' }, at);
        if (d === 1 && artInner[j]) tl.to(artInner[j], { scale: 1.08, duration: 1, ease: 'power1.inOut' }, at);
      }
      if (glows[i - 1]) tl.to(glows[i - 1], { opacity: 0, duration: 0.8 }, at + 0.1);
      if (glows[i]) tl.fromTo(glows[i], { opacity: 0 }, { opacity: 1, duration: 0.8 }, at + 0.1);
      if (fills[i]) tl.fromTo(fills[i], { scaleX: 0 }, { scaleX: 1, duration: 1 }, at);
      tl.addLabel(`c${i}`, i);
    }
    tl.to({}, { duration: 0.35 });

    let st = null;
    tl.eventCallback('onUpdate', () => {
      if (!st || (st.progress <= 0 && active < 0)) return;
      tNow = tl.time();
      /* Art starts building as soon as its card begins to rise into view */
      for (let i = 0; i < n; i++) if (tNow > i - 0.9) arts[i].play();
      setActive(Math.round(tNow));
      syncLoops();
    });

    st = ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * (0.92 * (n - 1) + 0.32))}`,
      pin: true,
      anticipatePin: 1,
      scrub: 0.7,
      animation: tl,
      invalidateOnRefresh: true,
    });

    /* First card intro as the stage arrives */
    ScrollTrigger.create({
      trigger: stage, start: 'top 72%',
      onEnter: () => { if (active < 0) setActive(0); },
    });

    /* Scroll position at which card idx is fully arrived */
    const yFor = (idx) => st.start + (st.end - st.start) * (idx / tl.duration());
    const go = (idx, immediate) => Site.scrollTo(Math.round(yFor(idx)) + 2, immediate ? { immediate: true } : { duration: 1.4 });

    const onStep = (e) => { const b = e.currentTarget; go(Number(b.dataset.svcStep)); };
    steps.forEach((b) => b.addEventListener('click', onStep));

    const onToc = (e) => {
      const a = e.target instanceof Element ? e.target.closest('.services__toc a') : null;
      if (!a) return;
      const idx = cards.findIndex((card) => `#${card.id}` === a.getAttribute('href'));
      if (idx < 0) return;
      e.preventDefault();
      go(idx);
    };
    el.addEventListener('click', onToc);

    /* Keyboard: focusing a covered card's link brings that card forward */
    const onFocus = (e) => {
      const card = e.target instanceof Element ? e.target.closest('[data-svc-card]') : null;
      if (!card) return;
      const idx = cards.indexOf(card);
      if (idx !== active || !st.isActive) go(idx, true);
    };
    deck.addEventListener('focusin', onFocus);

    return () => {
      steps.forEach((b) => b.removeEventListener('click', onStep));
      el.removeEventListener('click', onToc);
      deck.removeEventListener('focusin', onFocus);
      el.classList.remove('services--pin', 'is-last');
      active = -1;
      tNow = 0;
      mode = 'list';
    };
  }

  /* ---------- Mobile: sticky stacking, no pin ---------- */
  function mobileStack() {
    mode = 'mobile';
    el.classList.add('services--sticky');
    const inners = cards.map((card) => card.querySelector('.svc-card__inner'));
    const shades = cards.map((card) => card.querySelector('.svc-card__shade'));
    const gap = () => parseFloat(getComputedStyle(deck).rowGap) || 16;

    /* Natural (unstuck) offset of each card inside the deck, measured without sticky influence */
    const offsets = () => {
      const g = gap();
      let y = 0;
      return cards.map((card) => { const top = y; y += card.offsetHeight + g; return top; });
    };
    const stickTop = (i) => {
      const h = cards[i].offsetHeight;
      return Math.round(Math.min(navOffset() + 12 + i * 10, window.innerHeight - h - 12));
    };
    const setTops = () => cards.forEach((card, i) => card.style.setProperty('--stick-top', `${stickTop(i)}px`));
    setTops();
    ScrollTrigger.addEventListener('refreshInit', setTops);

    cards.forEach((card, i) => {
      arts[i].visible = false;
      ScrollTrigger.create({
        trigger: deck,
        start: () => `top+=${offsets()[i]} 94%`,
        once: true,
        onEnter: () => arts[i].play(),
      });
      ScrollTrigger.create({
        trigger: deck,
        start: () => `top+=${offsets()[i]} bottom`,
        end: () => (i < n - 1 ? `top+=${offsets()[i + 1]} top+=${stickTop(i + 1)}` : 'bottom top'),
        onToggle: (self) => { arts[i].visible = self.isActive; syncLoops(); },
      });
      if (i < n - 1) {
        const scrub = {
          trigger: deck,
          start: () => `top+=${offsets()[i + 1]} bottom`,
          end: () => `top+=${offsets()[i + 1]} top+=${stickTop(i + 1)}`,
          scrub: true,
          invalidateOnRefresh: true,
        };
        gsap.to(inners[i], { scale: 0.92, ease: 'none', scrollTrigger: scrub });
        gsap.to(shades[i], { opacity: 0.6, ease: 'none', scrollTrigger: { ...scrub } });
      }
    });

    const onToc = (e) => {
      const a = e.target instanceof Element ? e.target.closest('.services__toc a') : null;
      if (!a) return;
      const idx = cards.findIndex((card) => `#${card.id}` === a.getAttribute('href'));
      if (idx < 0) return;
      e.preventDefault();
      const deckTop = deck.getBoundingClientRect().top + Site.scrollY();
      Site.scrollTo(Math.round(deckTop + offsets()[idx] - stickTop(idx)), { duration: 1.2 });
    };
    el.addEventListener('click', onToc);

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', setTops);
      el.removeEventListener('click', onToc);
      cards.forEach((card) => card.style.removeProperty('--stick-top'));
      el.classList.remove('services--sticky');
      mode = 'list';
    };
  }
});
