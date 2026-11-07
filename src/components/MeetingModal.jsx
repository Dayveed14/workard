import { useState } from 'react';
import Modal from './Modal.jsx';
import Field from './Field.jsx';
import PeoplePicker from './PeoplePicker.jsx';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { todayString } from '../utils/format.js';
import { DAY_NAMES, WEEK_ORDER, nextDates } from '../utils/repeat.js';
import './MeetingModal.css';

const groupValue = (g) => `${g.type}:${g.id ?? ''}`;
export const REPEAT_LABELS = {
  none: 'Doesn’t repeat',
  daily: 'Daily',
  weekdays: 'Every weekday (Mon–Fri)',
  weekly: 'Weekly, on days I pick',
  monthly: 'Monthly',
};
const UNIT = { daily: 'day', weekly: 'week', monthly: 'month' };
const weekdayOf = (date) => new Date(`${date}T12:00:00Z`).getUTCDay();
// "Wed 11 Nov"
const shortDay = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const ordinal = (n) => `${n}${[11, 12, 13].includes(n % 100) ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;

// Schedule (or edit) a meeting. `preset` pre-fills it, e.g. a project's stand-up:
//   { title, group: 'team:4', projectId, isStandup: true, repeat: 'weekdays', time: '09:00' }
export default function MeetingModal({ meeting, preset = {}, onSaved, onClose }) {
  const toast = useToast();
  const { employee } = useAuth();
  const { data: groups } = useApi('/api/meetings/groups');
  const { data: people } = useApi('/api/meetings/people');
  const isEdit = Boolean(meeting);
  const [form, setForm] = useState({
    title: meeting?.title || preset.title || '',
    description: meeting?.description || '',
    group: meeting ? `${meeting.audience_type}:${meeting.audience_id ?? ''}` : preset.group || 'people:',
    date: meeting ? String(meeting.starts_at).slice(0, 10) : preset.date || todayString(),
    time: meeting ? String(meeting.starts_at).slice(11, 16) : preset.time || '09:00',
    durationMinutes: meeting?.duration_minutes || preset.durationMinutes || 30,
    repeat: meeting?.repeat_rule || preset.repeat || 'none',
    repeatEvery: meeting?.repeat_every || 1,
    repeatUntil: meeting?.repeat_until ? String(meeting.repeat_until).slice(0, 10) : '',
    isStandup: meeting ? Boolean(meeting.is_standup) : Boolean(preset.isStandup),
    projectId: meeting?.project_id || preset.projectId || '',
  });
  // Weekly: the chosen days, each with its own time (same time for all unless "different times" is on)
  const savedDays = meeting?.repeat_days?.length ? meeting.repeat_days : null;
  const [days, setDays] = useState(savedDays || [{ day: weekdayOf(meeting ? String(meeting.starts_at).slice(0, 10) : preset.date || todayString()), time: meeting ? String(meeting.starts_at).slice(11, 16) : preset.time || '09:00' }]);
  const [ownTimes, setOwnTimes] = useState(Boolean(savedDays && savedDays.some((d) => d.time !== savedDays[0].time)));
  const [invitees, setInvitees] = useState(meeting?.invitedIds?.filter((id) => id !== employee?.id) || preset.inviteeIds || []);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const [audienceType, audienceId] = form.group.split(':');

  const toggleDay = (day) =>
    setDays((list) => (list.some((d) => d.day === day) ? list.filter((d) => d.day !== day) : [...list, { day, time: form.time }]));
  const setDayTime = (day, time) => setDays((list) => list.map((d) => (d.day === day ? { ...d, time } : d)));
  // Without "different times", every day uses the main time
  const weekDays = (ownTimes ? days : days.map((d) => ({ ...d, time: form.time }))).sort((a, b) => WEEK_ORDER.indexOf(a.day) - WEEK_ORDER.indexOf(b.day));
  const preview = nextDates({ date: form.date, time: form.time, repeat: form.repeat, every: form.repeatEvery, days: weekDays, until: form.repeatUntil }, 4);

  const save = async () => {
    setBusy(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time,
        durationMinutes: Number(form.durationMinutes),
        repeat: form.repeat,
        repeatEvery: ['daily', 'weekly', 'monthly'].includes(form.repeat) ? Number(form.repeatEvery) : 1,
        repeatDays: form.repeat === 'weekly' ? weekDays : [],
        repeatUntil: form.repeat === 'none' ? '' : form.repeatUntil,
        isStandup: form.isStandup,
        inviteeIds: invitees,
      };
      const saved = isEdit
        ? await api(`/api/meetings/${meeting.id}`, { method: 'PATCH', body })
        : await api('/api/meetings', { method: 'POST', body: { ...body, audienceType, audienceId: audienceId ? Number(audienceId) : null, projectId: form.projectId } });
      toast.success(isEdit ? 'Meeting updated' : 'Meeting scheduled — everyone’s been invited');
      onSaved(saved);
    } catch (err) {
      setErrors(err.errors || { title: err.message });
      setBusy(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit meeting' : 'Schedule a meeting'} onClose={onClose} footer={
      <>
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn--primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : isEdit ? 'Save' : 'Schedule & invite'}</button>
      </>
    }>
      <div className="form form--flush">
        <Field label="Meeting" name="title" error={errors.title}>
          <input id="title" className="field__input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Sales stand-up" autoFocus />
        </Field>

        {!isEdit && (
          <Field label="Who’s it for" name="group" error={errors.audience || errors.audienceId}>
            <select id="group" className="field__input" value={form.group} onChange={(e) => set('group', e.target.value)}>
              <option value="people:">People I choose</option>
              {(groups || []).map((g) => <option key={groupValue(g)} value={groupValue(g)}>{g.label}</option>)}
            </select>
          </Field>
        )}
        <Field
          label={audienceType === 'people' ? 'Invite' : 'Also invite'}
          name="inviteeIds"
          error={errors.inviteeIds}
          optional={audienceType !== 'people'}
          hint={audienceType === 'people' ? 'You’re always in your own meetings.' : 'Everyone in the group is invited. Add anyone else here.'}
        >
          {people ? <PeoplePicker people={people.filter((p) => p.id !== employee?.id)} value={invitees} onChange={setInvitees} /> : <div className="field__input">Loading…</div>}
        </Field>

        <div className="form__row form__row--3">
          <Field label={form.repeat === 'none' ? 'Date' : 'Starts'} name="date" error={errors.date}>
            <input id="date" type="date" className="field__input" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Time" name="time" error={errors.time}>
            <input id="time" type="time" className="field__input" value={form.time} onChange={(e) => set('time', e.target.value)} />
          </Field>
          <Field label="Length" name="durationMinutes">
            <select id="durationMinutes" className="field__input" value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)}>
              {[15, 30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} h`}</option>)}
            </select>
          </Field>
        </div>

        <div className="repeat-box">
          <div className="form__row">
            <Field label="Repeat" name="repeat">
              <select id="repeat" className="field__input" value={form.repeat} onChange={(e) => set('repeat', e.target.value)}>
                {Object.entries(REPEAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            {UNIT[form.repeat] && (
              <Field label="Every" name="repeatEvery" error={errors.repeatEvery}>
                <select id="repeatEvery" className="field__input" value={form.repeatEvery} onChange={(e) => set('repeatEvery', Number(e.target.value))}>
                  {Array.from({ length: form.repeat === 'monthly' ? 12 : form.repeat === 'weekly' ? 4 : 7 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n === 1 ? UNIT[form.repeat] : `${n} ${UNIT[form.repeat]}s`}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {form.repeat === 'weekly' && (
            <Field label="On" name="repeatDays" error={errors.repeatDays}>
              <div className="repeat-days" role="group" aria-label="Days">
                {WEEK_ORDER.map((day) => {
                  const on = days.some((d) => d.day === day);
                  return (
                    <button key={day} type="button" className={on ? 'is-on' : ''} aria-pressed={on} onClick={() => toggleDay(day)} title={DAY_NAMES[day]}>
                      {DAY_NAMES[day].slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              {days.length > 1 && (
                <label className="form__check repeat-own">
                  <input type="checkbox" checked={ownTimes} onChange={(e) => setOwnTimes(e.target.checked)} />
                  A different time on each day
                </label>
              )}
              {ownTimes && days.length > 1 && (
                <div className="repeat-times">
                  {weekDays.map((d) => (
                    <label key={d.day}>
                      <span>{DAY_NAMES[d.day]}</span>
                      <input type="time" className="field__input" value={days.find((x) => x.day === d.day)?.time || form.time} onChange={(e) => setDayTime(d.day, e.target.value)} />
                    </label>
                  ))}
                </div>
              )}
            </Field>
          )}

          {form.repeat === 'monthly' && form.date && (
            <p className="muted repeat-note">
              On the {ordinal(Number(form.date.slice(8, 10)))} of the month{Number(form.date.slice(8, 10)) > 28 && ' (or the last day, in shorter months)'} — change “Starts” to pick another day.
            </p>
          )}

          {form.repeat !== 'none' && (
            <Field label="Until" name="repeatUntil" optional error={errors.repeatUntil} hint="Leave empty to keep repeating.">
              <input id="repeatUntil" type="date" className="field__input" min={form.date} value={form.repeatUntil} onChange={(e) => set('repeatUntil', e.target.value)} />
            </Field>
          )}

          {form.repeat !== 'none' && (
            <p className="repeat-preview">
              <strong>Next:</strong>{' '}
              {preview.length ? preview.map((p) => `${shortDay(p.date)} ${p.time}`).join(' · ') : 'no dates — check the days and dates'}
            </p>
          )}
        </div>
        <label className="form__check">
          <input type="checkbox" checked={form.isStandup} onChange={(e) => set('isStandup', e.target.checked)} />
          Stand-up — show everyone’s tasks (done, doing, overdue) in the meeting
        </label>
        <Field label="Agenda" name="description" optional>
          <textarea id="description" rows={2} className="field__input" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
