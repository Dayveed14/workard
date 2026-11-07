import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Navbar.css';

const links = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/#demo', label: 'Book a demo' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <nav className="navbar__inner container" aria-label="Main">
        <Link to="/" className="navbar__brand" aria-label="Workard home">
          <Logo variant="light" size={28} />
        </Link>

        <ul className={`navbar__links ${open ? 'navbar__links--open' : ''}`}>
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
          <li className="navbar__mobile-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn--primary btn--block" onClick={() => setOpen(false)}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost-light btn--block" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link to="/signup" className="btn btn--primary btn--block" onClick={() => setOpen(false)}>
                  Get started
                </Link>
              </>
            )}
          </li>
        </ul>

        <div className="navbar__actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn--primary btn--sm">
              Dashboard
            </Link>
          ) : (
            <>
              <NavLink to="/login" className="navbar__login">
                Log in
              </NavLink>
              <Link to="/signup" className="btn btn--primary btn--sm">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="navbar__toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
    </header>
  );
}
