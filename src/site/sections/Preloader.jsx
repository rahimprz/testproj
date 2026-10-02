import { memo } from 'react';

/** Full-screen intro: two suns, drawing orbits, rolling counter. GSAP drives it, so it never re-renders. */
function Preloader() {
  return (
    <div className="preloader" data-preloader aria-hidden="true">
      <div className="preloader__cols">
        <span className="preloader__col"></span><span className="preloader__col"></span><span className="preloader__col"></span><span className="preloader__col"></span><span className="preloader__col"></span>
      </div>
      <div className="preloader__glow"></div>
      <div className="preloader__inner">
        <div className="preloader__top">
          <span className="preloader__mask"><span className="preloader__brand">William W. Halford</span></span>
          <span className="preloader__mask"><span className="preloader__note">Science&nbsp;fiction</span></span>
          <span className="preloader__mask preloader__mask--right"><span className="preloader__note">Earth&nbsp;→&nbsp;Borland</span></span>
        </div>
        <div className="preloader__mark">
          <svg className="preloader__svg" viewBox="0 0 100 100" fill="none">
            <defs>
              <radialGradient id="pl-sun" cx="40%" cy="38%" r="65%">
                <stop offset="0" stopColor="#ffe2a8" />
                <stop offset="0.45" stopColor="#eeb253" />
                <stop offset="1" stopColor="#ed970f" />
              </radialGradient>
            </defs>
            <g className="preloader__petals" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.5">
              <ellipse className="preloader__petal" cx="50" cy="50" rx="44" ry="16" transform="rotate(-18 50 50)" />
              <ellipse className="preloader__petal" cx="50" cy="50" rx="36" ry="30" transform="rotate(24 50 50)" />
              <circle className="preloader__petal" cx="50" cy="50" r="47" />
            </g>
            <circle className="preloader__core" cx="50" cy="50" r="13" fill="url(#pl-sun)" />
            <circle className="preloader__moon" cx="80" cy="33" r="5" fill="#eeb253" />
          </svg>
        </div>
        <div className="preloader__bottom">
          <div className="preloader__count">
            <span className="preloader__digit"><span>0</span></span><span className="preloader__digit"><span>0</span></span><span className="preloader__digit"><span>0</span></span>
          </div>
          <p className="preloader__tag">
            <span className="preloader__mask"><span>POR!</span></span>
            <span className="preloader__mask"><span>Prince&nbsp;of</span></span>
            <span className="preloader__mask"><span className="preloader__accent">Borland</span></span>
          </p>
        </div>
        <div className="preloader__bar"><span></span></div>
      </div>
    </div>
  );
}

export default memo(Preloader);
