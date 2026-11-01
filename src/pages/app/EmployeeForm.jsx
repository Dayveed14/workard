import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import Field from '../../components/Field.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EMPLOYMENT_TYPES, todayString } from '../../utils/format.js';
import './EmployeeForm.css';

const EMPTY = {
  staffId: '', firstName: '', lastName: '', email: '', phone: '', gender: '', dateOfBirth: '', address: '',
  jobTitle: '', employmentType: 'full_time', branchId: '', departmentId: '', teamId: '', managerId: '',
  startDate: todayString(), emergencyContactName: '', emergencyContactPhone: '',
  sendInvite: true, roleId: '',
};

// Database row (snake_case) → form values (camelCase)
function fromEmployee(e) {
  return {
    ...EMPTY,
    staffId: e.staff_id || '', firstName: e.first_name, lastName: e.last_name, email: e.email, phone: e.phone || '',
    gender: e.gender || '', dateOfBirth: e.date_of_birth || '', address: e.address || '', jobTitle: e.job_title || '',
    employmentType: e.employment_type, branchId: e.branch_id || '', departmentId: e.department_id || '',
    teamId: e.team_id || '', managerId: e.manager_id || '', startDate: e.start_date || '',
    emergencyContactName: e.emergency_contact_name || '', emergencyContactPhone: e.emergency_contact_phone || '',
  };
}

// /employees/new and /employees/:id/edit
export default function EmployeeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { role } = useAuth();

  const { data: structure } = useApi('/api/organization/structure');
  const { data: existing } = useApi(isEdit ? `/api/employees/${id}` : null);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) setForm(fromEmployee(existing));
  }, [existing]);

  // Default the invite role to "Employee"
  useEffect(() => {
    if (!isEdit && structure && !form.roleId) {
      const employeeRole = structure.roles.find((r) => r.name === 'Employee');
      if (employeeRole) setForm((f) => ({ ...f, roleId: employeeRole.id }));
    }
  }, [structure, isEdit, form.roleId]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (isEdit) {
        const { sendInvite, roleId, ...details } = form; // eslint-disable-line no-unused-vars
        await api(`/api/employees/${id}`, { method: 'PATCH', body: details });
        toast.success('Employee updated');
        navigate(`/employees/${id}`);
      } else {
        const res = await api('/api/employees', { method: 'POST', body: form });
        toast.success(res.inviteMessage || 'Employee added');
        navigate(`/employees/${res.employee.id}`);
      }
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const input = (name, label, props = {}, optional = false) => (
    <Field label={label} name={name} error={errors[name]} optional={optional}>
      <input id={name} name={name} className="field__input" value={form[name]} onChange={onChange} {...props} />
    </Field>
  );

  const select = (name, label, options, optional = true) => (
    <Field label={label} name={name} error={errors[name]} optional={optional}>
      <select id={name} name={name} className="field__input" value={form[name]} onChange={onChange}>
        <option value="">None</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );

  if (isEdit && !existing) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const teams = (structure?.teams || []).filter((t) => !form.departmentId || !t.department_id || String(t.department_id) === String(form.departmentId));
  const roles = (structure?.roles || []).filter((r) => !r.isOwner || role?.isOwner);

  return (
    <>
      <PageHeader title={isEdit ? `Edit ${existing.first_name} ${existing.last_name}` : 'Add employee'} />

      <form className="card employee-form" onSubmit={onSubmit} noValidate>
        <div className="card__body form form--flush">
          {formError && (
            <div className="form__alert" role="alert">
              <AlertCircle size={18} /> {formError}
            </div>
          )}

          <p className="form__section">Personal details</p>
          <div className="form__row">
            {input('firstName', 'First name')}
            {input('lastName', 'Last name')}
          </div>
          <div className="form__row">
            {input('email', 'Work email', { type: 'email' })}
            {input('phone', 'Phone', { type: 'tel' }, true)}
          </div>
          <div className="form__row--3 form__row">
            <Field label="Gender" name="gender" optional>
              <select id="gender" name="gender" className="field__input" value={form.gender} onChange={onChange}>
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Field>
            {input('dateOfBirth', 'Date of birth', { type: 'date' }, true)}
            {input('staffId', 'Staff ID', { placeholder: 'e.g. EMP-014' }, true)}
          </div>
          {input('address', 'Home address', {}, true)}

          <p className="form__section">Job</p>
          <div className="form__row">
            {input('jobTitle', 'Job title', { placeholder: 'e.g. Sales Executive' }, true)}
            <Field label="Employment type" name="employmentType">
              <select id="employmentType" name="employmentType" className="field__input" value={form.employmentType} onChange={onChange}>
                {Object.entries(EMPLOYMENT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>
          <div className="form__row form__row--3">
            {select('branchId', 'Branch', (structure?.branches || []).map((b) => ({ value: b.id, label: b.name })))}
            {select('departmentId', 'Department', (structure?.departments || []).map((d) => ({ value: d.id, label: d.name })))}
            {select('teamId', 'Team', teams.map((t) => ({ value: t.id, label: t.name })))}
          </div>
          <div className="form__row">
            {select(
              'managerId',
              'Line manager',
              (structure?.employees || [])
                .filter((e) => String(e.id) !== String(id))
                .map((e) => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))
            )}
            {input('startDate', 'Start date', { type: 'date' }, true)}
          </div>

          <p className="form__section">Emergency contact</p>
          <div className="form__row">
            {input('emergencyContactName', 'Name', {}, true)}
            {input('emergencyContactPhone', 'Phone', { type: 'tel' }, true)}
          </div>

          {!isEdit && (
            <>
              <p className="form__section">Workard login</p>
              <label className="form__check">
                <input type="checkbox" name="sendInvite" checked={form.sendInvite} onChange={onChange} />
                <span>Email an invite so they can log in, clock in and request leave</span>
              </label>
              {form.sendInvite && (
                <Field label="Role" name="roleId" error={errors.roleId} hint="Decides what they can see and do. You can change it later.">
                  <select id="roleId" name="roleId" className="field__input" value={form.roleId} onChange={onChange}>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </Field>
              )}
            </>
          )}
        </div>

        <footer className="employee-form__footer">
          <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add employee'}
          </button>
        </footer>
      </form>
    </>
  );
}
