import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DoorOpen, Save } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Tabs from '../../../components/Tabs.jsx';
import Avatar from '../../../components/Avatar.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { Checklists, Progress } from '../onboarding/Onboarding.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate } from '../../../utils/format.js';
import { EXIT_TYPES, StatusBadge, timeLeft } from './offboardingBits.jsx';
import '../onboarding/Onboarding.css';
import './Offboarding.css';

// /offboarding — HR: people leaving, the offboarding checklists, and the notice period.
// People are added here when they resign (Requests → Resignation) or when HR exits
// someone from their profile (Exit → "with a checklist").
function NoticeSetting() {
  const toast = useToast();
  const { data, setData } = useApi('/api/offboarding/settings');
  const [value, setValue] = useState(null);
  if (!data) return null;
  const days = value ?? data.noticeDays;
  const save = async () => {
    try {
      setData(await api('/api/offboarding/settings', { method: 'PUT', body: { noticeDays: Number(days) } }));
      setValue(null);
      toast.success('Notice period saved');
    } catch (err) {
      toast.error(err.message);
    }
  };
  return (
    <label className="off-notice">
      <span>Notice period</span>
      <input type="number" min="0" max="180" className="field__input" value={days} onChange={(e) => setValue(e.target.value)} aria-label="Notice period in days" />
      <span>days</span>
      {value !== null && Number(value) !== data.noticeDays && <button type="button" className="btn btn--primary btn--sm" onClick={save}><Save size={14} /> Save</button>}
    </label>
  );
}

function People({ status }) {
  const navigate = useNavigate();
  const { data } = useApi(`/api/offboarding?status=${status}`);
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (!data.length) {
    return (
      <div className="card">
        <EmptyState
          icon={DoorOpen}
          title={status === 'open' ? 'Nobody is leaving' : 'Nothing here yet'}
          text={status === 'open' ? 'When someone resigns, or you exit someone from their profile, they show up here.' : 'People who left (or stayed) show here.'}
        />
      </div>
    );
  }
  return (
    <div className="card table-wrap">
      <table className="table table--clickable">
        <thead><tr><th>Person</th><th>Type</th><th>Last day</th><th>Checklist</th><th>Status</th></tr></thead>
        <tbody>
          {data.map((o) => (
            <tr key={o.id} onClick={() => navigate(`/offboarding/${o.id}`)}>
              <td>
                <span className="person">
                  <Avatar name={`${o.first_name} ${o.last_name}`} src={o.photo_url} size={34} />
                  <span><strong>{o.first_name} {o.last_name}</strong><span>{o.job_title || o.department_name || '—'}</span></span>
                </span>
              </td>
              <td>{EXIT_TYPES[o.exit_type]}{o.by_employee ? <span className="adm-sub muted"> · they resigned</span> : ''}</td>
              <td>{formatDate(o.last_day)}{['notice', 'in_progress'].includes(o.status) && <small className="off-left">{timeLeft(o.ends_at)}</small>}</td>
              <td>{o.template_name ? <Progress done={Number(o.done_items)} total={Number(o.total_items)} /> : <span className="muted">Not sent</span>}{Number(o.overdue_items) > 0 && <small className="off-overdue">{o.overdue_items} overdue</small>}</td>
              <td><StatusBadge status={o.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Offboarding() {
  const [params, setParams] = useSearchParams();
  const { data: templates, reload } = useApi('/api/onboarding/templates?kind=offboarding');
  const tabs = [
    { id: 'open', label: 'Leaving' },
    { id: 'exited', label: 'Left' },
    { id: 'withdrawn', label: 'Withdrawn' },
    { id: 'checklists', label: 'Checklists' },
  ];
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'open';

  return (
    <>
      <PageHeader
        title="Offboarding"
        subtitle="People leaving: their notice period, handover and the company items they return."
        actions={<NoticeSetting />}
      />
      <Tabs tabs={tabs} active={tab} onChange={(id) => setParams({ tab: id })} />
      {tab === 'checklists'
        ? (templates ? <Checklists templates={templates} reload={reload} kind="offboarding" /> : <div className="page-loader"><span className="page-loader__spinner" /></div>)
        : <People key={tab} status={tab} />}
    </>
  );
}
