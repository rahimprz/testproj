/** Pill button with rolling label and round icon, matching the shared .btn styles. */
export default function Btn({ href, label, icon = '→', variant = '', size = '', className = '', magnetic = '0.2', external, type, onClick, disabled }) {
  const cls = ['btn', variant && `btn--${variant}`, size && `btn--${size}`, className].filter(Boolean).join(' ');
  const inner = (
    <>
      <span className="btn__label"><span className="btn__label-inner" data-text={label}>{label}</span></span>
      {icon ? <span className="btn__icon" aria-hidden="true">{icon}</span> : null}
    </>
  );
  if (href) {
    const ext = external ?? /^https?:/.test(href);
    return (
      <a className={cls} href={href} data-magnetic={magnetic || undefined} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {inner}
      </a>
    );
  }
  return (
    <button className={cls} type={type || 'button'} onClick={onClick} disabled={disabled} data-magnetic={magnetic || undefined}>
      {inner}
    </button>
  );
}
