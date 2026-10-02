/** About the author: portrait drifts inside its frame, the sun disc rises behind it, badge turns with scroll. */
Site.register('author', ({ gsap, q, reduced }) => {
  if (reduced) return;
  const img = q('.author__frame img');
  gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: q('.author__frame'), start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from(q('.author__shape'), { scale: 0, duration: 1.6, ease: 'elastic.out(1, 0.7)', scrollTrigger: { trigger: q('.author__media'), start: 'top 75%', once: true } });
  gsap.fromTo(q('.author__shape'), { yPercent: 10 }, { yPercent: -20, ease: 'none', scrollTrigger: { trigger: q('.author__media'), start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from(q('.author__badge'), { rotate: -120, scale: 0.4, opacity: 0, duration: 1.4, scrollTrigger: { trigger: q('.author__media'), start: 'top 70%', once: true } });
  gsap.from(q('.author__eyebrow'), { x: -40, opacity: 0, duration: 1, scrollTrigger: { trigger: q('.author__copy'), start: 'top 80%', once: true } });
});
