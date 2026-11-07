import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Plus } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import Badge from '../../components/Badge.jsx';
import { SearchBox, useTable, SortTh, Pager } from '../../components/DataTable.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatDateTime } from '../../utils/format.js';

const live = (p) => p.status === 'published' && new Date(String(p.published_at).replace(' ', 'T')) <= new Date();
const stateOf = (p) => (p.status === 'draft' ? { label: 'Draft', tone: 'gray' } : live(p) ? { label: 'Live', tone: 'green' } : { label: 'Scheduled', tone: 'blue' });

// /admin/blog — the website's blog
export default function AdminBlog() {
  const navigate = useNavigate();
  const { data } = useApi('/api/admin/blog');
  const [filter, setFilter] = useState('');
  const table = useTable(data, {
    search: (p) => [p.title, p.category, p.author_name],
    sorts: { title: (p) => p.title, date: (p) => p.published_at || p.created_at, updated: (p) => p.updated_at },
    defaultSort: { key: 'date', dir: 'desc' },
    filter: filter ? (p) => stateOf(p).label === filter : null,
  });

  return (
    <>
      <PageHeader
        title="Blog"
        subtitle="Posts on workard.com/blog. A post goes live on its publish date; the website is rebuilt so Google sees it."
        actions={<Link to="/admin/blog/new" className="btn btn--primary"><Plus size={18} /> New post</Link>}
      />
      <div className="adm-toolbar">
        <SearchBox table={table} placeholder="Search posts" />
        <div className="adm-chips">
          {['', 'Live', 'Scheduled', 'Draft'].map((f) => (
            <button key={f} type="button" className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>{f || 'All'}</button>
          ))}
        </div>
      </div>
      <div className="card">
        {!data ? <div className="page-loader"><span className="page-loader__spinner" /></div> : data.length === 0 ? <p className="adm-empty">No posts yet — write the first one.</p> : (
          <div className="table-wrap">
            <table className="table table--clickable">
              <thead>
                <tr><th aria-label="Cover" /><SortTh table={table} column="title">Post</SortTh><th>State</th><SortTh table={table} column="date">Publish date</SortTh><SortTh table={table} column="updated">Last edited</SortTh><th aria-label="View" /></tr>
              </thead>
              <tbody>
                {table.rows.map((p) => (
                  <tr key={p.id} onClick={() => navigate(`/admin/blog/${p.id}`)}>
                    <td>{p.cover_url ? <img src={p.cover_url} alt="" className="blog-thumb" /> : <span className="blog-thumb" />}</td>
                    <td><strong>{p.title}</strong><span className="adm-sub">{[p.category, p.author_name].filter(Boolean).join(' · ')}</span></td>
                    <td><Badge tone={stateOf(p).tone}>{stateOf(p).label}</Badge></td>
                    <td>{p.published_at ? formatDateTime(p.published_at) : '—'}</td>
                    <td>{formatDateTime(p.updated_at)}</td>
                    <td>{live(p) && <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label="View on the website"><ExternalLink size={16} /></a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager table={table} noun="posts" />
          </div>
        )}
      </div>
    </>
  );
}
