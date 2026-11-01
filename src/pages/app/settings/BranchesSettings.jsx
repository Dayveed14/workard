import { useState } from 'react';
import { AlertCircle, Crosshair, MapPin, Pencil, Plus, Trash2, Wifi } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import Badge from '../../../components/Badge.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { CLOCK_IN_POLICIES, shortTime } from '../../../utils/format.js';

const EMPTY = {
  name: '', address: '', latitude: '', longitude: '', radiusM: 150, officeIps: '',
  clockInPolicy: 'either', workStart: '08:00', workEnd: '17:00', graceMinutes: 15,
};

function BranchModal({ branch, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(
    branch
      ? {
          name: branch.name, address: branch.address || '', latitude: branch.latitude ?? '', longitude: branch.longitude ?? '',
          radiusM: branch.radius_m, officeIps: branch.office_ips || '', clockInPolicy: branch.clock_in_policy,
          workStart: shortTime(branch.work_start), workEnd: shortTime(branch.work_end), graceMinutes: branch.grace_minutes,
        }
      : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Fill the coordinates from this device (best done while standing in the office)
  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error('This browser cannot share location');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude.toFixed(7), longitude: pos.coords.longitude.toFixed(7) }));
        toast.success(`Location captured (accuracy about ${Math.round(pos.coords.accuracy)} m)`);
      },
      () => toast.error('Location permission was denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Add the public IP of the network this device is on (do this from the office Wi-Fi)
  const addMyIp = async () => {
    try {
      const { ip } = await api('/api/organization/my-ip');
      const list = form.officeIps.split(/[,\s]+/).filter(Boolean);
      if (!list.includes(ip)) setForm((f) => ({ ...f, officeIps: [...list, ip].join(', ') }));
      toast.success(`Added ${ip}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const save = async () => {
    setBusy(true);
    setFormError('');
    try {
      await api(branch ? `/api/organization/branches/${branch.id}` : '/api/organization/branches', {
        method: branch ? 'PUT' : 'POST',
        body: form,
      });
      toast.success(branch ? 'Branch updated' : 'Branch added');
      onSaved();
      onClose();
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={branch ? `Edit ${branch.name}` : 'Add branch'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save branch'}</button>
        </>
      }
    >
      <div className="form form--flush">
        {formError && <div className="form__alert"><AlertCircle size={18} /> {formError}</div>}
        <div className="form__row">
          <Field label="Branch name" name="name" error={errors.name}>
            <input id="name" name="name" className="field__input" placeholder="e.g. Wuse 2 Office" value={form.name} onChange={onChange} />
          </Field>
          <Field label="Address" name="address" optional>
            <input id="address" name="address" className="field__input" value={form.address} onChange={onChange} />
          </Field>
        </div>

        <p className="form__section">Working hours</p>
        <div className="form__row form__row--3">
          <Field label="Start" name="workStart" error={errors.workStart}>
            <input id="workStart" name="workStart" type="time" className="field__input" value={form.workStart} onChange={onChange} />
          </Field>
          <Field label="End" name="workEnd" error={errors.workEnd}>
            <input id="workEnd" name="workEnd" type="time" className="field__input" value={form.workEnd} onChange={onChange} />
          </Field>
          <Field label="Late after (minutes)" name="graceMinutes" error={errors.graceMinutes}>
            <input id="graceMinutes" name="graceMinutes" type="number" min="0" className="field__input" value={form.graceMinutes} onChange={onChange} />
          </Field>
        </div>

        <p className="form__section">Clock-in verification</p>
        <Field label="Rule" name="clockInPolicy" hint="Clock-ins that fail are still recorded, but flagged for a manager to review.">
          <select id="clockInPolicy" name="clockInPolicy" className="field__input" value={form.clockInPolicy} onChange={onChange}>
            {Object.entries(CLOCK_IN_POLICIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>

        <div className="form__row form__row--3">
          <Field label="Latitude" name="latitude" error={errors.latitude} optional>
            <input id="latitude" name="latitude" className="field__input" inputMode="decimal" placeholder="9.0765" value={form.latitude} onChange={onChange} />
          </Field>
          <Field label="Longitude" name="longitude" error={errors.longitude} optional>
            <input id="longitude" name="longitude" className="field__input" inputMode="decimal" placeholder="7.4986" value={form.longitude} onChange={onChange} />
          </Field>
          <Field label="Allowed radius (m)" name="radiusM" error={errors.radiusM}>
            <input id="radiusM" name="radiusM" type="number" min="20" max="5000" className="field__input" value={form.radiusM} onChange={onChange} />
          </Field>
        </div>
        <div className="settings__helper">
          <button type="button" className="btn btn--outline btn--sm" onClick={useMyLocation}>
            <Crosshair size={16} /> Use my current location
          </button>
          <span className="muted">Best done while you’re in the office.</span>
        </div>

        <Field
          label="Office internet IP address(es)"
          name="officeIps"
          optional
          error={errors.officeIps}
          hint="Separate with commas. If your ISP changes your IP, update it here or get a static IP."
        >
          <input id="officeIps" name="officeIps" className="field__input" placeholder="e.g. 102.89.33.10" value={form.officeIps} onChange={onChange} />
        </Field>
        <div className="settings__helper">
          <button type="button" className="btn btn--outline btn--sm" onClick={addMyIp}>
            <Wifi size={16} /> Add the network I’m on now
          </button>
          <span className="muted">Do this while connected to the office Wi-Fi.</span>
        </div>
      </div>
    </Modal>
  );
}

export default function BranchesSettings() {
  const toast = useToast();
  const { data, reload } = useApi('/api/organization/structure');
  const [editing, setEditing] = useState(null); // null | 'new' | branch

  const remove = async (b) => {
    if (!window.confirm(`Delete ${b.name}?`)) return;
    try {
      await api(`/api/organization/branches/${b.id}`, { method: 'DELETE' });
      toast.success('Branch deleted');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="toolbar">
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
          <Plus size={18} /> Add branch
        </button>
      </div>

      <div className="branch-cards">
        {data?.branches.map((b) => (
          <article key={b.id} className="card branch-card">
            <header>
              <div>
                <h3>{b.name}</h3>
                <span className="muted">{b.employee_count} employee(s)</span>
              </div>
              <div className="row-actions">
                <button type="button" className="icon-btn" onClick={() => setEditing(b)} aria-label="Edit"><Pencil size={16} /></button>
                <button type="button" className="icon-btn" onClick={() => remove(b)} aria-label="Delete"><Trash2 size={16} /></button>
              </div>
            </header>
            <dl>
              <dt>Hours</dt>
              <dd>{shortTime(b.work_start)} – {shortTime(b.work_end)} (late after {b.grace_minutes} min)</dd>
              <dt>Clock-in</dt>
              <dd><Badge tone={b.clock_in_policy === 'none' ? 'gray' : 'blue'}>{CLOCK_IN_POLICIES[b.clock_in_policy]}</Badge></dd>
              <dt><MapPin size={14} /></dt>
              <dd>{b.latitude !== null ? `${Number(b.latitude).toFixed(4)}, ${Number(b.longitude).toFixed(4)} · ${b.radius_m} m` : <span className="muted">Not set</span>}</dd>
              <dt><Wifi size={14} /></dt>
              <dd>{b.office_ips || <span className="muted">Not set</span>}</dd>
            </dl>
          </article>
        ))}
      </div>

      {editing && <BranchModal branch={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </>
  );
}
