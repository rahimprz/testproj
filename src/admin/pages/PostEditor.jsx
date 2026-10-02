import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { admin, asset, slugify } from '../../lib/store.js';
import { renderMarkdown, formatDate } from '../../lib/markdown.js';
import { useAdmin, href } from '../context.js';
import { Icon } from '../icons.jsx';
import { PageHeader, Field, Counter, Switch, Dialog, Empty } from '../ui.jsx';
import { COVERS, todayISO } from '../shared.jsx';

const DEFAULT_CATEGORIES = ['News', 'Behind the Book', 'The Author', 'Worldbuilding', 'Readers', 'Events'];
const EXCERPT_MAX = 400;

function toForm(p) {
  return {
    title: p?.title || '',
    slug: p?.slug || '',
    category: p?.category || 'News',
    date: p?.date || todayISO(),
    status: p?.status === 'published' ? 'published' : 'draft',
    featured: Boolean(p?.featured),
    excerpt: p?.excerpt || '',
    cover: p?.cover || '',
    body: p?.body || '',
  };
}

export default function PostEditor({ id }) {
  const { data, update, act, navigate, guard, toast } = useAdmin();
  const existing = id ? data.posts.find((p) => p.id === id) : null;
  const [form, setForm] = useState(() => toForm(existing));
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(toForm(existing)));
  const [slugTouched, setSlugTouched] = useState(Boolean(existing));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('write');
  const [library, setLibrary] = useState(false);
  const titleRef = useRef(null);
  const dateRef = useRef(null);
  const bodyRef = useRef(null);
  const fileRef = useRef(null);
  const uid = useId();
  const ids = { title: `${uid}-title`, slug: `${uid}-slug`, cat: `${uid}-cat`, date: `${uid}-date`, excerpt: `${uid}-ex`, body: `${uid}-body`, cats: `${uid}-cats` };

  const dirty = JSON.stringify(form) !== snapshot;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Register the unsaved-changes guard with the router.
  useEffect(() => {
    guard.current = () => dirtyRef.current;
    return () => { guard.current = null; };
  }, [guard]);

  const categories = useMemo(() => [...new Set([...DEFAULT_CATEGORIES, ...data.posts.map((p) => p.category).filter(Boolean)])], [data.posts]);
  const words = form.body.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));

  if (id && !existing) {
    return (
      <>
        <PageHeader title="Post not found" back={<a className="back-link" href={href('posts')}><Icon name="back" size={16} /> Posts</a>} />
        <div className="card"><Empty icon="posts" title="This post no longer exists">It may have been deleted, or the demo data was reset.</Empty></div>
      </>
    );
  }

  const set = (key, value) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = value.trim() ? slugify(value) : '';
      return next;
    });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function save(e) {
    e?.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Give the post a title.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errs.date = 'Choose a valid date.';
    setErrors(errs);
    if (Object.keys(errs).length) {
      (errs.title ? titleRef : dateRef).current?.focus();
      toast('Please fix the highlighted fields.', 'error');
      return;
    }
    setSaving(true);
    const payload = { ...form, id: existing?.id, title: form.title.trim(), slug: form.slug || slugify(form.title), category: form.category.trim() || 'News' };
    const saved = await act(() => admin.savePost(payload));
    setSaving(false);
    if (!saved || saved === true) return;
    update((d) => {
      const i = d.posts.findIndex((p) => p.id === saved.id);
      d.posts = i >= 0 ? d.posts.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...d.posts];
    });
    const next = toForm(saved);
    setForm(next);
    setSnapshot(JSON.stringify(next));
    dirtyRef.current = false;
    toast(saved.status === 'published' ? (existing ? 'Post updated. It is live on the site.' : 'Post published.') : 'Draft saved.');
    if (!existing) navigate(`posts/edit/${encodeURIComponent(saved.id)}`, { replace: true });
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    const url = await act(() => admin.uploadImage(file), 'Image uploaded.');
    setUploading(false);
    if (url && url !== true) set('cover', url);
  }

  /* -------- markdown toolbar -------- */
  function replaceRange(ta, start, end, text, selStart, selEnd) {
    ta.focus();
    ta.setSelectionRange(start, end);
    let ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch { ok = false; }
    if (!ok || ta.value.slice(start, start + text.length) !== text) {
      const v = form.body;
      set('body', v.slice(0, start) + text + v.slice(end));
    }
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start + selStart, start + selEnd); });
  }

  function format(kind) {
    const ta = bodyRef.current;
    if (!ta) return;
    const v = ta.value;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const sel = v.slice(s, e);

    if (kind === 'bold' || kind === 'italic') {
      const mark = kind === 'bold' ? '**' : '*';
      const placeholder = kind === 'bold' ? 'bold text' : 'italic text';
      // Toggle off when the selection is already wrapped.
      if (sel && v.slice(s - mark.length, s) === mark && v.slice(e, e + mark.length) === mark && !(kind === 'italic' && v.slice(s - 2, s) === '**')) {
        replaceRange(ta, s - mark.length, e + mark.length, sel, 0, sel.length);
        return;
      }
      const lead = sel.match(/^\s*/)[0];
      const trail = sel.match(/\s*$/)[0];
      const inner = sel.trim() || placeholder;
      const text = `${lead}${mark}${inner}${mark}${sel.trim() ? trail : ''}`;
      replaceRange(ta, s, e, text, lead.length + mark.length, lead.length + mark.length + inner.length);
      return;
    }
    if (kind === 'link') {
      const label = sel.trim() || 'link text';
      const text = `[${label}](https://)`;
      replaceRange(ta, s, e, text, label.length + 3, label.length + 11);
      return;
    }
    // Line-based blocks: heading, quote, list. Toggle when every line already has the prefix.
    const prefix = kind === 'h2' ? '## ' : kind === 'quote' ? '> ' : '- ';
    const ls = v.lastIndexOf('\n', s - 1) + 1;
    let le = v.indexOf('\n', e > s && v[e - 1] === '\n' ? e - 1 : e);
    if (le === -1) le = v.length;
    const lines = v.slice(ls, le).split('\n');
    const all = lines.every((l) => l.startsWith(prefix));
    let out = lines.map((l) => {
      if (all) return l.slice(prefix.length);
      const clean = l.replace(/^(#{1,6} |> |[-*] )/, '');
      return kind === 'h2' && !clean.trim() ? `${prefix}Heading` : `${prefix}${clean}`;
    }).join('\n');
    if (lines.length === 1 && !lines[0].trim() && !all) out = kind === 'h2' ? '## Heading' : kind === 'quote' ? '> Quote' : '- List item';
    // Blocks need a blank line around them to render as their own block.
    const before = !all && ls > 0 && v.slice(Math.max(0, ls - 2), ls) !== '\n\n' ? (v[ls - 1] === '\n' ? '\n' : '\n\n') : '';
    const after = !all && le < v.length && v.slice(le, le + 2) !== '\n\n' ? '\n' : '';
    const text = before + out + after;
    const contentStart = before.length + (all ? 0 : prefix.length);
    const contentEnd = before.length + out.length;
    replaceRange(ta, ls, le, text, lines.length === 1 ? contentStart : before.length, contentEnd);
  }

  function onBodyKey(e) {
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); format('bold'); }
    else if (k === 'i') { e.preventDefault(); format('italic'); }
    else if (k === 'k') { e.preventDefault(); format('link'); }
  }

  function onFormKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (!saving) save(); }
  }

  function onTabKey(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = tab === 'write' ? 'preview' : 'write';
      setTab(next);
      requestAnimationFrame(() => document.getElementById(`${uid}-tab-${next}`)?.focus());
    }
  }

  const TOOLS = [
    { k: 'h2', icon: 'heading', label: 'Heading' },
    { k: 'bold', icon: 'bold', label: 'Bold (Ctrl+B)' },
    { k: 'italic', icon: 'italic', label: 'Italic (Ctrl+I)' },
    { k: 'quote', icon: 'quote', label: 'Quote' },
    { k: 'list', icon: 'list', label: 'Bulleted list' },
    { k: 'link', icon: 'link', label: 'Link (Ctrl+K)' },
  ];

  const statusText = saving ? 'Saving…' : dirty ? 'Unsaved changes' : existing ? 'All changes saved' : 'Not saved yet';

  return (
    <>
      <PageHeader
        back={<a className="back-link" href={href('posts')}><Icon name="back" size={16} /> Posts</a>}
        title={existing ? 'Edit post' : 'New post'}
        actions={
          <>
            <span className={`save-state ${dirty ? 'save-state--dirty' : ''}`} aria-live="polite">
              <span className="save-state__dot" aria-hidden="true" />{statusText}
            </span>
            <button type="submit" form="post-form" className="btn btn--primary" disabled={saving || uploading}>
              <Icon name="check" /> {form.status === 'published' ? (existing?.status === 'published' ? 'Update post' : 'Publish') : 'Save draft'}
            </button>
          </>
        }
      />

      <form id="post-form" className="editor" onSubmit={save} onKeyDown={onFormKey} noValidate>
        <div className="editor__main">
          <div className="card stack">
            {existing?.demo && (
              <p className="inline-note"><span className="tag">Example</span> This is sample content. Edit it or delete it before going live.</p>
            )}
            <Field label="Title" id={ids.title} error={errors.title}>
              <input
                ref={titleRef}
                id={ids.title}
                className="input input--title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={160}
                placeholder="What is this post about?"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? `${ids.title}-error` : undefined}
                required
              />
            </Field>
            <Field
              label="Excerpt"
              id={ids.excerpt}
              hint="A short summary shown on the post card and in search results."
              counter={<Counter value={form.excerpt} max={EXCERPT_MAX} id={`${ids.excerpt}-count`} />}
            >
              <textarea
                id={ids.excerpt}
                className="input"
                rows={3}
                value={form.excerpt}
                maxLength={EXCERPT_MAX}
                onChange={(e) => set('excerpt', e.target.value)}
                aria-describedby={`${ids.excerpt}-hint ${ids.excerpt}-count`}
              />
            </Field>
          </div>

          <div className="card md">
            <div className="md__head">
              <label className="field__label" htmlFor={ids.body} id={`${ids.body}-label`}>Body</label>
              <div className="md__tabs" role="tablist" aria-label="Body editor mode">
                {['write', 'preview'].map((t) => (
                  <button
                    key={t}
                    id={`${uid}-tab-${t}`}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    aria-controls={`${uid}-panel`}
                    tabIndex={tab === t ? 0 : -1}
                    className="md__tab"
                    onClick={() => setTab(t)}
                    onKeyDown={onTabKey}
                  >
                    {t === 'write' ? 'Write' : 'Preview'}
                  </button>
                ))}
              </div>
            </div>
            <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`}>
              {tab === 'write' ? (
                <>
                  <div className="md__toolbar" role="toolbar" aria-label="Formatting" aria-controls={ids.body}>
                    {TOOLS.map((t) => (
                      <button key={t.k} type="button" className="md__tool" onClick={() => format(t.k)} aria-label={t.label} title={t.label}>
                        <Icon name={t.icon} size={17} />
                      </button>
                    ))}
                    <span className="md__stats" aria-live="off">{words} words · {minutes} min read</span>
                  </div>
                  <textarea
                    ref={bodyRef}
                    id={ids.body}
                    className="input md__input"
                    value={form.body}
                    onChange={(e) => set('body', e.target.value)}
                    onKeyDown={onBodyKey}
                    rows={18}
                    spellCheck
                    placeholder={'Start writing…\n\n## A section heading\n\nLeave a blank line between paragraphs.'}
                    aria-describedby={`${ids.body}-hint`}
                  />
                  <p className="field__hint" id={`${ids.body}-hint`}>
                    Markdown: <code>## Heading</code> <code>**bold**</code> <code>*italic*</code> <code>&gt; quote</code> <code>- list</code> <code>[text](https://…)</code>. Leave a blank line between paragraphs.
                  </p>
                </>
              ) : (
                <article className="article">
                  {form.cover && <img className="article__cover" src={asset(form.cover)} alt="" />}
                  <p className="article__meta">{form.category || 'News'} · {formatDate(form.date)} · {minutes} min read</p>
                  <h1 className="article__title">{form.title || 'Untitled post'}</h1>
                  {form.excerpt && <p className="article__lead">{form.excerpt}</p>}
                  {form.body.trim()
                    ? <div className="article__body" dangerouslySetInnerHTML={{ __html: renderMarkdown(form.body) }} />
                    : <p className="muted">Nothing to preview yet. Switch to Write to add the body.</p>}
                </article>
              )}
            </div>
          </div>
        </div>

        <aside className="editor__side" aria-label="Post settings">
          <div className="card stack">
            <h2 className="card__title">Publishing</h2>
            <fieldset className="radio-seg">
              <legend className="field__label">Status</legend>
              <div className="radio-seg__opts">
                {[['draft', 'Draft'], ['published', 'Published']].map(([v, l]) => (
                  <label key={v} className={`radio-seg__opt ${form.status === v ? 'is-on' : ''}`}>
                    <input type="radio" name={`${uid}-status`} value={v} checked={form.status === v} onChange={() => set('status', v)} />
                    {l}
                  </label>
                ))}
              </div>
              <p className="field__hint">{form.status === 'published' ? 'Visible on the site after you save.' : 'Only visible here in the admin.'}</p>
            </fieldset>
            <Switch checked={form.featured} onChange={(v) => set('featured', v)} label="Featured post" description="Highlighted first in Recent Posts." />
            <Field label="Date" id={ids.date} error={errors.date}>
              <input ref={dateRef} id={ids.date} type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} aria-invalid={Boolean(errors.date)} required />
            </Field>
            <Field label="Category" id={ids.cat}>
              <input id={ids.cat} className="input" list={ids.cats} value={form.category} onChange={(e) => set('category', e.target.value)} maxLength={40} />
              <datalist id={ids.cats}>{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Slug" id={ids.slug} hint={slugTouched ? 'Used in the post link.' : 'Follows the title until you edit it.'}>
              <div className="input-prefix">
                <span aria-hidden="true">/</span>
                <input
                  id={ids.slug}
                  className="input"
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                  onBlur={() => {
                    if (!form.slug.trim()) { setSlugTouched(false); set('slug', form.title.trim() ? slugify(form.title) : ''); }
                    else set('slug', slugify(form.slug));
                  }}
                  maxLength={80}
                  spellCheck={false}
                  aria-describedby={`${ids.slug}-hint`}
                />
              </div>
            </Field>
          </div>

          <div className="card stack">
            <h2 className="card__title">Cover image</h2>
            <div className={`cover ${form.cover ? '' : 'cover--empty'}`}>
              {form.cover ? <img src={asset(form.cover)} alt="Current cover" /> : <span><Icon name="image" size={26} /><br />No cover image</span>}
              {uploading && <span className="cover__busy">Uploading…</span>}
            </div>
            <div className="cover__actions">
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => setLibrary(true)}><Icon name="image" size={16} /> Choose</button>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => fileRef.current?.click()} disabled={uploading}><Icon name="upload" size={16} /> Upload</button>
              {form.cover && <button type="button" className="btn btn--ghost btn--sm" onClick={() => set('cover', '')}><Icon name="close" size={16} /> Remove</button>}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
            </div>
            <p className="field__hint">JPG, PNG, WebP or GIF. Large photos are resized automatically.</p>
          </div>
        </aside>
      </form>

      <Dialog open={library} onClose={() => setLibrary(false)} title="Choose a cover image" size="lg">
        <ul className="library">
          {COVERS.map((c) => (
            <li key={c.path}>
              <button
                type="button"
                className={`library__item ${form.cover === c.path ? 'is-on' : ''}`}
                aria-pressed={form.cover === c.path}
                onClick={() => { set('cover', c.path); setLibrary(false); }}
              >
                <img src={asset(c.path)} alt="" loading="lazy" />
                <span>{c.label}</span>
                {form.cover === c.path && <span className="library__check"><Icon name="check" size={14} /></span>}
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
