import { useState } from 'react';
import { History } from 'lucide-react';
import EmptyState from '../../../components/EmptyState.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { formatDateTime } from '../../../utils/format.js';

// "Who did what" — every important change is recorded on the server
export default function ActivityLog() {
  const [page, setPage] = useState(1);
  const { data, loading } = useApi(`/api/organization/audit-logs?page=${page}`);

  return (
    <div className="card">
      {loading && <div className="page-loader"><span className="page-loader__spinner" /></div>}
      {data?.length === 0 && <EmptyState icon={History} title="No activity yet" />}
      {data?.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
              <tbody>
                {data.map((l) => (
                  <tr key={l.id}>
                    <td className="muted">{formatDateTime(l.created_at)}</td>
                    <td>{l.user_name || 'System'}</td>
                    <td><span className="audit-action">{l.action}</span></td>
                    <td>{l.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>Page {page}</span>
            <div>
              <button type="button" className="btn btn--outline btn--sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Newer</button>
              <button type="button" className="btn btn--outline btn--sm" disabled={data.length < 50} onClick={() => setPage((p) => p + 1)}>Older</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
