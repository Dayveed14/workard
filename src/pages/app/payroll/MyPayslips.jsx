import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Badge from '../../../components/Badge.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { Pager, SearchBox, SortTh, useTable } from '../../../components/DataTable.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { formatMoney, monthLabel } from '../../../utils/format.js';
import '../../../components/IntervalToggle.css';
import './MyPayslips.css';

// Every employee can see their own payslips once a payroll is approved.
// Someone with years of payslips can pick a year, search ("march", "2024", "450,000") and sort.
export default function MyPayslips() {
  const navigate = useNavigate();
  const { data: payslips, loading } = useApi('/api/me/payslips');
  const [year, setYear] = useState('all');

  const years = useMemo(() => [...new Set((payslips || []).map((p) => p.period.slice(0, 4)))].sort().reverse(), [payslips]);
  const inYear = useCallback((p) => year === 'all' || p.period.startsWith(year), [year]);
  const table = useTable(payslips, {
    // what you might type: the month name, the year, or an amount (with or without commas)
    search: (p) => [monthLabel(p.period), p.period, formatMoney(p.net_kobo), formatMoney(p.gross_kobo), String(Math.round(p.net_kobo / 100)), p.payment_status === 'paid' ? 'paid' : 'coming'],
    sorts: { month: (p) => p.period, gross: (p) => Number(p.gross_kobo), net: (p) => Number(p.net_kobo) },
    defaultSort: { key: 'month', dir: 'desc' },
    pageSize: 12,
    filter: year === 'all' ? null : inYear,
  });

  if (loading || !payslips) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const shown = payslips.filter(inYear);
  const yearNet = shown.reduce((sum, p) => sum + Number(p.net_kobo), 0);
  const yearGross = shown.reduce((sum, p) => sum + Number(p.gross_kobo), 0);

  return (
    <>
      <PageHeader title="My payslips" subtitle="Your monthly payslips. Open one to print or save it as a PDF." />
      {payslips.length === 0 ? (
        <div className="card">
          <EmptyState icon={FileText} title="No payslips yet" text="Your payslip appears here once your company approves a payroll." />
        </div>
      ) : (
        <>
          <div className="slips__toolbar">
            {years.length > 1 && (
              <div className="interval-toggle slips__years" role="radiogroup" aria-label="Year">
                {['all', ...years].map((y) => (
                  <button key={y} type="button" role="radio" aria-checked={year === y} className={year === y ? 'is-on' : ''} onClick={() => setYear(y)}>
                    {y === 'all' ? 'All years' : y}
                  </button>
                ))}
              </div>
            )}
            <SearchBox table={table} placeholder="Search month, year or amount" label="Search payslips" />
          </div>

          <div className="slips__totals">
            <span>{year === 'all' ? 'All time' : year}: <strong>{shown.length}</strong> payslip{shown.length === 1 ? '' : 's'}</span>
            <span>Gross <strong>{formatMoney(yearGross)}</strong></span>
            <span>Take-home <strong>{formatMoney(yearNet)}</strong></span>
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="table table--clickable">
                <thead>
                  <tr>
                    <SortTh table={table} column="month">Month</SortTh>
                    <SortTh table={table} column="gross">Gross pay</SortTh>
                    <th>Deductions</th>
                    <SortTh table={table} column="net">Take-home</SortTh>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((p) => (
                    <tr key={p.id} onClick={() => navigate(`/payslips/${p.id}`)}>
                      <td><strong>{monthLabel(p.period)}</strong></td>
                      <td>{formatMoney(p.gross_kobo)}</td>
                      <td>{formatMoney(Number(p.gross_kobo) - Number(p.net_kobo))}</td>
                      <td><strong>{formatMoney(p.net_kobo)}</strong></td>
                      <td><Badge status={p.payment_status === 'paid' ? 'paid' : 'approved'}>{p.payment_status === 'paid' ? 'Paid' : 'Coming'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager table={table} noun="payslips" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
