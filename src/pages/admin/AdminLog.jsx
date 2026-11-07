import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatDateTime } from '../../utils/format.js';

// What a log entry means, in words
const ACTIONS = {
  'admin.added': 'added a super admin',
  'admin.removed': 'removed a super admin',
  'admin.setup_done': 'set their admin password',
  'company.trial_extended': 'extended a trial',
  'company.plan_set': 'set a plan',
  'company.exempted': 'exempted from billing',
  'company.unexempted': 'billed normally again',
  'company.suspended': 'suspended a company',
  'company.restored': 'lifted a suspension',
  'support.opened': 'opened a company (support, read-only)',
  'user.locked': 'locked a user',
  'user.unlocked': 'unlocked a user',
  'user.reset_sent': 'sent a password-reset link',
  'pricing.updated': 'changed prices',
  'pricing.reset': 'reset prices',
  'announcement.sent': 'sent an announcement',
  'demo.updated': 'updated a demo request',
  'post.published': 'published a post',
  'post.drafted': 'saved a draft post',
  'post.updated': 'edited a post',
  'post.unpublished': 'unpublished a post',
  'post.deleted': 'deleted a post',
};

const linkFor = (l) =>
  l.target_type === 'company' ? `/admin/companies/${l.target_id}` : l.target_type === 'post' ? `/admin/blog/${l.target_id}` : null;

// /admin/log — everything super admins did
export default function AdminLog() {
  const [page, setPage] = useState(1);
  const { data } = useApi(`/api/admin/log?page=${page}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / 50)) : 1;
  return (
    <>
      <PageHeader title="Activity log" subtitle="Every change made in the admin area." />
      <div className="card">
        {!data ? <div className="page-loader"><span className="page-loader__spinner" /></div> : data.rows.length === 0 ? <p className="adm-empty">Nothing yet.</p> : (
          <>
            <ul className="adm-list">
              {data.rows.map((l) => (
                <li key={l.id}>
                  <span>
                    <strong>{l.admin_name}</strong> {ACTIONS[l.action] || l.action}
                    {l.target_name && <> — {linkFor(l) ? <Link to={linkFor(l)}>{l.target_name}</Link> : l.target_name}</>}
                    {l.details && <span className="adm-sub">{l.details}</span>}
                  </span>
                  <span className="muted">{formatDateTime(l.created_at)}</span>
                </li>
              ))}
            </ul>
            {pages > 1 && (
              <div className="dt-pager">
                <span className="muted">Page {page} of {pages}</span>
                <span className="dt-pager__buttons">
                  <button type="button" className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                  <button type="button" className="btn btn--outline btn--sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
