import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, FileText, Link2, Paperclip, Send, X } from 'lucide-react';
import Modal from '../Modal.jsx';
import RichTextEditor from '../RichTextEditor.jsx';
import RecipientInput from './RecipientInput.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { newRequestId } from '../../utils/format.js';
import './Mail.css';

export const MAX_BYTES = 3 * 1024 * 1024; // the same 3 MB limit the server checks
export const fileSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// The one email composer, used everywhere: Mail → Compose, a customer, an employee, an invoice,
// and Reply / Reply all / Forward in the inbox.
//   initial: { to, cc, bcc, subject, html }
//   links:   { customerId, employeeId, invoiceId } — the email is filed against these
//   reply:   { threadId, messageId, mode } — sends as a reply in that conversation
export default function ComposeModal({ title = 'New email', initial = {}, links = {}, reply = null, onClose, onSent }) {
  const toast = useToast();
  const { data: status } = useApi('/api/mail/account');
  const { data: templates } = useApi(reply ? null : '/api/mail/templates');
  const [to, setTo] = useState(initial.to || []);
  const [cc, setCc] = useState(initial.cc || []);
  const [bcc, setBcc] = useState(initial.bcc || []);
  const [showCopies, setShowCopies] = useState(Boolean(initial.cc?.length || initial.bcc?.length));
  const [subject, setSubject] = useState(initial.subject || '');
  const [html, setHtml] = useState(initial.html || '');
  const [editorKey, setEditorKey] = useState(0); // bump to reload the editor with new content (templates, links)
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef(newRequestId()); // same id on every retry of this email → it is sent once
  const picker = useRef(null);

  const total = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);
  const account = status?.account;
  const ready = account && account.status === 'active';

  const replaceBody = (next) => {
    setHtml(next);
    setEditorKey((k) => k + 1);
  };

  const useTemplate = async (id) => {
    if (!id) return;
    try {
      const filled = await api(`/api/mail/templates/${id}/fill`, { method: 'POST', body: links });
      setSubject(filled.subject);
      replaceBody(filled.html);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addFiles = (list) => {
    setFiles((current) => [...current, ...Array.from(list)].slice(0, 10));
    if (picker.current) picker.current.value = '';
  };

  // Too big to attach → upload it to Workard and put a link in the message instead
  const sendAsLink = async (file) => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const link = await api('/api/mail/links', { method: 'POST', formData: form });
      setFiles((current) => current.filter((f) => f !== file));
      replaceBody(`${html}<p><a href="${link.url}">${file.name}</a> (${fileSize(file.size)})</p>`);
      toast.success(`${file.name} added as a link`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    setError('');
    if (!to.length) return setError('Add at least one person in To');
    if (!reply && !subject.trim()) return setError('Add a subject');
    if (total > MAX_BYTES) return setError('Attachments can be up to 3 MB in total — send the big ones as a link.');
    setBusy(true);
    try {
      const form = new FormData();
      form.append('data', JSON.stringify({ to, cc, bcc, subject, html, requestId: requestId.current, ...links, ...(reply ? { mode: reply.mode } : {}) }));
      files.forEach((f) => form.append('files', f, f.name));
      const path = reply ? `/api/mail/inbox/threads/${encodeURIComponent(reply.threadId)}/messages/${encodeURIComponent(reply.messageId)}/reply` : '/api/mail/send';
      const sent = await api(path, { method: 'POST', formData: form });
      toast.success(sent.duplicate ? 'Already sent' : `Sent to ${to.map((p) => p.name || p.email).join(', ')}`);
      onSent?.(sent);
      onClose();
    } catch (err) {
      setError(Object.values(err.errors || {})[0] || err.message);
      setBusy(false);
    }
  };

  // Not connected (or needs reconnecting): explain, with a way to fix it
  if (status && !ready) {
    return (
      <Modal title={title} size="sm" onClose={onClose}>
        <div className="compose__connect">
          <AlertCircle size={22} />
          <p>
            {account?.status === 'needs_reconnect'
              ? `Your connection to ${account.email} has expired. Reconnect it to send email from Workard.`
              : 'Connect your Gmail or Outlook first. Emails then go from your own address and are saved in Workard.'}
          </p>
          <Link to="/mail?tab=mailbox" className="btn btn--primary" onClick={onClose}>Go to My mailbox</Link>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={title}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <span className="compose__from">{account ? <>From <strong>{account.email}</strong></> : 'Loading…'}</span>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" disabled={busy || !ready} onClick={send}>
            <Send size={16} /> {busy ? 'Sending…' : 'Send'}
          </button>
        </>
      }
    >
      <div className="compose">
        {error && <div className="form__alert"><AlertCircle size={18} /> {error}</div>}
        <div className="compose__people">
          <RecipientInput label="To" value={to} onChange={setTo} autoFocus={!to.length} />
          {showCopies ? (
            <>
              <RecipientInput label="Cc" value={cc} onChange={setCc} />
              <RecipientInput label="Bcc" value={bcc} onChange={setBcc} />
            </>
          ) : (
            <button type="button" className="link-btn compose__cc" onClick={() => setShowCopies(true)}>Cc / Bcc</button>
          )}
        </div>
        <div className="compose__row">
          <input className="field__input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" maxLength={300} />
          {templates?.length > 0 && (
            <select className="field__input compose__template" defaultValue="" onChange={(e) => useTemplate(e.target.value)} aria-label="Use a template">
              <option value="">Use a template…</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
        </div>
        <RichTextEditor key={editorKey} value={html} onChange={setHtml} placeholder="Write your message…" />
        {account?.signatureHtml && <p className="muted compose__sig">Your signature is added at the end.</p>}

        <div className="compose__files">
          {files.map((f) => {
            const tooBig = f.size > MAX_BYTES || total > MAX_BYTES;
            return (
              <span key={`${f.name}-${f.size}-${f.lastModified}`} className={`compose__file${tooBig ? ' is-over' : ''}`}>
                <FileText size={14} /> {f.name} <small>{fileSize(f.size)}</small>
                {tooBig && (
                  <button type="button" className="link-btn" onClick={() => sendAsLink(f)} disabled={busy}><Link2 size={13} /> Send as a link</button>
                )}
                <button type="button" className="icon-btn" aria-label={`Remove ${f.name}`} onClick={() => setFiles((cur) => cur.filter((x) => x !== f))}><X size={13} /></button>
              </span>
            );
          })}
          <button type="button" className="link-btn" onClick={() => picker.current?.click()}><Paperclip size={15} /> Attach files</button>
          <input ref={picker} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          {files.length > 0 && <small className={`compose__size${total > MAX_BYTES ? ' is-over' : ''}`}>{fileSize(total)} of 3 MB</small>}
        </div>
      </div>
    </Modal>
  );
}
