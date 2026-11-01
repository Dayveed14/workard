import { Link } from 'react-router-dom';
import { CheckCircle2, TrendingUp } from 'lucide-react';
import Logo from './Logo.jsx';
import './AuthLayout.css';

const benefits = [
  'Create and send invoices on WhatsApp',
  'Track every expense and know your real profit',
  'Manage employees and run payroll',
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth__panel">
        <Link to="/" aria-label="Workard home">
          <Logo variant="light" size={32} tagline />
        </Link>

        <div className="auth__pitch">
          <h2>
            One place to run your <span className="text-gradient">whole business.</span>
          </h2>
          <ul>
            {benefits.map((b) => (
              <li key={b}>
                <CheckCircle2 size={18} /> {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="auth__card" aria-hidden="true">
          <span className="auth__card-icon">
            <TrendingUp size={18} />
          </span>
          <div>
            <strong>Estimated profit this month</strong>
            <span>₦1,470,000 · up 12% on last month</span>
          </div>
        </div>
      </aside>

      <main className="auth__main">
        <div className="auth__form-wrap">
          <Link to="/" className="auth__mobile-logo" aria-label="Workard home">
            <Logo size={28} />
          </Link>
          <h1>{title}</h1>
          {subtitle && <p className="auth__subtitle">{subtitle}</p>}
          {children}
          {footer && <p className="auth__footer">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
