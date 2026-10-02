import { useEffect, useId, useRef, useState } from 'react';
import { admin } from '../../lib/store.js';
import { useAdmin } from '../context.js';
import { Icon } from '../icons.jsx';
import { PageHeader, Field, Counter } from '../ui.jsx';
import { isHttpUrl, isEmail } from '../shared.jsx';

const KEYS = ['amazonUrl', 'orderUrl', 'instagramUrl', 'facebookUrl', 'contactEmail', 'announcement'];
const pick = (s = {}) => Object.fromEntries(KEYS.map((k) => [k, s[k] || '']));
const ANNOUNCE_MAX = 200;

export default function Settings() {
  const { data, update, act, guard, toast, resetData, demo } = useAdmin();
  const [form, setForm] = useState(() => pick(data.settings));
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(pick(data.settings)));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const uid = useId();
  const id = (k) => `${uid}-${k}`;
  const dirty = JSON.stringify(form) !== snapshot;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    guard.current = () => dirtyRef.current;
    return () => { guard.current = null; };
  }, [guard]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function validate(f) {
    const e = {};
    for (const k of ['amazonUrl', 'orderUrl', 'instagramUrl', 'facebookUrl']) {
      const v = f[k].trim();
      if (v && !isHttpUrl(v)) e[k] = 'Enter a full web address starting with https:// (or http://).';
    }
    if (f.contactEmail.trim() && !isEmail(f.contactEmail.trim())) e.contactEmail = 'Enter a valid email address, like name@example.com.';
    return e;
  }

  async function save(ev) {
    ev.preventDefault();
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
    const errs = validate(clean);
    setErrors(errs);
    const first = KEYS.find((k) => errs[k]);
    if (first) {
      document.getElementById(id(first))?.focus();
      toast('Please fix the highlighted fields.', 'error');
      return;
    }
    setSaving(true);
    const saved = await act(() => admin.saveSettings(clean), 'Settings saved.');
    setSaving(false);
    if (!saved || saved === true) return;
    update((d) => { d.settings = saved; });
    const next = pick(saved);
    setForm(next);
    setSnapshot(JSON.stringify(next));
    dirtyRef.current = false;
  }

  const url = (k, label, hint, placeholder) => (
    <Field label={label} id={id(k)} hint={hint} error={errors[k]}>
      <input
        id={id(k)}
        className="input"
        type="url"
        inputMode="url"
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        onBlur={() => { const v = form[k].trim(); if (v && !errors[k] && !isHttpUrl(v)) setErrors((x) => ({ ...x, [k]: 'Enter a full web address starting with https:// (or http://).' })); }}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={Boolean(errors[k])}
        aria-describedby={errors[k] ? `${id(k)}-error` : hint ? `${id(k)}-hint` : undefined}
      />
    </Field>
  );

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Links and contact details used across the site."
        actions={
          <>
            {dirty && <span className="save-state save-state--dirty"><span className="save-state__dot" aria-hidden="true" />Unsaved changes</span>}
            <button type="submit" form="settings-form" className="btn btn--primary" disabled={saving}><Icon name="check" /> {saving ? 'Saving…' : 'Save changes'}</button>
          </>
        }
      />

      <form id="settings-form" className="settings" onSubmit={save} noValidate>
        <section className="card settings__section" aria-labelledby={`${uid}-buy`}>
          <div className="settings__intro">
            <h2 className="card__title" id={`${uid}-buy`}>Where to buy</h2>
            <p className="muted">Where the buy buttons send readers.</p>
          </div>
          <div className="stack">
            {url('amazonUrl', 'Amazon link', 'Used by the "Buy Now On Amazon" button. Leave empty to hide it.', 'https://www.amazon.com/dp/…')}
            {url('orderUrl', 'Order link', 'Where readers order a signed or direct copy.', 'https://…')}
          </div>
        </section>

        <section className="card settings__section" aria-labelledby={`${uid}-social`}>
          <div className="settings__intro">
            <h2 className="card__title" id={`${uid}-social`}>Social & contact</h2>
            <p className="muted">Shown in the footer and contact section. Empty links are hidden.</p>
          </div>
          <div className="stack">
            {url('instagramUrl', 'Instagram', null, 'https://instagram.com/…')}
            {url('facebookUrl', 'Facebook', null, 'https://facebook.com/…')}
            <Field label="Contact email" id={id('contactEmail')} hint="Public email address shown on the site." error={errors.contactEmail}>
              <input
                id={id('contactEmail')}
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.contactEmail}
                onChange={(e) => set('contactEmail', e.target.value)}
                onBlur={() => { const v = form.contactEmail.trim(); if (v && !isEmail(v)) setErrors((x) => ({ ...x, contactEmail: 'Enter a valid email address, like name@example.com.' })); }}
                placeholder="hello@example.com"
                aria-invalid={Boolean(errors.contactEmail)}
                aria-describedby={errors.contactEmail ? `${id('contactEmail')}-error` : `${id('contactEmail')}-hint`}
              />
            </Field>
          </div>
        </section>

        <section className="card settings__section" aria-labelledby={`${uid}-ann`}>
          <div className="settings__intro">
            <h2 className="card__title" id={`${uid}-ann`}>Announcement</h2>
            <p className="muted">A short line shown at the top of the site, such as a launch date or event. Leave empty for none.</p>
          </div>
          <div className="stack">
            <Field label="Announcement text" id={id('announcement')} counter={<Counter value={form.announcement} max={ANNOUNCE_MAX} />} optional>
              <textarea id={id('announcement')} className="input" rows={2} maxLength={ANNOUNCE_MAX} value={form.announcement} onChange={(e) => set('announcement', e.target.value)} placeholder="Book signing this Saturday at 2 PM, Flagstaff Public Library" />
            </Field>
          </div>
        </section>
      </form>

      <section className="card danger" aria-labelledby={`${uid}-danger`}>
        <div className="settings__intro">
          <h2 className="card__title" id={`${uid}-danger`}>Danger zone</h2>
          <p className="muted">{demo ? 'Undo everything you changed in this browser.' : 'Start over from the bundled sample content.'}</p>
        </div>
        <div className="danger__row">
          <p>
            {demo
              ? 'Reset demo data restores the example posts, reviews, messages, subscribers and settings in this browser.'
              : 'Replaces all live posts, reviews, messages, subscribers and settings with the sample content. This cannot be undone.'}
          </p>
          <button type="button" className="btn btn--danger" onClick={resetData}><Icon name="refresh" /> {demo ? 'Reset demo data' : 'Reset all content'}</button>
        </div>
      </section>
    </>
  );
}
