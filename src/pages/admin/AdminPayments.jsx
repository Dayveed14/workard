import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Badge from '../../components/Badge.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatDate, formatMoney } from '../../utils/format.js';

const KINDS = { new: 'First payment', renewal: 'Renewal', upgrade: 'Upgrade', auto_renewal: 'Automatic renewal' };

// /admin/payments — every payment to Workard (Workard's own Paystack account)
export default function AdminPayments() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data } = useApi(`/api/admin/payments?page=${page}${status ? `&status=${status}` : ''}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / 50)) : 1;

  return (
    <>
      <PageHeader title="Payments" subtitle={data ? `${data.total} payment${data.total === 1 ? '' : 's'} · ${formatMoney(data.paidKobo, { decimals: false })} received` : ' '} />
      <div className="adm-toolbar">
        <div className="adm-chips">
          {[['', 'All'], ['paid', 'Paid'], ['failed', 'Failed'], ['initiated', 'Started, not paid']].map(([v, l]) => (
            <button key={v} type="button" className={status === v ? 'is-on' : ''} onClick={() => { setStatus(v); setPage(1); }}>{l}</button>
          ))}
        </div>
      </div>
      <div className="card">
        {!data ? <div className="page-loader"><span className="page-loader__spinner" /></div> : data.rows.length === 0 ? <p className="adm-empty">No payments.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Company</th><th>What</th><th>Amount</th><th>Covers</th><th>Status</th></tr></thead>
              <tbody>
                {data.rows.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.paid_at || p.created_at)}</td>
                    <td><Link to={`/admin/companies/${p.organization_id}`}>{p.organization_name}</Link></td>
                    <td>{KINDS[p.kind]}<span className="adm-sub">{p.plan}{p.billing_interval && `, ${p.billing_interval}`}</span></td>
                    <td><strong>{formatMoney(p.amount_kobo, { decimals: false })}</strong></td>
                    <td>{p.period_start ? `${formatDate(p.period_start)} – ${formatDate(p.period_end)}` : '—'}</td>
                    <td><Badge status={p.status === 'initiated' ? 'pending' : p.status}>{p.status === 'initiated' ? 'Not paid' : undefined}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="dt-pager">
                <span className="muted">Page {page} of {pages}</span>
                <span className="dt-pager__buttons">
                  <button type="button" className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                  <button type="button" className="btn btn--outline btn--sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
