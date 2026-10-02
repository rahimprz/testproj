import { memo } from 'react';
import { asset } from '../../lib/store.js';
import Btn from './Btn.jsx';

const LINKS = [
  ['#top', 'Home'],
  ['#ata', 'About The Author'],
  ['#atb', 'About The Book'],
  ['#testi', 'Reviews'],
  ['#blgs', 'Blogs'],
  ['#cont', 'Contact Us'],
];

function Nav({ orderUrl }) {
  return (
    <>
      <header className="nav" data-nav>
        <a className="nav__logo" href="#top" aria-label="William W. Halford, back to top">
          <img className="nav__logo-img nav__logo-img--light" src={asset('img/brand/logo-light.webp')} alt="William W. Halford" width="732" height="124" />
          <img className="nav__logo-img nav__logo-img--dark" src={asset('img/brand/logo-dark.webp')} alt="" aria-hidden="true" width="732" height="124" />
        </a>
        <nav className="nav__links" aria-label="Primary">
          {LINKS.map(([href, text]) => (
            <a key={href} className="nav__link" href={href} data-nav-link>
              <span className="link-roll"><span className="link-roll__inner" data-text={text}>{text}</span></span>
            </a>
          ))}
        </nav>
        <div className="nav__end">
          <Btn href={orderUrl || '#pr'} label="Order Now" className="nav__cta" magnetic="0.25" />
          <button className="nav__burger" type="button" aria-expanded="false" aria-controls="menu" data-menu-toggle>
            <span className="nav__burger-line" /><span className="nav__burger-line" />
            <span className="sr-only" data-menu-label>Open menu</span>
          </button>
        </div>
      </header>

      <div className="menu" id="menu" data-menu hidden>
        <div className="menu__bg" aria-hidden="true" />
        <div className="menu__inner">
          <nav className="menu__links" aria-label="Menu">
            {LINKS.map(([href, text], i) => (
              <a key={href} className="menu__link" href={href}>
                <span className="menu__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="menu__text">{text}</span>
              </a>
            ))}
          </nav>
          <div className="menu__foot">
            <Btn href={orderUrl || '#pr'} label="Order One For Me Now!" size="lg" magnetic="" />
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(Nav);
