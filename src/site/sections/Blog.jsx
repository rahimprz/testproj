import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { asset } from '../../lib/store.js';
import { renderMarkdown, formatDate } from '../../lib/markdown.js';
import Btn from './Btn.jsx';

const HASH = 'post-';

/** Full-screen article reader, opened from the blog cards or a #post-slug link. */
function Reader({ post, posts, onClose, onOpen }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const { gsap } = window;
    el.scrollTop = 0;
    if (gsap && !window.Site?.flags?.reduced) {
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'orchid' });
      gsap.from(el.querySelectorAll('.reader__head > *'), { y: 40, opacity: 0, duration: 1, stagger: 0.07, delay: 0.35, ease: 'orchidOut' });
      gsap.from(el.querySelector('.reader__cover img'), { scale: 1.2, duration: 1.6, delay: 0.2, ease: 'orchidOut' });
    }
    window.Site?.lockScroll?.(true);
    el.querySelector('.reader__close')?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); window.Site?.lockScroll?.(false); };
  }, [post.id, onClose]);

  const more = posts.filter((p) => p.id !== post.id).slice(0, 3);
  return (
    <div className="reader" ref={ref} role="dialog" aria-modal="true" aria-labelledby="reader-title" data-lenis-prevent data-theme="light">
      <button className="reader__close" type="button" onClick={onClose} aria-label="Close article">✕</button>
      <article className="reader__article">
        <header className="reader__head">
          <p className="reader__meta"><span className="reader__cat">{post.category}</span><span>{formatDate(post.date)}</span><span>{post.readMinutes || 2} min read</span></p>
          <h2 className="reader__title" id="reader-title">{post.title}</h2>
          {post.excerpt ? <p className="reader__excerpt">{post.excerpt}</p> : null}
        </header>
        {post.cover ? <figure className="reader__cover"><img src={asset(post.cover)} alt="" /></figure> : null}
        <div className="reader__body prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
        <footer className="reader__foot">
          <p>Written by <strong>William W. Halford</strong></p>
          <Btn href="#cont" label="Connect With the Author" magnetic="" />
        </footer>
      </article>
      {more.length ? (
        <aside className="reader__more" aria-label="More posts">
          <h3>More from the author</h3>
          <div className="reader__more-grid">
            {more.map((p) => (
              <a key={p.id} className="reader__more-item" href={`#${HASH}${p.slug}`} onClick={(e) => { e.preventDefault(); onOpen(p.slug); }}>
                {p.cover ? <img src={asset(p.cover)} alt="" loading="lazy" /> : null}
                <span className="reader__more-cat">{p.category}</span>
                <span className="reader__more-title">{p.title}</span>
              </a>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function Blog({ posts }) {
  const [open, setOpen] = useState(null);
  const lastFocus = useRef(null);

  const openSlug = useCallback((slug) => {
    const p = posts.find((x) => x.slug === slug);
    if (!p) return;
    if (!lastFocus.current) lastFocus.current = document.activeElement;
    setOpen(p);
    if (location.hash !== `#${HASH}${slug}`) history.replaceState(null, '', `#${HASH}${slug}`);
  }, [posts]);

  const close = useCallback(() => {
    setOpen(null);
    history.replaceState(null, '', '#blgs');
    lastFocus.current?.focus?.({ preventScroll: true });
    lastFocus.current = null;
  }, []);

  useEffect(() => {
    const fromHash = () => { if (location.hash.startsWith(`#${HASH}`)) openSlug(location.hash.slice(HASH.length + 1)); };
    window.addEventListener('hashchange', fromHash);
    document.addEventListener('site:ready', fromHash, { once: true });
    return () => window.removeEventListener('hashchange', fromHash);
  }, [openSlug]);

  const featured = posts.find((p) => p.featured) || posts[0];
  const rest = posts.filter((p) => p !== featured).slice(0, 3);
  const cards = featured ? [featured, ...rest] : [];

  return (
    <section className="section blogs" id="blgs" data-section="blogs" data-theme="light">
      <div className="container">
        <h2 className="blogs__title" data-split="words">Recent Posts By <span className="hl">Author</span></h2>
        {cards.length ? (
          <div className={`blogs__grid blogs__grid--${Math.min(cards.length, 4)}`} data-reveal-group="up" data-stagger="0.12">
            {cards.map((p, i) => (
              <article className={`post${i === 0 ? ' post--featured' : ''}`} data-post key={p.id}>
                <a className="post__link" href={`#${HASH}${p.slug}`} data-cursor-label="Read" onClick={(e) => { e.preventDefault(); openSlug(p.slug); }}>
                  <span className="post__media">{p.cover ? <img src={asset(p.cover)} alt="" loading="lazy" /> : <span className="post__blank" />}</span>
                  <span className="post__shade" aria-hidden="true" />
                  <span className="post__body">
                    <span className="post__meta"><span className="post__cat">{p.category}</span><span>{formatDate(p.date, { month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
                    <h3 className="post__title">{p.title}</h3>
                    {i === 0 && p.excerpt ? <span className="post__excerpt">{p.excerpt}</span> : null}
                    <span className="btn post__btn"><span className="btn__label"><span className="btn__label-inner" data-text="Read Article">Read Article</span></span><span className="btn__icon" aria-hidden="true">→</span></span>
                  </span>
                </a>
              </article>
            ))}
          </div>
        ) : (
          <p className="blogs__empty">New posts are on the way. Check back soon.</p>
        )}
      </div>
      {open ? createPortal(<Reader post={open} posts={posts} onClose={close} onOpen={openSlug} />, document.body) : null}
    </section>
  );
}

export default memo(Blog);
