import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Download,
  FileText,
  Pencil,
  RefreshCw,
  Send,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import Badge from '../../../components/Badge.jsx';
import Tabs from '../../../components/Tabs.jsx';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import StatCard from '../../../components/StatCard.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { PAYROLL_STATUS_LABELS, downloadCsv, formatDateTime, formatMoney, monthLabel, todayString } from '../../../utils/format.js';
import './PayrollRun.css';

const STEPS = [
  { id: 'draft', label: 'Prepared' },
  { id: 'approved', label: 'Approved' },
  { id: 'paid', label: 'Paid' },
];

function Stepper({ run }) {
  const order = { draft: 0, approved: 1, processing: 1.5, paid: 2 };
  const at = order[run.status] ?? -1;
  return (
    <ol className="run-steps">
      {STEPS.map((s, i) => (
        <li key={s.id} className={i <= at ? 'is-done' : i - 0.5 === at ? 'is-active' : ''}>
          <span>{i < at || (i === at && s.id !== 'draft') || (s.id === 'draft' && at >= 0) ? <CheckCircle2 size={16} /> : i + 1}</span>
          <div>
            <strong>{s.label}</strong>
            <small>
              {s.id === 'draft' && run.prepared_by_name}
              {s.id === 'approved' && (run.approved_by_name ? `${run.approved_by_name} · ${formatDateTime(run.approved_at)}` : 'Waiting')}
              {s.id === 'paid' && (run.paid_at ? formatDateTime(run.paid_at) : run.status === 'processing' ? 'In progress' : 'Not yet')}
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}

function AdjustModal({ item, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ bonus: item.bonus_kobo / 100 || '', oneOffDeduction: item.one_off_deduction_kobo / 100 || '' });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      onSaved(await api(`/api/payroll/items/${item.id}`, { method: 'PATCH', body: { bonus: form.bonus || 0, oneOffDeduction: form.oneOffDeduction || 0 } }));
      toast.success('Payslip updated');
      onClose();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };
  return (
    <Modal
      title={`${item.first_name} ${item.last_name} — this month only`}
      size="sm"
      onClose={onClose}
      footer={<><button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button><button type="button" className="btn btn--primary" onClick={save} disabled={busy}>Save</button></>}
    >
      <div className="form form--flush">
        <Field label="Bonus (₦)" name="bonus" hint="Taxed like normal pay">
          <input id="bonus" type="number" min="0" step="0.01" className="field__input" value={form.bonus} onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))} />
        </Field>
        <Field label="One-off deduction (₦)" name="oneOffDeduction" hint="e.g. salary advance repayment">
          <input id="oneOffDeduction" type="number" min="0" step="0.01" className="field__input" value={form.oneOffDeduction} onChange={(e) => setForm((f) => ({ ...f, oneOffDeduction: e.target.value }))} />
        </Field>
      </div>
    </Modal>
  );
}

