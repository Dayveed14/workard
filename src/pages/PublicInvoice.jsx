import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import InvoiceDocument from '../components/InvoiceDocument.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useApi } from '../hooks/useApi.js';
import './PublicInvoice.css';

// /i/:token — what the customer opens from the email or WhatsApp link. No login.
export default function PublicInvoice() {
  const { token } = useParams();
  const { data, loading, error } = useApi(`/api/public/invoices/${token}`);

  if (loading) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  return (
    <main className="public-invoice">
      {error ? (
        <EmptyState title="Invoice not found" text="This link may be wrong or the invoice was cancelled. Please contact the business that sent it." />
      ) : (
        <>
          <div className="public-invoice__bar no-print">
            <span>Invoice from <strong>{data.business.name}</strong></span>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => window.print()}>
              <Printer size={16} /> Print / Save PDF
            </button>
          </div>
          <InvoiceDocument invoice={data} />
        </>
      )}
    </main>
  );
}
