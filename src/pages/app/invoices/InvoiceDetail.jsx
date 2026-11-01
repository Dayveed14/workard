import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Ban, Copy, Eye, Mail, MessageCircle, Pencil, Printer, Send, Trash2, Wallet } from 'lucide-react';
import InvoiceDocument from '../../../components/InvoiceDocument.jsx';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { PAYMENT_METHODS, formatDate, formatDateTime, formatMoney, newRequestId, todayString } from '../../../utils/format.js';
import './InvoiceDetail.css';

function SendModal({ invoice, onClose, onSent }) {
  const toast = useToast();
  const [busy, setBusy] = useState('');

  const send = async (channel) => {
    setBusy(channel);
    // Open the WhatsApp tab straight away (browsers block pop-ups opened after waiting)
    const waWindow = channel === 'whatsapp' ? window.open('', '_blank') : null;
    try {
      const res = await api(`/api/invoices/${invoice.id}/send`, { method: 'POST', body: { channel } });
      if (channel === 'whatsapp') {
        if (waWindow) waWindow.location.href = res.whatsappUrl;
        else window.location.href = res.whatsappUrl;
      }
      if (channel === 'link') {
        await navigator.clipboard?.writeText(res.publicUrl).catch(() => {});
        toast.success('Link copied — paste it anywhere');
      } else toast.success(res.message);
      onSent();
      onClose();
    } catch (err) {
      waWindow?.close();
      toast.error(err.message);
      setBusy('');
    }
  };

  return (
    <Modal title={`Send ${invoice.invoice_number}`} size="sm" onClose={onClose}>
      <p className="inv-detail__send-text">
        {invoice.customer_name} will get a link to view the invoice online, see how to pay, and print or save it as a PDF.
      </p>
      <div className="inv-detail__send-options">
        <button type="button" className="inv-detail__send-btn" onClick={() => send('email')} disabled={!!busy || !invoice.customer_email}>
          <Mail size={20} />
          <span>
            <strong>Email it</strong>
            <small>{invoice.customer_email || 'This customer has no email address'}</small>
          </span>
        </button>
        <button type="button" className="inv-detail__send-btn" onClick={() => send('whatsapp')} disabled={!!busy}>
          <MessageCircle size={20} />
          <span>
            <strong>Share on WhatsApp</strong>
            <small>{invoice.customer_phone || 'Choose the chat in WhatsApp'}</small>
          </span>
        </button>
        <button type="button" className="inv-detail__send-btn" onClick={() => send('link')} disabled={!!busy}>
          <Copy size={20} />
          <span>
            <strong>Copy link</strong>
            <small>Paste it in SMS, Instagram, anywhere</small>
          </span>
        </button>
      </div>
    </Modal>
  );
}

