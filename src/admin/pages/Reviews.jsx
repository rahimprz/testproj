import { useId, useState } from 'react';
import { admin } from '../../lib/store.js';
import { useAdmin } from '../context.js';
import { Icon } from '../icons.jsx';
import { PageHeader, Dialog, Field, Counter, Switch, Stars, Empty } from '../ui.jsx';

const BLANK = { title: '', text: '', name: '', rating: 5, visible: true };

export default function Reviews() {
  const { data, update, act, confirm } = useAdmin();
  const [editing, setEditing] = useState(null); // null | review-like object
  const [busy, setBusy] = useState(null);
  const [announce, setAnnounce] = useState('');
  const reviews = data.reviews;
  const shown = reviews.filter((r) => r.visible).length;

  async function move(index, dir) {
    const j = index + dir;
    if (j < 0 || j >= reviews.length) return;
    const next = [...reviews];
    [next[index], next[j]] = [next[j], next[index]];
    const prev = reviews;
    update((d) => { d.reviews = next; });
    setAnnounce(`Moved "${reviews[index].title || 'review'}" to position ${j + 1} of ${reviews.length}.`);
    const ok = await act(() => admin.reorderReviews(next.map((r) => r.id)));
    if (!ok) update((d) => { d.reviews = prev; });
    // Keep focus on the same control after the list re-renders.
    requestAnimationFrame(() => {
      const btn = document.querySelector(`[data-move="${next[j].id}:${dir}"]`);
      (btn && !btn.disabled ? btn : document.querySelector(`[data-move="${next[j].id}:${-dir}"]`))?.focus();
    });
  }

  async function toggleVisible(r) {
    setBusy(r.id);
    const saved = await act(() => admin.saveReview({ ...r, visible: !r.visible }), r.visible ? 'Review hidden from the site.' : 'Review is now shown on the site.');
    setBusy(null);
    if (saved && saved !== true) update((d) => { d.reviews = d.reviews.map((x) => (x.id === r.id ? saved : x)); });
  }

  async function remove(r) {
    const ok = await confirm({
      title: 'Delete this review?',
      body: `"${r.title || r.text.slice(0, 60)}" will be removed permanently. To keep it but take it off the site, switch "Shown on site" off instead.`,
      confirmLabel: 'Delete review',
      tone: 'danger',
    });
    if (!ok) return;
    const done = await act(() => admin.deleteReview(r.id), 'Review deleted.');
    if (done) update((d) => { d.reviews = d.reviews.filter((x) => x.id !== r.id); });
  }

  async function saveReview(form) {
    const saved = await act(() => admin.saveReview(form), form.id ? 'Review updated.' : 'Review added.');
    if (!saved || saved === true) return false;
    update((d) => {
      const i = d.reviews.findIndex((x) => x.id === saved.id);
      d.reviews = i >= 0 ? d.reviews.map((x) => (x.id === saved.id ? saved : x)) : [...d.reviews, saved];
    });
    return true;
  }

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle={`Reader reviews shown on the site, in this order. ${shown} of ${reviews.length} shown.`}
        actions={<button type="button" className="btn btn--primary" onClick={() => setEditing({ ...BLANK })}><Icon name="plus" /> Add review</button>}
      />
      <p className="sr-only" aria-live="polite">{announce}</p>

      {reviews.length ? (
        <ol className="reviews">
          {reviews.map((r, i) => (
            <li key={r.id} className={`review card ${r.visible ? '' : 'review--hidden'} ${busy === r.id ? 'is-busy' : ''}`}>
              <div className="review__order">
                <span className="review__pos" aria-hidden="true">{i + 1}</span>
                <button type="button" className="icon-btn icon-btn--sm" data-move={`${r.id}:-1`} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move "${r.title || 'review'}" up`}>
                  <Icon name="up" size={16} />
                </button>
                <button type="button" className="icon-btn icon-btn--sm" data-move={`${r.id}:1`} onClick={() => move(i, 1)} disabled={i === reviews.length - 1} aria-label={`Move "${r.title || 'review'}" down`}>
                  <Icon name="down" size={16} />
                </button>
              </div>
              <div className="review__body">
                <div className="review__top">
                  <Stars value={r.rating} />
                  {!r.visible && <span className="pill pill--muted"><Icon name="eyeOff" size={13} /> Hidden</span>}
                </div>
                <h2 className="review__title">{r.title || <span className="muted">Untitled review</span>}</h2>
                <p className="review__text">{r.text}</p>
                <p className="review__name">— {r.name || 'Anonymous reader'}</p>
              </div>
              <div className="review__actions">
                <Switch compact checked={r.visible} onChange={() => toggleVisible(r)} label={`Show "${r.title || 'review'}" on site`} disabled={busy === r.id} />
                <span className="review__vis-label" aria-hidden="true">{r.visible ? 'Shown' : 'Hidden'}</span>
                <span className="review__btns">
                  <button type="button" className="icon-btn" onClick={() => setEditing({ ...r })} aria-label={`Edit "${r.title || 'review'}"`} title="Edit"><Icon name="edit" /></button>
                  <button type="button" className="icon-btn icon-btn--danger" onClick={() => remove(r)} aria-label={`Delete "${r.title || 'review'}"`} title="Delete"><Icon name="trash" /></button>
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="card">
          <Empty icon="reviews" title="No reviews yet" action={<button type="button" className="btn btn--primary" onClick={() => setEditing({ ...BLANK })}><Icon name="plus" /> Add the first review</button>}>
            Add reader reviews to show them in the Reviews section of the site.
          </Empty>
        </div>
      )}

      {editing && <ReviewDialog key={editing.id || 'new'} initial={editing} onClose={() => setEditing(null)} onSave={saveReview} />}
    </>
  );
}

function ReviewDialog({ initial, onClose, onSave }) {
  const { confirm } = useAdmin();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const id = useId();
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined })); };
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  async function close() {
    if (dirty && !(await confirm({ title: 'Discard changes to this review?', confirmLabel: 'Discard', cancelLabel: 'Keep editing', tone: 'danger' }))) return;
    onClose();
  }

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.text.trim()) errs.text = 'Add the review text.';
    if (!form.title.trim()) errs.title = 'Add a short headline for the review.';
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`${id}-${errs.title ? 'title' : 'text'}`)?.focus();
      return;
    }
    setSaving(true);
    const ok = await onSave({ ...form, title: form.title.trim(), text: form.text.trim(), name: form.name.trim() });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Dialog
      open
      onClose={close}
      title={initial.id ? 'Edit review' : 'Add review'}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={close}>Cancel</button>
          <button type="submit" form={`${id}-form`} className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : initial.id ? 'Save review' : 'Add review'}</button>
        </>
      }
    >
      <form id={`${id}-form`} className="stack" onSubmit={submit} noValidate>
        <fieldset className="rating">
          <legend className="field__label">Rating</legend>
          <div className="rating__stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className={`rating__star ${n <= form.rating ? 'is-on' : ''}`}>
                <input type="radio" name={`${id}-rating`} value={n} checked={form.rating === n} onChange={() => set('rating', n)} />
                <Icon name="star" size={26} filled={n <= form.rating} />
                <span className="sr-only">{n} {n === 1 ? 'star' : 'stars'}</span>
              </label>
            ))}
            <span className="rating__value" aria-hidden="true">{form.rating} / 5</span>
          </div>
        </fieldset>
        <Field label="Headline" id={`${id}-title`} error={errors.title} counter={<Counter value={form.title} max={160} />}>
          <input id={`${id}-title`} className="input" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={160} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? `${id}-title-error` : undefined} data-autofocus />
        </Field>
        <Field label="Review" id={`${id}-text`} error={errors.text} counter={<Counter value={form.text} max={2000} />}>
          <textarea id={`${id}-text`} className="input" rows={6} value={form.text} onChange={(e) => set('text', e.target.value)} maxLength={2000} aria-invalid={Boolean(errors.text)} aria-describedby={errors.text ? `${id}-text-error` : undefined} />
        </Field>
        <Field label="Reader's name" id={`${id}-name`} optional hint='Leave empty to show "Anonymous reader".'>
          <input id={`${id}-name`} className="input" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={80} aria-describedby={`${id}-name-hint`} autoComplete="off" />
        </Field>
        <Switch checked={form.visible} onChange={(v) => set('visible', v)} label="Shown on site" description="Hidden reviews stay here but are not shown to visitors." />
      </form>
    </Dialog>
  );
}
