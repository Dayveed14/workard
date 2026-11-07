import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Badge from '../../components/Badge.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime } from '../../utils/format.js';

const STATUS = { new: { label: 'New', tone: 'blue' }, contacted: { label: 'Contacted', tone: 'amber' }, closed: { label: 'Closed', tone: 'gray' } };

// /admin/demos — "Book a demo" requests from the website
export default function AdminDemos() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const { data, setData } = useApi(`/api/admin/demos${status ? `?status=${status}` : ''}`);
  const [notes, setNotes] = useState({});

  const update = async (d, body) => {
    try {
      const updated = await api(`/api/admin/demos/${d.id}`, { method: 'PATCH', body });
      setData(data.map((x) => (x.id === d.id ? updated : x)));
      toast.success('Saved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Demo requests" subtitle="People who asked for a demo on the website. Every super admin is emailed when one comes in." />
      <div className="adm-toolbar">
        <div className="adm-chips">
          {[['', 'All'], ['new', 'New'], ['contacted', 'Contacted'], ['closed', 'Closed']].map(([v, l]) => (
            <button key={v} type="button" className={status === v ? 'is-on' : ''} onClick={() => setStatus(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="card">
        {!data ? <div className="page-loader"><span className="page-loader__spinner" /></div> : data.length === 0 ? <p className="adm-empty">No requests.</p> : (
          <ul className="adm-demos">
            {data.map((d) => (
              <li key={d.id}>
                <div className="adm-demos__who">
                  <strong>{d.full_name}</strong> <Badge tone={STATUS[d.status].tone}>{STATUS[d.status].label}</Badge>
                  <span className="adm-sub">
                    <a href={`mailto:${d.email}`}>{d.email}</a>{d.phone && <> · <a href={`tel:${d.phone}`}>{d.phone}</a></>} · {d.company || 'no company given'}{d.company_size && ` · ${d.company_size} staff`}
                  </span>
                  {d.message && <p className="adm-demos__msg">{d.message}</p>}
                  <span className="adm-sub">{formatDateTime(d.created_at)}</span>
                </div>
                <div className="adm-demos__act">
                  <select className="field__input" value={d.status} onChange={(e) => update(d, { status: e.target.value })} aria-label="Status">
                    {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                  </select>
                  <input className="field__input" placeholder="Note (only admins see it)" defaultValue={d.note || ''} onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })} onBlur={() => notes[d.id] !== undefined && notes[d.id] !== (d.note || '') && update(d, { note: notes[d.id] })} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
