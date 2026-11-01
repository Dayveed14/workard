import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Camera, Download, FileText, KeyRound, Mail, Pencil, Trash2, Upload, UserMinus } from 'lucide-react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Tabs from '../../components/Tabs.jsx';
import Modal from '../../components/Modal.jsx';
import Field from '../../components/Field.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import MonthAttendance from '../../components/MonthAttendance.jsx';
import LeaveBalances from '../../components/LeaveBalances.jsx';
import EmployeePayTab from './payroll/EmployeePayTab.jsx';
import TaskList from '../../components/TaskList.jsx';
import TaskModal from '../../components/TaskModal.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { DOCUMENT_CATEGORIES, EMPLOYMENT_TYPES, REVIEW_STATUS_LABELS, formatDate, fullName, periodLabel, scoreLabel } from '../../utils/format.js';
import './EmployeeProfile.css';

// ---------- Tabs ----------
// Open tasks for this person, plus a button to give them one
function TasksTab({ id, firstName }) {
  const [status, setStatus] = useState('open');
  const [adding, setAdding] = useState(false);
  const { data, reload } = useApi(`/api/tasks?view=team&assigneeId=${id}&status=${status}&limit=50`);
  return (
    <>
      <div className="toolbar">
        <select className="field__input profile__select" value={status} onChange={(ev) => setStatus(ev.target.value)} aria-label="Status">
          <option value="open">Open</option>
          <option value="done">Done</option>
          <option value="">All</option>
        </select>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setAdding(true)}>Give {firstName} a task</button>
      </div>
      <div className="card">{data ? <TaskList tasks={data.tasks} onChange={reload} /> : <div className="page-loader"><span className="page-loader__spinner" /></div>}</div>
      {adding && <TaskModal task={null} defaultAssigneeId={Number(id)} onClose={() => setAdding(false)} onSaved={reload} />}
    </>
  );
}

