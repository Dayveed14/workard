import { useState } from 'react';
import { CalendarPlus, Flag, Trash2 } from 'lucide-react';
import EmptyState from '../../../components/EmptyState.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate } from '../../../utils/format.js';

// Public holidays: nobody is marked absent on these days, and they don't count as working days
export default function HolidaysSettings() {
  const toast = useToast();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const { data: holidays, setData } = useApi(`/api/organization/holidays?year=${year}`);
  const [form, setForm] = useState({ date: '', name: '' });
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setData(await api('/api/organization/holidays', { method: 'POST', body: form }));
      setForm({ date: '', name: '' });
      toast.success('Holiday added');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addNational = async () => {
    setBusy(true);
    try {
      const r = await api('/api/organization/holidays/national', { method: 'POST', body: { year } });
      setData(r.holidays);
      toast.success(r.added ? `${r.added} public holidays added` : 'They’re already on the list');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (h) => {
    try {
      await api(`/api/organization/holidays/${h.id}`, { method: 'DELETE' });
      setData((list) => list.filter((x) => x.id !== h.id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="settings__grid">
      <section className="card">
        <header className="card__header">
          <h2>Public holidays</h2>
          <select className="field__input settings__year" value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year">
            {[thisYear - 1, thisYear, thisYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </header>
        {!holidays && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {holidays?.length === 0 && (
          <EmptyState icon={Flag} title={`No holidays for ${year} yet`} text="Add Nigeria’s fixed public holidays in one click, then add Easter, Eid and Maulud when they’re announced." />
        )}
        {holidays?.length > 0 && (
          <ul className="settings__list">
            {holidays.map((h) => (
              <li key={h.id}>
                <span className="settings__list-text">
                  <strong>{h.name}</strong>
                  <span>{formatDate(h.holiday_date)}</span>
                </span>
                <button type="button" className="icon-btn" onClick={() => remove(h)} aria-label={`Remove ${h.name}`}><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card card__body form form--flush">
        <h2 className="settings__title">Add holidays</h2>
        <p className="muted">On these days nobody is marked absent, and the day isn’t counted in anyone’s monthly attendance.</p>
        <button type="button" className="btn btn--outline" onClick={addNational} disabled={busy}>
          <Flag size={16} /> Add Nigeria’s fixed holidays for {year}
        </button>
        <p className="muted settings__hint">New Year, Workers’ Day, Democracy Day, Independence Day, Christmas and Boxing Day.</p>
        <form onSubmit={add} className="form form--flush">
          <div className="form__row">
            <div className="field">
              <label className="field__label" htmlFor="holidayDate">Date</label>
              <input id="holidayDate" type="date" className="field__input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="holidayName">Name</label>
              <input id="holidayName" className="field__input" placeholder="e.g. Eid-el-Fitr" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
          </div>
          <div>
            <button type="submit" className="btn btn--primary" disabled={busy || !form.date || form.name.trim().length < 2}>
              <CalendarPlus size={16} /> Add holiday
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
