import { Check } from 'lucide-react';
import './PasswordRules.css';

// Same rules as the server (validators/common.js)
export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'letter', label: 'A letter', test: (p) => /[A-Za-z]/.test(p) },
  { id: 'num', label: 'A number', test: (p) => /[0-9]/.test(p) },
];

export const passwordIsValid = (p) => PASSWORD_RULES.every((r) => r.test(p));

// Strength bar + checklist shown under a "create password" field
export default function PasswordRules({ password }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  return (
    <>
      <div className="password-rules__meter" data-score={passed} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <ul className="password-rules__list">
        {PASSWORD_RULES.map((r) => (
          <li key={r.id} className={r.test(password) ? 'is-ok' : ''}>
            <Check size={14} /> {r.label}
          </li>
        ))}
      </ul>
    </>
  );
}
