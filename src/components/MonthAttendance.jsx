import { useState } from 'react';
import { Clock } from 'lucide-react';
import Badge from './Badge.jsx';
import EmptyState from './EmptyState.jsx';
import AdherenceDonut from './AdherenceDonut.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatDate, formatHours, formatTime, todayString } from '../utils/format.js';
import './MonthAttendance.css';

// One month of attendance for one person.
//   basePath: '/api/me/attendance' or '/api/employees/12/attendance'
export default function MonthAttendance({ basePath }) {
  const [month, setMonth] = useState(todayString().slice(0, 7));
  const { data, loading, error } = useApi(`${basePath}?month=${month}`);

  return (
    <div className="month-att">
      <div className="month-att__top">
        <input
          type="month"
          className="field__input"
          value={month}
          max={todayString().slice(0, 7)}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Month"
        />
        {data && (
          <div className="month-att__summary">
            <span><strong>{data.summary.daysPresent}</strong> days present</span>
            <span><strong>{data.summary.daysLate}</strong> late</span>
            <span><strong>{data.summary.hoursWorked}</strong> hours</span>
          </div>
        )}
      </div>

      {data?.adherence && <AdherenceDonut data={data.adherence} previous={data.previousAdherence} />}

      <div className="card">
        {loading && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {error && <p className="card__body">{error}</p>}
        {data && data.records.length === 0 && <EmptyState icon={Clock} title="No attendance this month" />}
        {data && data.records.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>In</th>
                  <th>Out</th>
                  <th>Worked</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.work_date)}</td>
                    <td>{formatTime(r.clock_in_at)}</td>
                    <td>{formatTime(r.clock_out_at)}</td>
                    <td>{formatHours(r.minutes_worked)}</td>
                    <td>
                      {r.review_status === 'pending' ? (
                        <Badge status="flagged" />
                      ) : r.review_status === 'rejected' ? (
                        <Badge status="rejected" />
                      ) : r.is_late ? (
                        <Badge status="late" />
                      ) : (
                        <Badge status="present" />
                      )}
                    </td>
                    <td className="muted">{r.flag_reason || r.review_note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
