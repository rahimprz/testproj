/**
 * Declarative scroll FX. Add attributes in HTML, no JS needed:
 *
 *   data-reveal="up|down|left|right|fade|scale|blur"   reveal on enter  (data-delay, data-duration, data-start, data-trigger="load")
 *   data-reveal-group="up|..."                          stagger children (or [data-reveal-item] descendants); data-stagger
 *   data-split="lines|words|chars"                      SplitText reveal; data-split-anim="rise|fade|scrub"; data-trigger="load"; data-delay
 *   data-parallax="0.2"                                 scroll parallax; positive = drifts down (feels deeper), negative = rises faster
 *   data-img-reveal="up|down|left|right|center"         clip-path wipe of the element + scale-down of the media inside
 *   data-count="240"                                    count-up; data-count-decimals, data-count-prefix, data-count-suffix
 *   data-draw / data-draw="scrub"                       DrawSVG stroke draw on an svg, g or shape
 *   data-magnetic="0.35"                                magnetic hover (fine pointers); optional [data-magnetic-inner]
 *   data-skew="6"                                       skew with scroll velocity (max degrees)
 *
 * Never put data-reveal and data-magnetic on the same element (both own the transform); wrap one in the other.
 * Under prefers-reduced-motion every effect leaves content in its final, visible state.
 */
const Site = window.Site;
const { gsap, ScrollTrigger } = window;
const { qsa, num, clamp } = Site.utils;
const FX = (Site.fx = {});

const once = (el, key) => {
  const k = `fx${key}`;
  if (el.dataset[k]) return false;
  el.dataset[k] = '1';
  return true;
};
const startOf = (el, d = 'top 86%') => el.dataset.start || d;
const reduced = () => Site.flags.reduced;
const inScope = (scope, sel) => {
  const list = qsa(sel, scope);
  if (scope !== document && scope.matches && scope.matches(sel)) list.unshift(scope);
  return list;
};

const PRESETS = {
  up: { y: 70, opacity: 0 },
  down: { y: -70, opacity: 0 },
  left: { x: -80, opacity: 0 },
  right: { x: 80, opacity: 0 },
  fade: { opacity: 0 },
  scale: { scale: 0.86, opacity: 0 },
  blur: { y: 30, opacity: 0, filter: 'blur(14px)' },
};
const preset = (name) => PRESETS[name] || PRESETS.up;

function reveal(scope) {
  inScope(scope, '[data-reveal]').forEach((el) => {
    if (!once(el, 'Reveal') || reduced()) return;
    const from = preset(el.dataset.reveal);
    const vars = {
      ...from,
      duration: num(el.dataset.duration, 1.3),
      delay: num(el.dataset.delay, 0),
      ease: 'orchidOut',
      clearProps: 'filter',
    };
    if (el.dataset.trigger === 'load') {
      const tw = gsap.from(el, { ...vars, paused: true });
      Site.onReveal(() => tw.play());
    } else {
      gsap.from(el, { ...vars, scrollTrigger: { trigger: el, start: startOf(el), once: true } });
    }
  });
}

function revealGroup(scope) {
  inScope(scope, '[data-reveal-group]').forEach((group) => {
    if (!once(group, 'Group') || reduced()) return;
    const items = qsa('[data-reveal-item]', group);
    const targets = items.length ? items : Array.from(group.children);
    if (!targets.length) return;
    const vars = {
      ...preset(group.dataset.revealGroup),
      duration: num(group.dataset.duration, 1.2),
      delay: num(group.dataset.delay, 0),
      stagger: num(group.dataset.stagger, 0.09),
      ease: 'orchidOut',
      clearProps: 'filter',
    };
    if (group.dataset.trigger === 'load') {
      const tw = gsap.from(targets, { ...vars, paused: true });
      Site.onReveal(() => tw.play());
    } else {
      gsap.from(targets, { ...vars, scrollTrigger: { trigger: group, start: startOf(group), once: true } });
    }
  });
}

