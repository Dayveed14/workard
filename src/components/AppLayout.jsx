import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Megaphone,
  BarChart3,
  Video,
  FolderKanban,
  FolderOpen,
  HandCoins,
  Banknote,
  Lock,
  UserPlus,
  CreditCard,
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
import NotificationBell from './NotificationBell.jsx';
import Avatar from './Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import './AppLayout.css';

// Sidebar links, in sections. `anyOf` = only shown to people with one of these permissions.
// `feature` = the plan must include it; if not, the link shows a lock and opens the plans page.
const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/meetings', label: 'Meetings', icon: Video },
  { to: '/attendance', label: 'Attendance', icon: Clock },
  { to: '/leave', label: 'Leave', icon: CalendarDays },
  { to: '/requests', label: 'Requests', icon: HandCoins },
  { to: '/payslips', label: 'My payslips', icon: Receipt, employeeOnly: true, feature: 'payroll' },

  { section: 'Work' },
  { to: '/tasks', label: 'Tasks', icon: ListChecks, feature: 'tasks' },
  { to: '/projects', label: 'Projects', icon: FolderKanban, feature: 'tasks' },
  { to: '/resources', label: 'Team resources', icon: FolderOpen },
  { to: '/reviews', label: 'Reviews', icon: ClipboardCheck, feature: 'reviews' },
  { to: '/customers', label: 'Customers', icon: Contact, anyOf: ['customers.view'], feature: 'crm' },

  { section: 'Manage' },
  { to: '/employees', label: 'Employees', icon: Users, anyOf: ['employees.view'] },
  { to: '/performance', label: 'Team performance', icon: BarChart3, anyOf: ['reviews.view'], feature: 'reviews' },
  { to: '/onboarding', label: 'Onboarding', icon: UserPlus, anyOf: ['onboarding.manage'] },
  { to: '/invoices', label: 'Invoices', icon: FileText, anyOf: ['invoices.view'], feature: 'invoices' },
  { to: '/finance', label: 'Finance', icon: Wallet, anyOf: ['finance.view'], feature: 'finance' },
  { to: '/payroll', label: 'Payroll', icon: Banknote, anyOf: ['payroll.view'], feature: 'payroll' },
  { to: '/settings', label: 'Settings', icon: Settings, anyOf: ['organization.manage', 'roles.manage', 'audit.view', 'finance.manage', 'payroll.manage', 'payroll.approve', 'reviews.setup'] },
];

// Coming in later phases — shown so people can see where Workard is going
const SOON = [
  { label: 'Calls', icon: Phone },
];

export default function AppLayout() {
  const { user, organization, organizations, employee, role, canAny, logout, switchOrganization, subscription } = useAuth();
  const has = (feature) => !feature || subscription?.features.includes(feature);
  const locked = subscription && !subscription.usable; // unpaid / expired: only billing works
  // Owners see a reminder in the last 30 days of the year (and during the grace days)
  const renewSoon = role?.isOwner && subscription && !subscription.isLegacy &&
    (subscription.status === 'grace' || (subscription.status === 'active' && subscription.daysLeft <= 30));
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
          <Link to="/">
            <Logo variant="light" size={26} />
          </Link>
          <button type="button" className="sidebar__close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {locked ? (
            <NavLink to="/billing" className="sidebar__link is-active"><CreditCard size={18} /> Plan & billing</NavLink>
          ) : (
            NAV.filter((item) => item.section || (item.employeeOnly ? employee : !item.anyOf || canAny(...item.anyOf)))
              // drop a section heading that has no links under it
              .filter((item, i, list) => !item.section || (list[i + 1] && !list[i + 1].section))
              .map(({ to, label, icon: Icon, feature, section }) =>
                section ? (
                  <p key={section} className="sidebar__section">{section}</p>
                ) : has(feature) ? (
                  <NavLink key={to} to={to} className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}>
                    <Icon size={18} /> {label}
                  </NavLink>
                ) : (
                  // Not on this plan: shown with a lock so people know it exists
                  <NavLink key={to} to={to} className={({ isActive }) => `sidebar__link sidebar__link--locked ${isActive ? 'is-active' : ''}`} title="Not on your plan">
                    <Icon size={18} /> {label} <Lock size={13} className="sidebar__lock" />
                  </NavLink>
                )
              )
          )}

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
          {!locked && <NotificationBell />}

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
                {role?.isOwner && (
                  <Link to="/billing" onClick={() => setUserMenu(false)}>
                    <CreditCard size={16} /> Plan & billing
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
          {role?.isOwner && subscription?.status === 'trial' && location.pathname !== '/billing' && (
            <div className="app__renew">
              {subscription.daysLeft + 1} day{subscription.daysLeft === 0 ? '' : 's'} left of your free {subscription.planName} trial.{' '}
              <Link to="/billing">Choose a plan</Link>
            </div>
          )}
          {renewSoon && location.pathname !== '/billing' && (
            <div className="app__renew">
              {subscription.status === 'grace'
                ? 'Your Workard plan has ended — renew in the next few days to keep access.'
                : `Your ${subscription.planName} plan ends in ${subscription.daysLeft} day${subscription.daysLeft === 1 ? '' : 's'}.`}{' '}
              <Link to="/billing">Renew now</Link>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
