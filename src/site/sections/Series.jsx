import { memo } from 'react';
import { asset } from '../../lib/store.js';
import Btn from './Btn.jsx';

function Series({ orderUrl }) {
  return (
    <section className="section series" id="pr" data-section="series" data-theme="light">
      <div className="container">
        <h2 className="series__title" data-split="words">My <span className="hl">Book</span> Series</h2>
        <div className="series__grid">
          <div className="series__media">
            <div className="series__shape" aria-hidden="true" />
            <figure className="series__img">
              <img src={asset('img/brand/books.webp')} alt="Two copies of POR! Prince of Borland, one standing and one lying flat" width="1234" height="1363" loading="lazy" />
            </figure>
          </div>
          <div className="series__copy">
            <p className="series__label">Book <span>01</span></p>
            <h2 className="series__name" data-split="words">POR Prince Of Borland</h2>
            <p className="series__text" data-reveal="up">
              From the deserts of Arizona to a world of two suns and untold power. <strong><em>POR! Prince of Borland</em></strong> is a journey you won&rsquo;t forget.
            </p>
            <div data-reveal="up" data-delay="0.15">
              <Btn href={orderUrl || '#cont'} label="Order One For Me Now!" size="lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(Series);
