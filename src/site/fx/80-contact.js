/** Contact: the sun triangle grows from its base and the mockup slides in from the right, then floats with scroll. */
Site.register('contact', ({ gsap, q, reduced }) => {
  if (reduced) return;
  const media = q('.contact__media');
  gsap.timeline({ scrollTrigger: { trigger: media, start: 'top 80%', once: true } })
    .from(q('.contact__shape'), { scaleY: 0, transformOrigin: '50% 100%', duration: 1.2, ease: 'orchid' })
    .from(q('.contact__img'), { xPercent: 25, opacity: 0, rotate: 5, duration: 1.4, ease: 'orchidOut' }, 0.2);
  gsap.fromTo(q('.contact__img'), { yPercent: 6 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo(q('.contact__shape'), { yPercent: -4 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
});
