import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Banknote,
  ClipboardCheck,
  Receipt,
  CalendarDays,
  ChevronDown,
  Clock,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Phone,
  Settings,
  UserCircle,
  Users,
  Wallet,
  X,
  Contact,
} from 'lucide-react';
import Logo from './Logo.jsx';
import Avatar from './Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import './AppLayout.css';

// Sidebar links. `anyOf` = only shown to people with one of these permissions.
const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/attendance', label: 'Attendance', icon: Clock },
  { to: '/leave', label: 'Leave', icon: CalendarDays },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/reviews', label: 'Reviews', icon: ClipboardCheck },
  { to: '/employees', label: 'Employees', icon: Users, anyOf: ['employees.view'] },
  { to: '/customers', label: 'Customers', icon: Contact, anyOf: ['customers.view'] },
  { to: '/invoices', label: 'Invoices', icon: FileText, anyOf: ['invoices.view'] },
  { to: '/finance', label: 'Finance', icon: Wallet, anyOf: ['finance.view'] },
  { to: '/payroll', label: 'Payroll', icon: Banknote, anyOf: ['payroll.view'] },
  { to: '/payslips', label: 'My payslips', icon: Receipt, employeeOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings, anyOf: ['organization.manage', 'roles.manage', 'audit.view', 'finance.manage', 'payroll.manage', 'payroll.approve', 'reviews.setup'] },
];

// Coming in later phases — shown so people can see where Workard is going
const SOON = [
  { label: 'Calls', icon: Phone },
];

export default function AppLayout() {
  const { user, organization, organizations, employee, role, canAny, logout, switchOrganization } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    const close = (e) => userMenuRef.current && !userMenuRef.current.contains(e.target) && setUserMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const onSwitch = async (e) => {
    try {
      const s = await switchOrganization(Number(e.target.value));
      toast.success(`Switched to ${s.organization.name}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const displayName = employee ? `${employee.firstName} ${employee.lastName}` : user?.fullName;

  return (
    <div className={`app ${menuOpen ? 'app--menu-open' : ''}`}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar__brand">
          <Link to="/dashboard">
            <Logo variant="light" size={26} />
          </Link>
          <button type="button" className="sidebar__close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV.filter((item) => (item.employeeOnly ? employee : !item.anyOf || canAny(...item.anyOf))).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}

          <p className="sidebar__section">Coming soon</p>
          {SOON.map(({ label, icon: Icon }) => (
            <span key={label} className="sidebar__link sidebar__link--soon" aria-disabled="true">
              <Icon size={18} /> {label}
            </span>
          ))}
        </nav>

        <div className="sidebar__org">
          <span className="sidebar__org-label">Organisation</span>
          {organizations?.length > 1 ? (
            <select className="sidebar__org-select" value={organization?.id} onChange={onSwitch} aria-label="Switch organisation">
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          ) : (
            <strong>{organization?.name}</strong>
          )}
        </div>
      </aside>

      <div className="app__overlay" onClick={() => setMenuOpen(false)} aria-hidden="true" />

      <div className="app__main">
        <header className="topbar">
          <button type="button" className="topbar__menu" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <span className="topbar__org">{organization?.name}</span>

          <div className="topbar__user" ref={userMenuRef}>
            <button type="button" className="topbar__user-btn" onClick={() => setUserMenu((o) => !o)} aria-expanded={userMenu}>
              <Avatar name={displayName} src={employee?.photoUrl} size={34} />
              <span className="topbar__user-text">
                <strong>{displayName}</strong>
                <small>{role?.name}</small>
              </span>
              <ChevronDown size={16} />
            </button>
            {userMenu && (
              <div className="topbar__dropdown">
                {employee && (
                  <Link to={`/employees/${employee.id}`} onClick={() => setUserMenu(false)}>
                    <UserCircle size={16} /> My profile
                  </Link>
                )}
                <button type="button" onClick={onLogout}>
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="app__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
