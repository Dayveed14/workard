import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Contact, Plus, Search } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Tabs from '../../../components/Tabs.jsx';
import Badge from '../../../components/Badge.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import CustomerModal from '../../../components/CustomerModal.jsx';
import FollowUpList from '../../../components/FollowUpList.jsx';
import SalesDashboard from '../../../components/SalesDashboard.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { toQuery } from '../../../api/client.js';
import { CUSTOMER_STAGES, formatDate, formatMoney, todayString } from '../../../utils/format.js';
import './Customers.css';

// How many customers are in each stage — click one to filter the list
function StageChips({ counts, active, onChange }) {
  if (!counts) return null;
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const chips = [['', 'All', total], ...Object.entries(CUSTOMER_STAGES).map(([v, l]) => [v, l, counts[v] || 0])];
  return (
    <div className="stage-chips" role="group" aria-label="Filter by stage">
      {chips.map(([value, label, count]) => (
        <button
          key={value || 'all'}
          type="button"
          className={`stage-chip stage-chip--${value || 'all'} ${active === value ? 'is-on' : ''}`}
          aria-pressed={active === value}
          onClick={() => onChange(active === value ? '' : value)}
        >
          <strong>{count}</strong>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function CustomerList() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [filters, setFilters] = useState({ search: '', stage: '', page: 1 });
  const [searchText, setSearchText] = useState('');
  const [adding, setAdding] = useState(false);
  const { data, loading, error } = useApi(`/api/customers${toQuery(filters)}`);

  const setFilter = (name, value) => setFilters((f) => ({ ...f, [name]: value, page: 1 }));

  return (
    <>
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setFilter('search', searchText.trim()); }}>
        <input
          className="field__input toolbar__search"
          placeholder="Search name, email, phone or contact"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onBlur={() => setFilter('search', searchText.trim())}
          aria-label="Search customers"
        />
        <button type="submit" className="btn btn--outline" aria-label="Search"><Search size={18} /></button>
        {can('customers.manage') && (
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
            <Plus size={18} /> Add customer
          </button>
        )}
      </form>

      <StageChips counts={data?.stageCounts} active={filters.stage} onChange={(stage) => setFilter('stage', stage)} />

      <div className="card">
        {loading && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {error && <p className="card__body">{error}</p>}
        {data?.customers.length === 0 && (
          <EmptyState icon={Contact} title="No customers yet" text="Add leads, prospects and customers to track every conversation and invoice." />
        )}
        {data?.customers.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table table--clickable">
                <thead>
                  <tr><th>Customer</th><th>Stage</th><th>Handled by</th><th>Owes</th><th>Last activity</th></tr>
                </thead>
                <tbody>
                  {data.customers.map((c) => (
                    <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                      <td>
                        <div className="person">
                          <span className="customers__icon">{c.type === 'business' ? '🏢' : '👤'}</span>
                          <span>
                            <strong>{c.name}</strong>
                            <span>{c.phone || c.email || c.contact_person || '—'}</span>
                          </span>
                        </div>
                      </td>
                      <td><Badge status={c.stage} /></td>
                      <td>{c.assigned_name || <span className="muted">Unassigned</span>}</td>
                      <td className={Number(c.balance_kobo) > 0 ? 'customers__owes' : 'muted'}>
                        {Number(c.balance_kobo) > 0 ? formatMoney(c.balance_kobo) : '—'}
                      </td>
                      <td className="muted">{c.last_activity_at ? formatDate(c.last_activity_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.pages > 1 && (
              <div className="pagination">
                <span>Page {data.page} of {data.pages} · {data.total} customers</span>
                <div>
                  <button type="button" className="btn btn--outline btn--sm" disabled={data.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Previous</button>
                  <button type="button" className="btn btn--outline btn--sm" disabled={data.page >= data.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {adding && <CustomerModal customer={null} onClose={() => setAdding(false)} onSaved={(c) => navigate(`/customers/${c.id}`)} />}
    </>
  );
}

export default function Customers() {
  const [params, setParams] = useSearchParams();
  const { data: followUps, reload: reloadFollowUps } = useApi('/api/customers/follow-ups');
  const { data: cases, reload: reloadCases } = useApi('/api/customers/cases');

  const tabs = [
    { id: 'list', label: 'Customers' },
    { id: 'sales', label: 'Sales' },
    { id: 'follow-ups', label: 'Follow-ups', count: followUps?.filter((f) => f.follow_up_on <= todayString()).length },
    { id: 'cases', label: 'Enquiries & complaints', count: cases?.length },
  ];
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'list';

  return (
    <>
      <PageHeader title="Customers" subtitle="Leads, prospects and customers — with every conversation in one place." />
      <Tabs tabs={tabs} active={tab} onChange={(id) => setParams({ tab: id })} />
      {tab === 'list' && <CustomerList />}
      {tab === 'sales' && <SalesDashboard />}
      {tab === 'follow-ups' && <div className="card"><FollowUpList items={followUps} onChange={reloadFollowUps} /></div>}
      {tab === 'cases' && <div className="card"><FollowUpList items={cases} mode="cases" onChange={reloadCases} /></div>}
    </>
  );
}
