import './Badge.css';

// Status → colour. Unknown statuses are grey.
const TONES = {
  present: 'green',
  approved: 'green',
  active: 'green',
  late: 'amber',
  pending: 'amber',
  flagged: 'red',
  rejected: 'red',
  absent: 'red',
  exited: 'gray',
  cancelled: 'gray',
  on_leave: 'blue',
  upcoming: 'gray',
  invited: 'blue',
  // invoices
  draft: 'gray',
  sent: 'blue',
  partially_paid: 'amber',
  paid: 'green',
  overdue: 'red',
  void: 'gray',
  // customers
  lead: 'blue',
  prospect: 'amber',
  customer: 'green',
  inactive: 'gray',
  // enquiries & complaints
  open: 'red',
  resolved: 'green',
  // payroll
  processing: 'blue',
  failed: 'red',
  // tasks
  todo: 'gray',
  in_progress: 'blue',
  done: 'green',
  urgent: 'red',
  high: 'amber',
  // reviews
  self_review: 'amber',
  manager_review: 'blue',
  acknowledgement: 'amber',
  completed: 'green',
};

const LABELS = {
  on_leave: 'On leave',
  partially_paid: 'Part paid',
  todo: 'To do',
  in_progress: 'In progress',
  self_review: 'Self-assessment',
  manager_review: 'Manager review',
  acknowledgement: 'To confirm',
};

export default function Badge({ status, children, tone }) {
  const t = tone || TONES[status] || 'gray';
  const text = children || LABELS[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '');
  return <span className={`badge badge--${t}`}>{text}</span>;
}
