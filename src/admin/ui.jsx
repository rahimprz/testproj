import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons.jsx';

/* ------------------------------------------------------------------ dialogs */
// A stack so Esc and the focus trap only act on the top-most dialog.
const dialogStack = [];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function setBackgroundInert(on) {
  const root = document.getElementById('root');
  if (!root) return;
  if (on) root.setAttribute('inert', '');
  else root.removeAttribute('inert');
}

export function Dialog({ open, onClose, title, description, children, footer, size = 'md', initialFocusRef, className = '' }) {
  const panel = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const token = {};
    const previous = document.activeElement;
    dialogStack.push(token);
    setBackgroundInert(true);
    document.body.classList.add('has-dialog');
    const focusFirst = () => {
      const el = initialFocusRef?.current || panel.current?.querySelector('[data-autofocus]') || panel.current?.querySelector(FOCUSABLE) || panel.current;
      el?.focus({ preventScroll: true });
    };
    const raf = requestAnimationFrame(focusFirst);
    const onKey = (e) => {
      if (dialogStack[dialogStack.length - 1] !== token) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current?.();
      } else if (e.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
        if (!items.length) { e.preventDefault(); return; }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !panel.current.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      const i = dialogStack.indexOf(token);
      if (i >= 0) dialogStack.splice(i, 1);
      if (!dialogStack.length) { setBackgroundInert(false); document.body.classList.remove('has-dialog'); }
      if (previous && previous.isConnected && typeof previous.focus === 'function') previous.focus({ preventScroll: true });
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  return createPortal(
    <div className="dlg-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCloseRef.current?.(); }}>
      <div
        ref={panel}
        className={`dlg dlg--${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
      >
        <div className="dlg__head">
          <h2 id={titleId} className="dlg__title">{title}</h2>
          <button type="button" className="icon-btn" onClick={() => onCloseRef.current?.()} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        {description && <p id={descId} className="dlg__desc">{description}</p>}
        {children && <div className="dlg__body">{children}</div>}
        {footer && <div className="dlg__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ----------------------------------------------------------- confirm dialog */
const ConfirmCtx = createContext(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null);
  const cancelRef = useRef(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setReq({ ...opts, resolve })), []);
  const finish = (value) => {
    if (!req) return;
    req.resolve(value);
    setReq(null);
  };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Dialog
        open={Boolean(req)}
        onClose={() => finish(false)}
        title={req?.title}
        description={req?.body}
        size="sm"
        className="dlg--confirm"
        initialFocusRef={cancelRef}
        footer={
          <>
            <button ref={cancelRef} type="button" className="btn btn--ghost" onClick={() => finish(false)}>
              {req?.cancelLabel || 'Cancel'}
            </button>
            <button type="button" className={`btn ${req?.tone === 'danger' ? 'btn--danger' : 'btn--primary'}`} onClick={() => finish(true)}>
              {req?.confirmLabel || 'Confirm'}
            </button>
          </>
        }
      />
    </ConfirmCtx.Provider>
  );
}

/* ------------------------------------------------------------------- toasts */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const timers = useRef(new Map());
  const dismiss = useCallback((id) => {
    setItems((list) => list.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);
  const toast = useCallback((text, kind = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list.slice(-2), { id, text, kind }]);
    timers.current.set(id, setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4000));
  }, [dismiss]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {createPortal(
        <div className="toasts" role="region" aria-label="Notifications">
          <div aria-live="polite" aria-atomic="false" className="toasts__list">
            {items.map((t) => (
              <div key={t.id} className={`toast toast--${t.kind}`}>
                <Icon name={t.kind === 'error' ? 'alert' : t.kind === 'info' ? 'info' : 'check'} className="toast__icon" />
                <p className="toast__text">{t.kind === 'error' && <span className="sr-only">Error: </span>}{t.text}</p>
                <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                  <Icon name="close" size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

/* ------------------------------------------------------------- form pieces */
export function Field({ label, id, hint, error, counter, optional, children, className = '' }) {
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      <div className="field__top">
        <label className="field__label" htmlFor={id}>
          {label}
          {optional && <span className="field__opt"> (optional)</span>}
        </label>
        {counter}
      </div>
      {children}
      {hint && !error && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field__error" id={`${id}-error`}><Icon name="alert" size={14} /> {error}</p>}
    </div>
  );
}

export function Counter({ value, max, id }) {
  const n = String(value || '').length;
  return (
    <span className={`counter ${n > max * 0.9 ? 'counter--warn' : ''}`} id={id} aria-live="polite">
      {n}/{max}
    </span>
  );
}

export function Switch({ checked, onChange, label, description, id, disabled, compact = false }) {
  const autoId = useId();
  const sid = id || autoId;
  return (
    <div className={`switch-row ${compact ? 'switch-row--compact' : ''}`}>
      <button
        id={sid}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${sid}-d` : undefined}
        className="switch"
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className="switch__thumb" />
        {compact && <span className="sr-only">{label}</span>}
      </button>
      {!compact && (
        <span className="switch-row__text">
          <label htmlFor={sid} className="switch-row__label">{label}</label>
          {description && <span id={`${sid}-d`} className="switch-row__desc">{description}</span>}
        </span>
      )}
    </div>
  );
}

export function Stars({ value, size = 16 }) {
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} filled={n <= value} className={n <= value ? 'stars__on' : 'stars__off'} />
      ))}
    </span>
  );
}

export function SearchBox({ value, onChange, label, placeholder }) {
  const id = useId();
  return (
    <div className="search">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Icon name="search" className="search__icon" />
      <input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || label} autoComplete="off" />
    </div>
  );
}

export function Empty({ icon = 'info', title, children, action }) {
  return (
    <div className="empty">
      <span className="empty__icon"><Icon name={icon} size={22} /></span>
      <p className="empty__title">{title}</p>
      {children && <p className="empty__text">{children}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <header className="page-head">
      <div className="page-head__titles">
        {back}
        <h1 className="page-head__title" id="page-title">{title}</h1>
        {subtitle && <p className="page-head__sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}

export function Spinner({ label = 'Loading' }) {
  return <span className="spinner" role="status"><span className="sr-only">{label}</span></span>;
}
