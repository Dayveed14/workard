import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { toQuery } from '../../api/client.js';
import { fullName } from '../../utils/format.js';

export default function Employees() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Search, filters and page live in the address (?search=ada&page=2), so the
  // "← Employees" link on a profile brings you back to exactly this list
  const [params, setParams] = useSearchParams();
  const filters = {
    search: params.get('search') || '',
    branchId: params.get('branchId') || '',
    departmentId: params.get('departmentId') || '',
    status: params.has('status') ? params.get('status') : 'active',
    page: Number(params.get('page')) || 1,
  };
  const setFilters = (update) => {
    const next = typeof update === 'function' ? update(filters) : update;
    const clean = {};
    for (const [k, v] of Object.entries(next)) {
      if (k === 'status' ? v !== 'active' : k === 'page' ? v > 1 : v) clean[k] = String(v);
    }
    setParams(clean, { replace: true });
  };
  const [searchText, setSearchText] = useState(filters.search);
  const open = (id) => navigate(`/employees/${id}`, { state: { from: `${location.pathname}${location.search}`, label: 'Employees' } });

  const { data, loading, error } = useApi(`/api/employees${toQuery(filters)}`);
  const { data: structure } = useApi('/api/organization/structure');

  const setFilter = (name, value) => setFilters((f) => ({ ...f, [name]: value, page: 1 }));

  const onSearch = (e) => {
    e.preventDefault();
    setFilter('search', searchText.trim());
  };

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={data ? `${data.total} ${filters.status || 'total'} employee(s)` : ' '}
        actions={
          can('employees.create') && (
            <Link to="/employees/new" className="btn btn--primary">
              <Plus size={18} /> Add employee
            </Link>
          )
        }
      />

      <form className="toolbar" onSubmit={onSearch}>
        <input
          className="field__input toolbar__search"
          placeholder="Search name, email, staff ID or job title"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onBlur={() => setFilter('search', searchText.trim())}
          aria-label="Search employees"
        />
        <button type="submit" className="btn btn--outline" aria-label="Search">
          <Search size={18} />
        </button>
        <select className="field__input" value={filters.branchId} onChange={(e) => setFilter('branchId', e.target.value)} aria-label="Branch">
          <option value="">All branches</option>
          {structure?.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="field__input" value={filters.departmentId} onChange={(e) => setFilter('departmentId', e.target.value)} aria-label="Department">
          <option value="">All departments</option>
          {structure?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="field__input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
          <option value="active">Active</option>
          <option value="exited">Exited</option>
          <option value="">All</option>
        </select>
      </form>

      <div className="card">
        {loading && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {error && <p className="card__body">{error}</p>}
        {data && data.employees.length === 0 && (
          <EmptyState icon={Users} title="No employees found" text="Try a different search or filter." />
        )}
        {data && data.employees.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table table--clickable">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Staff ID</th>
                    <th>Department</th>
                    <th>Branch</th>
                    <th>Access</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.employees.map((e) => (
                    <tr key={e.id} onClick={() => open(e.id)}>
                      <td>
                        <div className="person">
                          <Avatar name={fullName(e)} src={e.photo_url} />
                          <span>
                            <strong>{fullName(e)}</strong>
                            <span>{e.job_title || e.email}</span>
                          </span>
                        </div>
                      </td>
                      <td>{e.staff_id || <span className="muted">—</span>}</td>
                      <td>{e.department_name || <span className="muted">—</span>}</td>
                      <td>{e.branch_name || <span className="muted">—</span>}</td>
                      <td>
                        {e.role_name ? (
                          e.role_name
                        ) : Number(e.pending_invites) > 0 ? (
                          <Badge status="invited">Invited</Badge>
                        ) : (
                          <span className="muted">No login</span>
                        )}
                      </td>
                      <td><Badge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.pages > 1 && (
              <div className="pagination">
                <span>Page {data.page} of {data.pages}</span>
                <div>
                  <button type="button" className="btn btn--outline btn--sm" disabled={data.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Previous</button>
                  <button type="button" className="btn btn--outline btn--sm" disabled={data.page >= data.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
