import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
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

// Logged-in users only
export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Loader />;
  if (status === 'guest') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
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
