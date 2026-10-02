import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { admin, asset } from '../lib/store.js';
import { Icon } from './icons.jsx';
import { AdminCtx, href } from './context.js';
import { ConfirmProvider, ToastProvider, Spinner, useConfirm, useToast } from './ui.jsx';
import Login from './Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Posts from './pages/Posts.jsx';
import PostEditor from './pages/PostEditor.jsx';
import Reviews from './pages/Reviews.jsx';
import Messages from './pages/Messages.jsx';
import Subscribers from './pages/Subscribers.jsx';
import Settings from './pages/Settings.jsx';

const NAV = [
  { page: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { page: 'posts', label: 'Posts', icon: 'posts' },
  { page: 'reviews', label: 'Reviews', icon: 'reviews' },
  { page: 'messages', label: 'Messages', icon: 'messages' },
  { page: 'subscribers', label: 'Subscribers', icon: 'subscribers' },
  { page: 'settings', label: 'Settings', icon: 'settings' },
];
const PAGES = new Set(NAV.map((n) => n.page));

function parseHash() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map((p) => {
    try { return decodeURIComponent(p); } catch { return p; }
  });
  const page = PAGES.has(parts[0]) ? parts[0] : 'dashboard';
  return { page, a: parts[1], b: parts[2] };
}

/* --------------------------------------------------------------------- app */
export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Root />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function Root() {
  const [status, setStatus] = useState('loading'); // loading | login | ready | error
  const [session, setSession] = useState(null);
  const [data, setData] = useState(null);
  const [notice, setNotice] = useState('');

  const start = useCallback(async () => {
    setStatus('loading');
    try {
      const s = await admin.session();
      setSession(s);
      if (!s.authed) { setStatus('login'); return; }
      setData(await admin.getState());
      setStatus('ready');
    } catch (e) {
      if (e.status === 401) { setStatus('login'); return; }
      setNotice(e.message || 'The admin panel could not load.');
      setStatus('error');
    }
  }, []);

  useEffect(() => { start(); }, [start]);

  const expired = useCallback(() => {
    setNotice('Your session expired. Please sign in again.');
    setData(null);
    setStatus('login');
  }, []);

  if (status === 'loading') {
    return (
      <div className="boot">
        <img src={asset('img/brand/logo-dark.webp')} alt="William W. Halford" width="220" height="37" />
        <Spinner label="Loading the admin panel" />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="boot">
        <img src={asset('img/brand/logo-dark.webp')} alt="William W. Halford" width="220" height="37" />
        <p className="boot__error" role="alert">{notice}</p>
        <button type="button" className="btn btn--primary" onClick={start}>Try again</button>
      </div>
    );
  }
  if (status === 'login') {
    return <Login session={session} notice={notice} onSignedIn={() => { setNotice(''); start(); }} />;
  }
  return <Shell session={session} data={data} setData={setData} onExpired={expired} onSignedOut={() => { setNotice(''); setData(null); setStatus('login'); }} />;
}

