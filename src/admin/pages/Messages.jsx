import { useEffect, useMemo, useRef, useState } from 'react';
import { admin } from '../../lib/store.js';
import { useAdmin, href } from '../context.js';
import { Icon } from '../icons.jsx';
import { PageHeader, SearchBox, Empty } from '../ui.jsx';
import { fullName, shortDate, longDate } from '../shared.jsx';

export default function Messages({ openId }) {
  const { data, update, act, confirm, navigate } = useAdmin();
  const [q, setQ] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const marked = useRef(new Set());
  const readingRef = useRef(null);
  const messages = data.messages;
  const unread = messages.filter((m) => !m.read).length;
  const current = openId ? messages.find((m) => m.id === openId) : null;

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...messages]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((m) => !unreadOnly || !m.read || m.id === openId)
      .filter((m) => !needle || `${m.firstName} ${m.lastName} ${m.email} ${m.phone} ${m.message}`.toLowerCase().includes(needle));
  }, [messages, q, unreadOnly, openId]);

  // Opening a message marks it read (once per visit, so "Mark unread" sticks).
  useEffect(() => {
    if (!current || current.read || marked.current.has(current.id)) return;
    marked.current.add(current.id);
    const id = current.id;
    update((d) => { d.messages = d.messages.map((m) => (m.id === id ? { ...m, read: true } : m)); });
    act(() => admin.setMessageRead(id, true)).then((ok) => {
      if (!ok) update((d) => { d.messages = d.messages.map((m) => (m.id === id ? { ...m, read: false } : m)); });
    });
  }, [current, update, act]);

  // Move focus to the reading pane when a message opens (helps keyboard and screen reader users, and the mobile view).
  useEffect(() => {
    if (openId && readingRef.current) readingRef.current.focus({ preventScroll: window.matchMedia('(min-width: 901px)').matches });
  }, [openId]);

  async function markUnread(m) {
    update((d) => { d.messages = d.messages.map((x) => (x.id === m.id ? { ...x, read: false } : x)); });
    const ok = await act(() => admin.setMessageRead(m.id, false), 'Marked as unread.');
    if (!ok) { update((d) => { d.messages = d.messages.map((x) => (x.id === m.id ? { ...x, read: true } : x)); }); return; }
    navigate('messages');
  }

  async function remove(m) {
    const ok = await confirm({
      title: 'Delete this message?',
      body: `The message from ${fullName(m)} will be deleted permanently.`,
      confirmLabel: 'Delete message',
      tone: 'danger',
    });
    if (!ok) return;
    const done = await act(() => admin.deleteMessage(m.id), 'Message deleted.');
    if (done) {
      update((d) => { d.messages = d.messages.filter((x) => x.id !== m.id); });
      navigate('messages');
    }
  }

  const mailto = current
    ? `mailto:${encodeURIComponent(current.email)}?subject=${encodeURIComponent('Re: your message')}&body=${encodeURIComponent(`Hi ${current.firstName || 'there'},\n\n\n\n---\nOn ${longDate(current.date)}, ${fullName(current)} wrote:\n> ${current.message.split('\n').join('\n> ')}`)}`
    : '';

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle={unread ? `${unread} unread of ${messages.length}. Sent from the contact form on the site.` : `${messages.length} ${messages.length === 1 ? 'message' : 'messages'}, all read. Sent from the contact form on the site.`}
      />

      <div className={`inbox ${openId ? 'inbox--open' : ''}`}>
        <section className="inbox__list card card--flush" aria-label="Message list">
          <div className="inbox__tools">
            <SearchBox value={q} onChange={setQ} label="Search messages" />
            <button type="button" className="chip" aria-pressed={unreadOnly} onClick={() => setUnreadOnly((v) => !v)}>
              Unread only
            </button>
          </div>
          {list.length ? (
            <ul className="msg-list">
              {list.map((m) => (
                <li key={m.id}>
                  <a
                    href={href(`messages/${encodeURIComponent(m.id)}`)}
                    className={`msg-item ${m.read ? '' : 'is-unread'} ${m.id === openId ? 'is-active' : ''}`}
                    aria-current={m.id === openId ? 'true' : undefined}
                  >
                    <span className="msg-item__top">
                      <span className="msg-item__name">
                        {!m.read && <span className="unread-dot" aria-hidden="true" />}
                        {fullName(m)}
                        {!m.read && <span className="sr-only"> (unread)</span>}
                      </span>
                      <time className="msg-item__date" dateTime={m.date}>{shortDate(m.date)}</time>
                    </span>
                    <span className="msg-item__text">{m.message}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={messages.length ? 'search' : 'messages'} title={messages.length ? 'No messages match' : 'Inbox is empty'}>
              {messages.length ? 'Try a different search.' : 'Messages from the contact form will show up here.'}
            </Empty>
          )}
        </section>

        <section className="inbox__read card" aria-label="Reading pane" ref={readingRef} tabIndex={-1}>
          {current ? (
            <article className="reader">
              <a className="back-link reader__back" href={href('messages')}><Icon name="back" size={16} /> All messages</a>
              <header className="reader__head">
                <span className="avatar avatar--lg" aria-hidden="true">{(current.firstName || current.email || '?').charAt(0).toUpperCase()}</span>
                <div className="reader__who">
                  <h2 className="reader__name">{fullName(current)}</h2>
                  <p className="reader__date"><time dateTime={current.date}>{longDate(current.date)}</time></p>
                </div>
              </header>
              <dl className="reader__meta">
                <div><dt><Icon name="mail" size={15} /> Email</dt><dd><a href={`mailto:${current.email}`}>{current.email || '—'}</a></dd></div>
                {current.phone && <div><dt><Icon name="phone" size={15} /> Phone</dt><dd><a href={`tel:${current.phone.replace(/[^\d+]/g, '')}`}>{current.phone}</a></dd></div>}
              </dl>
              <div className="reader__body">{current.message}</div>
              <div className="reader__actions">
                <a className="btn btn--primary" href={mailto}><Icon name="reply" /> Reply by email</a>
                <button type="button" className="btn btn--secondary" onClick={() => markUnread(current)}><Icon name="mail" /> Mark unread</button>
                <button type="button" className="btn btn--danger-ghost" onClick={() => remove(current)}><Icon name="trash" /> Delete</button>
              </div>
            </article>
          ) : openId ? (
            <Empty icon="messages" title="Message not found">It may have been deleted. <a href={href('messages')}>Back to all messages</a></Empty>
          ) : (
            <Empty icon="mailOpen" title="Select a message">Choose a message from the list to read it here.</Empty>
          )}
        </section>
      </div>
    </>
  );
}
