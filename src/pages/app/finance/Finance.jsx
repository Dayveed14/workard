import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Download, Paperclip, Plus, Scale, Trash2, Wallet } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Tabs from '../../../components/Tabs.jsx';
import StatCard from '../../../components/StatCard.jsx';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import TrendChart from '../../../components/TrendChart.jsx';
import { api, toQuery } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { PAYMENT_METHODS, formatDate, formatMoney, monthLabel, newRequestId, todayString } from '../../../utils/format.js';
import './Finance.css';

// ---------- Overview (monthly report) ----------
function Overview({ month }) {
  const { data: s, loading } = useApi(`/api/finance/summary?month=${month}`);
  if (loading || !s) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const maxExpense = Math.max(1, ...s.expensesByCategory.map((c) => c.totalKobo));

  return (
    <>
      <div className="finance__stats">
        <StatCard icon={ArrowDownCircle} tone="blue" label="Money in" value={formatMoney(s.revenueKobo)} hint={`${formatMoney(s.invoicePaymentsKobo)} from invoices`} />
        <StatCard icon={ArrowUpCircle} tone="amber" label="Money out" value={formatMoney(s.expensesKobo)} hint={`${s.expensesByCategory.length} categories`} />
        <StatCard
          icon={Scale}
          tone={s.profitKobo >= 0 ? 'green' : 'red'}
          label={s.profitKobo >= 0 ? 'Profit' : 'Loss'}
          value={formatMoney(Math.abs(s.profitKobo))}
          hint={s.profitMargin !== null ? `${s.profitMargin}% margin` : 'no income yet'}
        />
        <StatCard icon={Wallet} tone="red" label="Customers owe you" value={formatMoney(s.receivables.outstandingKobo)} hint={`${formatMoney(s.receivables.overdueKobo)} overdue`} to="/invoices?filter=unpaid" />
      </div>

      <div className="finance__grid">
        <section className="card">
          <header className="card__header"><h2>Last 6 months</h2></header>
          <div className="card__body"><TrendChart trend={s.trend} /></div>
        </section>

        <section className="card">
          <header className="card__header"><h2>Where the money went</h2></header>
          <div className="card__body">
            {s.expensesByCategory.length === 0 ? (
              <p className="muted">No expenses recorded in {monthLabel(month)}.</p>
            ) : (
              <ul className="finance__cats">
                {s.expensesByCategory.map((c) => (
                  <li key={c.name}>
                    <span>{c.name}</span>
                    <strong>{formatMoney(c.totalKobo)}</strong>
                    <div><i style={{ width: `${(c.totalKobo / maxExpense) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="card">
          <header className="card__header"><h2>Top paying customers</h2></header>
          <div className="card__body">
            {s.topCustomers.length === 0 ? (
              <p className="muted">No invoice payments in {monthLabel(month)}.</p>
            ) : (
              <ol className="finance__top">
                {s.topCustomers.map((c) => (
                  <li key={c.id}>
                    <Link to={`/customers/${c.id}`}>{c.name}</Link>
                    <strong>{formatMoney(c.totalKobo)}</strong>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <section className="card">
          <header className="card__header"><h2>Summary for {monthLabel(month)}</h2></header>
          <dl className="card__body finance__summary">
            <dt>Invoices issued</dt><dd>{s.invoiced.count} · {formatMoney(s.invoiced.totalKobo)}</dd>
            <dt>Received from invoices</dt><dd>{formatMoney(s.invoicePaymentsKobo)}</dd>
            <dt>Other income</dt><dd>{formatMoney(s.otherIncomeKobo)}</dd>
            <dt>Expenses</dt><dd>−{formatMoney(s.expensesKobo)}</dd>
            <dt className="finance__summary-total">{s.profitKobo >= 0 ? 'Profit' : 'Loss'}</dt>
            <dd className="finance__summary-total">{formatMoney(s.profitKobo)}</dd>
          </dl>
          <p className="card__body muted finance__basis">Counted when money actually comes in or goes out.</p>
        </section>
      </div>
    </>
  );
}

// ---------- Record income / expense ----------
function EntryModal({ type, categories, onClose, onSaved }) {
  const toast = useToast();
  const [requestId] = useState(newRequestId); // makes a double click save only once
  const options = categories.filter((c) => c.type === type && c.is_active);
  const [form, setForm] = useState({
    categoryId: options[0]?.id || '',
    amount: '',
    entryDate: todayString(),
    description: '',
    party: '',
    method: 'transfer',
    reference: '',
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const entry = await api('/api/finance/entries', { method: 'POST', body: { ...form, type, requestId } });
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        try {
          await api(`/api/finance/entries/${entry.id}/receipt`, { method: 'POST', formData: fd });
        } catch (err) {
          toast.error(`Saved, but the receipt didn't upload: ${err.message}`);
        }
      }
      toast.success(type === 'expense' ? 'Expense recorded' : 'Income recorded');
      onSaved();
      onClose();
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={type === 'expense' ? 'Record an expense' : 'Record other income'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </>
      }
    >
      <div className="form form--flush">
        {error && <div className="form__alert"><AlertCircle size={18} /> {error}</div>}
        {type === 'income' && (
          <p className="muted">Invoice payments are added automatically — use this for money that didn’t come through an invoice.</p>
        )}
        <div className="form__row">
          <Field label="Amount (₦)" name="amount" error={errors.amount}>
            <input id="amount" name="amount" type="number" min="0" step="0.01" className="field__input" value={form.amount} onChange={onChange} />
          </Field>
          <Field label="Date" name="entryDate" error={errors.entryDate}>
            <input id="entryDate" name="entryDate" type="date" className="field__input" value={form.entryDate} onChange={onChange} />
          </Field>
        </div>
        <Field label="Category" name="categoryId" error={errors.categoryId}>
          <select id="categoryId" name="categoryId" className="field__input" value={form.categoryId} onChange={onChange}>
            {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="What was it for?" name="description" error={errors.description}>
          <input id="description" name="description" className="field__input" placeholder={type === 'expense' ? 'e.g. Diesel for generator' : 'e.g. Consulting for Bello Pharmacy'} value={form.description} onChange={onChange} />
        </Field>
        <div className="form__row form__row--3">
          <Field label={type === 'expense' ? 'Paid to' : 'Received from'} name="party" optional>
            <input id="party" name="party" className="field__input" value={form.party} onChange={onChange} />
          </Field>
          <Field label="Method" name="method">
            <select id="method" name="method" className="field__input" value={form.method} onChange={onChange}>
              {Object.entries(PAYMENT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Reference" name="reference" optional>
            <input id="reference" name="reference" className="field__input" value={form.reference} onChange={onChange} />
          </Field>
        </div>
        <Field label="Receipt" name="file" optional hint="Photo or PDF of the receipt (max 10 MB)">
          <input id="file" type="file" className="field__input" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files[0])} />
        </Field>
      </div>
    </Modal>
  );
}

// ---------- Income & expenses list ----------
function Entries({ month }) {
  const toast = useToast();
  const { can } = useAuth();
  const [type, setType] = useState('');
  const [adding, setAdding] = useState(null); // 'income' | 'expense'
  const { data: entries, reload } = useApi(`/api/finance/entries${toQuery({ month, type })}`);
  const { data: payments } = useApi(type === 'expense' ? null : `/api/finance/payments?month=${month}`);
  const { data: categories } = useApi('/api/finance/categories');

  // One list: manual entries + invoice payments (as income), newest first
  const rows = [
    ...(entries || []).map((e) => ({
      key: `e${e.id}`,
      id: e.id,
      date: e.entry_date,
      type: e.type,
      category: e.category_name,
      description: e.description,
      party: e.party,
      method: e.method,
      amountKobo: e.amount_kobo,
      receiptUrl: e.receipt_url,
      editable: !e.request_id?.startsWith('payroll-'), // payroll costs are managed from Payroll
    })),
    ...(type === 'expense' ? [] : payments || []).map((p) => ({
      key: `p${p.id}`,
      date: p.paid_on,
      type: 'income',
      category: 'Invoice payment',
      description: p.invoice_number,
      invoiceId: p.invoice_id,
      party: p.customer_name,
      method: p.method,
      amountKobo: p.amount_kobo,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.description}"? This is recorded in the activity log.`)) return;
    try {
      await api(`/api/finance/entries/${row.id}`, { method: 'DELETE' });
      toast.success('Entry deleted');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Download what's on screen as a spreadsheet-friendly CSV
  const exportCsv = () => {
    const header = ['Date', 'Type', 'Category', 'Description', 'Party', 'Method', 'Amount (NGN)'];
    const lines = rows.map((r) => [r.date, r.type, r.category, r.description, r.party || '', PAYMENT_METHODS[r.method], (r.amountKobo / 100).toFixed(2)]);
    const csv = [header, ...lines].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `workard-finance-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="toolbar">
        <select className="field__input" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="">Income & expenses</option>
          <option value="income">Income only</option>
          <option value="expense">Expenses only</option>
        </select>
        <button type="button" className="btn btn--outline" onClick={exportCsv} disabled={!rows.length}><Download size={18} /> Export CSV</button>
        {can('finance.manage') && categories && (
          <>
            <button type="button" className="btn btn--outline finance__add" onClick={() => setAdding('income')}><Plus size={18} /> Income</button>
            <button type="button" className="btn btn--primary" onClick={() => setAdding('expense')}><Plus size={18} /> Expense</button>
          </>
        )}
      </div>

      <div className="card">
        {!entries && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {entries && rows.length === 0 && <EmptyState icon={Wallet} title={`Nothing recorded in ${monthLabel(month)}`} text="Record expenses like rent, fuel and salaries to see your real profit." />}
        {rows.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Paid to / from</th><th>Amount</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td className="muted">{formatDate(r.date)}</td>
                    <td>{r.category}</td>
                    <td>{r.invoiceId ? <Link to={`/invoices/${r.invoiceId}`}>{r.description}</Link> : r.description}</td>
                    <td className="muted">{r.party || '—'}</td>
                    <td className={r.type === 'income' ? 'finance__in' : 'finance__out'}>
                      {r.type === 'income' ? '+' : '−'}{formatMoney(r.amountKobo)}
                    </td>
                    <td className="row-actions">
                      {r.receiptUrl && <a href={r.receiptUrl} target="_blank" rel="noreferrer" className="icon-btn" aria-label="View receipt"><Paperclip size={16} /></a>}
                      {r.editable && can('finance.manage') && (
                        <button type="button" className="icon-btn" onClick={() => remove(r)} aria-label="Delete"><Trash2 size={16} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adding && categories && <EntryModal type={adding} categories={categories} onClose={() => setAdding(null)} onSaved={reload} />}
    </>
  );
}

export default function Finance() {
  const [params, setParams] = useSearchParams();
  const [month, setMonth] = useState(todayString().slice(0, 7));
  const tab = params.get('tab') === 'entries' ? 'entries' : 'overview';

  return (
    <>
      <PageHeader
        title="Finance"
        subtitle="Money in, money out and what’s left — month by month."
        actions={
          <input type="month" className="field__input finance__month" value={month} max={todayString().slice(0, 7)} onChange={(e) => setMonth(e.target.value)} aria-label="Month" />
        }
      />
      <Tabs
        tabs={[{ id: 'overview', label: 'Overview' }, { id: 'entries', label: 'Income & expenses' }]}
        active={tab}
        onChange={(id) => setParams({ tab: id })}
      />
      {tab === 'overview' ? <Overview month={month} /> : <Entries month={month} />}
    </>
  );
}
