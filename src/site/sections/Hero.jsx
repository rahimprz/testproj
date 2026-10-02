import { memo } from 'react';
import { asset } from '../../lib/store.js';
import Btn from './Btn.jsx';

function Hero({ amazonUrl, announcement }) {
  return (
    <section className="section hero" id="top" data-section="hero" data-theme="dark">
      <span id="banner" className="sr-only" />
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__bg-media">
          <img className="hero__bg-img" src={asset('img/bg/dusk-sky.jpg')} alt="" fetchPriority="high" />
        </div>
        <canvas className="hero__stars" />
        <div className="hero__overlay" />
        <div className="hero__suns"><span className="hero__sun hero__sun--a" /><span className="hero__sun hero__sun--b" /></div>
      </div>

      <div className="container hero__inner">
        <div className="hero__copy">
          {announcement ? <p className="hero__announce"><span className="hero__announce-dot" />{announcement}</p> : null}
          <p className="eyebrow hero__eyebrow"><span className="eyebrow__dot" /><span className="hero__eyebrow-text">A science fiction novel by William W. Halford</span></p>
          <h1 className="hero__title">What if one <span className="hl">discovery</span> changed your entire <span className="hl">reality?</span></h1>
          <p className="hero__lead">
            From the deserts of Arizona to a world of two suns and untold power. <strong><em>POR! Prince of Borland</em></strong> is a journey you won&rsquo;t forget.
          </p>
          <div className="hero__ctas">
            <Btn href={amazonUrl || '#atb'} label="Buy Now On Amazon" variant="ghost" size="lg" className="hero__cta" />
            <Btn href="#ata" label="Read the Story" icon="↓" size="lg" className="hero__cta" />
          </div>
          <dl className="hero__facts">
            <div><dt>From</dt><dd>Arizona, Earth</dd></div>
            <div><dt>To</dt><dd>Borland</dd></div>
            <div><dt>Suns</dt><dd>Two</dd></div>
          </dl>
        </div>

        <div className="hero__visual">
          <div className="hero__disc" aria-hidden="true" />
          <svg className="hero__orbits" viewBox="0 0 400 400" aria-hidden="true" fill="none">
            <circle cx="200" cy="200" r="196" stroke="rgba(255,255,255,.18)" strokeDasharray="2 6" />
            <ellipse cx="200" cy="200" rx="190" ry="70" stroke="rgba(237,151,15,.45)" transform="rotate(-20 200 200)" />
            <ellipse cx="200" cy="200" rx="150" ry="120" stroke="rgba(255,255,255,.14)" transform="rotate(30 200 200)" />
          </svg>
          <span className="hero__planet hero__planet--a" aria-hidden="true" />
          <span className="hero__planet hero__planet--b" aria-hidden="true" />
          <figure className="hero__book">
            <img src={asset('img/brand/book.webp')} alt="POR! Prince of Borland by William Halford, book cover" width="878" height="1100" fetchPriority="high" />
          </figure>
        </div>
      </div>

      <a className="hero__scroll" href="#ata" aria-label="Scroll to About The Author"><span>Scroll</span><i /></a>
    </section>
  );
}

export default memo(Hero);
