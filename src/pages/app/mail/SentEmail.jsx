import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, FileText } from 'lucide-react';
import EmptyState from '../../../components/EmptyState.jsx';
import Badge from '../../../components/Badge.jsx';
import EmailFrame from '../../../components/mail/EmailFrame.jsx';
import { fileSize } from '../../../components/mail/ComposeModal.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { formatDateTime } from '../../../utils/format.js';
import '../../../components/mail/Mail.css';

const KIND = { to: 'To', cc: 'Cc', bcc: 'Bcc' };

// /mail/sent/:id — one email sent from Workard. Only the sender and the Workard users it went to can open it;
// a bcc'd person sees only their own bcc line (the server decides).
export default function SentEmail() {
  const { id } = useParams();
  const { data: e, error } = useApi(`/api/mail/sent/${id}`);
  if (error) return <EmptyState title="Email not available" text={error} action={<Link to="/mail?tab=sent" className="btn btn--outline">Back to Mail</Link>} />;
  if (!e) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  return (
    <div className="thread">
      <Link to={`/mail?tab=${e.isMine ? 'sent' : 'received'}`} className="link-btn"><ArrowLeft size={16} /> Mail</Link>
      <h1 className="thread__subject">{e.subject}</h1>
      <article className="card thread__message">
        <dl className="sent__meta">
          <dt>From</dt>
          <dd>{e.from_name ? `${e.from_name} <${e.from_email}>` : e.from_email} {!e.isMine && <small className="muted">({e.sender_name})</small>}</dd>
          {['to', 'cc', 'bcc'].map((kind) => {
            const list = e.recipients.filter((r) => r.kind === kind);
            return list.length ? (
              <span key={kind} className="sent__row">
                <dt>{KIND[kind]}</dt>
                <dd>{list.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(', ')}</dd>
              </span>
            ) : null;
          })}
          <dt>Sent</dt>
          <dd>{formatDateTime(e.sent_at || e.created_at)} {e.kind !== 'new' && <Badge tone="gray">{{ reply: 'Reply', reply_all: 'Reply all', forward: 'Forward' }[e.kind]}</Badge>}</dd>
          {(e.customer_name || e.invoice_number || e.employee_name) && (
            <>
              <dt>Filed on</dt>
              <dd className="sent__links">
                {e.customer_name && <Link to={`/customers/${e.customer_id}`}>{e.customer_name}</Link>}
                {e.invoice_number && <Link to={`/invoices/${e.invoice_id}`}>{e.invoice_number}</Link>}
                {e.employee_name && <Link to={`/employees/${e.employee_id}`}>{e.employee_name}</Link>}
              </dd>
            </>
          )}
        </dl>
        {e.status === 'failed' && <div className="form__alert"><AlertCircle size={18} /> Not sent: {e.error}</div>}
        <EmailFrame html={e.body_html} />
        {e.attachments.length > 0 && (
          <div className="thread__files">
            {e.attachments.map((a) =>
              a.file_url ? (
                <a key={a.id} className="compose__file" href={a.file_url} target="_blank" rel="noreferrer" download={a.file_name}><FileText size={14} /> {a.file_name} <small>{fileSize(a.size_bytes)}</small></a>
              ) : (
                <span key={a.id} className="compose__file"><FileText size={14} /> {a.file_name} <small>{fileSize(a.size_bytes)}</small></span>
              )
            )}
          </div>
        )}
      </article>
    </div>
  );
}