function split(scope) {
  if (!window.SplitText) return;
  inScope(scope, '[data-split]').forEach((el) => {
    if (!once(el, 'Split')) return;
    const kind = ['lines', 'words', 'chars'].includes(el.dataset.split) ? el.dataset.split : 'lines';
    const mode = el.dataset.splitAnim || 'rise';
    const onLoad = el.dataset.trigger === 'load';
    if (reduced() && mode !== 'scrub') return;
    if (reduced()) return; // scrub fades are decorative; keep text at full strength

    const type = kind === 'chars' ? 'lines,words,chars' : kind === 'words' ? 'lines,words' : 'lines';
    const delay = num(el.dataset.delay, 0);
    if (onLoad) Site.onReveal(() => el._fxTween && el._fxTween.play());

    window.SplitText.create(el, {
      type,
      mask: mode === 'rise' ? 'lines' : undefined,
      linesClass: 'split-line',
      wordsClass: 'split-word',
      charsClass: 'split-char',
      autoSplit: true,
      onSplit(self) {
        const targets = self[kind];
        let tween;
        if (mode === 'scrub') {
          tween = gsap.fromTo(
            self.words.length ? self.words : targets,
            { opacity: 0.14 },
            {
              opacity: 1, stagger: 0.12, ease: 'none',
              scrollTrigger: { trigger: el, start: startOf(el, 'top 82%'), end: el.dataset.end || 'bottom 48%', scrub: true },
            }
          );
        } else {
          const base = mode === 'fade'
            ? { opacity: 0, y: 18, filter: 'blur(8px)', clearProps: 'filter' }
            : { yPercent: 118, rotate: kind === 'lines' ? 0 : 4 };
          const stagger = kind === 'chars' ? 0.024 : kind === 'words' ? 0.05 : 0.1;
          const vars = {
            ...base,
            duration: num(el.dataset.duration, mode === 'fade' ? 1.1 : 1.3),
            stagger,
            delay,
            ease: 'orchidOut',
          };
          if (onLoad) vars.paused = !Site.revealed;
          else vars.scrollTrigger = { trigger: el, start: startOf(el), once: true };
          tween = gsap.from(targets, vars);
        }
        el._fxTween = tween;
        return tween;
      },
    });
  });
}

function parallax(scope) {
  inScope(scope, '[data-parallax]').forEach((el) => {
    if (!once(el, 'Parallax') || reduced()) return;
    const speed = num(el.dataset.parallax, 0.15);
    const trigger = el.closest('[data-parallax-root]') || el.parentElement || el;
    gsap.fromTo(
      el,
      { y: () => -speed * window.innerHeight * 0.5 },
      {
        y: () => speed * window.innerHeight * 0.5,
        ease: 'none',
        scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      }
    );
  });
}

const CLIPS = {
  up: 'inset(100% 0% 0% 0%)',
  down: 'inset(0% 0% 100% 0%)',
  left: 'inset(0% 100% 0% 0%)',
  right: 'inset(0% 0% 0% 100%)',
  center: 'inset(50% 50% 50% 50%)',
};
function imgReveal(scope) {
  inScope(scope, '[data-img-reveal]').forEach((el) => {
    if (!once(el, 'Img') || reduced()) return;
    const clip = CLIPS[el.dataset.imgReveal] || CLIPS.up;
    const media = el.querySelector('[data-img-reveal-media]') || el.querySelector('img, video, canvas, svg');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: startOf(el, 'top 88%'), once: true },
      delay: num(el.dataset.delay, 0),
    });
    tl.fromTo(el, { clipPath: clip }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'orchid' });
    if (media) tl.from(media, { scale: 1.35, duration: 2, ease: 'orchidOut' }, 0);
    tl.set(el, { clearProps: 'clipPath' });
  });
}

