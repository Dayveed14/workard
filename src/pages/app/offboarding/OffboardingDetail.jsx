import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, CalendarClock, CheckCircle2, DoorOpen, Plus, Send, Undo2, X } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { Progress } from '../onboarding/Onboarding.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate, formatDateTime, todayString } from '../../../utils/format.js';
import { EXIT_TYPES, StatusBadge, dueText, timeLeft } from './offboardingBits.jsx';
import '../onboarding/Onboarding.css';
import './Offboarding.css';

// One person leaving. HR: send the checklist, tick HR's items, change the last day, exit now.
// The person leaving: their steps (with notes like the handover), and what HR is doing.
export default function OffboardingDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: o, error, setData, reload } = useApi(`/api/offboarding/${id}`);
  const { data: templates } = useApi(o?.canManage && !o.template_name ? '/api/onboarding/templates?kind=offboarding' : null);
  const [templateId, setTemplateId] = useState('');
  const [noting, setNoting] = useState(null); // the item being ticked with a note
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [changingDay, setChangingDay] = useState(false);
  const [lastDay, setLastDay] = useState('');
  const [busy, setBusy] = useState(false);

  if (error) return <EmptyState title="Not available" text={error} action={<Link to="/dashboard" className="btn btn--outline">Back</Link>} />;
  if (!o) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const run = async (request, message) => {
    setBusy(true);
    try {
      setData(await request());
      if (message) toast.success(message);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const suggested = templates?.find((t) => t.suits === o.exit_type) || templates?.find((t) => t.suits === 'everyone') || templates?.[0];
  const chosenTemplate = templateId || suggested?.id || '';
  const termination = o.exit_type === 'termination';
  const canTick = (item) => o.open && (o.canManage || (o.isLeaver && item.owner === 'employee'));

  const toggle = (item) => {
    if (!item.done_at && item.asks_for_note && o.isLeaver) {
      setNoting(item);
      setNote(item.note || '');
      return;
    }
    run(() => api(`/api/offboarding/items/${item.id}`, { method: 'PATCH', body: { done: !item.done_at } }));
  };

  const column = (owner, title, subtitle) => {
    const items = o.items.filter((i) => i.owner === owner);
    return (
      <section className="card ob-column">
        <header className="card__header">
          <div><h2>{title}</h2><small className="muted">{subtitle}</small></div>
          <Progress done={items.filter((i) => i.done_at).length} total={items.length} />
        </header>
        <ul className="ob-items">
          {items.map((item) => {
            const due = dueText(item.due_at);
            return (
              <li key={item.id} className={item.done_at ? 'is-done' : ''}>
                <label>
                  <input type="checkbox" checked={Boolean(item.done_at)} disabled={!canTick(item) || busy} onChange={() => toggle(item)} />
                  <span>
                    <strong>{item.title}</strong>
                    {item.description && <small>{item.description}</small>}
                    {item.note && <span className="off-note">{item.note}</span>}
                    <small className={`ob-due ob-due--${item.done_at ? 'none' : due.overdue ? 'overdue' : 'none'}`}>
                      {item.done_at ? `Done ${formatDateTime(item.done_at)}${item.done_by_name ? ` by ${item.done_by_name}` : ''}` : due.text}
                      {!item.done_at && item.asks_for_note ? ' · needs a note' : ''}
                    </small>
                  </span>
                </label>
                {o.canManage && o.open && (
                  <button type="button" className="icon-btn" onClick={() => window.confirm(`Remove “${item.title}”?`) && run(() => api(`/api/offboarding/items/${item.id}`, { method: 'DELETE' }))} aria-label={`Remove ${item.title}`}><X size={14} /></button>
                )}
              </li>
            );
          })}
        </ul>
        {o.canManage && o.open && (adding === owner ? (
          <form className="ob-add" onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => api(`/api/offboarding/${o.id}/items`, { method: 'POST', body: { title: newTitle, owner } }))) { setNewTitle(''); setAdding(null); }
          }}>
            <input className="field__input" placeholder="New item" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} aria-label="New item" autoFocus />
            <button type="submit" className="btn btn--primary btn--sm" disabled={newTitle.trim().length < 2}>Add</button>
          </form>
        ) : (
          <button type="button" className="link-btn ob-add-btn" onClick={() => setAdding(owner)}><Plus size={14} /> Add an item for {owner === 'hr' ? 'HR' : o.first_name}</button>
        ))}
      </section>
    );
  };

  return (
    <div className="ob-detail">
      <div className="ob-detail__bar">
        <Link to={o.canManage ? '/offboarding' : '/requests?tab=resignation'} className="link-btn"><ArrowLeft size={16} /> {o.canManage ? 'Offboarding' : 'Back'}</Link>
      </div>

      <header className="ob-detail__head">
        <div>
          <h1>{o.isLeaver ? (termination ? 'Your exit steps' : 'Your offboarding') : `${o.first_name} ${o.last_name}`}</h1>
          <p className="muted">
            {EXIT_TYPES[o.exit_type]} · last day <strong>{formatDate(o.last_day)}</strong>
            {o.open && <> · {timeLeft(o.ends_at)}</>}
            {!o.isLeaver && (o.by_employee ? ` · resigned ${formatDate(o.notice_start)}` : o.started_by_name ? ` · started by ${o.started_by_name}` : '')}
          </p>
        </div>
        <div className="ob-detail__status">
          {o.template_name && <Progress done={o.items.filter((i) => i.done_at).length} total={o.items.length} />}
          <StatusBadge status={o.status} />
        </div>
      </header>

      {o.reason && !o.isLeaver && <p className="off-reason">“{o.reason}”</p>}

      {/* What happens next, in words */}
      {o.isLeaver && o.open && (
        <div className="ob-banner"><span>
          {termination
            ? <>Please finish your steps by <strong>{formatDateTime(o.ends_at)}</strong>. After that your Workard access ends. If anything is unclear, speak to HR.</>
            : o.template_name
              ? <>Your notice period has started. Please finish your steps before your last day, <strong>{formatDate(o.last_day)}</strong>. Thank you for your time with us.</>
              : <>Your notice period has started — your last day is <strong>{formatDate(o.last_day)}</strong>. HR will send you a short offboarding checklist (handover, documents, company items).</>}
        </span></div>
      )}
      {o.status === 'exited' && <div className="ob-banner ob-banner--green"><CheckCircle2 size={18} /> <span>{o.first_name} left on {formatDate(o.last_day)}. Their records are kept; their log-in is closed.</span></div>}
      {o.status === 'withdrawn' && <div className="ob-banner"><span>The resignation was withdrawn — {o.first_name} is staying.</span></div>}
      {o.status === 'cancelled' && <div className="ob-banner"><span>This exit was called off — {o.first_name} is staying.</span></div>}
      {o.checklist_done_at && o.open && o.canManage && (
        <div className="ob-banner ob-banner--green"><CheckCircle2 size={18} /> <span>The checklist is complete. {o.first_name} leaves on {formatDate(o.last_day)} — or exit them now.</span></div>
      )}

      {/* HR: send the checklist */}
      {o.canManage && o.open && !o.template_name && (
        <section className="card card__body off-send">
          <h2>Send an offboarding checklist</h2>
          <p className="muted">{o.first_name} gets it by email and in Workard, and ticks their steps off before {termination ? 'the 24 hours are up' : 'their last day'}.</p>
          <div className="off-send__row">
            <select className="field__input" value={chosenTemplate} onChange={(e) => setTemplateId(e.target.value)} aria-label="Checklist">
              {(templates || []).map((t) => <option key={t.id} value={t.id}>{t.name} ({t.joiner_items} + {t.hr_items} steps)</option>)}
            </select>
            <button type="button" className="btn btn--primary" disabled={busy || !chosenTemplate} onClick={() => run(() => api(`/api/offboarding/${o.id}/checklist`, { method: 'POST', body: { templateId: Number(chosenTemplate) } }), `Checklist sent to ${o.first_name}`)}>
              <Send size={16} /> Send checklist
            </button>
          </div>
        </section>
      )}

      {o.template_name && (
        <div className="ob-detail__columns">
          {column('employee', o.isLeaver ? 'Your steps' : `${o.first_name}’s steps`, 'Done by the person leaving')}
          {column('hr', o.isLeaver ? 'What HR is doing' : 'HR & owner steps', 'Done by HR or the owner')}
        </div>
      )}

      {/* Actions */}
      {o.open && (
        <div className="off-actions">
          {o.isLeaver && o.exit_type === 'resignation' && (
            <button type="button" className="btn btn--outline" disabled={busy} onClick={() => window.confirm('Withdraw your resignation? HR will be told you’re staying.') && run(() => api(`/api/offboarding/${o.id}/withdraw`, { method: 'POST' }), 'Resignation withdrawn')}>
              <Undo2 size={16} /> Withdraw my resignation
            </button>
          )}
          {o.canManage && (
            <>
              {!termination && <button type="button" className="btn btn--outline" onClick={() => { setLastDay(o.last_day); setChangingDay(true); }}><CalendarClock size={16} /> Change last day</button>}
              <button type="button" className="btn btn--danger" disabled={busy} onClick={() => window.confirm(`Exit ${o.first_name} now? Their log-in stops straight away.`) && run(() => api(`/api/offboarding/${o.id}/exit-now`, { method: 'POST' }), `${o.first_name} has left`)}>
                <DoorOpen size={16} /> Exit now
              </button>
              <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => window.confirm(`Call off ${o.first_name}’s exit? They stay with the company.`) && run(() => api(`/api/offboarding/${o.id}/cancel`, { method: 'POST' }), 'Called off')}>
                <Ban size={16} /> Call it off
              </button>
            </>
          )}
        </div>
      )}

      {noting && (
        <Modal
          title={noting.title}
          size="sm"
          onClose={() => setNoting(null)}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setNoting(null)}>Cancel</button>
              <button type="button" className="btn btn--primary" disabled={busy || note.trim().length < 3} onClick={async () => {
                if (await run(() => api(`/api/offboarding/items/${noting.id}`, { method: 'PATCH', body: { done: true, note } }), 'Done')) setNoting(null);
              }}>Save & tick</button>
            </>
          }
        >
          {noting.description && <p className="muted" style={{ marginBottom: 12 }}>{noting.description}</p>}
          <Field label={/handover/i.test(noting.title) ? 'Your handover note' : 'Your note'} name="note" hint="HR can read this.">
            <textarea id="note" rows={/handover/i.test(noting.title) ? 8 : 4} className="field__input" value={note} onChange={(e) => setNote(e.target.value)} autoFocus
              placeholder={/handover/i.test(noting.title) ? 'What you work on, where things are, who to call, what’s unfinished…' : 'e.g. Laptop and ID card returned to Tunde (HR) on Friday'} />
          </Field>
        </Modal>
      )}

      {changingDay && (
        <Modal
          title="Change the last day"
          size="sm"
          onClose={() => setChangingDay(false)}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setChangingDay(false)}>Cancel</button>
              <button type="button" className="btn btn--primary" disabled={busy || !lastDay} onClick={async () => {
                if (await run(() => api(`/api/offboarding/${o.id}/last-day`, { method: 'PATCH', body: { lastDay } }), 'Last day changed')) setChangingDay(false);
              }}>Save</button>
            </>
          }
        >
          <Field label="Last day" name="lastDay" hint={`${o.first_name} is told. Their log-in stops at the end of that day.`}>
            <input id="lastDay" type="date" className="field__input" min={todayString()} value={lastDay} onChange={(e) => setLastDay(e.target.value)} />
          </Field>
        </Modal>
      )}
    </div>
  );
}
