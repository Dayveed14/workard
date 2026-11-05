import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, PenLine, Printer } from 'lucide-react';
import InvoiceDocument from '../components/InvoiceDocument.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import Field from '../components/Field.jsx';
import SignaturePad from '../components/SignaturePad.jsx';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { formatDate } from '../utils/format.js';
import './PublicInvoice.css';

// The customer accepts the invoice: their name, a drawn signature and an optional note
function AcceptModal({ token, onAccepted, onClose }) {
  const pad = useRef(null);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [signed, setSigned] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const next = {};
    if (name.trim().length < 2) next.name = 'Type your full name';
    if (!signed) next.signature = 'Sign in the box';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const acceptance = await api(`/api/public/invoices/${token}/accept`, {
        method: 'POST',
        body: { name: name.trim(), note, signature: pad.current.toDataUrl() },
      });
      onAccepted(acceptance);
      onClose();
    } catch (err) {
      setErrors({ ...err.errors, form: err.message });
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Accept & sign"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--success" onClick={submit} disabled={busy}>
            <CheckCircle2 size={16} /> {busy ? 'Sending…' : 'Accept invoice'}
          </button>
        </>
      }
    >
      <p className="muted public-invoice__intro">By signing you confirm this invoice is correct. The business gets a copy straight away.</p>
      {errors.form && !errors.name && !errors.signature && <p className="form__alert">{errors.form}</p>}
      <Field label="Your full name" name="signerName" error={errors.name}>
        <input id="signerName" className="field__input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Signature" name="signature" error={errors.signature}>
        <SignaturePad ref={pad} onChange={setSigned} />
      </Field>
      <Field label="Note to the business" name="note" optional>
        <textarea id="note" className="field__input" rows={3} maxLength={1000} placeholder="e.g. Please deliver before Friday" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </Modal>
  );
}

// /i/:token — what the customer opens from the email or WhatsApp link. No login.
export default function PublicInvoice() {
  const { token } = useParams();
  const { data, setData, loading, error } = useApi(`/api/public/invoices/${token}`);
  const [accepting, setAccepting] = useState(false);

  if (loading) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  return (
    <main className="public-invoice">
      {error ? (
        <EmptyState title="Invoice not found" text="This link may be wrong or the invoice was cancelled. Please contact the business that sent it." />
      ) : (
        <>
          <div className="public-invoice__bar no-print">
            <span>Invoice from <strong>{data.business.name}</strong></span>
            <div className="public-invoice__actions">
              {data.acceptance ? (
                <span className="public-invoice__accepted"><CheckCircle2 size={16} /> Accepted {formatDate(data.acceptance.acceptedAt)}</span>
              ) : (
                <button type="button" className="btn btn--success btn--sm" onClick={() => setAccepting(true)}>
                  <PenLine size={16} /> Accept & sign
                </button>
              )}
              <button type="button" className="btn btn--outline btn--sm" onClick={() => window.print()}>
                <Printer size={16} /> Print / Save PDF
              </button>
            </div>
          </div>
          <InvoiceDocument invoice={data} />
          {accepting && (
            <AcceptModal token={token} onAccepted={(acceptance) => setData((d) => ({ ...d, acceptance }))} onClose={() => setAccepting(false)} />
          )}
        </>
      )}
    </main>
  );
}
