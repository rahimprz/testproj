/**
 * 10 — Hero
 *   - Raw WebGL fragment shader: slow domain-warped fbm flow in the orchid palette with an eased
 *     pointer light and a vignette. DPR capped at 1.75 with an adaptive render scale, paused when
 *     off-screen or the tab is hidden, a single still frame under reduced motion, CSS gradient fallback.
 *   - SVG orchid bloom: unfurls on reveal, breathes, tilts and opens towards the pointer.
 *   - Intro on Site.onReveal, scrubbed scroll-out hand-off to the marquee.
 */
const Site = window.Site;

/* ------------------------------------------------------------------------------------------------
   Shaders
   ------------------------------------------------------------------------------------------------ */
const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;   // buffer px, origin bottom-left
uniform vec2 uFocus;   // bloom centre, buffer px
uniform float uLight;  // pointer light strength
uniform float uFade;   // scroll-out dim 0..1
uniform float uIntro;  // reveal 0..1

const vec3 INK   = vec3(0.055, 0.043, 0.071);
const vec3 DEEP  = vec3(0.298, 0.114, 0.400);
const vec3 ORCH  = vec3(0.698, 0.420, 0.847);
const vec3 BLUSH = vec3(0.949, 0.769, 0.839);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = ROT * p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 p = (fc - 0.5 * uRes) / uRes.y;
  vec2 fp = (uFocus - 0.5 * uRes) / uRes.y;
  vec2 mp = (uMouse - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.045;

  // Domain warping: fbm feeding fbm feeding fbm, drifting slowly.
  vec2 pp = p * 1.35 + vec2(0.0, -0.1);
  vec2 q = vec2(fbm(pp + vec2(0.0, t)), fbm(pp + vec2(5.2, 1.3) - vec2(t * 0.8, 0.0)));
  vec2 r = vec2(fbm(pp + 3.4 * q + vec2(1.7, 9.2) + 0.55 * t), fbm(pp + 3.4 * q + vec2(8.3, 2.8) - 0.4 * t));
  float f = fbm(pp + 3.0 * r + vec2(0.0, t * 0.3));

  // Composition: richer around the bloom, deep and quiet on the text side.
  vec2 dfp = (p - fp) * vec2(0.85, 1.0);
  float focus = exp(-dot(dfp, dfp) * 2.4);
  float side = smoothstep(-0.95, 0.55, p.x);

  vec3 col = INK;
  col = mix(col, DEEP, smoothstep(0.18, 0.85, f) * (0.5 + 0.4 * side + 0.3 * focus));
  float silk = smoothstep(0.4, 0.95, f * (0.6 + length(q)));
  col = mix(col, ORCH, silk * (0.16 + 0.6 * focus) * (0.6 + 0.4 * side));
  float sheen = smoothstep(0.55, 0.92, r.y * f * 1.6);
  col = mix(col, BLUSH, sheen * focus * 0.42);
  col += ORCH * 0.05 * focus; // ambient bloom light, independent of the pointer
  // Fine bright filaments where the warp folds.
  float fil = pow(1.0 - abs(r.x - q.y), 14.0);
  col += BLUSH * fil * 0.06 * (0.3 + focus);

  // Soft light that follows the pointer.
  vec2 dm = p - mp;
  float light = exp(-dot(dm, dm) * 4.5);
  col += (ORCH * 0.13 + BLUSH * 0.05 * f) * light * uLight * (0.55 + 0.9 * f);
  col += BLUSH * pow(light, 5.0) * 0.035 * uLight;

  // Vignette.
  vec2 v = fc / uRes - 0.5;
  float vig = smoothstep(0.92, 0.18, length(v * vec2(0.92, 1.22)));
  col *= mix(0.38, 1.0, vig);

  col = mix(INK, col, uIntro);
  col = mix(col, INK, uFade);
  col += (hash(fc + fract(uTime) * 61.0) - 0.5) / 200.0; // dither against banding
  gl_FragColor = vec4(col, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------
   WebGL flow
   ------------------------------------------------------------------------------------------------ */
function createFlow(canvas) {
  let gl = null;
  let prog = null;
  let u = {};
  let w = 1;
  let h = 1;
  let scale = 1;
  let lost = false;

  const getGL = () => {
    const opts = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
    try {
      return canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    } catch (e) {
      return null;
    }
  };

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(`[hero] shader: ${log}`);
    }
    return s;
  };

  const setup = () => {
    gl = gl || getGL();
    if (!gl) return false;
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`[hero] link: ${gl.getProgramInfoLog(prog)}`);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    u = {};
    ['uRes', 'uTime', 'uMouse', 'uFocus', 'uLight', 'uFade', 'uIntro'].forEach((n) => { u[n] = gl.getUniformLocation(prog, n); });
    return true;
  };

  try {
    if (!setup()) return null;
  } catch (e) {
    console.warn(e);
    return null;
  }

  // Software rasterisers (no GPU) get a much smaller buffer; the flow is soft, so it still reads well.
  let software = false;
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
    software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch (e) { /* ignore */ }

  const api = {
    software,
    get ok() { return !!gl && !lost; },
    get scale() { return scale; },
    get size() { return [w, h]; },
    resize(s = scale) {
      scale = s;
      const cw = canvas.clientWidth || canvas.parentElement.clientWidth || 1;
      const ch = canvas.clientHeight || canvas.parentElement.clientHeight || 1;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = Math.max(2, Math.round(cw * dpr * scale));
      h = Math.max(2, Math.round(ch * dpr * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      if (gl && !lost) gl.viewport(0, 0, w, h);
    },
    draw(s) {
      if (!gl || lost) return;
      gl.uniform2f(u.uRes, w, h);
      gl.uniform1f(u.uTime, s.time);
      gl.uniform2f(u.uMouse, s.mx * w, (1 - s.my) * h);
      gl.uniform2f(u.uFocus, s.fx * w, (1 - s.fy) * h);
      gl.uniform1f(u.uLight, s.light);
      gl.uniform1f(u.uFade, s.fade);
      gl.uniform1f(u.uIntro, s.intro);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    onLost: null,
    onRestored: null,
  };

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    if (api.onLost) api.onLost();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    try {
      setup();
      api.resize();
      if (api.onRestored) api.onRestored();
    } catch (err) {
      console.warn(err);
    }
  });

  return api;
}

