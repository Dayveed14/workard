import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Badge from '../../../components/Badge.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { formatMoney, monthLabel } from '../../../utils/format.js';

// Every employee can see their own payslips once a payroll is approved
export default function MyPayslips() {
  const navigate = useNavigate();
  const { data: payslips, loading } = useApi('/api/me/payslips');

  if (loading || !payslips) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  return (
    <>
      <PageHeader title="My payslips" subtitle="Your monthly payslips. Open one to print or save it as a PDF." />
      <div className="card">
        {payslips.length === 0 ? (
          <EmptyState icon={FileText} title="No payslips yet" text="Your payslip appears here once your company approves a payroll." />
        ) : (
          <div className="table-wrap">
            <table className="table table--clickable">
              <thead>
                <tr><th>Month</th><th>Gross pay</th><th>Deductions</th><th>Take-home</th><th>Status</th></tr>
              </thead>
              <tbody>
                {payslips.map((p) => (
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
          </div>
        )}
      </div>
    </>
  );
}
