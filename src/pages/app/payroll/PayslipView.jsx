import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import PayslipDocument from '../../../components/PayslipDocument.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import './PayslipView.css';

// One payslip, ready to print. Staff see their own; payroll staff can open anyone's.
export default function PayslipView() {
  const { id } = useParams();
  const { employee } = useAuth();
  const { data: p, loading, error } = useApi(`/api/payroll/payslips/${id}`);

  if (loading) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (error) return <EmptyState title="Payslip not available" text={error} action={<Link to="/payslips" className="btn btn--outline">My payslips</Link>} />;

  const mine = employee?.id === p.employee_id;
  const back = mine ? { to: '/payslips', label: 'My payslips' } : { to: `/payroll/${p.run_id}`, label: 'Payroll' };

  return (
    <div className="payslip-view">
      <div className="payslip-view__bar">
        <Link to={back.to} className="link-btn"><ArrowLeft size={16} /> {back.label}</Link>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => window.print()}>
          <Printer size={16} /> Print / save PDF
        </button>
      </div>
      <PayslipDocument p={p} />
    </div>
  );
}