function counters(scope) {
  inScope(scope, '[data-count]').forEach((el) => {
    if (!once(el, 'Count')) return;
    const end = num(el.dataset.count, 0);
    const dec = parseInt(el.dataset.countDecimals || '0', 10);
    const pre = el.dataset.countPrefix || '';
    const suf = el.dataset.countSuffix || '';
    const fmt = (v) => pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
    if (reduced()) { el.textContent = fmt(end); return; }
    const o = { v: 0 };
    el.textContent = fmt(0);
    gsap.to(o, {
      v: end,
      duration: num(el.dataset.duration, 2.4),
      ease: 'power3.out',
      onUpdate: () => { el.textContent = fmt(o.v); },
      onComplete: () => { el.textContent = fmt(end); },
      scrollTrigger: { trigger: el, start: startOf(el, 'top 90%'), once: true },
    });
  });
}

function draw(scope) {
  if (!window.DrawSVGPlugin) return;
  inScope(scope, '[data-draw]').forEach((el) => {
    if (!once(el, 'Draw') || reduced()) return;
    const shapes = el.matches('svg, g')
      ? qsa('path, line, polyline, polygon, circle, ellipse, rect', el).filter((s) => !s.closest('defs, clipPath, mask'))
      : [el];
    if (!shapes.length) return;
    const trigger = el.closest('svg') || el;
    if (el.dataset.draw === 'scrub') {
      gsap.fromTo(shapes, { drawSVG: '0%' }, {
        drawSVG: '100%', ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger, start: startOf(el, 'top 80%'), end: el.dataset.end || 'bottom 40%', scrub: true },
      });
    } else {
      gsap.fromTo(shapes, { drawSVG: '0%' }, {
        drawSVG: '100%', duration: num(el.dataset.duration, 2), stagger: 0.12, ease: 'orchid', delay: num(el.dataset.delay, 0),
        scrollTrigger: { trigger, start: startOf(el, 'top 85%'), once: true },
      });
    }
  });
}

function magnetic(scope) {
  if (Site.flags.touch || reduced()) return;
  inScope(scope, '[data-magnetic]').forEach((el) => {
    if (!once(el, 'Magnetic')) return;
    const strength = num(el.dataset.magnetic, 0.35);
    const inner = el.querySelector('[data-magnetic-inner]');
    const ease = 'elastic.out(1, 0.45)';
    const xTo = gsap.quickTo(el, 'x', { duration: 0.9, ease });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.9, ease });
    const ixTo = inner && gsap.quickTo(inner, 'x', { duration: 0.9, ease });
    const iyTo = inner && gsap.quickTo(inner, 'y', { duration: 0.9, ease });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength); yTo(dy * strength);
      if (inner) { ixTo(dx * strength * 0.45); iyTo(dy * strength * 0.45); }
    });
    el.addEventListener('pointerleave', () => {
      xTo(0); yTo(0);
      if (inner) { ixTo(0); iyTo(0); }
    });
  });
}

const skewItems = [];
let skewTicking = false;
function skew(scope) {
  if (reduced()) return;
  inScope(scope, '[data-skew]').forEach((el) => {
    if (!once(el, 'Skew')) return;
    skewItems.push({ set: gsap.quickSetter(el, 'skewY', 'deg'), max: num(el.dataset.skew, 6), cur: 0 });
  });
  if (skewItems.length && !skewTicking) {
    skewTicking = true;
    gsap.ticker.add(() => {
      for (const it of skewItems) {
        const target = clamp(-Site.velocity / 320, -it.max, it.max);
        it.cur += (target - it.cur) * 0.12;
        it.set(Math.abs(it.cur) < 0.01 ? 0 : it.cur);
      }
    });
  }
}

FX.init = (scope = document) => {
  reveal(scope);
  revealGroup(scope);
  split(scope);
  parallax(scope);
  imgReveal(scope);
  counters(scope);
  draw(scope);
  magnetic(scope);
  skew(scope);
};

FX.refresh = () => ScrollTrigger.refresh();
