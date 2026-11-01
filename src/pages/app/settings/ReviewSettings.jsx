import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';

// How often reviews happen, whether staff rate themselves first, and what everyone is rated on
export default function ReviewSettings() {
  const toast = useToast();
  const { data, setData } = useApi('/api/reviews/settings');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (data) {
      setForm({
        frequency: data.frequency,
        selfReview: data.selfReview,
        criteria: data.criteria.map((c) => ({ id: c.id, name: c.name, description: c.description || '', weight: c.weight })),
      });
    }
  }, [data]);

  if (!form) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const total = form.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
  const setCriterion = (i, name, value) =>
    setForm((f) => ({ ...f, criteria: f.criteria.map((c, j) => (j === i ? { ...c, [name]: value } : c)) }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      setData(await api('/api/reviews/settings', { method: 'PUT', body: form }));
      toast.success('Review settings saved');
    } catch (err) {
      setError(err.errors?.criteria || err.message);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card card__body form form--flush settings__reviews" onSubmit={save}>
      <h2 className="settings__title">How reviews work</h2>
      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor="frequency">How often</label>
          <select id="frequency" className="field__input" value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly (every 3 months)</option>
          </select>
        </div>
        <label className="form__check settings__check-inline">
          <input type="checkbox" checked={form.selfReview} onChange={(e) => setForm((f) => ({ ...f, selfReview: e.target.checked }))} />
          <span>Staff rate themselves first</span>
        </label>
      </div>

      <p className="form__section">What staff are rated on (1–5 each)</p>
      <p className="muted">The weight is how much each part counts towards the overall score. Changing these doesn’t affect reviews already started.</p>

      {form.criteria.map((c, i) => (
        <div key={c.id || `new-${i}`} className="settings__criterion">
          <input className="field__input" value={c.name} onChange={(e) => setCriterion(i, 'name', e.target.value)} placeholder="e.g. Customer service" aria-label="Criterion name" />
          <input className="field__input" value={c.description} onChange={(e) => setCriterion(i, 'description', e.target.value)} placeholder="What good looks like (optional)" aria-label="Description" />
          <div className="settings__weight">
            <input className="field__input" type="number" min="1" max="100" value={c.weight} onChange={(e) => setCriterion(i, 'weight', e.target.value)} aria-label="Weight" />
            <span>%</span>
          </div>
          <button type="button" className="icon-btn" aria-label="Remove" disabled={form.criteria.length === 1} onClick={() => setForm((f) => ({ ...f, criteria: f.criteria.filter((_, j) => j !== i) }))}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <div className="settings__helper">
        <button type="button" className="btn btn--outline btn--sm" onClick={() => setForm((f) => ({ ...f, criteria: [...f.criteria, { name: '', description: '', weight: 10 }] }))}>
          <Plus size={16} /> Add
        </button>
        <span className={total === 100 ? 'settings__total-ok' : 'settings__total-bad'}>
          Total: {total}% {total !== 100 && '— must be 100%'}
        </span>
      </div>

      {error && <p className="field__error">{error}</p>}
      <div>
        <button type="submit" className="btn btn--primary" disabled={busy || total !== 100}>{busy ? 'Saving…' : 'Save settings'}</button>
      </div>
    </form>
  );
}
