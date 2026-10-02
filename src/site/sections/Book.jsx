import { memo } from 'react';
import { asset } from '../../lib/store.js';

const LEFT = [
  ['01', 'Parallel Worlds & Alternate Realities', 'A central concept is the existence of another world (Borland), emphasizing the idea that reality may extend far beyond what we understand. It introduces readers to advanced civilizations, different ecosystems, and alternate timelines.'],
  ['02', 'Survival & Adaptation', 'The harsh and unfamiliar environment of Borland forces Billy to adapt physically, mentally, and emotionally. The book focuses on resilience, quick learning, and the human ability to survive in extreme conditions.'],
  ['03', 'Loyalty, Friendship & Loss', 'Billy’s bond with Kim represents loyalty and the emotional cost of separation. The story captures the pain of leaving behind loved ones and the weight of unresolved connections.'],
];
const RIGHT = [
  ['04', 'Good vs Evil', 'The subplot involving Decragon introduces betrayal, jealousy, and internal conflict within power structures, reinforcing the timeless struggle between loyalty and ambition.'],
  ['05', 'Moral Responsibility & Choice', 'Billy is constantly faced with choices that define his character: whether to return home, stay, fight, love, or lead. The narrative reinforces accountability and personal responsibility.'],
  ['06', 'Time Displacement & Consequences', 'The difference in time flow between Earth and Borland adds depth to the narrative, showing how choices impact relationships, aging, and life paths in unexpected ways.'],
];

const Card = ({ n, title, text, side }) => (
  <article className={`theme-card theme-card--${side}`} data-theme-card>
    <span className="theme-card__num">{n}</span>
    <h3>{title}</h3>
    <p>{text}</p>
  </article>
);

function Book() {
  return (
    <section className="section book" id="atb" data-section="book" data-theme="dark">
      <div className="book__bg" aria-hidden="true">
        <div className="book__bg-media"><img src={asset('img/bg/canyon.jpg')} alt="" loading="lazy" /></div>
        <div className="book__overlay" />
        <div className="book__glow" />
      </div>
      <div className="book__stage">
        <div className="container">
          <header className="book__head">
            <p className="eyebrow"><span className="eyebrow__dot" />Six themes</p>
            <h2 className="book__title">About The <span className="hl">Book</span></h2>
          </header>
          <div className="book__grid">
            <div className="book__col book__col--left">{LEFT.map(([n, t, x]) => <Card key={n} n={n} title={t} text={x} side="l" />)}</div>
            <div className="book__center">
              <div className="book__disc" aria-hidden="true" />
              <figure className="book__mock">
                <img src={asset('img/brand/book.webp')} alt="POR! Prince of Borland book cover" width="878" height="1100" loading="lazy" />
              </figure>
            </div>
            <div className="book__col book__col--right">{RIGHT.map(([n, t, x]) => <Card key={n} n={n} title={t} text={x} side="r" />)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(Book);
