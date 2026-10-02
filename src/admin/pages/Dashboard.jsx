import { asset } from '../../lib/store.js';
import { formatDate } from '../../lib/markdown.js';
import { useAdmin, href } from '../context.js';
import { Icon } from '../icons.jsx';
import { PageHeader, Empty } from '../ui.jsx';
import { StatusPill, fullName, shortDate } from '../shared.jsx';

export default function Dashboard() {
  const { data, demo } = useAdmin();
  const published = data.posts.filter((p) => p.status === 'published').length;
  const drafts = data.posts.length - published;
  const shown = data.reviews.filter((r) => r.visible).length;
  const unread = data.messages.filter((m) => !m.read).length;
  const latest = [...data.messages].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const recent = [...data.posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  const tiles = [
    { label: 'Published posts', value: published, to: 'posts', icon: 'posts' },
    { label: 'Drafts', value: drafts, to: 'posts', icon: 'edit' },
    { label: 'Reviews shown', value: shown, to: 'reviews', icon: 'reviews', note: shown !== data.reviews.length ? `of ${data.reviews.length}` : null },
    { label: 'Unread messages', value: unread, to: 'messages', icon: 'messages', hot: unread > 0 },
    { label: 'Subscribers', value: data.subscribers.length, to: 'subscribers', icon: 'subscribers' },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={demo ? 'An overview of the example content. Try anything: it only changes this browser.' : 'An overview of everything on the site.'}
        actions={<a className="btn btn--primary" href={href('posts/new')}><Icon name="plus" /> New post</a>}
      />

      <ul className="tiles">
        {tiles.map((t) => (
          <li key={t.label}>
            <a className={`tile ${t.hot ? 'tile--hot' : ''}`} href={href(t.to)}>
              <span className="tile__icon"><Icon name={t.icon} size={18} /></span>
              <span className="tile__value">{t.value}{t.note && <small> {t.note}</small>}</span>
              <span className="tile__label">{t.label}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="dash-grid">
        <section className="card" aria-labelledby="dash-msgs">
          <div className="card__head">
            <h2 id="dash-msgs" className="card__title">Latest messages</h2>
            <a className="link-more" href={href('messages')}>All messages</a>
          </div>
          {latest.length ? (
            <ul className="mini-list">
              {latest.map((m) => (
                <li key={m.id}>
                  <a className={`mini-msg ${m.read ? '' : 'is-unread'}`} href={href(`messages/${encodeURIComponent(m.id)}`)}>
                    <span className="avatar" aria-hidden="true">{(m.firstName || m.email || '?').charAt(0).toUpperCase()}</span>
                    <span className="mini-msg__main">
                      <span className="mini-msg__top">
                        <span className="mini-msg__name">
                          {!m.read && <span className="unread-dot" aria-hidden="true" />}
                          {fullName(m)}
                          {!m.read && <span className="sr-only"> (unread)</span>}
                        </span>
                        <time className="mini-msg__date" dateTime={m.date}>{shortDate(m.date)}</time>
                      </span>
                      <span className="mini-msg__text">{m.message}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : <Empty icon="messages" title="No messages yet">Messages sent from the contact form show up here.</Empty>}
        </section>

        <section className="card" aria-labelledby="dash-posts">
          <div className="card__head">
            <h2 id="dash-posts" className="card__title">Recent posts</h2>
            <a className="link-more" href={href('posts')}>All posts</a>
          </div>
          {recent.length ? (
            <ul className="mini-list">
              {recent.map((p) => (
                <li key={p.id}>
                  <a className="mini-post" href={href(`posts/edit/${encodeURIComponent(p.id)}`)}>
                    <span className="thumb thumb--sm">{p.cover ? <img src={asset(p.cover)} alt="" loading="lazy" /> : <Icon name="image" />}</span>
                    <span className="mini-post__main">
                      <span className="mini-post__title">{p.title}</span>
                      <span className="mini-post__meta">{p.category} · {formatDate(p.date, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                    <StatusPill status={p.status} />
                  </a>
                </li>
              ))}
            </ul>
          ) : <Empty icon="posts" title="No posts yet" />}
        </section>

        <section className="card card--actions" aria-labelledby="dash-quick">
          <h2 id="dash-quick" className="card__title">Quick actions</h2>
          <div className="quick">
            <a className="quick__item" href={href('posts/new')}>
              <span className="quick__icon"><Icon name="plus" /></span>
              <span><strong>New post</strong><small>Write news or a behind-the-book story</small></span>
            </a>
            <a className="quick__item" href={href('settings')}>
              <span className="quick__icon"><Icon name="settings" /></span>
              <span><strong>Edit settings</strong><small>Amazon and order links, socials, announcement</small></span>
            </a>
            <a className="quick__item" href={href('reviews')}>
              <span className="quick__icon"><Icon name="reviews" /></span>
              <span><strong>Manage reviews</strong><small>Choose which reader reviews appear and in what order</small></span>
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
