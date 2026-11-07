import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

// Holds the logged-in session:
// { user, organization, organizations, role, permissions, employee }
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | guest | suspended
  const [suspendedMessage, setSuspendedMessage] = useState('');

  const signIn = useCallback((s) => {
    setSession(s);
    setStatus('authenticated');
    return s;
  }, []);

  useEffect(() => {
    let active = true;
    api('/api/auth/me')
      .then((s) => active && signIn(s))
      .catch((err) => active && setStatus(err.status === 423 ? 'suspended' : 'guest'));
    // Any request can find out the company has been suspended by Workard
    const onSuspended = (e) => {
      setSuspendedMessage(e.detail || '');
      setStatus('suspended');
    };
    window.addEventListener('workard:suspended', onSuspended);
    return () => {
      active = false;
      window.removeEventListener('workard:suspended', onSuspended);
    };
  }, [signIn]);

  const value = useMemo(() => {
    const permissions = session?.permissions || {};
    return {
      ...session,
      status,
      suspendedMessage,
      isAuthenticated: status === 'authenticated',
      // A Workard support visit (read-only) — see AppLayout's banner
      isSupportVisit: Boolean(session?.support),

      // can('employees.view') → scope string ("team", "all"...) or undefined
      can: (key) => permissions[key],
      canAny: (...keys) => keys.some((k) => permissions[k]),

      // Step 1 of login/sign up returns { challengeToken, email } — the code is then entered in OtpStep
      startLogin: (credentials) => api('/api/auth/login', { method: 'POST', body: credentials }),
      startRegister: (details) => api('/api/auth/register', { method: 'POST', body: details }),

      // Step 2: the emailed code
      verifyOtp: async (challengeToken, code) =>
        signIn(await api('/api/auth/verify-otp', { method: 'POST', body: { challengeToken, code } })),

      acceptInvite: async (token, body) =>
        signIn(await api(`/api/invites/${token}/accept`, { method: 'POST', body })),

      switchOrganization: async (organizationId) =>
        signIn(await api('/api/auth/switch-organization', { method: 'POST', body: { organizationId } })),

      reloadSession: async () => signIn(await api('/api/auth/me')),

      logout: async () => {
        try {
          await api('/api/auth/logout', { method: 'POST' });
        } finally {
          setSession(null);
          setStatus('guest');
        }
      },
    };
  }, [session, status, signIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
