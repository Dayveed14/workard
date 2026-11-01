import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Loads data from the API when the component mounts (and when `path` changes).
//   const { data, loading, error, reload } = useApi('/api/dashboard');
// Pass null as the path to skip loading.
export function useApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError('');
    try {
      setData(await api(path));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}
