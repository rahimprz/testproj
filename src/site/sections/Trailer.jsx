import { memo } from 'react';
import { asset } from '../../lib/store.js';

function Trailer() {
  return (
    <section className="section trailer" id="trlr" data-section="trailer" data-theme="dark">
      <div className="container">
        <header className="trailer__head">
          <p className="eyebrow"><span className="eyebrow__dot" />Watch</p>
          <h2 className="trailer__title" data-split="words">My Book <span className="hl">Video Trailer</span></h2>
        </header>
      </div>
      <div className="trailer__clip">
        <button className="trailer__card" type="button" data-trailer-open data-video={asset('video/trailer.mp4')} data-cursor-label="Play" aria-label="Play the book trailer">
          <span className="trailer__poster">
            <img src={asset('img/brand/trailer-poster.jpg')} alt="" width="1600" height="900" loading="lazy" />
            <video className="trailer__loop" muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} poster={asset('img/brand/trailer-poster.jpg')}>
              <source src={asset('video/trailer.mp4')} type="video/mp4" />
            </video>
          </span>
          <span className="trailer__shade" aria-hidden="true" />
          <span className="trailer__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></span>
          <span className="trailer__meta" aria-hidden="true"><span>POR! Prince of Borland</span><span>Official trailer</span></span>
        </button>
      </div>
      <div className="trailer-modal" data-trailer-modal hidden>
        <div className="trailer-modal__bg" data-trailer-close />
        <div className="trailer-modal__box" role="dialog" aria-modal="true" aria-label="Book trailer">
          <button className="trailer-modal__close" type="button" data-trailer-close aria-label="Close trailer">✕</button>
          <video className="trailer-modal__video" controls playsInline preload="none" poster={asset('img/brand/trailer-poster.jpg')} />
        </div>
      </div>
    </section>
  );
}

export default memo(Trailer);
