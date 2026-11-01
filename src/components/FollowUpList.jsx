import { Link } from 'react-router-dom';
import { Check, CalendarClock } from 'lucide-react';
import Badge from './Badge.jsx';
import EmptyState from './EmptyState.jsx';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { ACTIVITY_TYPES, formatDate, todayString } from '../utils/format.js';
import './FollowUpList.css';

// Follow-ups (overdue, today, upcoming) or open cases, with a "done" button
export default function FollowUpList({ items, mode = 'followups', onChange, compact = false }) {
  const toast = useToast();
  const today = todayString();

  const complete = async (item) => {
    try {
      if (mode === 'cases') await api(`/api/customers/activity/${item.id}/resolve`, { method: 'PATCH' });
      else await api(`/api/customers/activity/${item.id}/follow-up-done`, { method: 'PATCH' });
      toast.success(mode === 'cases' ? 'Marked as resolved' : 'Follow-up done');
      onChange?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!items?.length) {
    return (
      <EmptyState
        icon={CalendarClock}
        title={mode === 'cases' ? 'No open enquiries or complaints' : 'No follow-ups due'}
        text={compact ? undefined : mode === 'cases' ? 'Enquiries and complaints logged on a customer appear here until resolved.' : 'Add a follow-up date when you log activity on a customer.'}
      />
    );
  }

  return (
    <ul className={`follow-ups ${compact ? 'follow-ups--compact' : ''}`}>
      {items.map((item) => {
        const when = item.follow_up_on;
        const due = mode === 'followups' && when ? (when < today ? 'overdue' : when === today ? 'today' : 'upcoming') : null;
        return (
          <li key={item.id}>
            <div className="follow-ups__main">
              <Link to={`/customers/${item.customer_id}`} className="follow-ups__customer">{item.customer_name}</Link>
              <span className="follow-ups__subject">
                <Badge tone={item.type === 'complaint' ? 'red' : 'gray'}>{ACTIVITY_TYPES[item.type]}</Badge> {item.subject}
              </span>
              {!compact && item.employee_name && <span className="muted follow-ups__who">Handled by {item.employee_name}</span>}
            </div>
            {due && (
              <span className={`follow-ups__due follow-ups__due--${due}`}>
                {due === 'today' ? 'Today' : due === 'overdue' ? `Overdue · ${formatDate(when)}` : formatDate(when)}
              </span>
            )}
            {mode === 'cases' && <span className="muted follow-ups__due">Since {formatDate(item.created_at)}</span>}
            <button type="button" className="btn btn--outline btn--sm" onClick={() => complete(item)}>
              <Check size={16} /> {mode === 'cases' ? 'Resolve' : 'Done'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
