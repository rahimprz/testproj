import { memo, useState } from 'react';
import { asset, subscribe } from '../../lib/store.js';

const Instagram = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" /></svg>
);
const Facebook = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" /></svg>
);

function Footer({ settings }) {
  const [msg, setMsg] = useState({ state: 'idle', text: '' });
  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const { email, website } = Object.fromEntries(new FormData(form));
    if (website) return;
    setMsg({ state: 'sending', text: 'Joining…' });
    try {
      const r = await subscribe(email);
      form.reset();
      setMsg({ state: 'sent', text: r.already ? 'You are already on the list. Thank you!' : r.mode === 'demo' ? 'You are on the list! (Demo mode: saved in this browser.)' : 'You are on the list. Thank you!' });
    } catch (err) {
      setMsg({ state: 'error', text: err.message });
    }
  }
  const socials = [
    ['Instagram', settings.instagramUrl, Instagram],
    ['Facebook', settings.facebookUrl, Facebook],
  ];
  return (
    <footer className="footer" data-section="footer" data-theme="dark">
      <div className="footer__inner">
        <div className="container footer__top">
          <a className="footer__logo" href="#top" aria-label="William W. Halford, back to top">
            <img src={asset('img/brand/logo-light.webp')} alt="William W. Halford" width="732" height="124" loading="lazy" />
          </a>
          <p className="footer__text">Be the first to receive updates on new releases, behind-the-scenes insights, and personal reflections from my work. I also share occasional thoughts on writing, life, and the stories that shape us.</p>
          <form className="footer__form" onSubmit={onSubmit}>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            <label className="sr-only" htmlFor="nl-email">Email address</label>
            <input id="nl-email" className="footer__input" type="email" name="email" required placeholder="Your email address" autoComplete="email" />
            <button className="btn footer__submit" type="submit" disabled={msg.state === 'sending'}>
              <span className="btn__label"><span className="btn__label-inner" data-text="Join the Newsletter">Join the Newsletter</span></span>
            </button>
          </form>
          <p className={`form-status form-status--${msg.state}`} role="status" aria-live="polite">{msg.text}</p>
          <ul className="footer__social" role="list">
            {socials.map(([name, url, Icon]) => (
              <li key={name}>
                <a href={url || '#'} aria-label={name} data-magnetic="0.4" {...(url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><Icon /></a>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer__mega" aria-hidden="true"><span className="footer__word">Borland</span></div>
        <div className="container footer__bottom">
          <p>&copy; <strong>William W. Halford</strong> All Rights Reserved.</p>
          <div className="footer__links">
            <a className="footer__top-link" href="admin.html">Admin</a>
            <a className="footer__top-link" href="#top" data-magnetic="0.3">Back to top <span aria-hidden="true">↑</span></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);
