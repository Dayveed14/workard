import { useState } from 'react';
import Badge from '../../components/Badge.jsx';
import { formatMoneyShort } from '../../utils/format.js';

// How a company's account stands, in words (matches the server's adminService.companyStatus)
export const COMPANY_STATUS = {
  trial: { label: 'Trial', tone: 'blue' },
  trial_ended: { label: 'Trial ended', tone: 'amber' },
  active: { label: 'Paying', tone: 'green' },
  grace: { label: 'Grace days', tone: 'amber' },
  expired: { label: 'Expired', tone: 'red' },
  free: { label: 'Free (billing off)', tone: 'gray' },
  exempt: { label: 'Exempt', tone: 'gray' },
  suspended: { label: 'Suspended', tone: 'red' },
};

export function CompanyBadge({ status }) {
  const s = COMPANY_STATUS[status] || { label: status, tone: 'gray' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

// One-series bar chart with a value on hover and a table toggle
export function Bars({ items, label, value, format = (v) => v, emptyText = 'Nothing yet' }) {
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...items.map(value));
  if (!items.length) return <p className="adm-empty">{emptyText}</p>;
  return (
    <>
      <div className="adm-bars__toggle">
        <button type="button" className="link-btn" onClick={() => setAsTable((v) => !v)}>{asTable ? 'Show as chart' : 'Show as table'}</button>
      </div>
      {asTable ? (
        <table className="table">
          <tbody>
            {items.map((it) => <tr key={label(it)}><td>{label(it)}</td><td><strong>{format(value(it))}</strong></td></tr>)}
          </tbody>
        </table>
      ) : (
        <>
          <div className="adm-bars" role="img" aria-label={items.map((it) => `${label(it)}: ${format(value(it))}`).join(', ')}>
            {items.map((it) => (
              <div key={label(it)} className="adm-bars__col" title={`${label(it)}: ${format(value(it))}`}>
                <span className="adm-bars__value">{value(it) ? format(value(it)) : ''}</span>
                <span className="adm-bars__bar" style={{ height: `${(value(it) / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <p className="adm-bars__labels" aria-hidden="true">{items.map((it) => <span key={label(it)}>{label(it)}</span>)}</p>
        </>
      )}
    </>
  );
}

export const naira = (kobo) => formatMoneyShort(kobo);
