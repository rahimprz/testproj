/**
 * 30 — Manifesto
 *  - Statement: words are wrapped once (no SplitText re-split needed: word wrapping never changes the
 *    word list) and filled word by word with a scrubbed timeline. The inline pill images pop in
 *    (scale + rotate) exactly when the fill reaches them, and their inner art animates in step.
 *  - Arch illustration: core data-img-reveal clip + inner scrubbed parallax (sun, hills, plant, petals).
 *  - Floating edge art: core data-parallax on the wrapper, scroll-linked spin on the inner element.
 *  - Principles: hairline draws across, number/copy rise, icons draw (core data-draw).
 *  - Sign-off: the signature stroke writes itself in, then the i-dot.
 * Reduced motion: nothing is split or hidden; the layout renders in its final state.
 */
Site.register('manifesto', (ctx) => {
  const { el, gsap, reduced, q, qa } = ctx;
  if (reduced) return;

  /* ---------- Word wrapping (keeps <em> and the pill spans intact) ---------- */
  const statement = q('[data-mf-statement]');
  const wrapWords = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        if (parts.length === 1 && !parts[0].trim()) return;
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const span = document.createElement('span');
          span.className = 'manifesto__word';
          span.textContent = part;
          frag.appendChild(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains('manifesto__pill')) {
        wrapWords(child);
      }
    });
  };

  if (statement) {
    wrapWords(statement);
    const nodes = Array.from(statement.querySelectorAll('.manifesto__word, .manifesto__pill'));
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: statement, start: 'top 82%', end: 'bottom 46%', scrub: 0.6 },
    });
    nodes.forEach((node, i) => {
      if (!node.classList.contains('manifesto__pill')) {
        tl.fromTo(node, { opacity: 0.13 }, { opacity: 1, duration: 2.4 }, i);
        return;
      }
      const at = i - 0.6;
      tl.fromTo(node, { scale: 0.1, rotate: -32, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 3.2, ease: 'back.out(1.7)' }, at);
      tl.fromTo(node.querySelector('.manifesto__pill-art'), { scale: 1.5, xPercent: -18 }, { scale: 1, xPercent: 0, duration: 4.5, ease: 'power2.out' }, at);
      const sprout = node.querySelector('.manifesto__sprout');
      if (sprout) tl.fromTo(sprout, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 3.5, ease: 'power2.out' }, at + 0.8);
      const bloom = node.querySelector('.manifesto__pill-bloom');
      if (bloom) tl.fromTo(bloom, { rotate: -150, scale: 0.08, svgOrigin: '60 30' }, { rotate: 0, scale: 0.42, svgOrigin: '60 30', duration: 4, ease: 'power3.out' }, at + 0.4);
      const waves = node.querySelector('.manifesto__waves');
      if (waves) tl.fromTo(waves, { x: -90 }, { x: 0, duration: nodes.length - at, ease: 'none' }, at);
    });
  }

  /* ---------- Top strip + meta ---------- */
  const top = q('.manifesto__top');
  if (top) {
    gsap.timeline({ scrollTrigger: { trigger: top, start: 'top 90%', once: true } })
      .from(top.querySelectorAll('.manifesto__top-rule'), { scaleX: 0, transformOrigin: '0 50%', duration: 1.6, ease: 'orchid', stagger: 0.12 })
      .from(top.querySelectorAll(':scope > span:not(.manifesto__top-rule)'), { opacity: 0, y: 14, duration: 1, stagger: 0.08 }, 0.2)
      .from(q('.manifesto__meta').children, { opacity: 0, y: 18, duration: 1.1, stagger: 0.1 }, 0.35);
  }

  /* ---------- Floating art: scroll-linked spin ---------- */
  qa('[data-mf-spin]').forEach((node) => {
    const deg = Number(node.dataset.mfSpin) || 0;
    const trigger = node.closest('[data-parallax-root]') || el;
    gsap.to(node, {
      rotate: `+=${deg}`,
      ease: 'none',
      scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
  });

  /* ---------- Arch illustration: inner parallax ---------- */
  const art = q('.manifesto__art');
  if (art) {
    // the figure is sticky on desktop, so measure against the (static) body grid instead
    const st = { trigger: q('.manifesto__body'), start: 'top bottom', end: 'bottom top', scrub: 0.8 };
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: st });
    tl.fromTo(q('.manifesto__sun'), { y: 70 }, { y: -18 }, 0)
      .fromTo(q('.manifesto__stars'), { y: -14 }, { y: 22 }, 0)
      .fromTo(q('.manifesto__hill--back'), { y: 26 }, { y: -6 }, 0)
      .fromTo(q('.manifesto__hill--mid'), { y: 14 }, { y: -4 }, 0)
      .fromTo(q('.manifesto__plant'), { rotate: -4.5, svgOrigin: '262 480' }, { rotate: 2.5, svgOrigin: '262 480' }, 0)
      .fromTo(q('.manifesto__fall'), { y: -50 }, { y: 70 }, 0);
    qa('.manifesto__fall use').forEach((p, i) => {
      tl.fromTo(p, { rotate: '-=0' }, { rotate: `+=${i % 2 ? -90 : 120}`, transformOrigin: '50% 50%' }, 0);
    });
  }

  /* ---------- Principles ---------- */
  const head = q('.manifesto__principles-head');
  if (head) {
    gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 88%', once: true } })
      .from(head.querySelector('.manifesto__principles-rule'), { scaleX: 0, transformOrigin: '0 50%', duration: 1.4, ease: 'orchid' })
      .from(head.querySelectorAll('span:not(.manifesto__principles-rule)'), { opacity: 0, y: 12, duration: 0.9, stagger: 0.1 }, 0.1)
      .from(q('.manifesto__principles-lead'), { opacity: 0, y: 30, duration: 1.2 }, 0.2);
  }
  qa('.manifesto__item').forEach((item) => {
    gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 88%', once: true } })
      .from(item.querySelector('.manifesto__rule'), { scaleX: 0, duration: 1.5, ease: 'orchid' })
      .from(item.querySelectorAll('[data-mf-rise]'), { opacity: 0, y: 34, duration: 1.2, stagger: 0.1 }, 0.18);
  });
  const caption = q('.manifesto__caption');
  if (caption) gsap.from(caption.children, { opacity: 0, y: 16, duration: 1, stagger: 0.1, scrollTrigger: { trigger: caption, start: 'top 95%', once: true } });

  /* ---------- Signature ---------- */
  const sig = q('[data-mf-signature]');
  if (sig && window.DrawSVGPlugin) {
    const main = sig.querySelector('.manifesto__sig-main');
    const dot = sig.querySelector('.manifesto__sig-dot');
    gsap.timeline({ scrollTrigger: { trigger: q('.manifesto__signoff'), start: 'top 88%', once: true } })
      .from(q('[data-mf-sign-text]'), { opacity: 0, x: -24, duration: 1.2 })
      .fromTo(main, { drawSVG: '0%' }, { drawSVG: '100%', duration: 2.6, ease: 'power1.inOut' }, 0.25)
      .fromTo(dot, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.35, ease: 'power2.out' }, '-=0.2')
      .from(q('.manifesto__sign-meta'), { opacity: 0, y: 10, duration: 1 }, 0.6);
  }
});