/* ------------------------------------------------------------------------------------------------
   SVG bloom
   ------------------------------------------------------------------------------------------------ */
function createBloom(root) {
  const svg = root.querySelector('.hb-svg');
  if (!svg) return null;
  const parts = Array.from(svg.querySelectorAll('[data-bloom-part]')).map((g, i) => ({
    g,
    angle: parseFloat(g.dataset.angle) || 0,
    amp: parseFloat(g.dataset.amp) || 1,
    spread: parseFloat(g.dataset.spread) || 0,
    phase: i * 1.37,
  }));
  const layers = Array.from(svg.querySelectorAll('[data-bloom-layer]')).map((g) => ({ g, depth: parseFloat(g.dataset.bloomLayer) || 0 }));
  const motes = Array.from(svg.querySelectorAll('.hb-pollen circle')).map((c, i) => {
    const cx = parseFloat(c.getAttribute('cx'));
    const cy = parseFloat(c.getAttribute('cy'));
    return { c, cx, cy, ph: i * 0.73, sp: 0.18 + (i % 5) * 0.05, base: parseFloat(c.getAttribute('opacity')) || 0.6 };
  });
  const orbit = svg.querySelector('.hb-orbit');

  return {
    svg,
    parts,
    frame(t, open, px, py) {
      for (const p of parts) {
        const a = p.angle + Math.sin(t * 0.55 + p.phase) * 1.3 * p.amp + p.spread * open * 6;
        const s = 1 + Math.sin(t * 0.8 + p.phase) * 0.011 * p.amp + open * 0.025;
        p.g.setAttribute('transform', `rotate(${a.toFixed(3)} 400 400) translate(400 400) scale(${s.toFixed(4)}) translate(-400 -400)`);
      }
      for (const l of layers) {
        l.g.setAttribute('transform', `translate(${(px * 18 * l.depth).toFixed(2)} ${(py * 18 * l.depth).toFixed(2)})`);
      }
      for (const m of motes) {
        const dx = Math.sin(t * m.sp + m.ph) * 9 + Math.cos(t * m.sp * 0.6 + m.ph) * 5;
        const dy = Math.cos(t * m.sp * 0.8 + m.ph) * 11 - open * 6;
        m.c.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
        m.c.setAttribute('opacity', (m.base * (0.55 + 0.45 * Math.sin(t * 1.2 + m.ph * 2))).toFixed(3));
      }
      if (orbit) orbit.setAttribute('transform', `rotate(${((t * 7) % 360).toFixed(2)} 400 400)`);
    },
  };
}

