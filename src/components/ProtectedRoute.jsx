import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { FEATURE_NAMES, FEATURE_PLAN, planById } from '../config/plans.js';
import { useAuth } from '../context/AuthContext.jsx';
import EmptyState from './EmptyState.jsx';

function Loader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader__spinner" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// Logged-in users only. While the plan is unpaid or expired, only the billing pages open.
export default function ProtectedRoute() {
  const { status, subscription } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Loader />;
  if (status === 'guest') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (subscription && !subscription.usable && !location.pathname.startsWith('/billing')) {
    return <Navigate to="/billing" replace />;
  }
  return <Outlet />;
}

// Shows the page only if the organisation's plan includes this feature
export function RequireFeature({ feature, children }) {
  const { subscription, role } = useAuth();
  if (subscription?.features.includes(feature)) return children;
  const plan = planById(FEATURE_PLAN[feature]);
  return (
    <EmptyState
      icon={Sparkles}
      title={`${FEATURE_NAMES[feature]} is on the ${plan?.name} plan`}
      text={`Your ${subscription?.planName} plan doesn’t include ${FEATURE_NAMES[feature].toLowerCase()}. ${role?.isOwner ? 'Upgrade any time — you only pay the difference for the rest of your year.' : 'Ask the owner to upgrade.'}`}
      action={role?.isOwner && <Link to="/billing" className="btn btn--primary">See plans</Link>}
    />
  );
}

// Logged-out users only (login, sign up)
export function GuestRoute() {
  const { status } = useAuth();
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// Shows the page only if the user has at least one of these permissions
export function RequirePermission({ anyOf, children }) {
  const { canAny } = useAuth();
  if (!canAny(...anyOf)) {
    return (
      <EmptyState
        icon={Lock}
        title="You don’t have access to this page"
        text="Ask your administrator if you need access."
      />
    );
  }
  return children;
}
