import { useMemo, useState } from 'react';
import { admin } from '../../lib/store.js';
import { formatDate } from '../../lib/markdown.js';
import { useAdmin } from '../context.js';
import { Icon } from '../icons.jsx';
import { PageHeader, SearchBox, Empty } from '../ui.jsx';

const csvCell = (v) => {
  const s = String(v ?? '');
  // Quote every cell and neutralise spreadsheet formulas.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export default function Subscribers() {
  const { data, update, act, confirm, toast } = useAdmin();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const all = data.subscribers;

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all
      .filter((s) => !needle || s.email.toLowerCase().includes(needle))
      .sort((a, b) => (sort === 'new' ? b.date.localeCompare(a.date) : sort === 'old' ? a.date.localeCompare(b.date) : a.email.localeCompare(b.email)));
  }, [all, q, sort]);

  function exportCsv() {
    if (!list.length) { toast('There are no subscribers to export.', 'info'); return; }
    const rows = [['email', 'date_joined'], ...list.map((s) => [s.email, s.date])];
    const csv = `﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`;
    try {
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast(`Exported ${list.length} ${list.length === 1 ? 'subscriber' : 'subscribers'} to CSV.`);
    } catch {
      toast('The download could not start in this browser.', 'error');
    }
  }

  async function remove(s) {
    const ok = await confirm({
      title: 'Remove this subscriber?',
      body: `${s.email} will no longer receive updates. This cannot be undone.`,
      confirmLabel: 'Remove subscriber',
      tone: 'danger',
    });
    if (!ok) return;
    const done = await act(() => admin.deleteSubscriber(s.id), 'Subscriber removed.');
    if (done) update((d) => { d.subscribers = d.subscribers.filter((x) => x.id !== s.id); });
  }

  return (
    <>
      <PageHeader
        title="Subscribers"
        subtitle={`${all.length} ${all.length === 1 ? 'person has' : 'people have'} signed up for updates.`}
        actions={
          <button type="button" className="btn btn--primary" onClick={exportCsv} disabled={!all.length}>
            <Icon name="download" /> Export CSV{q.trim() && list.length !== all.length ? ` (${list.length})` : ''}
          </button>
        }
      />

      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} label="Search by email" />
        <label className="select-wrap">
          <span className="sr-only">Sort subscribers</span>
          <select className="input input--select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="az">Email A–Z</option>
          </select>
        </label>
      </div>
      <p className="list-count" aria-live="polite">
        {q.trim() ? `${list.length} of ${all.length} match` : `${all.length} total`}
      </p>

      {list.length ? (
        <div className="card card--flush">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Date joined</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td className="table__email">
                    <span className="avatar avatar--sm" aria-hidden="true">{s.email.charAt(0).toUpperCase()}</span>
                    <a href={`mailto:${s.email}`}>{s.email}</a>
                  </td>
                  <td className="table__date"><time dateTime={s.date}>{formatDate(s.date, { month: 'short', day: 'numeric', year: 'numeric' })}</time></td>
                  <td className="ta-r">
                    <button type="button" className="icon-btn icon-btn--danger" onClick={() => remove(s)} aria-label={`Remove ${s.email}`} title="Remove">
                      <Icon name="trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <Empty icon={all.length ? 'search' : 'subscribers'} title={all.length ? 'No subscribers match' : 'No subscribers yet'}>
            {all.length ? 'Try a different search.' : 'People who sign up with the newsletter form on the site appear here.'}
          </Empty>
        </div>
      )}
    </>
  );
}
