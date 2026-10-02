import { memo } from 'react';

const Stars = ({ rating }) => (
  <span className="review__stars" role="img" aria-label={`Rated ${rating} out of 5`}>
    <svg viewBox="0 0 120 22" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} transform={`translate(${i * 24} 0)`} fill={i < rating ? 'currentColor' : 'rgba(255,255,255,.22)'}
          d="M11 1l3 6.5 7 .8-5.2 4.8 1.4 7L11 16.6 4.8 20.1l1.4-7L1 8.3l7-.8z" />
      ))}
    </svg>
  </span>
);

function Reviews({ reviews }) {
  const total = reviews.length;
  return (
    <section className="section reviews" id="testi" data-section="reviews" data-theme="mauve">
      <div className="container">
        <header className="reviews__head">
          <h4 className="reviews__eyebrow">Testimonials</h4>
          <h2 className="reviews__title" data-split="words">What My <span className="hl">Reader</span> Says</h2>
        </header>
      </div>
      <div className="reviews__viewport" data-cursor-label="Drag">
        <div className="reviews__track" data-reviews-track>
          {reviews.map((r) => (
            <article className="review" data-review key={r.id}>
              <Stars rating={r.rating || 5} />
              <h3 className="review__title">&ldquo;{r.title}&rdquo;</h3>
              <p>{r.text}</p>
              {r.name ? <p className="review__name">{r.name}</p> : null}
              <span className="review__quote" aria-hidden="true">&rdquo;</span>
            </article>
          ))}
        </div>
      </div>
      <div className="container reviews__controls">
        <div className="reviews__progress" aria-hidden="true"><span data-reviews-bar /></div>
        <p className="reviews__count" aria-live="polite"><span data-reviews-current>01</span> / {String(total).padStart(2, '0')}</p>
        <div className="reviews__buttons">
          <button className="reviews__btn" type="button" data-reviews-prev aria-label="Previous review">←</button>
          <button className="reviews__btn" type="button" data-reviews-next aria-label="Next review">→</button>
        </div>
      </div>
    </section>
  );
}

export default memo(Reviews);
