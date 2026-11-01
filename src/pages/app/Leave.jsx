import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CalendarPlus, Check, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import Tabs from '../../components/Tabs.jsx';
import Modal from '../../components/Modal.jsx';
import Field from '../../components/Field.jsx';
import Badge from '../../components/Badge.jsx';
import Avatar from '../../components/Avatar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import LeaveBalances from '../../components/LeaveBalances.jsx';
import ReviewModal from '../../components/ReviewModal.jsx';
import { api, toQuery } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, fullName, todayString } from '../../utils/format.js';
import './Leave.css';

function RequestModal({ balances, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ leaveTypeId: balances[0]?.leaveTypeId || '', startDate: '', endDate: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const balance = balances.find((b) => String(b.leaveTypeId) === String(form.leaveTypeId));

  const submit = async () => {
    setBusy(true);
    setFormError('');
    try {
      await api('/api/me/leave', { method: 'POST', body: form });
      toast.success('Leave request sent for approval');
      onSaved();
      onClose();
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Request leave"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
        </>
      }
    >
      <div className="form form--flush">
        {formError && <div className="form__alert"><AlertCircle size={18} /> {formError}</div>}
        <Field label="Leave type" name="leaveTypeId" error={errors.leaveTypeId} hint={balance && `${balance.remaining} day(s) left this year`}>
          <select id="leaveTypeId" name="leaveTypeId" className="field__input" value={form.leaveTypeId} onChange={onChange}>
            {balances.map((b) => <option key={b.leaveTypeId} value={b.leaveTypeId}>{b.name}</option>)}
          </select>
        </Field>
        <div className="form__row">
          <Field label="From" name="startDate" error={errors.startDate}>
            <input id="startDate" name="startDate" type="date" className="field__input" min={todayString()} value={form.startDate} onChange={onChange} />
          </Field>
          <Field label="To" name="endDate" error={errors.endDate}>
            <input id="endDate" name="endDate" type="date" className="field__input" min={form.startDate || todayString()} value={form.endDate} onChange={onChange} />
          </Field>
        </div>
        <Field label="Reason" name="reason" optional>
          <textarea id="reason" name="reason" className="field__input" value={form.reason} onChange={onChange} maxLength={500} />
        </Field>
        <p className="muted leave__note">Weekends are not counted.</p>
      </div>
    </Modal>
  );
}

function MyLeave() {
  const toast = useToast();
  const { data, loading, reload } = useApi('/api/me/leave');
  const [showRequest, setShowRequest] = useState(false);

  if (loading || !data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const cancel = async (r) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await api(`/api/me/leave/${r.id}/cancel`, { method: 'POST' });
      toast.success('Request cancelled');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="toolbar">
        <button type="button" className="btn btn--primary" onClick={() => setShowRequest(true)}>
          <CalendarPlus size={18} /> Request leave
        </button>
      </div>
      <LeaveBalances balances={data.balances} />
      <div className="card">
        {data.requests.length === 0 ? (
          <EmptyState title="No leave requests yet" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Note</th><th /></tr></thead>
              <tbody>
                {data.requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.leave_type}</td>
                    <td>{formatDate(r.start_date)} – {formatDate(r.end_date)}</td>
                    <td>{r.days}</td>
                    <td><Badge status={r.status} /></td>
                    <td className="muted">{r.review_note || r.reason || '—'}</td>
                    <td className="row-actions">
                      {r.status === 'pending' && <button type="button" className="link-btn" onClick={() => cancel(r)}>Cancel</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showRequest && <RequestModal balances={data.balances} onClose={() => setShowRequest(false)} onSaved={reload} />}
    </>
  );
}

function Approvals({ onChange }) {
  const { can, employee } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const { data, loading, reload } = useApi(`/api/leave${toQuery({ status })}`);
  const [review, setReview] = useState(null);

  const submit = async ({ decision, note }) => {
    try {
      await api(`/api/leave/${review.request.id}/review`, { method: 'PATCH', body: { decision, note } });
      toast.success(decision === 'approved' ? 'Leave approved' : 'Leave rejected');
      reload();
      onChange?.();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  return (
    <>
      <div className="toolbar">
        <select className="field__input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>
      <div className="card">
        {loading && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {data?.length === 0 && <EmptyState title={status === 'pending' ? 'No requests waiting' : 'No leave requests'} />}
        {data?.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th /></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/employees/${r.employee_id}`} className="person">
                        <Avatar name={fullName(r)} src={r.photo_url} size={32} />
                        <span><strong>{fullName(r)}</strong><span>{r.job_title || '—'}</span></span>
                      </Link>
                    </td>
                    <td>{r.leave_type}</td>
                    <td>{formatDate(r.start_date)} – {formatDate(r.end_date)}</td>
                    <td>{r.days}</td>
                    <td className="muted">{r.reason || '—'}</td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      {r.status === 'pending' && can('leave.approve') && r.employee_id !== employee?.id && (
                        <div className="row-actions">
                          <button type="button" className="icon-btn" onClick={() => setReview({ request: r, decision: 'rejected' })} aria-label="Reject"><X size={18} /></button>
                          <button type="button" className="btn btn--success btn--sm" onClick={() => setReview({ request: r, decision: 'approved' })}><Check size={16} /> Approve</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {review && (
        <ReviewModal
          title={review.decision === 'approved' ? 'Approve leave' : 'Reject leave'}
          decision={review.decision}
          summary={`${fullName(review.request)} · ${review.request.leave_type} · ${formatDate(review.request.start_date)} – ${formatDate(review.request.end_date)} (${review.request.days} day(s))`}
          onSubmit={submit}
          onClose={() => setReview(null)}
        />
      )}
    </>
  );
}

export default function Leave() {
  const { can, employee } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: pending, reload } = useApi(can('leave.view') ? '/api/leave?status=pending' : null);

  const tabs = [
    ...(employee ? [{ id: 'mine', label: 'My leave' }] : []),
    ...(can('leave.view') ? [{ id: 'approvals', label: 'Team requests', count: pending?.filter((r) => r.employee_id !== employee?.id).length }] : []),
  ];
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : tabs[0]?.id;

  return (
    <>
      <PageHeader title="Leave" subtitle="Request time off and keep track of approvals." />
      <Tabs tabs={tabs} active={tab} onChange={(id) => setParams({ tab: id })} />
      {tab === 'mine' && <MyLeave />}
      {tab === 'approvals' && <Approvals onChange={reload} />}
    </>
  );
}
