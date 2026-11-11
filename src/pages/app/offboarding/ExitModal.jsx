import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { todayString } from '../../../utils/format.js';

// Employee profile → Exit. Three ways someone can leave:
//   termination → a short checklist they finish within 24 hours, then their access ends
//   resignation → HR records a resignation they received; notice period, then they leave
//   now         → straight away, no checklist (the original exit)
// The first two need HR (onboarding.manage) and the HR feature; otherwise only "now" shows.
export default function ExitModal({ employee, onClose, onExitedNow }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { can, subscription } = useAuth();
  const withChecklist = Boolean(can('onboarding.manage')) && subscription?.features.includes('hr');
  const { data: templates } = useApi(withChecklist ? '/api/onboarding/templates?kind=offboarding' : null);
  const { data: settings } = useApi(withChecklist ? '/api/offboarding/settings' : null);
  const [type, setType] = useState(withChecklist ? 'termination' : 'now');
  const [templateId, setTemplateId] = useState('');
  const [lastDay, setLastDay] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const first = employee.first_name;

  // Suggest the checklist that fits the type of exit, and the usual last day
  useEffect(() => {
    if (!templates) return;
    const match = templates.find((t) => t.suits === type) || templates.find((t) => t.suits === 'everyone') || templates[0];
    setTemplateId(match?.id || '');
  }, [templates, type]);
  useEffect(() => {
    if (!settings) return;
    const d = new Date();
    d.setDate(d.getDate() + settings.noticeDays);
    setLastDay(todayString(d));
  }, [settings]);

  const submit = async () => {
    setBusy(true);
    try {
      if (type === 'now') {
        await api(`/api/employees/${employee.id}/exit`, { method: 'POST', body: {} });
        toast.success(`${first} has left`);
        onExitedNow();
        return;
      }
      const o = await api('/api/offboarding', {
        method: 'POST',
        body: { employeeId: employee.id, exitType: type, reason, lastDay: type === 'resignation' ? lastDay : undefined, templateId: templateId || null },
      });
      toast.success(type === 'termination' ? `${first} has their 24-hour checklist` : 'Resignation recorded');
      navigate(`/offboarding/${o.id}`);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  const options = [
    withChecklist && ['termination', 'Exit with a 24-hour checklist', `${first} gets a short list (return items, hand over work) to finish within 24 hours. Then their access ends.`],
    withChecklist && ['resignation', 'Record their resignation', `They gave notice on paper or by email. ${first} works their notice period with an offboarding checklist.`],
    ['now', 'Exit immediately', 'No checklist — their log-in stops right now.'],
  ].filter(Boolean);

  return (
    <Modal
      title={`Exit ${employee.first_name} ${employee.last_name}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--danger" disabled={busy || (type === 'resignation' && !lastDay)} onClick={submit}>
            {busy ? 'Working…' : type === 'now' ? 'Exit now' : type === 'termination' ? 'Send the checklist' : 'Record resignation'}
          </button>
        </>
      }
    >
      <div className="form form--flush">
        <div className="off-choices" role="radiogroup" aria-label="How are they leaving?">
          {options.map(([value, label, text]) => (
            <label key={value} className={`off-choice${type === value ? ' is-on' : ''}`}>
              <input type="radio" name="exitType" value={value} checked={type === value} onChange={() => setType(value)} />
              <span><strong>{label}</strong><small>{text}</small></span>
            </label>
          ))}
        </div>

        {type !== 'now' && (
          <>
            <div className="form__row">
              <Field label="Checklist" name="templateId" hint={templateId ? undefined : 'You can send one later'}>
                <select id="templateId" className="field__input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  <option value="">No checklist yet</option>
                  {(templates || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
              {type === 'resignation' && (
                <Field label="Last day" name="lastDay" hint={settings ? `Notice period: ${settings.noticeDays} days` : undefined}>
                  <input id="lastDay" type="date" className="field__input" min={todayString()} value={lastDay} onChange={(e) => setLastDay(e.target.value)} />
                </Field>
              )}
            </div>
            <Field label={type === 'termination' ? 'Reason (only HR sees this)' : 'Note (only HR sees this)'} name="reason" optional>
              <textarea id="reason" rows={3} className="field__input" value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} />
            </Field>
          </>
        )}
        {type === 'now' && <p className="muted">Their records (attendance, leave, documents, pay) are kept. They won’t be able to log in and won’t appear in daily attendance.</p>}
      </div>
    </Modal>
  );
}
