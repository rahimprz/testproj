/** Two crossing tapes looping in opposite directions; scroll speed pushes them faster and flips direction. */
Site.register('tape', ({ gsap, reduced, qa }) => {
  if (reduced) return;
  const loops = qa('.tape__track').map((track) => {
    const rev = track.classList.contains('tape__track--rev');
    const tw = gsap.fromTo(track, { xPercent: rev ? -50 : 0 }, { xPercent: rev ? 0 : -50, duration: rev ? 46 : 38, ease: 'none', repeat: -1 });
    return { tw, rev };
  });
  let dir = 1;
  gsap.ticker.add(() => {
    const v = Site.velocity;
    if (Math.abs(v) > 30) dir = v > 0 ? 1 : -1;
    const boost = 1 + Math.min(Math.abs(v) / 400, 5);
    loops.forEach(({ tw }) => { tw.timeScale(gsap.utils.interpolate(tw.timeScale(), dir * boost, 0.08)); });
  });
});
