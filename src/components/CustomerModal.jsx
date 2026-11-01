import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from './Modal.jsx';
import Field from './Field.jsx';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { CUSTOMER_STAGES } from '../utils/format.js';

// Add or edit a customer. `customer` = existing row (edit) or null (new).
export default function CustomerModal({ customer, onClose, onSaved }) {
  const toast = useToast();
  const { can, employee } = useAuth();
  const manageScope = can('customers.manage');
  // Only people beyond "own" scope can choose who handles the account
  const { data: structure } = useApi(manageScope && manageScope !== 'own' ? '/api/organization/structure' : null);

  const [form, setForm] = useState({
    type: customer?.type || 'individual',
    name: customer?.name || '',
    contactPerson: customer?.contact_person || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    stage: customer?.stage || 'lead',
    source: customer?.source || '',
    assignedEmployeeId: customer ? customer.assigned_employee_id || '' : employee?.id || '',
    notes: customer?.notes || '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const save = async () => {
    setBusy(true);
    setFormError('');
    try {
      const body = { ...form };
      if (manageScope === 'own') delete body.assignedEmployeeId; // always yourself
      const saved = await api(customer ? `/api/customers/${customer.id}` : '/api/customers', {
        method: customer ? 'PATCH' : 'POST',
        body,
      });
      toast.success(customer ? 'Customer updated' : 'Customer added');
      onSaved(saved);
      onClose();
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
      setBusy(false);
    }
  };

  const input = (name, label, props = {}, optional = true) => (
    <Field label={label} name={name} error={errors[name]} optional={optional}>
      <input id={name} name={name} className="field__input" value={form[name]} onChange={onChange} {...props} />
    </Field>
  );

  return (
    <Modal
      title={customer ? `Edit ${customer.name}` : 'Add customer'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save customer'}</button>
        </>
      }
    >
      <div className="form form--flush">
        {formError && <div className="form__alert"><AlertCircle size={18} /> {formError}</div>}

        <div className="form__row">
          <Field label="Type" name="type">
            <select id="type" name="type" className="field__input" value={form.type} onChange={onChange}>
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </Field>
          {input('name', form.type === 'business' ? 'Business name' : 'Full name', { placeholder: form.type === 'business' ? 'e.g. Zenith Foods Ltd' : 'e.g. Ngozi Obi' }, false)}
        </div>
        {form.type === 'business' && input('contactPerson', 'Contact person', { placeholder: 'Who you deal with' })}
        <div className="form__row">
          {input('email', 'Email', { type: 'email', placeholder: 'For sending invoices' })}
          {input('phone', 'Phone', { type: 'tel', placeholder: 'For calls & WhatsApp' })}
        </div>
        {input('address', 'Address')}

        <div className="form__row form__row--3">
          <Field label="Stage" name="stage">
            <select id="stage" name="stage" className="field__input" value={form.stage} onChange={onChange}>
              {Object.entries(CUSTOMER_STAGES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          {input('source', 'Source', { placeholder: 'e.g. Referral, Instagram' })}
          {manageScope && manageScope !== 'own' ? (
            <Field label="Handled by" name="assignedEmployeeId" error={errors.assignedEmployeeId} optional={manageScope === 'all'}>
              <select id="assignedEmployeeId" name="assignedEmployeeId" className="field__input" value={form.assignedEmployeeId} onChange={onChange}>
                {manageScope === 'all' && <option value="">Unassigned</option>}
                {(structure?.employees || []).map((e) => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Handled by" name="assignedEmployeeId">
              <input className="field__input" value="You" disabled />
            </Field>
          )}
        </div>

        <Field label="Notes" name="notes" optional>
          <textarea id="notes" name="notes" className="field__input" value={form.notes} onChange={onChange} />
        </Field>
      </div>
    </Modal>
  );
}
