import { useState } from 'react';
import { Check, Crown, X } from 'lucide-react';
import Avatar from './Avatar.jsx';
import './PeoplePicker.css';

// Pick one or more people. The first one picked is the lead (shown with a crown).
// value = [employeeId, …]; people = [{ id, first_name, last_name, job_title }]
export default function PeoplePicker({ people, value, onChange, meId }) {
  const [query, setQuery] = useState('');
  const name = (p) => (p.id === meId ? 'Me' : `${p.first_name} ${p.last_name}`);
  const chosen = value.map((id) => people.find((p) => p.id === id)).filter(Boolean);
  const matches = people.filter((p) => `${p.first_name} ${p.last_name} ${p.job_title || ''}`.toLowerCase().includes(query.toLowerCase()));

  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const makeLead = (id) => onChange([id, ...value.filter((x) => x !== id)]);

  return (
    <div className="people-picker">
      <div className="people-picker__chosen">
        {chosen.length === 0 && <span className="muted">No one yet</span>}
        {chosen.map((p, i) => (
          <span key={p.id} className={`people-picker__chip ${i === 0 ? 'is-lead' : ''}`}>
            {i === 0 && <Crown size={12} aria-label="Lead" />}
            <button type="button" className="people-picker__name" onClick={() => makeLead(p.id)} title={i === 0 ? 'Lead' : 'Make lead'}>{name(p)}</button>
            <button type="button" onClick={() => toggle(p.id)} aria-label={`Remove ${name(p)}`}><X size={12} /></button>
          </span>
        ))}
      </div>
      {people.length > 6 && (
        <input className="field__input people-picker__search" placeholder="Search people" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search people" />
      )}
      <ul className="people-picker__list">
        {matches.map((p) => (
          <li key={p.id}>
            <button type="button" className={value.includes(p.id) ? 'is-on' : ''} onClick={() => toggle(p.id)} aria-pressed={value.includes(p.id)}>
              <Avatar name={`${p.first_name} ${p.last_name}`} src={p.photo_url} size={24} />
              <span className="people-picker__label">{name(p)}{p.job_title && <small> · {p.job_title}</small>}</span>
              {value.includes(p.id) && <Check size={15} />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
