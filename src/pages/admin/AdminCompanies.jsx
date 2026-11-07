import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import { SearchBox } from '../../components/DataTable.jsx';
import { useApi } from '../../hooks/useApi.js';
import { toQuery } from '../../api/client.js';
import { formatDate, timeAgo } from '../../utils/format.js';
import { CompanyBadge, COMPANY_STATUS } from './adminBits.jsx';

// /admin/companies — every company on Workard
export default function AdminCompanies() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const page = Number(params.get('page')) || 1;
  const [search, setSearch] = useState(params.get('search') || '');
  const { data } = useApi(`/api/admin/companies${toQuery({ search: params.get('search'), status, page })}`);
  const set = (k, v) => {
    const next = Object.fromEntries(params);
    if (v) next[k] = v; else delete next[k];
    if (k !== 'page') delete next.page;
    setParams(next, { replace: true });
  };
  // The search box helper expects a table-like object
  const box = { query: search, setQuery: (v) => { setSearch(v); set('search', v.trim()); } };

  return (
    <>
      <PageHeader title="Companies" subtitle={data ? `${data.total} compan${data.total === 1 ? 'y' : 'ies'}` : ' '} />
      <div className="adm-toolbar">
        <SearchBox table={box} placeholder="Company, owner name or email" />
        <div className="adm-chips" role="group" aria-label="Status">
          <button type="button" className={!status ? 'is-on' : ''} onClick={() => set('status', '')}>All</button>
          {Object.entries(COMPANY_STATUS).filter(([k]) => data?.counts?.[k]).map(([k, s]) => (
            <button key={k} type="button" className={status === k ? 'is-on' : ''} onClick={() => set('status', k)}>{s.label}<span>{data.counts[k]}</span></button>
          ))}
        </div>
      </div>
      <div className="card">
        {!data ? <div className="page-loader"><span className="page-loader__spinner" /></div> : data.companies.length === 0 ? <p className="adm-empty">No companies match.</p> : (
          <div className="table-wrap">
            <table className="table table--clickable">
              <thead><tr><th>Company</th><th>Owner</th><th>Status</th><th>Plan</th><th>Staff</th><th>Until</th><th>Last active</th><th>Joined</th></tr></thead>
              <tbody>
                {data.companies.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/admin/companies/${c.id}`)}>
                    <td><strong>{c.name}</strong><span className="adm-sub">{c.industry || '—'}</span></td>
                    <td>{c.owner?.name || '—'}<span className="adm-sub">{c.owner?.email}</span></td>
                    <td><CompanyBadge status={c.status} /></td>
                    <td>{c.planName}{c.interval && <span className="adm-sub">{c.interval}</span>}</td>
                    <td>{c.employees}</td>
                    <td>{c.periodEnd ? formatDate(c.periodEnd) : '—'}</td>
                    <td>{c.lastActive ? timeAgo(c.lastActive) : <span className="muted">never</span>}</td>
                    <td>{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.pages > 1 && (
              <div className="dt-pager">
                <span className="muted">Page {data.page} of {data.pages}</span>
                <span className="dt-pager__buttons">
                  <button type="button" className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => set('page', String(page - 1))}>Previous</button>
                  <button type="button" className="btn btn--outline btn--sm" disabled={page >= data.pages} onClick={() => set('page', String(page + 1))}>Next</button>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
