/**
 * About the book: on wide screens the stage pins and the six theme cards fly out from behind the book
 * to their places while the book rises and the sun disc swells. Smaller screens get staggered reveals.
 */
Site.register('book', ({ el, gsap, q, qa, mm }) => {
  const stage = q('.book__stage');
  const left = qa('.book__col--left .theme-card');
  const right = qa('.book__col--right .theme-card');
  const cards = [...left, ...right];
  const mock = q('.book__mock');
  const disc = q('.book__disc');

  gsap.fromTo(q('.book__bg-media'), { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });

  mm.add({ wide: '(min-width: 1100px) and (prefers-reduced-motion: no-preference)', narrow: '(max-width: 1099px) and (prefers-reduced-motion: no-preference)' }, (c) => {
    if (c.conditions.wide) {
      // Each card starts at the book's centre and travels to its slot.
      const offset = (card) => {
        const cr = card.getBoundingClientRect();
        const br = mock.getBoundingClientRect();
        return { x: br.left + br.width / 2 - (cr.left + cr.width / 2), y: br.top + br.height / 2 - (cr.top + cr.height / 2) };
      };
      const tl = gsap.timeline({
        scrollTrigger: { trigger: stage, start: 'top top', end: '+=140%', scrub: 0.8, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
      });
      tl.from(q('.book__head'), { y: 40, opacity: 0, duration: 0.3 }, 0)
        .from(mock, { scale: 0.7, yPercent: 12, rotate: -6, duration: 0.6, ease: 'power2.out' }, 0)
        .from(disc, { scale: 0.2, duration: 0.6, ease: 'power2.out' }, 0)
        .from(cards, {
          x: (i, t) => offset(t).x,
          y: (i, t) => offset(t).y,
          scale: 0.3,
          rotate: (i) => (i < 3 ? -18 : 18),
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: { each: 0.09, from: 'start' },
        }, 0.2)
        .to(mock, { y: -14, duration: 0.3, ease: 'sine.inOut' }, 0.9)
        .to(disc, { scale: 1.08, duration: 0.3 }, 0.9);
    } else {
      gsap.from(cards, { y: 50, opacity: 0, duration: 1, stagger: 0.08, ease: 'orchidOut', scrollTrigger: { trigger: q('.book__grid'), start: 'top 80%', once: true } });
      gsap.from(mock, { scale: 0.8, opacity: 0, duration: 1.3, ease: 'orchidOut', scrollTrigger: { trigger: mock, start: 'top 85%', once: true } });
      gsap.from(disc, { scale: 0, duration: 1.4, ease: 'elastic.out(1, 0.7)', scrollTrigger: { trigger: mock, start: 'top 85%', once: true } });
    }
  });
});
