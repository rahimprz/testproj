/** Book series: the slanted sun shape sweeps in, the mockup slides from the left and floats on scroll. */
Site.register('series', ({ gsap, q, reduced }) => {
  if (reduced) return;
  const media = q('.series__media');
  const tl = gsap.timeline({ scrollTrigger: { trigger: media, start: 'top 78%', once: true } });
  tl.from(q('.series__shape'), { clipPath: 'polygon(25% 0, 25% 0, 0 100%, 0 100%)', duration: 1.3, ease: 'orchid' })
    .from(q('.series__img'), { xPercent: -30, opacity: 0, rotate: -6, duration: 1.4, ease: 'orchidOut' }, 0.2)
    .from(q('.series__label'), { x: -30, opacity: 0, duration: 1 }, 0.3);
  gsap.fromTo(q('.series__img'), { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo(q('.series__shape'), { yPercent: -6 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
});
