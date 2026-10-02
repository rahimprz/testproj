import { useId, useRef, useState } from 'react';
import { admin, asset, DEMO_PASSWORD } from '../lib/store.js';
import { Icon } from './icons.jsx';

export default function Login({ session, notice, onSignedIn }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const id = useId();
  const demo = session?.mode !== 'live';
  const unconfigured = session?.mode === 'live' && session.configured === false;

  async function submit(e) {
    e.preventDefault();
    if (!password) { setError('Enter the admin password.'); input.current?.focus(); return; }
    setBusy(true);
    setError('');
    try {
      await admin.login(password);
      onSignedIn();
    } catch (err) {
      setError(err.message || 'Could not sign in.');
      setBusy(false);
      input.current?.select();
    }
  }

  return (
    <div className="login">
      <div className="login__art" aria-hidden="true">
        <img src={asset('img/brand/books.webp')} alt="" />
      </div>
      <main className="login__panel">
        <img className="login__logo" src={asset('img/brand/logo-dark.webp')} alt="William W. Halford" width="732" height="124" />
        <h1 className="login__title">Sign in to the site admin</h1>
        <p className="login__lead">Manage posts, reviews, reader messages and site links for POR! Prince of Borland.</p>

        {notice && <p className="login__notice" role="status"><Icon name="info" size={17} /> {notice}</p>}

        {demo && (
          <div className="callout callout--demo">
            <Icon name="database" size={18} className="callout__icon" />
            <p>
              <strong>Demo mode:</strong> no database is connected, so changes are saved in this browser only.
              Password: <code>{DEMO_PASSWORD}</code>
            </p>
          </div>
        )}
        {unconfigured && (
          <div className="callout callout--warn" role="alert">
            <Icon name="alert" size={18} className="callout__icon" />
            <p>
              <strong>No admin password is set.</strong> The database is connected, but sign-in stays locked until you add an
              <code>ADMIN_PASSWORD</code> environment variable in Vercel (Project → Settings → Environment Variables) and redeploy.
            </p>
          </div>
        )}

        <form className="login__form" onSubmit={submit} noValidate>
          <input type="text" name="username" value="admin" autoComplete="username" readOnly hidden />
          <div className={`field ${error ? 'field--error' : ''}`}>
            <label className="field__label" htmlFor={id}>Password</label>
            <div className="pw">
              <Icon name="lock" size={18} className="pw__icon" />
              <input
                ref={input}
                id={id}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                disabled={unconfigured}
                autoFocus
              />
              <button type="button" className="pw__toggle" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} disabled={unconfigured}>
                <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
            {error && <p className="field__error" id={`${id}-error`} role="alert"><Icon name="alert" size={14} /> {error}</p>}
          </div>
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy || unconfigured}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <a className="login__site" href="index.html">
          <Icon name="back" size={16} /> Back to the website
        </a>
      </main>
    </div>
  );
}
