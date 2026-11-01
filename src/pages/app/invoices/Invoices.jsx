import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, FileText, Plus, Search, Wallet } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Tabs from '../../../components/Tabs.jsx';
import Badge from '../../../components/Badge.jsx';
import StatCard from '../../../components/StatCard.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { toQuery } from '../../../api/client.js';
import { formatDate, formatMoney } from '../../../utils/format.js';
import './Invoices.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'paid', label: 'Paid' },
  { id: 'void', label: 'Void' },
];

export default function Invoices() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = FILTERS.some((f) => f.id === params.get('filter')) ? params.get('filter') : 'all';
  const [search, setSearch] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, error } = useApi(`/api/invoices${toQuery({ filter, search, page })}`);
  const summary = data?.summary;

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Create, send and get paid — and see who still owes you."
        actions={
          can('invoices.manage') && (
            <Link to="/invoices/new" className="btn btn--primary"><Plus size={18} /> New invoice</Link>
          )
        }
      />

      {summary && (
        <div className="invoices__stats">
          <StatCard icon={Wallet} tone="blue" label="Outstanding" value={formatMoney(summary.outstandingKobo)} hint={`${summary.unpaidCount} unpaid invoice(s)`} />
          <StatCard icon={AlertTriangle} tone="red" label="Overdue" value={formatMoney(summary.overdueKobo)} hint={`${summary.overdueCount} past due date`} />
          <StatCard icon={FileText} tone="gray" label="Drafts" value={summary.draftCount} hint="not sent yet" />
        </div>
      )}

      <Tabs
        tabs={FILTERS.map((f) => ({ ...f, count: f.id === 'overdue' ? summary?.overdueCount : undefined }))}
        active={filter}
        onChange={(id) => { setParams({ filter: id }); setPage(1); }}
      />

      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setSearch(searchText.trim()); setPage(1); }}>
        <input className="field__input toolbar__search" placeholder="Search invoice number or customer" value={searchText} onChange={(e) => setSearchText(e.target.value)} aria-label="Search invoices" />
        <button type="submit" className="btn btn--outline" aria-label="Search"><Search size={18} /></button>
      </form>

      <div className="card">
        {loading && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {error && <p className="card__body">{error}</p>}
        {data?.invoices.length === 0 && (
          <EmptyState
            icon={FileText}
            title={filter === 'all' ? 'No invoices yet' : 'Nothing here'}
            text={filter === 'all' ? 'Create your first invoice and send it by email or WhatsApp.' : undefined}
            action={filter === 'all' && can('invoices.manage') && <Link to="/invoices/new" className="btn btn--primary">New invoice</Link>}
          />
        )}
        {data?.invoices.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table table--clickable">
                <thead>
                  <tr><th>Number</th><th>Customer</th><th>Issued</th><th>Due</th><th>Total</th><th>Balance</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.invoices.map((i) => (
                    <tr key={i.id} onClick={() => navigate(`/invoices/${i.id}`)}>
                      <td><strong>{i.invoice_number}</strong></td>
                      <td>{i.customer_name}</td>
                      <td className="muted">{formatDate(i.issue_date)}</td>
                      <td className={i.display_status === 'overdue' ? 'invoices__late' : 'muted'}>{formatDate(i.due_date)}</td>
                      <td>{formatMoney(i.total_kobo)}</td>
                      <td>{['sent', 'partially_paid'].includes(i.status) ? <strong>{formatMoney(i.balance_kobo)}</strong> : <span className="muted">—</span>}</td>
                      <td><Badge status={i.display_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.pages > 1 && (
              <div className="pagination">
                <span>Page {data.page} of {data.pages}</span>
                <div>
                  <button type="button" className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                  <button type="button" className="btn btn--outline btn--sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
