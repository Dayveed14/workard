import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, FilePlus2, Mail, MapPin, MessageSquarePlus, Pencil, Phone, User } from 'lucide-react';
import Badge from '../../../components/Badge.jsx';
import Tabs from '../../../components/Tabs.jsx';
import Field from '../../../components/Field.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import CustomerModal from '../../../components/CustomerModal.jsx';
import TaskList from '../../../components/TaskList.jsx';
import TaskModal from '../../../components/TaskModal.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { ACTIVITY_TYPES, PAYMENT_METHODS, formatDate, formatDateTime, formatMoney } from '../../../utils/format.js';
import './CustomerProfile.css';

// ---------- Activity timeline + "log activity" form ----------
function Activity({ customerId, canManage }) {
  const toast = useToast();
  const { data, loading, reload } = useApi(`/api/customers/${customerId}/activity`);
  const empty = { type: 'call', subject: '', details: '', followUpOn: '' };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/api/customers/${customerId}/activity`, { method: 'POST', body: form });
      toast.success('Activity logged');
      setForm(empty);
      reload();
    } catch (err) {
      setError(err.errors?.subject || err.message);
    } finally {
      setBusy(false);
    }
  };

  const act = async (url, message) => {
    try {
      await api(url, { method: 'PATCH' });
      toast.success(message);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="cprofile__activity">
      {canManage && (
        <form className="card card__body form form--flush cprofile__log" onSubmit={save}>
          {error && <div className="form__alert"><AlertCircle size={18} /> {error}</div>}
          <div className="form__row">
            <Field label="What happened?" name="type">
              <select id="type" name="type" className="field__input" value={form.type} onChange={onChange}>
                {Object.entries(ACTIVITY_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Follow up on" name="followUpOn" optional>
              <input id="followUpOn" name="followUpOn" type="date" className="field__input" value={form.followUpOn} onChange={onChange} />
            </Field>
          </div>
          <Field label="Subject" name="subject">
            <input id="subject" name="subject" className="field__input" placeholder="e.g. Called about the November order" value={form.subject} onChange={onChange} />
          </Field>
          <Field label="Details" name="details" optional>
            <textarea id="details" name="details" className="field__input" value={form.details} onChange={onChange} />
          </Field>
          {['enquiry', 'complaint'].includes(form.type) && (
            <p className="muted cprofile__hint">This {form.type} stays open until someone marks it resolved.</p>
          )}
          <div>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              <MessageSquarePlus size={18} /> Log activity
            </button>
          </div>
        </form>
      )}

      <div className="card">
        {loading && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {data?.length === 0 && <EmptyState title="No activity yet" text="Log calls, meetings, enquiries and complaints to build this customer’s history." />}
        {data?.length > 0 && (
          <ol className="timeline">
            {data.map((a) => (
              <li key={a.id} className={`timeline__item timeline__item--${a.type}`}>
                <div className="timeline__head">
                  <Badge tone={a.type === 'complaint' ? 'red' : a.type === 'enquiry' ? 'amber' : 'blue'}>{ACTIVITY_TYPES[a.type]}</Badge>
                  <strong>{a.subject}</strong>
                  {a.status && <Badge status={a.status} />}
                </div>
                {a.details && <p className="timeline__details">{a.details}</p>}
                <div className="timeline__meta">
                  <span>{formatDateTime(a.created_at)} · {a.created_by_name || 'System'}</span>
                  {a.follow_up_on && (
                    <span className={a.follow_up_done ? 'muted' : 'timeline__follow'}>
                      {a.follow_up_done ? '✓ Followed up' : `Follow up ${formatDate(a.follow_up_on)}`}
                    </span>
                  )}
                  {canManage && a.status === 'open' && (
                    <button type="button" className="link-btn" onClick={() => act(`/api/customers/activity/${a.id}/resolve`, 'Marked as resolved')}>Mark resolved</button>
                  )}
                  {canManage && a.follow_up_on && !a.follow_up_done && (
                    <button type="button" className="link-btn" onClick={() => act(`/api/customers/activity/${a.id}/follow-up-done`, 'Follow-up done')}>Follow-up done</button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ---------- Invoices & payments for this customer ----------
function CustomerInvoices({ customerId }) {
  const navigate = useNavigate();
  const { data } = useApi(`/api/invoices?customerId=${customerId}&limit=100`);
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (!data.invoices.length) return <div className="card"><EmptyState title="No invoices yet" /></div>;
  return (
    <div className="card table-wrap">
      <table className="table table--clickable">
        <thead><tr><th>Number</th><th>Issued</th><th>Due</th><th>Total</th><th>Balance</th><th>Status</th></tr></thead>
        <tbody>
          {data.invoices.map((i) => (
            <tr key={i.id} onClick={() => navigate(`/invoices/${i.id}`)}>
              <td><strong>{i.invoice_number}</strong></td>
              <td>{formatDate(i.issue_date)}</td>
              <td>{formatDate(i.due_date)}</td>
              <td>{formatMoney(i.total_kobo)}</td>
              <td>{Number(i.balance_kobo) > 0 && i.status !== 'void' ? formatMoney(i.balance_kobo) : '—'}</td>
              <td><Badge status={i.display_status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerPayments({ customerId }) {
  const { data } = useApi(`/api/customers/${customerId}/payments`);
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (!data.length) return <div className="card"><EmptyState title="No payments yet" /></div>;
  return (
    <div className="card table-wrap">
      <table className="table">
        <thead><tr><th>Date</th><th>Invoice</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id}>
              <td>{formatDate(p.paid_on)}</td>
              <td><Link to={`/invoices/${p.invoice_id}`}>{p.invoice_number}</Link></td>
              <td>{PAYMENT_METHODS[p.method]}</td>
              <td className="muted">{p.reference || '—'}</td>
              <td><strong>{formatMoney(p.amount_kobo)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Page ----------
// Tasks linked to this customer (e.g. "Deliver samples", "Chase payment")
function CustomerTasks({ customerId }) {
  const [adding, setAdding] = useState(false);
  const { data, reload } = useApi(`/api/tasks?view=team&customerId=${customerId}&status=&limit=50`);
  return (
    <>
      <div className="toolbar">
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setAdding(true)}>Add task</button>
      </div>
      <div className="card">
        {data ? <TaskList tasks={data.tasks} showAssignee onChange={reload} emptyText="Tasks you add here are linked to this customer." /> : <div className="page-loader"><span className="page-loader__spinner" /></div>}
      </div>
      {adding && <TaskModal task={null} customerId={customerId} onClose={() => setAdding(false)} onSaved={reload} />}
    </>
  );
}

export default function CustomerProfile() {
  const { id } = useParams();
  const { can } = useAuth();
  const { data: c, loading, error, reload } = useApi(`/api/customers/${id}`);
  const [tab, setTab] = useState('activity');
  const [editing, setEditing] = useState(false);

  if (loading) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (error) return <EmptyState title="Customer not available" text={error} action={<Link to="/customers" className="btn btn--outline">Back to customers</Link>} />;

  const tabs = [
    { id: 'activity', label: 'Activity' },
    { id: 'tasks', label: 'Tasks' },
    ...(can('invoices.view') ? [{ id: 'invoices', label: 'Invoices' }, { id: 'payments', label: 'Payments' }] : []),
  ];

  return (
    <>
      <section className="card cprofile__header">
        <div className="cprofile__who">
          <div className="cprofile__title">
            <h1>{c.name}</h1>
            <Badge status={c.stage} />
          </div>
          <ul className="cprofile__contact">
            {c.contact_person && <li><User size={15} /> {c.contact_person}</li>}
            {c.phone && <li><Phone size={15} /> <a href={`tel:${c.phone}`}>{c.phone}</a></li>}
            {c.email && <li><Mail size={15} /> <a href={`mailto:${c.email}`}>{c.email}</a></li>}
            {c.address && <li><MapPin size={15} /> {c.address}</li>}
          </ul>
          <p className="muted cprofile__owner">
            Handled by <strong>{c.assigned_name || 'no one yet'}</strong>
            {c.source && ` · Source: ${c.source}`}
          </p>
        </div>

        <div className="cprofile__money">
          {can('invoices.view') && (
            <>
              <div>
                <span>Owes</span>
                <strong className={Number(c.balance_kobo) > 0 ? 'cprofile__owes' : ''}>{formatMoney(c.balance_kobo)}</strong>
              </div>
              <div>
                <span>Paid to date</span>
                <strong>{formatMoney(c.lifetime_paid_kobo)}</strong>
              </div>
            </>
          )}
        </div>

        <div className="cprofile__actions">
          {can('customers.manage') && (
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing(true)}><Pencil size={16} /> Edit</button>
          )}
          {can('invoices.manage') && (
            <Link to={`/invoices/new?customerId=${c.id}`} className="btn btn--primary btn--sm"><FilePlus2 size={16} /> New invoice</Link>
          )}
        </div>
      </section>

      {c.notes && <p className="card card__body cprofile__notes">{c.notes}</p>}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'activity' && <Activity customerId={id} canManage={Boolean(can('customers.manage'))} />}
      {tab === 'tasks' && <CustomerTasks customerId={id} />}
      {tab === 'invoices' && <CustomerInvoices customerId={id} />}
      {tab === 'payments' && <CustomerPayments customerId={id} />}

      {editing && <CustomerModal customer={c} onClose={() => setEditing(false)} onSaved={reload} />}
    </>
  );
}
