import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, CreditCard, Inbox, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatDate, formatMoney, monthLabel, timeAgo } from '../../utils/format.js';
import { Bars, CompanyBadge, COMPANY_STATUS, naira } from './adminBits.jsx';

// /admin — how Workard is doing
export default function AdminOverview() {
  const { data } = useApi('/api/admin/overview');
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  const paying = (data.byStatus.active || 0) + (data.byStatus.grace || 0);
  const trials = (data.byStatus.trial || 0) + (data.byStatus.trial_ended || 0);

  return (
    <>
      <PageHeader title="Overview" subtitle="How Workard is doing across every company." />
      <div className="adm-grid">
        <StatCard icon={Building2} label="Companies" value={data.totals.companies} hint={`${paying} paying · ${trials} on trial`} to="/admin/companies" />
        <StatCard icon={CreditCard} tone="green" label="Monthly revenue" value={naira(data.monthlyRevenueKobo)} hint="paying companies, yearly ÷ 12" to="/admin/payments" />
        <StatCard icon={Users} tone="amber" label="People using Workard" value={data.totals.employees} hint={`${data.totals.active7} logged in this week`} to="/admin/users" />
        <StatCard icon={Inbox} tone="gray" label="New demo requests" value={data.totals.newDemos} hint={data.totals.failedPayments30 ? `${data.totals.failedPayments30} failed payments (30 days)` : 'no failed payments (30 days)'} to="/admin/demos" />
      </div>

      <div className="card adm-statusline">
        {Object.entries(COMPANY_STATUS).filter(([k]) => data.byStatus[k]).map(([k]) => (
          <Link key={k} to={`/admin/companies?status=${k}`}><CompanyBadge status={k} /> <strong>{data.byStatus[k]}</strong></Link>
        ))}
      </div>

      <div className="adm-two">
        <section className="card">
          <header className="card__header"><h2>New companies per week</h2></header>
          <Bars items={data.signupsByWeek} label={(w) => formatDate(w.week).replace(/ \d{4}$/, '')} value={(w) => w.count} emptyText="No sign-ups in the last 12 weeks" />
        </section>
        <section className="card">
          <header className="card__header"><h2>Money received per month</h2></header>
          <Bars items={data.revenueByMonth} label={(m) => monthLabel(m.month, true)} value={(m) => m.kobo} format={naira} emptyText="No payments yet" />
        </section>
      </div>

      <div className="adm-two">
        <section className="card">
          <header className="card__header"><h2>Trials ending this week</h2></header>
          {data.trialsEndingSoon.length === 0 ? <p className="adm-empty">None.</p> : (
            <ul className="adm-list">
              {data.trialsEndingSoon.map((c) => (
                <li key={c.id}><Link to={`/admin/companies/${c.id}`}>{c.name}</Link><span className="muted">{c.daysLeft === 0 ? 'ends today' : `${c.daysLeft} day${c.daysLeft === 1 ? '' : 's'} left`} · {c.employees} staff</span></li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <header className="card__header"><h2><AlertTriangle size={16} /> Renewal problems</h2></header>
          {data.renewalProblems.length === 0 ? <p className="adm-empty">No declined cards.</p> : (
            <ul className="adm-list">
              {data.renewalProblems.map((c) => (
                <li key={c.id}><Link to={`/admin/companies/${c.id}`}>{c.name}</Link><span className="muted">{c.renewalProblem}</span></li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="adm-two">
        <section className="card">
          <header className="card__header"><h2>Newest companies</h2></header>
          <ul className="adm-list">
            {data.newest.map((c) => (
              <li key={c.id}><span><Link to={`/admin/companies/${c.id}`}>{c.name}</Link> <CompanyBadge status={c.status} /></span><span className="muted">{timeAgo(c.createdAt)}</span></li>
            ))}
          </ul>
        </section>
        <section className="card">
          <header className="card__header"><h2>Latest payments</h2></header>
          {data.latestPayments.length === 0 ? <p className="adm-empty">No payments yet.</p> : (
            <ul className="adm-list">
              {data.latestPayments.map((p) => (
                <li key={p.id}><span>{p.organization_name}</span><span><strong>{formatMoney(p.amount_kobo, { decimals: false })}</strong> <span className="muted">· {timeAgo(p.paid_at)}</span></span></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
