import { useEffect, useState } from 'react';
import { loadSiteData } from '../lib/store.js';
import { bootSite } from './engine/index.js';
import Preloader from './sections/Preloader.jsx';
import Nav from './sections/Nav.jsx';
import Hero from './sections/Hero.jsx';
import Tape from './sections/Tape.jsx';
import Author from './sections/Author.jsx';
import Book from './sections/Book.jsx';
import Series from './sections/Series.jsx';
import Trailer from './sections/Trailer.jsx';
import Reviews from './sections/Reviews.jsx';
import Blog from './sections/Blog.jsx';
import Contact from './sections/Contact.jsx';
import Footer from './sections/Footer.jsx';

const Chrome = () => (
  <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="grain" aria-hidden="true" />
    <div className="scroll-progress" aria-hidden="true"><span className="scroll-progress__bar" /></div>
    <div className="cursor" aria-hidden="true">
      <div className="cursor__ring"><span className="cursor__label" /></div>
      <div className="cursor__dot" />
    </div>
  </>
);

export default function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    const timeout = new Promise((r) => setTimeout(() => r(null), 4000));
    Promise.race([loadSiteData(), timeout]).then((d) => {
      if (!alive) return;
      setData(d || { mode: 'demo', settings: {}, posts: [], reviews: [] });
    });
    return () => { alive = false; };
  }, []);

  // The GSAP engine takes over once the content is in the DOM (it measures sections, splits text, pins).
  useEffect(() => {
    if (!data) return;
    const id = requestAnimationFrame(() => bootSite());
    return () => cancelAnimationFrame(id);
  }, [data]);

  const s = data?.settings || {};
  return (
    <>
      <Chrome />
      <Preloader />
      {data ? (
        <>
          <Nav orderUrl={s.orderUrl} />
          <main id="main" className="page">
            <Hero amazonUrl={s.amazonUrl} announcement={s.announcement} />
            <Tape />
            <Author />
            <Book />
            <Series orderUrl={s.orderUrl} />
            <Trailer />
            {data.reviews.length ? <Reviews reviews={data.reviews} /> : null}
            <Blog posts={data.posts} />
            <Contact />
          </main>
          <Footer settings={s} />
        </>
      ) : null}
    </>
  );
}
