import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { timeAgo } from '../utils/format.js';
import './NotificationBell.css';

const CHECK_EVERY = 30 * 1000; // no websockets: the bell asks the server every 30 seconds

// The bell in the top bar: unread count, a dropdown of the latest, and a
// pop-up when something new arrives while you're using the app.
export default function NotificationBell() {
  const toast = useToast();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const latestSeen = useRef(null); // newest id we know about
  const box = useRef(null);

  const check = useCallback(async () => {
    try {
      const r = await api('/api/notifications/count');
      setCount(r.unread);
      // Something new since the last check → pop it up
      if (latestSeen.current !== null && r.latest && r.latest > latestSeen.current) {
        const list = await api('/api/notifications');
        setItems(list.items);
        list.items.filter((n) => n.id > latestSeen.current && !n.read_at).slice(0, 3).reverse().forEach((n) => toast.info(n.title));
      }
      if (r.latest) latestSeen.current = Math.max(latestSeen.current || 0, r.latest);
      else if (latestSeen.current === null) latestSeen.current = 0;
    } catch {
      // offline or logged out — try again next time
    }
  }, [toast]);

  useEffect(() => {
    check();
    const timer = setInterval(() => document.visibilityState === 'visible' && check(), CHECK_EVERY);
    window.addEventListener('focus', check);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', check);
    };
  }, [check]);

  // Close when clicking outside
  useEffect(() => {
    const close = (e) => open && box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const toggle = async () => {
    setOpen((o) => !o);
    if (!open) {
      const list = await api('/api/notifications').catch(() => null);
      if (list) {
        setItems(list.items);
        setCount(list.unread);
      }
    }
  };

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read_at) {
      const r = await api(`/api/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => null);
      if (r) setCount(r.unread);
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read_at: 'now' } : x)));
    }
    if (n.link) navigate(n.link);
  };

  const readAll = async () => {
    await api('/api/notifications/read-all', { method: 'POST' }).catch(() => null);
    setCount(0);
    setItems((list) => list?.map((x) => ({ ...x, read_at: x.read_at || 'now' })));
  };

  return (
    <div className="bell" ref={box}>
      <button type="button" className="bell__btn" onClick={toggle} aria-label={`Notifications${count ? ` (${count} unread)` : ''}`} aria-expanded={open}>
        <Bell size={20} />
        {count > 0 && <span className="bell__count">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <div className="bell__panel">
          <header className="bell__head">
            <strong>Notifications</strong>
            {count > 0 && (
              <button type="button" className="link-btn" onClick={readAll}><CheckCheck size={14} /> Mark all read</button>
            )}
          </header>
          {!items && <div className="bell__empty">Loading…</div>}
          {items?.length === 0 && <div className="bell__empty">You’re all caught up.</div>}
          {items?.length > 0 && (
            <ul className="bell__list">
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" className={`bell__item ${n.read_at ? '' : 'is-unread'}`} onClick={() => openItem(n)}>
                    <span className="bell__dot" aria-hidden="true" />
                    <span className="bell__text">
                      <span>{n.title}</span>
                      {n.body && <small className="bell__body">{n.body}</small>}
                      <small>{timeAgo(n.created_at)}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
