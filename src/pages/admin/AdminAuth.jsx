import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';

// The super admin's session — separate from company log-ins (cookie wk_admin, /api/admin only)
const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | in | out

  const reload = useCallback(
    () =>
      api('/api/admin/auth/me')
        .then((s) => {
          setAdmin(s.admin);
          setStatus('in');
        })
        .catch(() => setStatus('out')),
    []
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(
    () => ({
      admin,
      status,
      startLogin: (body) => api('/api/admin/auth/login', { method: 'POST', body }),
      verify: async (challengeToken, code) => {
        const s = await api('/api/admin/auth/verify', { method: 'POST', body: { challengeToken, code } });
        setAdmin(s.admin);
        setStatus('in');
      },
      logout: async () => {
        await api('/api/admin/auth/logout', { method: 'POST' }).catch(() => {});
        setAdmin(null);
        setStatus('out');
      },
    }),
    [admin, status]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdmin = () => useContext(AdminAuthContext);
