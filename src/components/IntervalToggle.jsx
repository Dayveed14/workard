import { YEARLY_SAVING } from '../config/plans.js';
import './IntervalToggle.css';

// Monthly | Yearly switch for prices
export default function IntervalToggle({ value, onChange }) {
  return (
    <div className="interval-toggle" role="radiogroup" aria-label="Billing period">
      {[
        ['monthly', 'Monthly'],
        ['yearly', 'Yearly'],
      ].map(([id, label]) => (
        <button key={id} type="button" role="radio" aria-checked={value === id} className={value === id ? 'is-on' : ''} onClick={() => onChange(id)}>
          {label}
          {id === 'yearly' && <span className="interval-toggle__save">save up to {YEARLY_SAVING}%</span>}
        </button>
      ))}
    </div>
  );
}
