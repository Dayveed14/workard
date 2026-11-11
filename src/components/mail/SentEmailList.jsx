import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Paperclip } from 'lucide-react';
import EmptyState from '../EmptyState.jsx';
import Badge from '../Badge.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatDateTime } from '../../utils/format.js';
import './Mail.css';

// Recipients as "Ada, zenith@x.com +2"
export function peopleLine(recipients = []) {
  const shown = recipients.filter((r) => r.kind !== 'bcc');
  const names = shown.slice(0, 2).map((r) => r.name || r.email);
  return `${names.join(', ')}${shown.length > 2 ? ` +${shown.length - 2}` : ''}` || '—';
}

// The record of sent emails, filtered: box = sent | received | all, or for one customer / employee / invoice.
// Only emails the viewer is allowed to see come back from the server.
export default function SentEmailList({ box = 'all', customerId, employeeId, invoiceId, search = '', emptyText }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ box, page: String(page) });
  if (customerId) params.set('customerId', customerId);
  if (employeeId) params.set('employeeId', employeeId);
  if (invoiceId) params.set('invoiceId', invoiceId);
  if (search) params.set('search', search);
  const { data, error } = useApi(`/api/mail/sent?${params}`);

  if (error) return <p className="muted">{error}</p>;
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (!data.emails.length) return <EmptyState icon={Mail} title="No emails yet" text={emptyText || 'Emails sent from Workard show here.'} />;

  return (
    <>
      <ul className="mail-list">
        {data.emails.map((e) => (
          <li key={e.id}>
            <button type="button" onClick={() => navigate(`/mail/sent/${e.id}`)}>
              <span className="mail-list__who">{e.isMine ? `To: ${peopleLine(e.recipients)}` : `From: ${e.sender_name}`}</span>
              <span className="mail-list__main">
                <strong>{e.subject}</strong>
                <small>{e.snippet}</small>
              </span>
              <span className="mail-list__meta">
                {Number(e.attachment_count) > 0 && <Paperclip size={14} aria-label="Has attachments" />}
                {e.status === 'failed' && <Badge tone="red">Not sent</Badge>}
                {e.kind !== 'new' && <Badge tone="gray">{{ reply: 'Reply', reply_all: 'Reply all', forward: 'Forward' }[e.kind]}</Badge>}
                <small>{formatDateTime(e.sent_at || e.created_at)}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {data.pages > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="muted">Page {page} of {data.pages}</span>
          <button type="button" className="btn btn--outline btn--sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
