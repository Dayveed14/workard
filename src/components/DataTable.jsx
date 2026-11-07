import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import './DataTable.css';

// ============================================================
// Search, sort and pages for a list that's already loaded (like a "datatable").
//
//   const t = useTable(rows, {
//     search: (r) => [r.first_name, r.staff_id],          // what the search box looks in
//     sorts: { name: (r) => r.first_name, in: (r) => r.clock_in_at },
//     defaultSort: { key: 'name', dir: 'asc' },
//     pageSize: 25,
//   });
//   t.rows → the rows to show on this page
// ============================================================

const text = (v) => (v === null || v === undefined ? '' : String(v)).toLowerCase();

function compare(a, b) {
  const emptyA = a === null || a === undefined || a === '';
  const emptyB = b === null || b === undefined || b === '';
  if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1; // blanks always last
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export function useTable(rows, { search, sorts = {}, defaultSort = null, pageSize = 25, filter = null } = {}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);

  const matched = useMemo(() => {
    const words = text(query).split(/\s+/).filter(Boolean);
    let list = rows || [];
    if (filter) list = list.filter(filter);
    if (words.length && search) {
      // every word must appear somewhere ("ada 014" finds Ada with staff ID WK-014)
      list = list.filter((r) => {
        const hay = search(r).map(text).join(' ');
        return words.every((w) => hay.includes(w));
      });
    }
    if (sort && sorts[sort.key]) {
      const get = sorts[sort.key];
      list = [...list].sort((a, b) => {
        const result = compare(get(a), get(b));
        // blanks stay last in both directions
        const blank = get(a) === null || get(a) === undefined || get(a) === '' || get(b) === null || get(b) === undefined || get(b) === '';
        return sort.dir === 'desc' && !blank ? -result : result;
      });
    }
    return list;
  }, [rows, query, sort, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = Math.max(1, Math.ceil(matched.length / pageSize));
  useEffect(() => setPage(1), [query, sort, filter, rows]);
  const current = Math.min(page, pages);
  const start = (current - 1) * pageSize;

  // Click a column once → A–Z / lowest first, again → the other way
  const toggleSort = (key) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  return {
    rows: matched.slice(start, start + pageSize),
    total: (rows || []).length,
    matched: matched.length,
    query, setQuery,
    sort, setSort, toggleSort,
    page: current, pages, setPage,
    from: matched.length ? start + 1 : 0,
    to: Math.min(start + pageSize, matched.length),
  };
}

export function SearchBox({ table, placeholder = 'Search…', label = 'Search' }) {
  return (
    <label className="dt-search">
      <Search size={16} aria-hidden="true" />
      <input type="search" value={table.query} onChange={(e) => table.setQuery(e.target.value)} placeholder={placeholder} aria-label={label} />
      {table.query && (
        <button type="button" onClick={() => table.setQuery('')} aria-label="Clear search"><X size={14} /></button>
      )}
    </label>
  );
}

// A column header you can click to sort by
export function SortTh({ table, column, children, className = '' }) {
  const active = table.sort?.key === column;
  const Icon = !active ? ArrowUpDown : table.sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={className} aria-sort={active ? (table.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={active ? 'dt-sort is-active' : 'dt-sort'} onClick={() => table.toggleSort(column)}>
        {children} <Icon size={13} aria-hidden="true" />
      </button>
    </th>
  );
}

// "Showing 26–50 of 112" + previous / next
export function Pager({ table, noun = 'people' }) {
  if (!table.matched) {
    return table.query ? <p className="dt-none">No {noun} match “{table.query}”.</p> : null;
  }
  return (
    <div className="dt-pager">
      <span className="muted">
        {table.matched === table.total
          ? `${table.total} ${noun}`
          : `${table.matched} of ${table.total} ${noun} match`}
        {table.pages > 1 && ` · showing ${table.from}–${table.to}`}
      </span>
      {table.pages > 1 && (
        <span className="dt-pager__buttons">
          <button type="button" className="btn btn--outline btn--sm" disabled={table.page <= 1} onClick={() => table.setPage(table.page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
          <span>Page {table.page} of {table.pages}</span>
          <button type="button" className="btn btn--outline btn--sm" disabled={table.page >= table.pages} onClick={() => table.setPage(table.page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
        </span>
      )}
    </div>
  );
}