// Past performance reviews for this person
function ReviewsTab({ id }) {
  const navigate = useNavigate();
  const { data } = useApi(`/api/reviews?view=team&employeeId=${id}`);
  const reviews = (data || []).filter((r) => r.status !== 'cancelled');
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (!reviews.length) return <div className="card"><EmptyState title="No reviews yet" text="Start one from the Reviews page." /></div>;
  return (
    <div className="card table-wrap">
      <table className="table table--clickable">
        <thead><tr><th>Period</th><th>Stage</th><th>Score</th><th>Reviewer</th></tr></thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} onClick={() => navigate(`/reviews/${r.id}`)}>
              <td><strong>{periodLabel(r.period)}</strong></td>
              <td><Badge status={r.status}>{REVIEW_STATUS_LABELS[r.status]}</Badge></td>
              <td>{r.overall_score ? <><strong>{Number(r.overall_score).toFixed(1)}</strong> <span className="muted">{scoreLabel(r.overall_score)}</span></> : '—'}</td>
              <td className="muted">{r.reviewer_name || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Overview({ e }) {
  const rows = [
    ['Email', e.email],
    ['Phone', e.phone],
    ['Staff ID', e.staff_id],
    ['Job title', e.job_title],
    ['Employment type', EMPLOYMENT_TYPES[e.employment_type]],
    ['Branch', e.branch_name],
    ['Department', e.department_name],
    ['Team', e.team_name],
    ['Line manager', e.manager_name],
    ['Start date', e.start_date && formatDate(e.start_date)],
    ['Gender', e.gender && e.gender[0].toUpperCase() + e.gender.slice(1)],
    ['Date of birth', e.date_of_birth && formatDate(e.date_of_birth)],
    ['Address', e.address],
    ['Emergency contact', [e.emergency_contact_name, e.emergency_contact_phone].filter(Boolean).join(' · ')],
    ...(e.status === 'exited' ? [['Exit date', formatDate(e.exit_date)]] : []),
  ];
  return (
    <dl className="profile__details card card__body">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || <span className="muted">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

function LeaveTab({ id }) {
  const { data, loading } = useApi(`/api/employees/${id}/leave`);
  if (loading || !data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  return (
    <>
      <LeaveBalances balances={data.balances} />
      <div className="card">
        {data.requests.length === 0 ? (
          <EmptyState title="No leave requests yet" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Reviewed by</th></tr>
              </thead>
              <tbody>
                {data.requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.leave_type}</td>
                    <td>{formatDate(r.start_date)} – {formatDate(r.end_date)}</td>
                    <td>{r.days}</td>
                    <td><Badge status={r.status} /></td>
                    <td className="muted">{r.reviewed_by_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function DocumentsTab({ id, canManage }) {
  const toast = useToast();
  const { data, loading, reload } = useApi(`/api/employees/${id}/documents`);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'contract', file: null });
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!form.file) return toast.error('Choose a file');
    const fd = new FormData();
    fd.append('file', form.file);
    fd.append('title', form.title || form.file.name);
    fd.append('category', form.category);
    setBusy(true);
    try {
      await api(`/api/employees/${id}/documents`, { method: 'POST', formData: fd });
      toast.success('Document uploaded');
      setShowUpload(false);
      setForm({ title: '', category: 'contract', file: null });
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) return;
    try {
      await api(`/api/documents/${doc.id}`, { method: 'DELETE' });
      toast.success('Document deleted');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      {canManage && (
        <div className="toolbar">
          <button type="button" className="btn btn--primary" onClick={() => setShowUpload(true)}>
            <Upload size={18} /> Upload document
          </button>
        </div>
      )}
      <div className="card">
        {loading && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {data?.length === 0 && <EmptyState icon={FileText} title="No documents yet" text="Contracts, IDs and certificates live here." />}
        {data?.length > 0 && (
          <ul className="profile__docs">
            {data.map((d) => (
              <li key={d.id}>
                <span className="profile__doc-icon"><FileText size={20} /></span>
                <span className="profile__doc-text">
                  <strong>{d.title}</strong>
                  <span>
                    {DOCUMENT_CATEGORIES[d.category] || d.category} · {formatDate(d.created_at)}
                    {d.uploaded_by_name && ` · by ${d.uploaded_by_name}`}
                  </span>
                </span>
                <a href={d.file_url} target="_blank" rel="noreferrer" className="icon-btn" aria-label="Open">
                  <Download size={18} />
                </a>
                {canManage && (
                  <button type="button" className="icon-btn" onClick={() => remove(d)} aria-label="Delete">
                    <Trash2 size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showUpload && (
        <Modal
          title="Upload document"
          size="sm"
          onClose={() => setShowUpload(false)}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setShowUpload(false)}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={upload} disabled={busy}>{busy ? 'Uploading…' : 'Upload'}</button>
            </>
          }
        >
          <div className="form form--flush">
            <Field label="File" name="file" hint="PDF, Word or image · max 10 MB">
              <input id="file" type="file" className="field__input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files[0] }))} />
            </Field>
            <Field label="Title" name="title">
              <input id="title" className="field__input" placeholder="e.g. Employment contract 2026" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
            <Field label="Category" name="category">
              <select id="category" className="field__input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {Object.entries(DOCUMENT_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}

// ---------- Page ----------
export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const auth = useAuth();
  const { data: e, loading, error, reload } = useApi(`/api/employees/${id}`);
  const { data: structure } = useApi(auth.can('roles.manage') || auth.can('employees.create') ? '/api/organization/structure' : null);
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'overview');
  const [modal, setModal] = useState(null); // 'invite' | 'role' | 'exit'
  const [roleId, setRoleId] = useState('');
  const [busy, setBusy] = useState(false);
  const photoInput = useRef(null);

  if (loading) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (error) return <EmptyState title="Employee not available" text={error} action={<Link to="/employees" className="btn btn--outline">Back to employees</Link>} />;

  const isSelf = auth.employee?.id === e.id;
  const active = e.status === 'active';
  const canEdit = auth.can('employees.edit') && active;
  const canPhoto = isSelf || canEdit;
  const roles = (structure?.roles || []).filter((r) => !r.isOwner || auth.role?.isOwner);

  const run = async (fn, success) => {
    setBusy(true);
    try {
      const res = await fn();
      toast.success(res?.message || success);
      setModal(null);
      await reload();
      if (isSelf) auth.reloadSession();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onPhoto = async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await run(() => api(`/api/employees/${id}/photo`, { method: 'POST', formData: fd }), 'Photo updated');
    ev.target.value = '';
  };

  const openRoleModal = (type) => {
    setRoleId(e.role_id || roles.find((r) => r.name === 'Employee')?.id || '');
    setModal(type);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave' },
    { id: 'documents', label: 'Documents' },
  ];
  const isManager = auth.employee && e.manager_id === auth.employee.id;
  if (isSelf || isManager || auth.can('tasks.view')) tabs.push({ id: 'tasks', label: 'Tasks' });
  if (isSelf || isManager || auth.canAny('reviews.view', 'reviews.manage')) tabs.push({ id: 'reviews', label: 'Reviews' });
  if (auth.can('payroll.view')) tabs.push({ id: 'pay', label: 'Pay' });

  return (
    <>
      <section className="profile__header card">
        <div className="profile__photo">
          <Avatar name={fullName(e)} src={e.photo_url} size={84} />
          {canPhoto && (
            <>
              <button type="button" className="profile__photo-btn" onClick={() => photoInput.current.click()} aria-label="Change photo">
                <Camera size={16} />
              </button>
              <input ref={photoInput} type="file" accept="image/*" hidden onChange={onPhoto} />
            </>
          )}
        </div>

        <div className="profile__who">
          <h1>{fullName(e)}</h1>
          <p>{[e.job_title, e.department_name, e.branch_name].filter(Boolean).join(' · ') || 'No job details yet'}</p>
          <div className="profile__badges">
            <Badge status={e.status} />
            {e.role_name ? (
              <Badge tone="blue">{e.role_name}</Badge>
            ) : Number(e.pending_invites) > 0 ? (
              <Badge status="invited">Invite sent</Badge>
            ) : (
              <Badge tone="gray">No login</Badge>
            )}
            {isSelf && <Badge tone="green">You</Badge>}
          </div>
        </div>

        <div className="profile__actions">
          {canEdit && (
            <button type="button" className="btn btn--outline btn--sm" onClick={() => navigate(`/employees/${id}/edit`)}>
              <Pencil size={16} /> Edit
            </button>
          )}
          {active && !e.user_id && auth.can('employees.create') && (
            <button type="button" className="btn btn--outline btn--sm" onClick={() => openRoleModal('invite')}>
              <Mail size={16} /> {Number(e.pending_invites) > 0 ? 'Resend invite' : 'Send invite'}
            </button>
          )}
          {active && e.user_id && auth.can('roles.manage') && !isSelf && (
            <button type="button" className="btn btn--outline btn--sm" onClick={() => openRoleModal('role')}>
              <KeyRound size={16} /> Change role
            </button>
          )}
          {active && auth.can('employees.exit') && !isSelf && (
            <button type="button" className="btn btn--ghost btn--sm profile__exit" onClick={() => setModal('exit')}>
              <UserMinus size={16} /> Exit
            </button>
          )}
        </div>
      </section>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'overview' && <Overview e={e} />}
      {tab === 'attendance' && <MonthAttendance basePath={`/api/employees/${id}/attendance`} />}
      {tab === 'leave' && <LeaveTab id={id} />}
      {tab === 'tasks' && <TasksTab id={id} firstName={e.first_name} />}
      {tab === 'reviews' && <ReviewsTab id={id} />}
      {tab === 'pay' && auth.can('payroll.view') && <EmployeePayTab employeeId={id} />}
      {tab === 'documents' && <DocumentsTab id={id} canManage={auth.can('documents.manage') && active} />}

      {(modal === 'invite' || modal === 'role') && (
        <Modal
          title={modal === 'invite' ? `Invite ${e.first_name} to Workard` : `Change ${e.first_name}'s role`}
          size="sm"
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy || !roleId}
                onClick={() =>
                  modal === 'invite'
                    ? run(() => api(`/api/employees/${id}/invite`, { method: 'POST', body: { roleId } }))
                    : run(() => api(`/api/employees/${id}/role`, { method: 'PATCH', body: { roleId } }))
                }
              >
                {modal === 'invite' ? 'Send invite' : 'Save role'}
              </button>
            </>
          }
        >
          {modal === 'invite' && <p className="profile__modal-text">We’ll email <strong>{e.email}</strong> a link to set up their login.</p>}
          <Field label="Role" name="roleId" hint="Decides what they can see and do.">
            <select id="roleId" className="field__input" value={roleId} onChange={(ev) => setRoleId(ev.target.value)}>
              <option value="">Choose a role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
        </Modal>
      )}

      {modal === 'exit' && (
        <Modal
          title={`Exit ${fullName(e)}?`}
          size="sm"
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn btn--danger" disabled={busy} onClick={() => run(() => api(`/api/employees/${id}/exit`, { method: 'POST', body: {} }), 'Employee exited')}>
                Exit employee
              </button>
            </>
          }
        >
          <p className="profile__modal-text">
            Their records (attendance, leave, documents) are kept, but they will no longer be able to log in and won’t
            appear in daily attendance.
          </p>
        </Modal>
      )}
    </>
  );
}
