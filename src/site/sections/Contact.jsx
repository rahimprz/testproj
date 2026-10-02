import { memo, useState } from 'react';
import { asset, submitContact } from '../../lib/store.js';

const FIELDS = [
  ['firstName', 'First Name', 'text', 'given-name', true],
  ['lastName', 'Last Name', 'text', 'family-name', true],
  ['email', 'Email Address', 'email', 'email', true],
  ['phone', 'Phone Number', 'tel', 'tel', false],
];

function Contact() {
  const [status, setStatus] = useState({ state: 'idle', text: '' });

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (data.website) return;
    setStatus({ state: 'sending', text: 'Sending…' });
    try {
      const r = await submitContact(data);
      form.reset();
      setStatus({ state: 'sent', text: r.mode === 'demo' ? 'Thank you! (Demo mode: your message was saved in this browser and appears in the admin inbox.)' : 'Thank you! Your message has been sent to William.' });
    } catch (err) {
      setStatus({ state: 'error', text: err.message });
    }
  }

  return (
    <section className="section contact" id="cont" data-section="contact" data-theme="light">
      <div className="container contact__grid">
        <div className="contact__media">
          <div className="contact__shape" aria-hidden="true" />
          <figure className="contact__img">
            <img src={asset('img/brand/book.webp')} alt="POR! Prince of Borland book cover" width="878" height="1100" loading="lazy" />
          </figure>
        </div>
        <div className="contact__copy">
          <h2 className="contact__title" data-split="words">Connect With the <span className="hl">Author</span></h2>
          <form className="contact__form" onSubmit={onSubmit} data-reveal-group="up" data-stagger="0.07" noValidate={false}>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            {FIELDS.map(([name, label, type, ac, req]) => (
              <div className="field" key={name}>
                <input id={`cf-${name}`} name={name} type={type} required={req} maxLength={type === 'email' ? 254 : 80} autoComplete={ac} placeholder=" " />
                <label htmlFor={`cf-${name}`}>{label}</label>
              </div>
            ))}
            <div className="field field--full">
              <textarea id="cf-message" name="message" rows="5" maxLength="2000" required placeholder=" " />
              <label htmlFor="cf-message">Your Message</label>
            </div>
            <div className="field--full contact__actions">
              <button className="btn btn--lg btn--dark" type="submit" disabled={status.state === 'sending'} data-magnetic="0.2">
                <span className="btn__label"><span className="btn__label-inner" data-text="Submit">Submit</span></span>
                <span className="btn__icon" aria-hidden="true">→</span>
              </button>
              <p className={`form-status form-status--${status.state}`} role="status" aria-live="polite">{status.text}</p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default memo(Contact);
