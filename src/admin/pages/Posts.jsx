import { useMemo, useState } from 'react';
import { admin, asset } from '../../lib/store.js';
import { formatDate } from '../../lib/markdown.js';
import { useAdmin, href } from '../context.js';
import { Icon } from '../icons.jsx';
import { PageHeader, SearchBox, Empty } from '../ui.jsx';
import { StatusPill } from '../shared.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
];

export default function Posts() {
  const { data, update, act, confirm } = useAdmin();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(null);

  const counts = {
    all: data.posts.length,
    published: data.posts.filter((p) => p.status === 'published').length,
    draft: data.posts.filter((p) => p.status !== 'published').length,
  };
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...data.posts]
      .filter((p) => filter === 'all' || p.status === filter)
      .filter((p) => !needle || `${p.title} ${p.category} ${p.excerpt}`.toLowerCase().includes(needle))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.posts, filter, q]);

  async function remove(p) {
    const ok = await confirm({
      title: 'Delete this post?',
      body: `"${p.title}" will be removed from the site. This cannot be undone.`,
      confirmLabel: 'Delete post',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(p.id);
    const done = await act(() => admin.deletePost(p.id), 'Post deleted.');
    setBusy(null);
    if (done) update((d) => { d.posts = d.posts.filter((x) => x.id !== p.id); });
  }

  async function toggleFeatured(p) {
    setBusy(p.id);
    const saved = await act(() => admin.savePost({ ...p, featured: !p.featured }), p.featured ? 'Removed from featured.' : 'Marked as featured.');
    setBusy(null);
    if (saved && saved !== true) update((d) => { d.posts = d.posts.map((x) => (x.id === p.id ? saved : x)); });
  }

  return (
    <>
      <PageHeader
        title="Posts"
        subtitle="News and stories for the blog section of the site. Only published posts are public."
        actions={<a className="btn btn--primary" href={href('posts/new')}><Icon name="plus" /> New post</a>}
      />

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Filter posts by status">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className="segmented__btn" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label} <span className="segmented__count">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <SearchBox value={q} onChange={setQ} label="Search posts" />
      </div>

      <p className="sr-only" aria-live="polite">{list.length} {list.length === 1 ? 'post' : 'posts'} shown</p>

      {list.length ? (
        <div className="card card--flush">
          <div className="post-row post-row--head" aria-hidden="true">
            <span />
            <span>Title</span>
            <span>Category</span>
            <span>Date</span>
            <span>Status</span>
            <span className="ta-r">Actions</span>
          </div>
          <ul className="post-list">
            {list.map((p) => (
              <li key={p.id} className={`post-row ${busy === p.id ? 'is-busy' : ''}`}>
                <span className="thumb">
                  {p.cover ? <img src={asset(p.cover)} alt="" loading="lazy" /> : <Icon name="image" />}
                </span>
                <span className="post-row__title">
                  <a href={href(`posts/edit/${encodeURIComponent(p.id)}`)}>{p.title}</a>
                  {p.demo && <span className="tag">Example</span>}
                  <span className="post-row__sub">/{p.slug}</span>
                </span>
                <span className="post-row__meta">
                  <span className="post-row__catdate">
                    <span className="post-row__cat"><span className="sr-only">Category: </span>{p.category}</span>
                    <span className="post-row__date"><span className="sr-only">Date: </span><time dateTime={p.date}>{formatDate(p.date, { month: 'short', day: 'numeric', year: 'numeric' })}</time></span>
                  </span>
                  <span className="post-row__status"><StatusPill status={p.status} /></span>
                </span>
                <span className="post-row__actions">
                  <button
                    type="button"
                    className={`icon-btn star-btn ${p.featured ? 'is-on' : ''}`}
                    aria-pressed={p.featured}
                    aria-label={`Featured: ${p.title}`}
                    title={p.featured ? 'Featured (click to unfeature)' : 'Mark as featured'}
                    onClick={() => toggleFeatured(p)}
                    disabled={busy === p.id}
                  >
                    <Icon name="star" filled={p.featured} />
                  </button>
                  <a className="icon-btn" href={href(`posts/edit/${encodeURIComponent(p.id)}`)} aria-label={`Edit ${p.title}`} title="Edit">
                    <Icon name="edit" />
                  </a>
                  <button type="button" className="icon-btn icon-btn--danger" onClick={() => remove(p)} aria-label={`Delete ${p.title}`} title="Delete" disabled={busy === p.id}>
                    <Icon name="trash" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="card">
          {data.posts.length ? (
            <Empty icon="search" title="No posts match">Try another search or filter.</Empty>
          ) : (
            <Empty icon="posts" title="No posts yet" action={<a className="btn btn--primary" href={href('posts/new')}><Icon name="plus" /> Write the first post</a>}>
              Posts appear in the Recent Posts section of the site.
            </Empty>
          )}
        </div>
      )}
    </>
  );
}
