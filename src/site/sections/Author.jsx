import { memo } from 'react';
import { asset } from '../../lib/store.js';

function Author() {
  return (
    <section className="section author" id="ata" data-section="author" data-theme="light">
      <div className="container author__grid">
        <div className="author__media" data-parallax-root>
          <div className="author__shape" aria-hidden="true" />
          <figure className="author__frame" data-img-reveal="left">
            <img src={asset('img/brand/author.webp')} alt="Portrait of William W. Halford" width="1024" height="1024" loading="lazy" />
          </figure>
          <div className="author__badge badge-spin" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <defs><path id="author-badge-path" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs>
              <text><textPath href="#author-badge-path">Storyteller • U.S. Air Force • Civil Service •</textPath></text>
            </svg>
            <span className="badge-spin__center">✦</span>
          </div>
        </div>

        <div className="author__copy">
          <h4 className="author__eyebrow"><span className="hl">About The Author</span></h4>
          <h2 className="author__name" data-split="chars">William Halford</h2>
          <p className="author__lead" data-reveal="up">
            <strong>William Halford</strong> is a storyteller shaped by discipline, service, and a lifelong curiosity about the unknown. Born in{' '}
            <strong>Forrest City, Arkansas</strong>, he built a career grounded in precision and responsibility, serving as an Air Traffic Controller in the{' '}
            <strong>United States Air Force</strong> before continuing his professional journey within the <strong>U.S. Army Civil Service</strong>. Alongside his
            technical achievements, William carried a deep passion for imagination and exploration, one that ultimately found its voice through writing.
          </p>
          <p data-reveal="up" data-delay="0.1">
            <strong><em>POR! Prince of Borland</em></strong> reflects not only his creative vision but also his perseverance, faith, and the unwavering support of
            his family. With a background that blends structure and imagination, William brings a unique perspective to science fiction, one that is both
            grounded and expansive, driven by curiosity, purpose, and storytelling that reaches beyond worlds.
          </p>
          <dl className="author__record" data-reveal-group="up" data-stagger="0.08">
            <div className="author__row"><dt>Born</dt><dd>Forrest City, Arkansas</dd></div>
            <div className="author__row"><dt>Served</dt><dd>Air Traffic Controller, U.S. Air Force</dd></div>
            <div className="author__row"><dt>Then</dt><dd>U.S. Army Civil Service</dd></div>
            <div className="author__row"><dt>Writes</dt><dd>Science fiction</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}

export default memo(Author);
