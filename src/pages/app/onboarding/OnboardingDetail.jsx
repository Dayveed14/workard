import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, CheckCircle2, Plus, X } from 'lucide-react';
import Badge from '../../../components/Badge.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { Progress } from './Onboarding.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { dueLabel, formatDate, formatDateTime } from '../../../utils/format.js';
import './Onboarding.css';

// One person's onboarding: their steps on one side, HR's steps on the other
export default function OnboardingDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: o, loading, error, setData, reload } = useApi(`/api/onboarding/${id}`);
  const [adding, setAdding] = useState(null); // 'new_joiner' | 'hr'
  const [newItem, setNewItem] = useState({ title: '', dueDate: '' });

  if (loading && !o) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (error) return <EmptyState title="Onboarding not available" text={error} action={<Link to="/dashboard" className="btn btn--outline">Back</Link>} />;

  const open = o.status === 'in_progress';
  const canTick = (item) => open && (o.canManage || (o.isJoiner && item.owner === 'new_joiner'));

  // Ticks instantly, then saves (undone if saving fails)
  const toggle = async (item) => {
    const done = !item.done_at;
    setData((cur) => ({ ...cur, items: cur.items.map((i) => (i.id === item.id ? { ...i, done_at: done ? new Date().toISOString() : null } : i)) }));
    try {
      const updated = await api(`/api/onboarding/items/${item.id}`, { method: 'PATCH', body: { done } });
      setData(updated);
      if (updated.status === 'completed') toast.success('Onboarding complete 🎉');
    } catch (err) {
      toast.error(err.message);
      reload();
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    try {
      setData(await api(`/api/onboarding/${id}/items`, { method: 'POST', body: { ...newItem, owner: adding } }));
      setNewItem({ title: '', dueDate: '' });
      setAdding(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Remove “${item.title}”?`)) return;
    try {
      setData(await api(`/api/onboarding/items/${item.id}`, { method: 'DELETE' }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const cancel = async () => {
    if (!window.confirm(`Cancel ${o.first_name}’s onboarding?`)) return;
    try {
      setData(await api(`/api/onboarding/${id}/cancel`, { method: 'POST' }));
      toast.success('Onboarding cancelled');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const column = (owner, title, subtitle) => {
    const items = o.items.filter((i) => i.owner === owner);
    const done = items.filter((i) => i.done_at).length;
    return (
      <section className="card ob-column">
        <header className="card__header">
          <div>
            <h2>{title}</h2>
            <small className="muted">{subtitle}</small>
          </div>
          <Progress done={done} total={items.length} />
        </header>
        <ul className="ob-items">
          {items.map((item) => {
            const due = dueLabel(item.due_date, item.done_at ? 'done' : 'todo');
            return (
              <li key={item.id} className={item.done_at ? 'is-done' : ''}>
                <label>
                  <input type="checkbox" checked={Boolean(item.done_at)} disabled={!canTick(item)} onChange={() => toggle(item)} />
                  <span>
                    <strong>{item.title}</strong>
                    {item.description && <small>{item.description}</small>}
                    <small className={`ob-due ob-due--${item.done_at ? 'none' : due.tone}`}>
                      {item.done_at ? `Done ${formatDateTime(item.done_at)}${item.done_by_name ? ` by ${item.done_by_name}` : ''}` : due.text}
                    </small>
                  </span>
                </label>
                {o.canManage && open && (
                  <button type="button" className="icon-btn" onClick={() => removeItem(item)} aria-label={`Remove ${item.title}`}><X size={14} /></button>
                )}
              </li>
            );
          })}
        </ul>
        {o.canManage && open && (
          adding === owner ? (
            <form className="ob-add" onSubmit={addItem}>
              <input className="field__input" placeholder="New item" value={newItem.title} onChange={(e) => setNewItem((n) => ({ ...n, title: e.target.value }))} aria-label="New item" autoFocus />
              <input className="field__input" type="date" value={newItem.dueDate} onChange={(e) => setNewItem((n) => ({ ...n, dueDate: e.target.value }))} aria-label="Due date" />
              <button type="submit" className="btn btn--primary btn--sm" disabled={newItem.title.trim().length < 2}>Add</button>
            </form>
          ) : (
            <button type="button" className="link-btn ob-add-btn" onClick={() => setAdding(owner)}><Plus size={14} /> Add an item for {owner === 'hr' ? 'HR' : o.first_name}</button>
          )
        )}
      </section>
    );
  };

  return (
    <div className="ob-detail">
      <div className="ob-detail__bar">
        <Link to={o.canManage ? '/onboarding' : '/dashboard'} className="link-btn"><ArrowLeft size={16} /> {o.canManage ? 'Onboarding' : 'Dashboard'}</Link>
      </div>

      <header className="ob-detail__head">
        <div>
          <h1>{o.isJoiner ? `Welcome, ${o.first_name}!` : `${o.first_name} ${o.last_name}`}</h1>
          <p className="muted">
            {o.template_name} · first day {formatDate(o.start_date)}
            {o.started_by_name && ` · sent by ${o.started_by_name}`}
          </p>
        </div>
        <div className="ob-detail__status">
          <Progress done={Number(o.items.filter((i) => i.done_at).length)} total={o.items.length} />
          {o.status === 'completed' && <Badge status="completed">Completed</Badge>}
          {o.status === 'cancelled' && <Badge status="cancelled" />}
          {o.canManage && open && (
            <button type="button" className="btn btn--ghost btn--sm ob-cancel" onClick={cancel}><Ban size={15} /> Cancel</button>
          )}
        </div>
      </header>

      {o.status === 'completed' && (
        <div className="ob-banner ob-banner--green"><CheckCircle2 size={18} /> All done — onboarding completed {formatDateTime(o.completed_at)}.</div>
      )}
      {o.canManage && open && !o.hasLogin && (
        <div className="ob-banner">{o.first_name} hasn’t accepted their Workard invite yet. They’ll see their steps as soon as they log in.</div>
      )}
      {o.isJoiner && open && (
        <div className="ob-banner">Tick each step off as you finish it. The steps on the right are what HR is doing to get you set up.</div>
      )}

      <div className="ob-detail__columns">
        {column('new_joiner', o.isJoiner ? 'Your steps' : `${o.first_name}’s steps`, 'Done by the new joiner')}
        {column('hr', o.isJoiner ? 'What HR is doing for you' : 'HR & owner steps', 'Done by HR or the owner')}
      </div>
    </div>
  );
}
