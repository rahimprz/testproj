/**
 * Trailer: the video card opens up from a narrow rounded window to near full width as it scrolls into view
 * (the scroll-linked clip-path of the WordPress row, rebuilt with GSAP). Clicking plays the trailer in a dialog.
 */
Site.register('trailer', ({ el, gsap, ScrollTrigger, q, mm }) => {
  const card = q('.trailer__card');
  mm.add({ desk: `${Site.bp.desktop} and ${Site.bp.motion}` }, () => {
    gsap.fromTo(card,
      { clipPath: 'inset(0% 14% 0% 14% round 75px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 16px)', ease: 'none', scrollTrigger: { trigger: card, start: 'top 90%', end: 'center 55%', scrub: true } });
    gsap.fromTo(q('.trailer__poster img'), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Silent preview loop inside the card while it is on screen (skipped under reduced motion).
  const loop = q('.trailer__loop');
  if (loop && !Site.flags.reduced) {
    const play = () => { loop.play().then(() => loop.classList.add('is-playing')).catch(() => {}); };
    ScrollTrigger.create({ trigger: card, start: 'top 85%', end: 'bottom 15%', onToggle: (self) => (self.isActive ? play() : loop.pause()) });
    document.addEventListener('visibilitychange', () => { if (document.hidden) loop.pause(); });
  }

  const modal = q('[data-trailer-modal]');
  const video = q('.trailer-modal__video');
  let lastFocus = null;
  const open = () => {
    lastFocus = document.activeElement;
    if (loop) loop.pause();
    if (!video.src) video.src = card.dataset.video;
    modal.hidden = false;
    Site.lockScroll(true);
    gsap.fromTo(q('.trailer-modal__box'), { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'orchidOut' });
    gsap.fromTo(q('.trailer-modal__bg'), { opacity: 0 }, { opacity: 1, duration: 0.5 });
    q('.trailer-modal__close').focus();
    video.play().catch(() => {});
  };
  const close = () => {
    video.pause();
    gsap.to(q('.trailer-modal__box'), { scale: 0.9, opacity: 0, duration: 0.4, ease: 'orchid' });
    gsap.to(q('.trailer-modal__bg'), { opacity: 0, duration: 0.4, onComplete: () => { modal.hidden = true; Site.lockScroll(false); if (lastFocus) lastFocus.focus({ preventScroll: true }); } });
  };
  card.addEventListener('click', open);
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-trailer-close]')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
});
