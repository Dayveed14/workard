import { Link } from 'react-router-dom';
import './StatCard.css';

// A number on the dashboard. If `to` is given, the whole card is a link
// (every number leads to the records behind it).
export default function StatCard({ icon: Icon, label, value, hint, tone = 'blue', to }) {
  const content = (
    <>
      <span className={`stat-card__icon stat-card__icon--${tone}`}>{Icon && <Icon size={20} />}</span>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </>
  );
  return to ? (
    <Link to={to} className="stat-card stat-card--link">
      {content}
    </Link>
  ) : (
    <div className="stat-card">{content}</div>
  );
}