/* ------------------------------------------------------------------- shell */
function Shell({ session, data, setData, onExpired, onSignedOut }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [route, setRoute] = useState(parseHash);
  const [drawer, setDrawer] = useState(false);
  const guard = useRef(null); // () => boolean: true when the current screen has unsaved changes
  const currentHash = useRef(window.location.hash);
  const allowNext = useRef(false);
  const mainRef = useRef(null);
  const menuBtn = useRef(null);
  const demo = session.mode === 'demo';

  // Hash router with an unsaved-changes guard (covers links, the back button and programmatic navigation).
  useEffect(() => {
    const onHash = async () => {
      const target = window.location.hash;
      if (target === currentHash.current) return;
      if (!allowNext.current && guard.current?.()) {
        window.history.replaceState(null, '', currentHash.current || '#/');
        const ok = await confirm({
          title: 'Discard unsaved changes?',
          body: 'You have edits on this screen that have not been saved. Leaving now will lose them.',
          confirmLabel: 'Discard changes',
          cancelLabel: 'Keep editing',
          tone: 'danger',
        });
        if (!ok) return;
        guard.current = null;
        allowNext.current = true;
        window.location.hash = target;
        return;
      }
      allowNext.current = false;
      currentHash.current = target;
      setRoute(parseHash());
      setDrawer(false);
      mainRef.current?.scrollTo?.(0, 0);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [confirm]);

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    const onUnload = (e) => {
      if (guard.current?.()) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  // Drawer: Esc closes, focus moves in and back out.
  useEffect(() => {
    if (!drawer) return undefined;
    const first = document.querySelector('.sidebar a, .sidebar button');
    first?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { setDrawer(false); menuBtn.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  const navigate = useCallback((path, { replace = false, force = false } = {}) => {
    const target = href(path);
    if (force) { guard.current = null; allowNext.current = true; }
    if (replace) {
      window.history.replaceState(null, '', target);
      currentHash.current = target;
      setRoute(parseHash());
      return;
    }
    if (window.location.hash === target) return;
    window.location.hash = target;
  }, []);

  /** Runs a store call with error handling. Returns the result (or true), or undefined when it failed. */
  const act = useCallback(async (fn, success) => {
    try {
      const v = await fn();
      if (success) toast(success);
      return v ?? true;
    } catch (e) {
      if (e?.status === 401) { onExpired(); return undefined; }
      toast(e?.message || 'Something went wrong. Please try again.', 'error');
      return undefined;
    }
  }, [toast, onExpired]);

  const update = useCallback((fn) => setData((d) => {
    const next = { ...d };
    fn(next);
    return next;
  }), [setData]);

  const resetData = useCallback(async () => {
    const ok = await confirm({
      title: demo ? 'Reset demo data?' : 'Restore the sample content?',
      body: demo
        ? 'This removes every change made in this browser (posts, reviews, messages, subscribers and settings) and restores the original example content.'
        : 'This replaces ALL live content (posts, reviews, messages, subscribers and settings) with the original sample content. Visitors will see the change right away. This cannot be undone.',
      confirmLabel: demo ? 'Reset demo data' : 'Replace live content',
      tone: 'danger',
    });
    if (!ok) return;
    const fresh = await act(() => admin.reset(), demo ? 'Demo data reset.' : 'Sample content restored.');
    if (fresh) {
      setData(fresh === true ? await admin.getState() : fresh);
      navigate('dashboard', { force: true });
    }
  }, [act, confirm, demo, navigate, setData]);

  const signOut = useCallback(async () => {
    if (guard.current?.()) {
      const ok = await confirm({ title: 'Sign out with unsaved changes?', body: 'Your unsaved edits on this screen will be lost.', confirmLabel: 'Sign out', cancelLabel: 'Keep editing', tone: 'danger' });
      if (!ok) return;
    }
    guard.current = null;
    try { await admin.logout(); } catch { /* ignore: we sign out locally either way */ }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    onSignedOut();
  }, [confirm, onSignedOut]);

  const unread = data.messages.filter((m) => !m.read).length;
  const ctx = useMemo(() => ({ session, demo, data, setData, update, act, navigate, guard, toast, confirm, resetData }), [session, demo, data, setData, update, act, navigate, toast, confirm, resetData]);

  let page;
  switch (route.page) {
    case 'posts':
      page = route.a === 'new' ? <PostEditor key="new" id={null} />
        : route.a === 'edit' && route.b ? <PostEditor key={route.b} id={route.b} />
          : <Posts />;
      break;
    case 'reviews': page = <Reviews />; break;
    case 'messages': page = <Messages openId={route.a || null} />; break;
    case 'subscribers': page = <Subscribers />; break;
    case 'settings': page = <Settings />; break;
    default: page = <Dashboard />;
  }

  return (
    <AdminCtx.Provider value={ctx}>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
      <div className={`shell ${drawer ? 'shell--drawer' : ''}`}>
        <aside className="sidebar" id="sidebar" aria-label="Admin navigation">
          <div className="sidebar__top">
            <a href={href('dashboard')} className="sidebar__logo">
              <img src={asset('img/brand/logo-light.webp')} alt="William W. Halford" width="732" height="124" />
            </a>
            <span className="sidebar__kicker">Site admin</span>
            <button type="button" className="icon-btn icon-btn--dark sidebar__close" onClick={() => { setDrawer(false); menuBtn.current?.focus(); }} aria-label="Close menu">
              <Icon name="close" />
            </button>
          </div>
          <nav className="nav" aria-label="Sections">
            <ul>
              {NAV.map((n) => (
                <li key={n.page}>
                  <a href={href(n.page)} className={`nav__link ${route.page === n.page ? 'is-active' : ''}`} aria-current={route.page === n.page ? 'page' : undefined}>
                    <Icon name={n.icon} size={19} />
                    <span>{n.label}</span>
                    {n.page === 'messages' && unread > 0 && (
                      <span className="nav__badge">{unread}<span className="sr-only"> unread</span></span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="sidebar__foot">
            <span className={`mode-pill ${demo ? 'mode-pill--demo' : 'mode-pill--live'}`} title={demo ? 'No database connected: changes stay in this browser' : 'Connected to the live database'}>
              <span className="mode-pill__dot" aria-hidden="true" />
              {demo ? 'Demo data' : 'Live'}
            </span>
            <a className="side-link" href="index.html" target="_blank" rel="noopener noreferrer">
              <Icon name="external" size={17} />
              View site<span className="sr-only"> (opens in a new tab)</span>
            </a>
            <button type="button" className="side-link" onClick={signOut}>
              <Icon name="logout" size={17} />
              Sign out
            </button>
          </div>
        </aside>
        <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

        <div className="main" inert={drawer || undefined}>
          <header className="mobilebar">
            <button ref={menuBtn} type="button" className="icon-btn icon-btn--dark" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer} aria-controls="sidebar">
              <Icon name="menu" size={22} />
              {unread > 0 && <span className="mobilebar__dot" aria-hidden="true" />}
            </button>
            <a href={href('dashboard')} className="mobilebar__logo">
              <img src={asset('img/brand/logo-light.webp')} alt="William W. Halford admin" width="732" height="124" />
            </a>
            <span className={`mode-pill mode-pill--sm ${demo ? 'mode-pill--demo' : 'mode-pill--live'}`}>
              <span className="mode-pill__dot" aria-hidden="true" />
              {demo ? 'Demo' : 'Live'}
            </span>
          </header>

          {demo && (
            <div className="demo-banner" role="note">
              <Icon name="database" size={18} className="demo-banner__icon" />
              <p><strong>Demo mode.</strong> No database is connected, so changes are saved in this browser only.</p>
              <button type="button" className="btn btn--sm btn--ghost-dark" onClick={resetData}>
                <Icon name="refresh" size={15} /> Reset demo data
              </button>
            </div>
          )}

          <main id="main" ref={mainRef} tabIndex={-1} className="content" aria-labelledby="page-title">
            {page}
          </main>
        </div>
      </div>
    </AdminCtx.Provider>
  );
}
