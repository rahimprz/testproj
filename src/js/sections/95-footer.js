/** Footer: content rises from below as the page ends; the BORLAND wordmark climbs letter by letter and leans with the pointer. */
Site.register('footer', ({ el, gsap, SplitText, q, reduced, touch }) => {
  if (reduced) return;
  gsap.fromTo(q('.footer__inner'), { yPercent: -18 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  const word = q('.footer__word');
  const split = SplitText.create(word, { type: 'chars', charsClass: 'footer__char' });
  gsap.from(split.chars, { yPercent: 110, rotate: 8, duration: 1.3, stagger: 0.06, ease: 'orchidOut', scrollTrigger: { trigger: q('.footer__mega'), start: 'top 95%', once: true } });
  gsap.from(q('.footer__top').children, { y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'orchidOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  if (!touch) {
    const skew = gsap.quickTo(word, 'skewX', { duration: 1, ease: 'power3' });
    el.addEventListener('pointermove', (e) => skew(((e.clientX / window.innerWidth) - 0.5) * -10));
    el.addEventListener('pointerleave', () => skew(0));
  }
});
