import { useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, Unplug } from 'lucide-react';
import RichTextEditor from '../../../components/RichTextEditor.jsx';
import { api } from '../../../api/client.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate } from '../../../utils/format.js';

const NAMES = { google: 'Gmail / Google Workspace', microsoft: 'Outlook / Microsoft 365' };

// Mail → My mailbox: connect / reconnect / disconnect, the signature, and inbox notes
export default function Mailbox({ status, onChange }) {
  const toast = useToast();
  const account = status.account;
  const [busy, setBusy] = useState('');
  const [signature, setSignature] = useState(account?.signatureHtml || '');

  // Ask the server for the sign-in link, then go there (Google/Microsoft send us back to /mail)
  const connect = async (provider, withInbox = false) => {
    setBusy(provider);
    try {
      const { url } = await api(`/api/mail/connect/${provider}`, { method: 'POST', body: { withInbox } });
      window.location.href = url;
    } catch (err) {
      toast.error(err.message);
      setBusy('');
    }
  };

  const disconnect = async () => {
    if (!window.confirm(`Disconnect ${account.email}? Workard will no longer send from it. Emails already sent stay in Workard.`)) return;
    setBusy('disconnect');
    try {
      await api('/api/mail/account', { method: 'DELETE' });
      toast.success('Mailbox disconnected');
      onChange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const saveSignature = async () => {
    setBusy('signature');
    try {
      const result = await api('/api/mail/account/signature', { method: 'PUT', body: { signatureHtml: signature } });
      setSignature(result.account.signatureHtml);
      toast.success('Signature saved');
      onChange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const buttons = (label = 'Connect') => (
    <div className="mailbox__buttons">
      {['google', 'microsoft'].map((p) => (
        <button key={p} type="button" className="btn btn--outline mailbox__provider" onClick={() => connect(p)} disabled={Boolean(busy) || !status.providers[p]}>
          <span className={`mailbox__logo mailbox__logo--${p}`} aria-hidden="true">{p === 'google' ? 'G' : 'M'}</span>
          {label} {p === 'google' ? 'Google' : 'Microsoft'}
          {!status.providers[p] && <small> (not set up yet)</small>}
        </button>
      ))}
    </div>
  );

  if (!account) {
    return (
      <section className="card card__body mailbox">
        <Mail size={28} className="mailbox__icon" />
        <h2>Connect your mailbox</h2>
        <p className="muted">
          Emails you send from Workard go from <strong>your own address</strong> and also appear in your Gmail or Outlook “Sent” folder.
          Workard never sees your password — you sign in with Google or Microsoft and can disconnect any time.
        </p>
        {buttons()}
        <ul className="mailbox__notes muted">
          <li><strong>Google Workspace, Microsoft 365, Outlook.com</strong>: send and read your inbox here.</li>
          <li><strong>Personal Gmail</strong>: send now; reading your inbox here is coming soon.</li>
          <li>On a company Microsoft 365 account, your IT admin may need to approve Workard once.</li>
        </ul>
      </section>
    );
  }

  return (
    <div className="mailbox-grid">
      <section className="card card__body mailbox">
        <h2>Connected mailbox</h2>
        <p className="mailbox__account">
          {account.status === 'active' ? <CheckCircle2 size={18} className="mailbox__ok" /> : <AlertCircle size={18} className="mailbox__warn" />}
          <span>
            <strong>{account.email}</strong>
            <small className="muted">{NAMES[account.provider]}{account.isWorkspace ? ' (company account)' : ''} · since {formatDate(account.connectedAt)}</small>
          </span>
        </p>
        {account.status === 'needs_reconnect' && (
          <div className="form__alert"><AlertCircle size={18} /> The connection has expired (access was cancelled or the password changed). Reconnect to keep sending.</div>
        )}
        <p className="muted">{status.inbox.allowed ? 'Sending and inbox are on.' : status.inbox.reason || 'Sending is on.'}</p>

        {status.inbox.canTurnOn && (
          <div className="mailbox__inbox">
            <p><strong>Turn on your inbox.</strong> Workard will ask Google for permission to read your mail. Your Google Workspace admin may first need to trust Workard:</p>
            <ol className="muted">
              <li>Admin console → Security → Access and data control → <strong>API controls</strong></li>
              <li>Manage third-party app access → Add app → search for <strong>Workard</strong></li>
              <li>Set it to <strong>Trusted</strong></li>
            </ol>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => connect('google', true)} disabled={Boolean(busy)}>Turn on inbox</button>
          </div>
        )}

        <div className="mailbox__actions">
          {account.status !== 'active' ? buttons('Reconnect with') : null}
          <button type="button" className="btn btn--ghost" onClick={disconnect} disabled={Boolean(busy)}><Unplug size={16} /> Disconnect</button>
        </div>
      </section>

      <section className="card card__body mailbox">
        <h2>Signature</h2>
        <p className="muted">Added to the end of every email you send from Workard.</p>
        <RichTextEditor value={signature} onChange={setSignature} placeholder="e.g. Ada Okafor · CEO · 0803 000 0000" />
        <button type="button" className="btn btn--primary btn--sm mailbox__save" onClick={saveSignature} disabled={Boolean(busy)}>{busy === 'signature' ? 'Saving…' : 'Save signature'}</button>
      </section>
    </div>
  );
}