function PaymentModal({ invoice, onClose, onSaved }) {
  const toast = useToast();
  // One id per opened form: if "Save" is clicked twice, the payment is still saved once
  const [requestId] = useState(newRequestId);
  const [form, setForm] = useState({
    amount: (invoice.balance_kobo / 100).toFixed(2),
    paidOn: todayString(),
    method: 'transfer',
    reference: '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api(`/api/invoices/${invoice.id}/payments`, { method: 'POST', body: { ...form, requestId } });
      toast.success('Payment recorded');
      onSaved();
      onClose();
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Record payment"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--success" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save payment'}</button>
        </>
      }
    >
      <div className="form form--flush">
        {error && <div className="form__alert"><AlertCircle size={18} /> {error}</div>}
        <p className="muted">Balance on {invoice.invoice_number}: <strong>{formatMoney(invoice.balance_kobo)}</strong></p>
        <div className="form__row">
          <Field label="Amount (₦)" name="amount" error={errors.amount}>
            <input id="amount" name="amount" type="number" min="0" step="0.01" className="field__input" value={form.amount} onChange={onChange} />
          </Field>
          <Field label="Date paid" name="paidOn" error={errors.paidOn}>
            <input id="paidOn" name="paidOn" type="date" max={todayString()} className="field__input" value={form.paidOn} onChange={onChange} />
          </Field>
        </div>
        <div className="form__row">
          <Field label="Method" name="method">
            <select id="method" name="method" className="field__input" value={form.method} onChange={onChange}>
              {Object.entries(PAYMENT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Reference" name="reference" optional>
            <input id="reference" name="reference" className="field__input" placeholder="e.g. bank ref" value={form.reference} onChange={onChange} />
          </Field>
        </div>
        <Field label="Note" name="note" optional>
          <input id="note" name="note" className="field__input" value={form.note} onChange={onChange} />
        </Field>
      </div>
    </Modal>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const { data: invoice, loading, error, reload } = useApi(`/api/invoices/${id}`);
  const [modal, setModal] = useState(null); // 'send' | 'pay'

  if (loading) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (error) return <EmptyState title="Invoice not available" text={error} action={<Link to="/invoices" className="btn btn--outline">Back to invoices</Link>} />;

  const isVoid = invoice.status === 'void';
  const hasPayments = Number(invoice.amount_paid_kobo) > 0;
  const canEdit = can('invoices.manage') && !isVoid && !hasPayments;
  const canPay = can('invoices.payments') && !isVoid && Number(invoice.balance_kobo) > 0;

  const run = async (fn, message, after) => {
    try {
      await fn();
      toast.success(message);
      after ? after() : reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="inv-detail">
      <div className="inv-detail__bar no-print">
        <Link to="/invoices" className="link-btn"><ArrowLeft size={16} /> Invoices</Link>
        <div className="inv-detail__actions">
          {canEdit && (
            <Link to={`/invoices/${id}/edit`} className="btn btn--outline btn--sm"><Pencil size={16} /> Edit</Link>
          )}
          <button type="button" className="btn btn--outline btn--sm" onClick={() => window.print()}><Printer size={16} /> Print / PDF</button>
          {can('invoices.manage') && !isVoid && (
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setModal('send')}>
              <Send size={16} /> {invoice.sent_at ? 'Send again' : 'Send'}
            </button>
          )}
          {canPay && (
            <button type="button" className="btn btn--success btn--sm" onClick={() => setModal('pay')}><Wallet size={16} /> Record payment</button>
          )}
        </div>
      </div>

      <div className="inv-detail__grid">
        <InvoiceDocument invoice={invoice} />

        <aside className="inv-detail__side no-print">
          <section className="card card__body inv-detail__history">
            <h2>History</h2>
            <ul>
              <li>Created {formatDateTime(invoice.created_at)}</li>
              {invoice.sent_at && <li>Sent {formatDateTime(invoice.sent_at)}</li>}
              {invoice.viewed_at ? (
                <li className="inv-detail__viewed"><Eye size={14} /> Viewed by customer {formatDateTime(invoice.viewed_at)}</li>
              ) : invoice.sent_at ? (
                <li className="muted">Not opened yet</li>
              ) : null}
              {invoice.voided_at && <li>Voided {formatDateTime(invoice.voided_at)}</li>}
            </ul>
            {invoice.publicUrl && (
              <button type="button" className="link-btn" onClick={() => navigator.clipboard?.writeText(invoice.publicUrl).then(() => toast.success('Link copied'))}>
                <Copy size={14} /> Copy customer link
              </button>
            )}
          </section>

          <section className="card">
            <header className="card__header"><h2>Payments</h2><span className="muted">{formatMoney(invoice.amount_paid_kobo)}</span></header>
            {invoice.payments.length === 0 ? (
              <p className="card__body muted">No payments yet.</p>
            ) : (
              <ul className="inv-detail__payments">
                {invoice.payments.map((p) => (
                  <li key={p.id}>
                    <span>
                      <strong>{formatMoney(p.amount_kobo)}</strong>
                      <small>{formatDate(p.paid_on)} · {PAYMENT_METHODS[p.method]}{p.reference ? ` · ${p.reference}` : ''}</small>
                      <small>Recorded by {p.recorded_by_name || '—'}</small>
                    </span>
                    {can('invoices.payments') && (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Remove payment"
                        onClick={() => window.confirm(`Remove this ${formatMoney(p.amount_kobo)} payment? It will be recorded in the activity log.`) &&
                          run(() => api(`/api/invoices/payments/${p.id}`, { method: 'DELETE' }), 'Payment removed')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {can('invoices.manage') && !isVoid && (
            <section className="inv-detail__danger">
              {invoice.status === 'draft' ? (
                <button type="button" className="link-btn inv-detail__danger-btn" onClick={() => window.confirm('Delete this draft?') && run(() => api(`/api/invoices/${id}`, { method: 'DELETE' }), 'Draft deleted', () => navigate('/invoices'))}>
                  <Trash2 size={14} /> Delete draft
                </button>
              ) : (
                <button
                  type="button"
                  className="link-btn inv-detail__danger-btn"
                  disabled={hasPayments}
                  title={hasPayments ? 'Remove payments before voiding' : ''}
                  onClick={() => window.confirm('Void this invoice? It stays on record but no longer counts as owed.') && run(() => api(`/api/invoices/${id}/void`, { method: 'POST' }), 'Invoice voided')}
                >
                  <Ban size={14} /> Void invoice
                </button>
              )}
            </section>
          )}
        </aside>
      </div>

      {modal === 'send' && <SendModal invoice={invoice} onClose={() => setModal(null)} onSent={reload} />}
      {modal === 'pay' && <PaymentModal invoice={invoice} onClose={() => setModal(null)} onSaved={reload} />}
    </div>
  );
}
