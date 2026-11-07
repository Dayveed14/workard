import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackLink.css';

// "← Employees" that returns to the list exactly as it was left (search, filters, page).
// Lists pass where they were in the link's state: navigate(to, { state: { from, label } }).
// Opened from anywhere else (a dashboard card, a chart) it goes back one step;
// opened straight from a link or bookmark, it goes to `fallback`.
export default function BackLink({ fallback, label }) {
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  if (from) {
    return <Link to={from} className="back-link"><ArrowLeft size={16} /> {location.state.label || label}</Link>;
  }
  if (location.key !== 'default') {
    return <button type="button" className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>;
  }
  return <Link to={fallback} className="back-link"><ArrowLeft size={16} /> {label}</Link>;
}