/* ------------------------------------------------------------------------------------------------
   Section
   ------------------------------------------------------------------------------------------------ */
Site.register('hero', (ctx) => {
  const { el, gsap, ScrollTrigger, SplitText, reduced, touch, mm, q, qa } = ctx;
  const { clamp, debounce } = ctx.utils;

  const stage = q('[data-hero-stage]');
  const canvas = q('[data-hero-canvas]');
  const bloomWrap = q('[data-hero-bloom-wrap]');
  const bloomEl = q('[data-hero-bloom]');
  const title = q('[data-hero-title]');
  const lines = qa('[data-hero-line]');

  /* ---------- Shared animation state ---------- */
  const state = {
    time: 14.0, // a pleasant moment of the flow for the very first (and reduced-motion) frame
    mx: 0.72, my: 0.48, tmx: 0.72, tmy: 0.48, // eased pointer, normalised to the stage
    px: 0, py: 0, // pointer offset from the bloom centre, -1..1
    fx: 0.73, fy: 0.51, // bloom centre, normalised
    light: 0, tlight: 0.75,
    open: 0, topen: 0,
    fade: 0,
    intro: reduced ? 1 : 0,
    hasPointer: false,
  };

  /* ---------- WebGL ---------- */
  const flow = canvas ? createFlow(canvas) : null;
  const quality = { scale: ctx.desktop ? 0.62 : 0.5, min: 0.2, acc: 0, n: 0, warm: 8 };
  if (flow && flow.software) quality.scale = 0.24;
  if (flow) {
    flow.resize(quality.scale);
    flow.onLost = () => stage.classList.remove('is-gl', 'is-settled');
    flow.onRestored = () => { stage.classList.add('is-gl'); renderOnce(); };
  } else {
    stage.classList.add('no-gl');
  }

  const bloom = bloomEl ? createBloom(bloomEl) : null;

  const measureFocus = () => {
    const sr = stage.getBoundingClientRect();
    const br = bloomWrap.getBoundingClientRect();
    if (!sr.width || !sr.height) return;
    state.fx = (br.left + br.width / 2 - sr.left) / sr.width;
    state.fy = (br.top + br.height / 2 - sr.top) / sr.height;
  };
  measureFocus();
  if (!state.hasPointer) { state.mx = state.tmx = state.fx - 0.08; state.my = state.tmy = state.fy - 0.1; }

  function renderOnce() {
    if (flow && flow.ok) {
      flow.draw({ ...state, light: reduced ? 0.6 : state.light });
      if (!stage.classList.contains('is-gl')) {
        stage.classList.add('is-gl');
        setTimeout(() => stage.classList.add('is-settled'), 1600);
      }
    }
  }
  renderOnce();

  /* ---------- Pointer ---------- */
  const onPointer = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    state.tmx = clamp((e.clientX - r.left) / r.width, -0.2, 1.2);
    state.tmy = clamp((e.clientY - r.top) / r.height, -0.2, 1.2);
    state.hasPointer = true;
    state.tlight = 1;
  };
  const onLeave = () => { state.hasPointer = false; state.tlight = 0.75; };

  /* ---------- Frame loop (only while visible) ---------- */
  let running = false;
  let inView = true;
  let last = 0;

  const tick = () => {
    const now = performance.now();
    const raw = (now - last) / 1000;
    last = now;
    const dt = Math.min(raw, 0.05);
    state.time += dt;

    if (!state.hasPointer || touch) {
      // Idle drift: the light wanders lazily around the bloom.
      state.tmx = state.fx - 0.1 + Math.sin(state.time * 0.21) * 0.16;
      state.tmy = state.fy - 0.06 + Math.cos(state.time * 0.17) * 0.14;
    }
    const k = 1 - Math.pow(0.04, dt); // frame-rate independent easing
    state.mx += (state.tmx - state.mx) * k;
    state.my += (state.tmy - state.my) * k;
    state.light += (state.tlight - state.light) * k * 0.6;

    // Pointer relative to the bloom, drives tilt, layer parallax and the petals opening.
    const sr = stage.getBoundingClientRect();
    const aspect = sr.width / Math.max(1, sr.height);
    const dx = (state.mx - state.fx) * aspect;
    const dy = state.my - state.fy;
    const bloomR = (bloomWrap.offsetWidth / Math.max(1, sr.height)) * 0.5;
    state.px = clamp(dx / Math.max(0.2, bloomR * 1.6), -1, 1);
    state.py = clamp(dy / Math.max(0.2, bloomR * 1.6), -1, 1);
    state.topen = state.hasPointer && !touch ? clamp(1 - Math.hypot(dx, dy) / Math.max(0.15, bloomR * 1.15), 0, 1) : 0.25 + Math.sin(state.time * 0.4) * 0.25;
    state.open += (state.topen - state.open) * k * 0.5;

    if (flow && flow.ok) flow.draw(state);
    // Adaptive resolution: when frames run slow, render the (soft) flow smaller.
    if (quality.warm > 0) quality.warm -= 1;
    else { quality.acc += raw; quality.n += 1; }
    if (flow && quality.acc > 0.8) {
      const avg = quality.acc / quality.n;
      if (avg > 0.03 && quality.scale > quality.min) {
        quality.scale = Math.max(quality.min, quality.scale * Math.max(0.55, Math.sqrt(0.02 / avg)));
        flow.resize(quality.scale);
        flow.draw(state); // never leave a freshly cleared buffer on screen
      }
      quality.acc = 0;
      quality.n = 0;
    }
    if (bloom) {
      bloom.frame(state.time, state.open, state.px, state.py);
      bloomEl.style.transform = `rotateX(${(-state.py * 9).toFixed(3)}deg) rotateY(${(state.px * 12).toFixed(3)}deg)`;
    }
  };

  const setRunning = (on) => {
    if (on === running) return;
    running = on;
    if (on) {
      last = performance.now();
      quality.acc = 0;
      quality.n = 0;
      quality.warm = 8; // ignore the first frames after (re)starting
      gsap.ticker.add(tick);
    } else {
      gsap.ticker.remove(tick);
    }
  };
  const update = () => setRunning(!reduced && inView && !document.hidden && Site.revealed);

  if (!reduced) {
    if (!touch) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
    }
    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => { inView = self.isActive; update(); },
    });
    document.addEventListener('visibilitychange', update);
  }

  const onResize = debounce(() => {
    if (flow) flow.resize(quality.scale);
    measureFocus();
    if (!running) renderOnce();
  }, 120);
  window.addEventListener('resize', onResize);
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage);

  /* ---------- Reduced motion: final, still state ---------- */
  if (reduced) {
    if (bloom) bloom.frame(state.time, 0.35, 0, 0);
    Site.onReveal(() => renderOnce());
    return;
  }

  /* ---------- Intro (set initial states now, under the preloader) ---------- */
  const emChars = [];
  const charLines = [];
  if (SplitText) {
    qa('[data-hero-split]').forEach((node) => {
      // Lines are authored by hand (each one drifts on its own), so only words + chars are split.
      const s = SplitText.create(node, { type: 'words,chars', wordsClass: 'hero-word', charsClass: 'hero-char', aria: 'none' });
      charLines.push(s.chars);
      s.chars.forEach((c) => { if (c.closest('.hero__em')) emChars.push(c); });
    });
    title.classList.add('is-split');
  }

  // Give each char of the italic accent word its own slice of one continuous gradient.
  const paintGradient = () => {
    const em = q('.hero__em');
    if (!em || !emChars.length) return;
    const total = emChars.reduce((acc, c) => acc + c.offsetWidth, 0) || em.offsetWidth;
    const first = emChars[0].offsetLeft;
    emChars.forEach((c) => {
      c.style.backgroundImage = 'var(--grad-orchid)';
      c.style.backgroundSize = `${total * 1.06}px 100%`;
      c.style.backgroundPosition = `${-(c.offsetLeft - first)}px 0`;
      c.style.backgroundRepeat = 'no-repeat';
    });
  };
  paintGradient();
  window.addEventListener('resize', debounce(paintGradient, 150));

  const scramble = q('.hero__scramble');
  const scrambleText = scramble ? scramble.textContent.trim() : '';
  const sparkle = q('[data-hero-sparkle]'); // GSAP owns the wrapper, the CSS twinkle owns the svg
  const svg = bloom && bloom.svg;
  const sel = (s) => (svg ? Array.from(svg.querySelectorAll(s)) : []);

  const intro = gsap.timeline({ paused: true, defaults: { ease: 'orchidOut' } });
  intro
    .fromTo(state, { intro: 0 }, { intro: 1, duration: 2.8, ease: 'soft' }, 0)
    .fromTo(state, { light: 0 }, { light: 0.75, duration: 2.6, ease: 'soft' }, 0.6)
    .from(qa('.hero__rule'), { scaleX: 0, duration: 1.8, ease: 'orchid', stagger: 0.15 }, 0.05)
    .from(q('.hero__eyebrow-dot'), { scale: 0, duration: 0.9, ease: 'back.out(3)' }, 0.1);

  if (scramble && window.ScrambleTextPlugin) {
    scramble.textContent = '';
    intro.to(scramble, { duration: 1.6, ease: 'none', scrambleText: { text: scrambleText, chars: 'lowerCase', revealDelay: 0.25, speed: 0.55 } }, 0.15);
  }

  intro.from(qa('.hero__meta-item'), { x: 40, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.35);

  charLines.forEach((chars, i) => {
    intro.from(chars, { yPercent: 118, rotate: 7, transformOrigin: '0% 100%', duration: 1.35, stagger: 0.026 }, 0.22 + i * 0.13);
  });
  if (sparkle) {
    intro.from(sparkle, { scale: 0, rotate: -120, opacity: 0, duration: 1.4, ease: 'back.out(2.4)', transformOrigin: '50% 50%' }, 1.05);
  }
  intro
    .from(q('.hero__sub-index'), { y: 20, opacity: 0, duration: 1.1 }, 0.75)
    .from(q('.hero__sub'), { y: 34, opacity: 0, filter: 'blur(8px)', duration: 1.3, clearProps: 'filter' }, 0.8)
    .from(qa('.hero__cta'), { y: 36, opacity: 0, duration: 1.2, stagger: 0.1 }, 0.95)
    .from(q('.hero__pill'), { y: 24, opacity: 0, duration: 1.1 }, 1.05)
    .from(q('.hero__cue'), { y: 24, opacity: 0, duration: 1.1 }, 1.15)
    .from(q('.hero__folio'), { x: 30, opacity: 0, duration: 1.1 }, 1.2)
    .from(q('.hero__badge-in'), { scale: 0.4, rotate: -140, opacity: 0, duration: 1.6, ease: 'orchidOut' }, 1.0);

  // Bloom unfurl
  if (svg) {
    intro
      .from(q('.hero__glow'), { scale: 0.3, opacity: 0, duration: 2.6, ease: 'soft' }, 0.1)
      .fromTo(sel('.hb-ring'), { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 2.2, ease: 'orchid', stagger: 0.12 }, 0.1)
      .fromTo(sel('.hb-ticks'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 2.4, ease: 'orchid' }, 0.25)
      .from(sel('.hb-deg text, .hb-cross, .hb-orbit'), { opacity: 0, duration: 1, stagger: 0.08 }, 1.0)
      .from(sel('.hb-heart'), { opacity: 0, scale: 0.4, svgOrigin: '400 400', duration: 2, ease: 'soft' }, 0.3);
    const unfurl = (s) => sel(`${s} .hb-unfurl`);
    intro
      .from(unfurl('.hb-sepal'), { scale: 0.08, rotation: (i) => [-24, 30, -30][i] || 0, opacity: 0, svgOrigin: '400 400', duration: 2.1, stagger: 0.1, ease: 'orchidOut' }, 0.3)
      .from(unfurl('.hb-petal'), { scale: 0.08, rotation: (i) => (i === 0 ? -40 : 40), opacity: 0, svgOrigin: '400 400', duration: 2.2, stagger: 0.08, ease: 'orchidOut' }, 0.5)
      .from(unfurl('.hb-lip'), { scale: 0.1, opacity: 0, svgOrigin: '400 404', duration: 1.8, ease: 'back.out(1.6)' }, 0.9)
      .from(unfurl('.hb-column'), { scale: 0, opacity: 0, svgOrigin: '400 400', duration: 1.2, ease: 'back.out(2.5)' }, 1.25)
      .fromTo(sel('.hb-vein'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.8, stagger: 0.02, ease: 'soft' }, 1.0)
      .fromTo(sel('.hb-tendril'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.4, ease: 'orchid' }, 1.4)
      .from(sel('.hb-pollen circle'), { attr: { r: 0 }, duration: 1.6, stagger: 0.04, ease: 'back.out(3)' }, 1.2)
      .fromTo(sel('.hb-leader'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, ease: 'orchid' }, 1.6)
      .from(sel('.hb-caption text, .hb-caption circle'), { opacity: 0, x: -14, duration: 1, stagger: 0.1 }, 1.9);
  }

  // Handles for QA tooling (seek the intro frame by frame, read the loop state).
  el._heroIntro = intro;
  el._heroDebug = () => ({ running, inView, revealed: Site.revealed, hidden: document.hidden, intro: state.intro, fade: state.fade, scale: quality.scale, gl: !!(flow && flow.ok) });

  Site.onReveal(() => {
    measureFocus();
    intro.play(0);
    update();
  });

  /* ---------- Scroll-out hand-off (scrub) ---------- */
  mm.add({ isDesktop: Site.bp.desktop, isMobile: Site.bp.mobile }, (c) => {
    const d = c.conditions.isDesktop;
    const outs = qa('[data-hero-out]');
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true },
    });
    tl.to(lines[0], { xPercent: d ? -16 : -10, yPercent: d ? -55 : -30 }, 0)
      .to(lines[1], { xPercent: d ? 9 : 7, yPercent: d ? -12 : -8 }, 0)
      .to(lines[2], { xPercent: d ? 24 : 16, yPercent: d ? 40 : 4 }, 0)
      .to(title, { y: () => window.innerHeight * (d ? 0.22 : 0.05) }, 0)
      .to(outs, { autoAlpha: 0, y: d ? -60 : -40, filter: d ? 'blur(10px)' : 'none', duration: d ? 0.55 : 0.3, stagger: d ? 0.04 : 0.02 }, 0)
      .to(q('[data-hero-badge]'), { rotate: 200, scale: 0.7, autoAlpha: 0, duration: 0.7 }, 0)
      .to(stage, { scale: d ? 1.14 : 1.1, yPercent: d ? 26 : 18 }, 0)
      .to(bloomWrap, { rotate: d ? 16 : 10, scale: 1.06 }, 0)
      .to(q('[data-hero-dim]'), { opacity: 0.6 }, 0)
      .to(state, { fade: 0.5 }, 0)
      .to(q('[data-hero-curtain]'), { opacity: 1, duration: 0.6 }, 0.4);
    return () => { gsap.set(state, { fade: 0 }); };
  });
});
