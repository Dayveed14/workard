import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  CalendarClock,
  Contact,
  Scale,
  Wallet,
  CalendarDays,
  CalendarX,
  ClipboardCheck,
  Clock,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import ClockCard from '../../components/ClockCard.jsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatDate, formatMoneyShort, formatTime, fullName } from '../../utils/format.js';
import FollowUpList from '../../components/FollowUpList.jsx';
import TaskList from '../../components/TaskList.jsx';
import './Dashboard.css';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// What a manager sees: numbers for the people in their scope
function TeamOverview() {
  const { data, loading, error, reload } = useApi('/api/dashboard');
  if (loading) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (error) return <p className="form__alert">{error}</p>;

  const { headcount, today, needsAttention, byDepartment, recentClockIns, upcomingLeave, scope, money, customers, tasks, reviews } = data;
  const maxDept = Math.max(1, ...byDepartment.map((d) => d.total));
  const teamOverdue = tasks?.team ? tasks.team.overdue - tasks.mine.overdue : 0; // other people's overdue tasks
  const attention = needsAttention.pendingLeave + needsAttention.flaggedClockIns + Math.max(0, teamOverdue) + (reviews?.toWrite || 0);

  return (
    <>
      <div className="dash__heading">
        <h2>Today at a glance</h2>
        {scope !== 'all' && <span className="muted">Showing your {scope}</span>}
        <button type="button" className="link-btn" onClick={reload}>Refresh</button>
      </div>

      <div className="dash__stats">
        <StatCard icon={Users} label="Employees" value={headcount} hint="active" to="/employees" />
        <StatCard icon={UserCheck} tone="green" label="Present" value={today.present} hint={`${today.attendanceRate}% attendance`} to="/attendance?tab=register" />
        <StatCard icon={Clock} tone="amber" label="Late" value={today.late} to="/attendance?tab=register" />
        <StatCard icon={CalendarDays} tone="blue" label="On leave" value={today.onLeave} to="/leave?tab=approvals" />
        <StatCard icon={UserX} tone="red" label="Not clocked in" value={today.absent} to="/attendance?tab=register" />
      </div>

      {attention > 0 && (
        <div className="dash__attention">
          <AlertTriangle size={20} />
          <div>
            <strong>Needs your attention</strong>
            <span>
              {needsAttention.pendingLeave > 0 && (
                <Link to="/leave?tab=approvals">{needsAttention.pendingLeave} leave request(s) waiting</Link>
              )}
              {needsAttention.flaggedClockIns > 0 && (
                <Link to="/attendance?tab=flagged">{needsAttention.flaggedClockIns} flagged clock-in(s) to review</Link>
              )}
              {teamOverdue > 0 && <Link to="/tasks?tab=team">{teamOverdue} overdue task(s) in your team</Link>}
              {reviews?.toWrite > 0 && <Link to="/reviews?tab=team">{reviews.toWrite} performance review(s) to write</Link>}
            </span>
          </div>
        </div>
      )}

      {(money || customers) && (
        <>
          <div className="dash__heading">
            <h2>Business this month</h2>
          </div>
          <div className="dash__stats dash__stats--money">
            {money?.revenueKobo !== undefined && (
              <StatCard icon={ArrowDownCircle} tone="blue" label="Money in" value={formatMoneyShort(money.revenueKobo)} to="/finance" />
            )}
            {money?.expensesKobo !== undefined && (
              <StatCard icon={ArrowUpCircle} tone="amber" label="Money out" value={formatMoneyShort(money.expensesKobo)} to="/finance?tab=entries" />
            )}
            {money?.profitKobo !== undefined && (
              <StatCard icon={Scale} tone={money.profitKobo >= 0 ? 'green' : 'red'} label={money.profitKobo >= 0 ? 'Profit' : 'Loss'} value={formatMoneyShort(Math.abs(money.profitKobo))} to="/finance" />
            )}
            {money && (
              <StatCard icon={Wallet} tone="red" label="Customers owe" value={formatMoneyShort(money.outstandingKobo)} hint={money.overdueCount ? `${money.overdueCount} overdue` : 'none overdue'} to="/invoices?filter=unpaid" />
            )}
            {customers && (
              <StatCard
                icon={Contact}
                tone="blue"
                label="Customers"
                value={customers.byStage.customer || 0}
                hint={`${(customers.byStage.lead || 0) + (customers.byStage.prospect || 0)} leads & prospects`}
                to="/customers"
              />
            )}
          </div>
          {customers && (customers.followUpsDue > 0 || customers.openCases > 0) && (
            <div className="dash__attention dash__attention--info">
              <CalendarClock size={20} />
              <div>
                <strong>Customers waiting on you</strong>
                <span>
                  {customers.followUpsDue > 0 && <Link to="/customers?tab=follow-ups">{customers.followUpsDue} follow-up(s) due</Link>}
                  {customers.openCases > 0 && <Link to="/customers?tab=cases">{customers.openCases} open enquiry/complaint(s)</Link>}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <div className="dash__grid">
        <section className="card">
          <header className="card__header">
            <h2>Latest clock-ins</h2>
            <Link to="/attendance?tab=register" className="link-btn">Register <ArrowRight size={14} /></Link>
          </header>
          {recentClockIns.length === 0 ? (
            <EmptyState icon={Clock} title="No one has clocked in yet today" />
          ) : (
            <ul className="dash__list">
              {recentClockIns.map((r) => (
                <li key={r.id}>
                  <Link to={`/employees/${r.employee_id}`} className="person">
                    <Avatar name={fullName(r)} src={r.photo_url} size={34} />
                    <span>
                      <strong>{fullName(r)}</strong>
                      <span>{r.job_title || '—'}</span>
                    </span>
                  </Link>
                  <span className="dash__time">
                    {formatTime(r.clock_in_at)}
                    {r.review_status === 'pending' ? <Badge status="flagged" /> : r.is_late ? <Badge status="late" /> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="card__header">
            <h2>Upcoming leave</h2>
            <Link to="/leave?tab=approvals" className="link-btn">All leave <ArrowRight size={14} /></Link>
          </header>
          {upcomingLeave.length === 0 ? (
            <EmptyState icon={CalendarX} title="No approved leave coming up" />
          ) : (
            <ul className="dash__list">
              {upcomingLeave.map((l) => (
                <li key={l.id}>
                  <span className="person">
                    <Avatar name={fullName(l)} src={l.photo_url} size={34} />
                    <span>
                      <strong>{fullName(l)}</strong>
                      <span>{l.leave_type} · {l.days} day(s)</span>
                    </span>
                  </span>
                  <span className="dash__time muted">
                    {formatDate(l.start_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="card__header">
            <h2>People by department</h2>
          </header>
          <div className="card__body dash__bars">
            {byDepartment.map((d) => (
              <div key={d.name} className="dash__bar">
                <span>
                  {d.name} <strong>{d.total}</strong>
                </span>
                <div><i style={{ width: `${(d.total / maxDept) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

// Staff who handle customers see what they need to follow up today
function MyFollowUps() {
  const { data, reload } = useApi('/api/customers/follow-ups');
  if (!data) return null;
  return (
    <section className="card">
      <header className="card__header">
        <h2>My customer follow-ups</h2>
        <Link to="/customers?tab=follow-ups" className="link-btn">All <ArrowRight size={14} /></Link>
      </header>
      <FollowUpList items={data.slice(0, 5)} onChange={reload} compact />
    </section>
  );
}

// Everyone: open tasks (overdue & today first) + any review waiting on them
function MyTasks() {
  const { data, reload } = useApi('/api/tasks?view=mine&status=open&limit=5');
  const { data: reviews } = useApi('/api/reviews?view=mine&status=open');
  const waiting = (reviews || []).filter((r) => ['self_review', 'acknowledgement'].includes(r.status));
  if (!data) return null;
  return (
    <section className="card dash__tasks">
      <header className="card__header">
        <h2>My tasks {data.total > 0 && <span className="muted">· {data.total} open</span>}</h2>
        <Link to="/tasks" className="link-btn">All <ArrowRight size={14} /></Link>
      </header>
      {waiting.map((r) => (
        <Link key={r.id} to={`/reviews/${r.id}`} className="dash__review-due">
          <ClipboardCheck size={16} />
          {r.status === 'self_review' ? 'Rate yourself for your performance review' : 'Your performance review is ready — read & confirm'}
          <ArrowRight size={14} />
        </Link>
      ))}
      <TaskList tasks={data.tasks} onChange={reload} compact />
    </section>
  );
}

// What everyone sees: own leave balances
function MyLeaveSummary() {
  const { data } = useApi('/api/me/leave');
  if (!data) return null;
  return (
    <section className="card">
      <header className="card__header">
        <h2>My leave balance</h2>
        <Link to="/leave" className="link-btn">Request leave <ArrowRight size={14} /></Link>
      </header>
      <div className="card__body dash__balances">
        {data.balances.map((b) => (
          <div key={b.leaveTypeId}>
            <strong>{b.remaining}</strong>
            <span>{b.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { user, employee, organization, can } = useAuth();
  const firstName = employee?.firstName || user?.fullName?.split(' ')[0];

  return (
    <div className="dash">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle={`${organization?.name} · ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {employee && <ClockCard />}
      {employee && <MyTasks />}

      {can('dashboard.view') ? (
        <TeamOverview />
      ) : (
        <div className="dash__mine">
          {employee && <MyLeaveSummary />}
          {can('customers.view') && <MyFollowUps />}
        </div>
      )}
    </div>
  );
}