function MarkPaidModal({ run, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ paidOn: todayString(), method: 'bank_upload' });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      onSaved(await api(`/api/payroll/${run.id}/mark-paid`, { method: 'POST', body: form }));
      toast.success('Payroll marked as paid — salaries added to expenses');
      onClose();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Mark as paid"
      size="sm"
      onClose={onClose}
      footer={<><button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button><button type="button" className="btn btn--success" onClick={save} disabled={busy}>Mark as paid</button></>}
    >
      <div className="form form--flush">
        <p className="muted">Use this when you paid outside Workard — e.g. uploaded the bank schedule to your bank’s bulk-payment portal.</p>
        <div className="form__row">
          <Field label="Date paid" name="paidOn">
            <input id="paidOn" type="date" max={todayString()} className="field__input" value={form.paidOn} onChange={(e) => setForm((f) => ({ ...f, paidOn: e.target.value }))} />
          </Field>
          <Field label="How" name="method">
            <select id="method" className="field__input" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
              <option value="bank_upload">Bank bulk upload</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function Remittances({ runId, period }) {
  const { data } = useApi(`/api/payroll/${runId}/remittances`);
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  const pensionTotal = data.pension.reduce((s, p) => s + p.employeeKobo + p.employerKobo, 0);

  const exportPaye = () =>
    downloadCsv(`paye-${period}.csv`, ['Employee', 'Tax ID', 'Gross pay (NGN)', 'PAYE (NGN)'], data.paye.map((p) => [p.name, p.taxId, p.grossKobo / 100, p.payeKobo / 100]));
  const exportPension = () =>
    downloadCsv(
      `pension-${period}.csv`,
      ['PFA', 'Employee', 'Pension PIN', 'Total contribution (NGN)'],
      data.pension.flatMap((p) => p.staff.map((s) => [p.pfa, s.name, s.pin, s.totalKobo / 100]))
    );

  return (
    <div className="run-remit">
      <section className="card">
        <header className="card__header">
          <h2>PAYE to the state tax office</h2>
          <button type="button" className="link-btn" onClick={exportPaye}><Download size={14} /> CSV</button>
        </header>
        <div className="card__body">
          <div className="run-remit__total">{formatMoney(data.payeKobo)}</div>
          <p className="muted run-remit__note">Usually due by the 10th of the next month. Check with your state Internal Revenue Service.</p>
        </div>
      </section>
      <section className="card">
        <header className="card__header">
          <h2>Pension to fund administrators</h2>
          <button type="button" className="link-btn" onClick={exportPension}><Download size={14} /> CSV</button>
        </header>
        <div className="card__body">
          <div className="run-remit__total">{formatMoney(pensionTotal)}</div>
          <ul className="run-remit__list">
            {data.pension.map((p) => (
              <li key={p.pfa}>
                <span>{p.pfa} <small>({p.staff.length} staff)</small></span>
                <strong>{formatMoney(p.employeeKobo + p.employerKobo)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {data.nhfKobo > 0 && (
        <section className="card">
          <header className="card__header"><h2>National Housing Fund</h2></header>
          <div className="card__body run-remit__total">{formatMoney(data.nhfKobo)}</div>
        </section>
      )}
    </div>
  );
}

export default function PayrollRun() {
  const { id } = useParams();
  const toast = useToast();
  const { can } = useAuth();
  const { data: run, loading, error, setData, reload } = useApi(`/api/payroll/${id}`);
  const [tab, setTab] = useState('payslips');
  const [modal, setModal] = useState(null); // { type: 'adjust', item } | { type: 'paid' } | { type: 'paystack' }
  const [busy, setBusy] = useState('');

  if (loading) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (error) return <EmptyState title="Payroll not available" text={error} action={<Link to="/payroll" className="btn btn--outline">Back to payroll</Link>} />;

  const act = async (key, path, message) => {
    setBusy(key);
    try {
      setData(await api(`/api/payroll/${id}/${path}`, { method: 'POST' }));
      toast.success(message);
    } catch (err) {
      toast.error(err.message);
      reload();
    } finally {
      setBusy('');
    }
  };

  const downloadBankSchedule = async () => {
    try {
      const s = await api(`/api/payroll/${id}/bank-schedule`);
      downloadCsv(
        `salaries-${s.period}.csv`,
        ['Beneficiary name', 'Account number', 'Bank', 'Bank code', 'Amount (NGN)', 'Narration'],
        s.rows.map((r) => [r.accountName || r.name, r.accountNumber, r.bankName, r.bankCode, (r.amountKobo / 100).toFixed(2), r.narration])
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isDraft = run.status === 'draft';
  const canPay = can('payroll.approve') && ['approved', 'processing'].includes(run.status);
  const deductions = Number(run.paye_kobo) + Number(run.pension_employee_kobo) + Number(run.nhf_kobo) + Number(run.other_deductions_kobo);
  const missingBank = run.items.filter((i) => !i.account_number);

  return (
    <div className="run">
      <div className="run__bar">
        <Link to="/payroll" className="link-btn"><ArrowLeft size={16} /> Payroll</Link>
      </div>

      <header className="run__head">
        <div>
          <h1>Payroll — {monthLabel(run.period)}</h1>
          <Badge status={run.status}>{PAYROLL_STATUS_LABELS[run.status]}</Badge>
        </div>
        <div className="run__actions">
          {isDraft && can('payroll.manage') && (
            <button type="button" className="btn btn--outline btn--sm" onClick={() => act('recalc', 'recalculate', 'Recalculated with the latest salaries and leave')} disabled={!!busy}>
              <RefreshCw size={16} /> Recalculate
            </button>
          )}
          {isDraft && run.canApprove && (
            <button type="button" className="btn btn--primary btn--sm" onClick={() => window.confirm(`Approve ${monthLabel(run.period)} payroll? Net pay ${formatMoney(run.net_kobo)} for ${run.employee_count} staff.`) && act('approve', 'approve', 'Payroll approved')} disabled={!!busy}>
              <ShieldCheck size={16} /> Approve
            </button>
          )}
          {canPay && (
            <button type="button" className="btn btn--outline btn--sm" onClick={downloadBankSchedule}>
              <Download size={16} /> Bank schedule
            </button>
          )}
          {canPay && run.settings.paystackConnected && (
            <button type="button" className="btn btn--success btn--sm" onClick={() => setModal({ type: 'paystack' })} disabled={!!busy || Number(run.processing_count) > 0 && Number(run.failed_count) === 0}>
              <Send size={16} /> {Number(run.failed_count) > 0 ? 'Retry failed with Paystack' : 'Pay with Paystack'}
            </button>
          )}
          {canPay && Number(run.processing_count) === 0 && (
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setModal({ type: 'paid' })}>
              <Wallet size={16} /> Mark as paid
            </button>
          )}
          {['draft', 'approved'].includes(run.status) && can('payroll.manage') && (
            <button type="button" className="btn btn--ghost btn--sm run__cancel" onClick={() => window.confirm('Cancel this payroll? You can prepare the month again afterwards.') && act('cancel', 'cancel', 'Payroll cancelled')}>
              <Ban size={16} /> Cancel
            </button>
          )}
        </div>
      </header>

      <Stepper run={run} />

      {isDraft && !run.canApprove && can('payroll.approve') && (
        <div className="run__notice"><ShieldCheck size={18} /> You prepared this payroll, so someone else with approval rights must approve it.</div>
      )}
      {isDraft && !can('payroll.approve') && (
        <div className="run__notice"><ShieldCheck size={18} /> Ready for approval by someone with payroll approval rights (e.g. the Finance Officer or Owner).</div>
      )}
      {run.status === 'processing' && (
        <div className="run__notice run__notice--blue">
          <RefreshCw size={18} />
          <span>
            Paystack is sending salaries: {run.paid_count} paid, {run.processing_count} in progress
            {Number(run.failed_count) > 0 && <strong>, {run.failed_count} failed — check the reasons below and retry</strong>}.
          </span>
          <button type="button" className="link-btn" onClick={reload}>Refresh</button>
        </div>
      )}
      {run.status === 'paid' && (
        <div className="run__notice run__notice--green">
          <CheckCircle2 size={18} />
          <span>
            Paid. Salaries ({formatMoney(run.gross_kobo)}) and employer pension ({formatMoney(run.pension_employer_kobo)}) were added
            to <Link to="/finance?tab=entries">expenses</Link>, and staff were emailed their payslips.
          </span>
        </div>
      )}
      {isDraft && run.missingPay.length > 0 && (
        <div className="run__notice run__notice--amber">
          <AlertTriangle size={18} />
          <span>Not included (no salary set): {run.missingPay.map((m) => `${m.first_name} ${m.last_name}`).join(', ')}</span>
        </div>
      )}

      <div className="run__stats">
        <StatCard icon={FileText} tone="blue" label="Gross pay" value={formatMoney(run.gross_kobo)} hint={`${run.employee_count} staff`} />
        <StatCard icon={FileText} tone="amber" label="Deductions" value={formatMoney(deductions)} hint={`PAYE ${formatMoney(run.paye_kobo)}`} />
        <StatCard icon={Wallet} tone="green" label="Net pay (to staff)" value={formatMoney(run.net_kobo)} />
        <StatCard icon={Wallet} tone="gray" label="Total cost to company" value={formatMoney(Number(run.gross_kobo) + Number(run.pension_employer_kobo))} hint={`incl. ${formatMoney(run.pension_employer_kobo)} employer pension`} />
      </div>

      <Tabs tabs={[{ id: 'payslips', label: 'Payslips' }, { id: 'remittances', label: 'Tax & pension to remit' }]} active={tab} onChange={setTab} />

      {tab === 'payslips' && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>Employee</th><th>Gross</th><th>PAYE</th><th>Pension</th><th>Other</th><th>Net pay</th><th>{isDraft ? '' : 'Payment'}</th></tr>
            </thead>
            <tbody>
              {run.items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="person">
                      <span>
                        <Link to={`/employees/${i.employee_id}?tab=pay`}><strong>{i.first_name} {i.last_name}</strong></Link>
                        <span>
                          {i.job_title || '—'}
                          {i.days_payable < i.days_in_period && ` · ${i.days_payable}/${i.days_in_period} days`}
                          {Number(i.bonus_kobo) > 0 && ` · bonus ${formatMoney(i.bonus_kobo)}`}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>{formatMoney(i.gross_kobo)}</td>
                  <td>{formatMoney(i.paye_kobo)}</td>
                  <td>{formatMoney(i.pension_employee_kobo)}</td>
                  <td>{formatMoney(Number(i.nhf_kobo) + Number(i.other_deductions_kobo) + Number(i.one_off_deduction_kobo))}</td>
                  <td><strong>{formatMoney(i.net_kobo)}</strong></td>
                  <td>
                    <div className="row-actions run__row-actions">
                      {isDraft && can('payroll.manage') && (
                        <button type="button" className="icon-btn" onClick={() => setModal({ type: 'adjust', item: i })} aria-label="Bonus or deduction"><Pencil size={16} /></button>
                      )}
                      {!isDraft && (
                        <>
                          <Badge status={i.payment_status} />
                          {i.failure_reason && <small className="run__fail" title={i.failure_reason}>{i.failure_reason}</small>}
                        </>
                      )}
                      {!isDraft && <Link to={`/payslips/${i.id}`} className="icon-btn" aria-label="View payslip"><FileText size={16} /></Link>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'remittances' && <Remittances runId={run.id} period={run.period} />}

      {modal?.type === 'adjust' && <AdjustModal item={modal.item} onClose={() => setModal(null)} onSaved={setData} />}
      {modal?.type === 'paid' && <MarkPaidModal run={run} onClose={() => setModal(null)} onSaved={setData} />}
      {modal?.type === 'paystack' && (
        <Modal
          title="Pay with Paystack"
          size="sm"
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn btn--success" disabled={!!busy} onClick={async () => { await act('paystack', 'pay-paystack', 'Sent to Paystack'); setModal(null); }}>
                Send {formatMoney(run.items.filter((i) => ['pending', 'failed'].includes(i.payment_status)).reduce((s, i) => s + Number(i.net_kobo), 0))}
              </button>
            </>
          }
        >
          <p className="run__modal-text">
            Workard will ask Paystack to send each person’s net pay from your Paystack balance (key ending <strong>{run.settings.paystackKeyLast4}</strong>) to the bank account saved when this payroll was approved.
          </p>
          <ul className="run__modal-list">
            <li>Make sure your Paystack balance can cover it.</li>
            <li>Each payslip has its own reference, so retrying never pays anyone twice.</li>
            <li>Paystack confirms each transfer a little later — this page updates as they arrive.</li>
          </ul>
          {missingBank.length > 0 && (
            <p className="form__alert"><AlertTriangle size={16} /> {missingBank.length} person(s) have no bank account — Paystack can’t pay them.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
