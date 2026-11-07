import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Building2,
  CreditCard,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  ShieldCheck,
  Tags,
  Users,
  X,
} from 'lucide-react';
import Logo from '../../components/Logo.jsx';
import { useAdmin } from './AdminAuth.jsx';
import '../../components/AppLayout.css';
import './Admin.css';

// The Workard super admin area — running Workard itself, not a company.
// Same look as the company app, with an "Admin" badge so nobody mixes them up.
const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { section: 'Website' },
  { to: '/admin/blog', label: 'Blog', icon: Newspaper },
  { to: '/admin/demos', label: 'Demo requests', icon: Inbox },
  { to: '/admin/pricing', label: 'Prices & trial', icon: Tags },
  { section: 'Workard' },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/admins', label: 'Super admins', icon: ShieldCheck },
  { to: '/admin/log', label: 'Activity log', icon: Activity },
];

export default function AdminLayout() {
  const { status, admin, logout } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [location.pathname]);

  if (status === 'loading') return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (status === 'out') return <Navigate to="/admin/login" replace />;

  return (
    <div className={`app admin ${menuOpen ? 'app--menu-open' : ''}`}>
      <aside className="sidebar" aria-label="Admin navigation">
        <div className="sidebar__brand">
          <Link to="/" className="admin__brand">
            <Logo variant="light" size={24} />
            <span className="admin__badge">Admin</span>
          </Link>
          <button type="button" className="sidebar__close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={22} /></button>
        </div>
        <nav className="sidebar__nav">
          {NAV.map((item) =>
            item.section ? (
              <p key={item.section} className="sidebar__section">{item.section}</p>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}>
                <item.icon size={18} /> {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="sidebar__org">
          <span className="sidebar__org-label">Signed in as</span>
          <strong>{admin?.fullName}</strong>
        </div>
      </aside>
      <div className="app__overlay" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <div className="app__main">
        <header className="topbar">
          <button type="button" className="topbar__menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <span className="topbar__org">Workard admin</span>
          <button type="button" className="btn btn--outline btn--sm admin__logout" onClick={() => logout().then(() => navigate('/admin/login'))}>
            <LogOut size={15} /> Log out
          </button>
        </header>
        <main className="app__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
