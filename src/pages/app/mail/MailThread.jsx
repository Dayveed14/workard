import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Forward, Reply, ReplyAll } from 'lucide-react';
import EmptyState from '../../../components/EmptyState.jsx';
import Avatar from '../../../components/Avatar.jsx';
import EmailFrame from '../../../components/mail/EmailFrame.jsx';
import ComposeModal, { fileSize } from '../../../components/mail/ComposeModal.jsx';
import { api, API_URL } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { formatDateTime } from '../../../utils/format.js';
import '../../../components/mail/Mail.css';

const names = (list = []) => list.map((p) => p.name || p.email).join(', ');
const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

// /mail/thread/:threadId — one received conversation, read live from Gmail / Outlook
export default function MailThread() {
  const { threadId } = useParams();
  const { data: thread, error } = useApi(`/api/mail/inbox/threads/${encodeURIComponent(threadId)}`);
  const [replying, setReplying] = useState(null); // { message, mode }

  // Opening it marks it read in Gmail / Outlook too
  useEffect(() => {
    if (thread?.messages.some((m) => m.unread)) api(`/api/mail/inbox/threads/${encodeURIComponent(threadId)}/read`, { method: 'POST' }).catch(() => {});
  }, [thread, threadId]);

  if (error) return <EmptyState title="Conversation not available" text={error} action={<Link to="/mail" className="btn btn--outline">Back to Mail</Link>} />;
  if (!thread) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  // Who a reply goes to. Reply: the sender (or their Reply-To). Reply all: + everyone else except me.
  const recipientsFor = (m, mode) => {
    if (mode === 'forward') return { to: [], cc: [] };
    const me = thread.me;
    const to = (m.replyTo?.length ? m.replyTo : [m.from]).filter((p) => p && p.email !== me);
    if (mode === 'reply') return { to, cc: [] };
    const others = [...(m.to || []), ...(m.cc || [])].filter((p) => p && p.email !== me && !to.some((t) => t.email === p.email));
    return { to, cc: others };
  };

  const startReply = (message, mode) => {
    const { to, cc } = recipientsFor(message, mode);
    const quoted = mode === 'forward'
      ? `<p></p><p>---------- Forwarded message ----------<br>From: ${esc(message.from?.name || message.from?.email)}<br>Date: ${esc(formatDateTime(message.date))}<br>Subject: ${esc(message.subject)}</p>`
      : '';
    setReplying({ message, mode, initial: { to, cc, html: quoted } });
  };

  const last = thread.messages[thread.messages.length - 1];
  return (
    <div className="thread">
      <Link to="/mail" className="link-btn"><ArrowLeft size={16} /> Inbox</Link>
      <h1 className="thread__subject">{thread.subject}</h1>
      {thread.messages.map((m) => (
        <article key={m.id} className="card thread__message">
          <header className="thread__head">
            <Avatar name={m.from?.name || m.from?.email || '?'} size={36} />
            <div>
              <strong>{m.from?.name || m.from?.email}</strong> {m.from?.name && <small className="muted">&lt;{m.from.email}&gt;</small>}
              {m.customer && <Link to={`/customers/${m.customer.id}`} className="mail-chip">Customer: {m.customer.name}</Link>}
              <small className="muted thread__to">to {names(m.to)}{m.cc?.length ? `, cc ${names(m.cc)}` : ''}</small>
            </div>
            <small className="muted">{formatDateTime(m.date)}</small>
          </header>
          <EmailFrame html={m.html} text={m.text} />
          {m.attachments?.length > 0 && (
            <div className="thread__files">
              {m.attachments.map((a) => (
                <a key={a.id} className="compose__file" href={`${API_URL}/api/mail/inbox/messages/${encodeURIComponent(m.id)}/attachments/${encodeURIComponent(a.id)}?name=${encodeURIComponent(a.name)}`}>
                  <Download size={14} /> {a.name} <small>{fileSize(a.size || 0)}</small>
                </a>
              ))}
            </div>
          )}
          <div className="thread__actions">
            <button type="button" className="btn btn--outline btn--sm" onClick={() => startReply(m, 'reply')}><Reply size={15} /> Reply</button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => startReply(m, 'reply_all')}><ReplyAll size={15} /> Reply all</button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => startReply(m, 'forward')}><Forward size={15} /> Forward</button>
          </div>
        </article>
      ))}
      {replying && (
        <ComposeModal
          title={{ reply: 'Reply', reply_all: 'Reply all', forward: 'Forward' }[replying.mode]}
          initial={{ ...replying.initial, subject: replying.mode === 'forward' ? `Fwd: ${last.subject || thread.subject}` : `Re: ${(replying.message.subject || thread.subject).replace(/^re:\s*/i, '')}` }}
          links={{ customerId: replying.message.customer?.id }}
          reply={{ threadId, messageId: replying.message.id, mode: replying.mode }}
          onClose={() => setReplying(null)}
        />
      )}
    </div>
  );
}
