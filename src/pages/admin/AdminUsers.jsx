import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Badge from '../../components/Badge.jsx';
import { SearchBox } from '../../components/DataTable.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, timeAgo } from '../../utils/format.js';

// /admin/users — anyone with a Workard log-in
export default function AdminUsers() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, setData } = useApi(`/api/admin/users${query ? `?search=${encodeURIComponent(query)}` : ''}`);
  const box = { query: search, setQuery: (v) => { setSearch(v); setQuery(v.trim()); } };

  const lock = async (u, locked) => {
    if (locked && !window.confirm(`Lock ${u.email}? They’re logged out everywhere and can’t log in until you unlock them.`)) return;
    try {
      await api(`/api/admin/users/${u.id}/lock`, { method: 'POST', body: { locked } });
      setData(data.map((x) => (x.id === u.id ? { ...x, locked_at: locked ? new Date().toISOString() : null } : x)));
      toast.success(locked ? 'Locked' : 'Unlocked');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const reset = async (u) => {
    try {
      toast.success((await api(`/api/admin/users/${u.id}/reset`, { method: 'POST' })).message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Find anyone by email, name or phone. Showing the newest 50 until you search." />
      <div className="adm-toolbar"><SearchBox table={box} placeholder="Email, name or phone" /></div>
      <div className="card">
        {!data ? <div className="page-loader"><span className="page-loader__spinner" /></div> : data.length === 0 ? <p className="adm-empty">Nobody matches.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Person</th><th>Companies</th><th>Last log-in</th><th>Joined</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.full_name}</strong> {Boolean(u.is_admin) && <Badge tone="amber">Super admin</Badge>} {u.locked_at && <Badge tone="red">Locked</Badge>}
                      <span className="adm-sub">{u.email}{u.phone && ` · ${u.phone}`}{!u.email_verified && ' · email not verified'}</span>
                    </td>
                    <td>
                      {u.memberships.length === 0 ? <span className="muted">—</span> : u.memberships.map((m) => (
                        <span key={m.orgId} className="adm-sub"><Link to={`/admin/companies/${m.orgId}`}>{m.orgName}</Link> · {m.role}{m.status !== 'active' && ' (removed)'}</span>
                      ))}
                    </td>
                    <td>{u.last_login_at ? timeAgo(u.last_login_at) : <span className="muted">never</span>}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td className="row-actions">
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => reset(u)}>Send reset link</button>
                      {u.locked_at
                        ? <button type="button" className="btn btn--outline btn--sm" onClick={() => lock(u, false)}>Unlock</button>
                        : <button type="button" className="btn btn--danger btn--sm" onClick={() => lock(u, true)}>Lock</button>}
                    </td>
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
