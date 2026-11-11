import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Inbox as InboxIcon, PenSquare, RefreshCw, Search } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Tabs from '../../../components/Tabs.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import ComposeModal from '../../../components/mail/ComposeModal.jsx';
import SentEmailList from '../../../components/mail/SentEmailList.jsx';
import Mailbox from './Mailbox.jsx';
import Templates from './Templates.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { timeAgo } from '../../../utils/format.js';
import '../../../components/mail/Mail.css';

// The inbox: fetched live from Gmail / Outlook (nothing stored in Workard)
function Inbox({ status }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [pages, setPages] = useState(['']); // page tokens we've visited, so "Previous" works
  const pageToken = pages[pages.length - 1];
  const allowed = status.inbox.allowed;
  const { data, error, reload, loading } = useApi(
    allowed ? `/api/mail/inbox?${new URLSearchParams({ ...(query ? { search: query } : {}), ...(pageToken ? { pageToken } : {}) })}` : null
  );

  if (!status.account) return null; // the page shows the connect card instead
  if (!allowed) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="Your inbox isn’t available here yet"
        text={status.inbox.reason || 'You can send email from Workard now.'}
        action={status.inbox.canTurnOn ? <button type="button" className="btn btn--primary" onClick={() => navigate('/mail?tab=mailbox')}>Turn on the inbox</button> : null}
      />
    );
  }

  return (
    <div className="card">
      <form className="toolbar mail-toolbar" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); setPages(['']); }}>
        <div className="search-box">
          <Search size={16} />
          <input className="field__input" placeholder="Search your inbox" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search your inbox" />
        </div>
        <button type="button" className="icon-btn" onClick={reload} aria-label="Refresh" title="Refresh"><RefreshCw size={16} /></button>
      </form>
      {error && <p className="card__body muted">{error}</p>}
      {loading && !data && <div className="page-loader"><span className="page-loader__spinner" /></div>}
      {data && !data.threads.length && <EmptyState icon={InboxIcon} title={query ? 'Nothing found' : 'Your inbox is empty'} />}
      {data?.threads.length > 0 && (
        <ul className="mail-list mail-list--inbox">
          {data.threads.map((t) => (
            <li key={t.id} className={t.unread ? 'is-unread' : ''}>
              <button type="button" onClick={() => navigate(`/mail/thread/${encodeURIComponent(t.id)}`)}>
                <span className="mail-list__who">{t.from?.name || t.from?.email || 'Unknown'}</span>
                <span className="mail-list__main">
                  <strong>{t.subject}</strong>
                  <small>{t.snippet}</small>
                </span>
                <span className="mail-list__meta">
                  {t.customer && <span className="mail-chip">Customer: {t.customer.name}</span>}
                  {t.messageCount > 1 && <small>{t.messageCount}</small>}
                  <small>{timeAgo(t.date)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {(pages.length > 1 || data?.nextPageToken) && (
        <div className="pagination">
          <button type="button" className="btn btn--outline btn--sm" disabled={pages.length <= 1} onClick={() => setPages((p) => p.slice(0, -1))}>Newer</button>
          <button type="button" className="btn btn--outline btn--sm" disabled={!data?.nextPageToken} onClick={() => setPages((p) => [...p, data.nextPageToken])}>Older</button>
        </div>
      )}
    </div>
  );
}

// /mail — Inbox · Sent · Templates · My mailbox, and Compose
export default function Mail() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data: status, reload } = useApi('/api/mail/account');
  const [composing, setComposing] = useState(false);
  const [sentKey, setSentKey] = useState(0); // refresh the Sent list after sending
  const announced = useRef(false); // say "connected" once (React runs effects twice in development)

  // Coming back from Google / Microsoft: say how it went, then tidy the address bar
  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    if (params.get('connected')) toast.success(`${params.get('connected') === 'google' ? 'Gmail' : 'Outlook'} connected`);
    if (params.get('mailError')) toast.error(params.get('mailError'));
    if (params.get('connected') || params.get('mailError')) setParams({ tab: 'inbox' }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { id: 'inbox', label: 'Inbox' },
    { id: 'sent', label: 'Sent' },
    { id: 'received', label: 'Sent to me' },
    { id: 'templates', label: 'Templates' },
    { id: 'mailbox', label: 'My mailbox' },
  ];
  const connected = Boolean(status?.account);
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : connected ? 'inbox' : 'mailbox';

  return (
    <>
      <PageHeader
        title="Mail"
        subtitle={status?.account ? `Sending as ${status.account.email}` : 'Send email from your own Gmail or Outlook, and keep a record in Workard.'}
        actions={<button type="button" className="btn btn--primary" onClick={() => setComposing(true)} disabled={!connected}><PenSquare size={18} /> Compose</button>}
      />
      <Tabs tabs={tabs} active={tab} onChange={(id) => setParams({ tab: id })} />
      {!status ? (
        <div className="page-loader"><span className="page-loader__spinner" /></div>
      ) : tab === 'mailbox' || (!connected && ['inbox'].includes(tab)) ? (
        <Mailbox status={status} onChange={reload} />
      ) : tab === 'inbox' ? (
        <Inbox status={status} />
      ) : tab === 'templates' ? (
        <Templates />
      ) : (
        <div className="card"><SentEmailList key={`${tab}-${sentKey}`} box={tab === 'sent' ? 'sent' : 'received'} emptyText={tab === 'sent' ? 'Emails you send from Workard show here.' : 'Emails colleagues sent you from Workard show here.'} /></div>
      )}
      {composing && <ComposeModal onClose={() => setComposing(false)} onSent={() => setSentKey((k) => k + 1)} />}
    </>
  );
}
