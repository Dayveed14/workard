import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Tabs from '../../../components/Tabs.jsx';
import Badge from '../../../components/Badge.jsx';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import ChecklistEditor from './ChecklistEditor.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate, todayString } from '../../../utils/format.js';
import './Onboarding.css';

export const SUITS_LABELS = { everyone: 'Everyone', staff: 'Staff', managers: 'Managers' };

export function Progress({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <span className="ob-progress" title={`${done} of ${total} done`}>
      <span className="ob-progress__bar"><span style={{ width: `${pct}%` }} /></span>
      <small>{done}/{total}</small>
    </span>
  );
}

// Choose the new joiner + checklist + start date
function StartModal({ templates, preselect, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: people } = useApi('/api/onboarding/candidates');
  const [form, setForm] = useState({ employeeId: preselect || '', templateId: '', startDate: '' });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const person = people?.find((p) => String(p.id) === String(form.employeeId));

  // Picking a person suggests the checklist that suits them (manager vs staff) and their start date
  useEffect(() => {
    if (!person) return;
    const match = templates.find((t) => t.suits === person.suits) || templates.find((t) => t.suits === 'everyone') || templates[0];
    setForm((f) => ({ ...f, templateId: match?.id || '', startDate: person.start_date || todayString() }));
  }, [person, templates]);

  const start = async () => {
    setBusy(true);
    try {
      const o = await api('/api/onboarding', { method: 'POST', body: form });
      toast.success(`Onboarding sent to ${o.first_name}`);
      navigate(`/onboarding/${o.id}`);
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Start onboarding"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" disabled={busy || !form.employeeId || !form.templateId} onClick={start}>
            {busy ? 'Sending…' : 'Send onboarding'}
          </button>
        </>
      }
    >
      <div className="form form--flush">
        <Field label="New joiner" name="employeeId" error={errors.employeeId}>
          <select id="employeeId" className="field__input" value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}>
            <option value="">Choose a person</option>
            {(people || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}{p.job_title ? ` — ${p.job_title}` : ''}{p.completed_before > 0 ? ' (onboarded before)' : ''}
              </option>
            ))}
          </select>
        </Field>
        {person && !person.hasLogin && (
          <p className="ob-note">{person.first_name} hasn’t accepted their Workard invite yet. You can still send it — they’ll see their checklist as soon as they log in.</p>
        )}
        <div className="form__row">
          <Field label="Checklist" name="templateId" error={errors.templateId} hint={person ? `Suggested for ${person.suits === 'managers' ? 'a manager' : 'staff'}` : undefined}>
            <select id="templateId" className="field__input" value={form.templateId} onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}>
              <option value="">Choose a checklist</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({SUITS_LABELS[t.suits]})</option>
              ))}
            </select>
          </Field>
          <Field label="First day" name="startDate" hint="Due dates count from this day">
            <input id="startDate" type="date" className="field__input" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function OnboardingList({ status }) {
  const navigate = useNavigate();
  const { data } = useApi(`/api/onboarding?status=${status}`);
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (!data.length) {
    return (
      <EmptyState
        icon={UserPlus}
        title={status === 'in_progress' ? 'No one is being onboarded' : 'Nothing here yet'}
        text={status === 'in_progress' ? 'Add a new employee, then press “Start onboarding” to send them their checklist.' : undefined}
      />
    );
  }
  return (
    <div className="table-wrap">
      <table className="table table--clickable">
        <thead>
          <tr><th>New joiner</th><th>Checklist</th><th>First day</th><th>Progress</th><th /></tr>
        </thead>
        <tbody>
          {data.map((o) => (
            <tr key={o.id} onClick={() => navigate(`/onboarding/${o.id}`)}>
              <td>
                <div className="person">
                  <span><strong>{o.first_name} {o.last_name}</strong><span>{[o.job_title, o.department_name].filter(Boolean).join(' · ') || '—'}</span></span>
                </div>
              </td>
              <td>{o.template_name}</td>
              <td>{formatDate(o.start_date)}</td>
              <td><Progress done={Number(o.done_items)} total={Number(o.total_items)} /></td>
              <td className="ob-flags">
                {!o.employee_user_id && <Badge tone="gray">Not logged in yet</Badge>}
                {Number(o.overdue_items) > 0 && o.status === 'in_progress' && <Badge tone="red">{o.overdue_items} overdue</Badge>}
                {o.status === 'completed' && <Badge status="completed">Completed</Badge>}
                {o.status === 'cancelled' && <Badge status="cancelled" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Checklists({ templates, reload }) {
  const toast = useToast();
  const [editing, setEditing] = useState(null); // { id } | { id: null }

  const remove = async (t) => {
    if (!window.confirm(`Delete the "${t.name}" checklist? Onboardings already sent keep their items.`)) return;
    try {
      await api(`/api/onboarding/templates/${t.id}`, { method: 'DELETE' });
      toast.success('Checklist deleted');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="toolbar ob-toolbar">
        <p className="muted">Each checklist has steps for the <strong>new joiner</strong> and steps for <strong>HR / the owner</strong>. Make one per type of role.</p>
        <button type="button" className="btn btn--primary" onClick={() => setEditing({ id: null })}><Plus size={18} /> New checklist</button>
      </div>
      <div className="ob-templates">
        {templates.map((t) => (
          <article key={t.id} className="card card__body ob-template">
            <header>
              <h3>{t.name}</h3>
              <Badge tone={t.suits === 'managers' ? 'blue' : 'gray'}>{SUITS_LABELS[t.suits]}</Badge>
            </header>
            {t.description && <p className="muted">{t.description}</p>}
            <p className="ob-template__counts">
              <span><strong>{t.joiner_items}</strong> for the new joiner</span>
              <span><strong>{t.hr_items}</strong> for HR</span>
            </p>
            <div className="row-actions">
              <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing({ id: t.id })}><Pencil size={15} /> Edit</button>
              <button type="button" className="icon-btn" onClick={() => remove(t)} aria-label={`Delete ${t.name}`}><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
      </div>
      {editing && <ChecklistEditor templateId={editing.id} onClose={() => setEditing(null)} onSaved={reload} />}
    </>
  );
}

export default function Onboarding() {
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const manage = Boolean(can('onboarding.manage'));
  const { data: templates, reload: reloadTemplates } = useApi(manage ? '/api/onboarding/templates' : null);
  const { data: mine, loading: mineLoading } = useApi(manage ? null : '/api/onboarding/mine');
  const [starting, setStarting] = useState(Boolean(params.get('start')));

  // Staff: this page is just their own onboarding
  if (!manage) {
    if (mineLoading) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
    if (mine?.id) return <Navigate to={`/onboarding/${mine.id}`} replace />;
    return <EmptyState icon={ClipboardList} title="No onboarding for you" text="When HR sends you an onboarding checklist, it appears here." />;
  }

  const tabs = [
    { id: 'in_progress', label: 'In progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'checklists', label: 'Checklists' },
  ];
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'in_progress';

  return (
    <>
      <PageHeader
        title="Onboarding"
        subtitle="Send new joiners their first-week checklist, and keep track of HR’s side too."
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setStarting(true)} disabled={!templates}>
            <UserPlus size={18} /> Start onboarding
          </button>
        }
      />
      <Tabs tabs={tabs} active={tab} onChange={(id) => setParams({ tab: id })} />
      {tab === 'checklists' ? (
        templates ? <Checklists templates={templates} reload={reloadTemplates} /> : null
      ) : (
        <div className="card"><OnboardingList key={tab} status={tab} /></div>
      )}
      {starting && templates && (
        <StartModal
          templates={templates}
          preselect={params.get('start')}
          onClose={() => {
            setStarting(false);
            if (params.get('start')) setParams({});
          }}
        />
      )}
    </>
  );
}
