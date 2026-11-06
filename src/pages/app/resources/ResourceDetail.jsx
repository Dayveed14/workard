import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, History, Pencil, Send, Trash2, Upload } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import RichTextEditor from '../../../components/RichTextEditor.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate, formatDateTime } from '../../../utils/format.js';
import { groupValue } from './Resources.jsx';
import './Resources.css';

// Write / edit a document
function DocumentEditor({ resource, groups, onSaved, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: resource?.title || '',
    description: resource?.description || '',
    body: resource?.body || '',
    group: groups?.[0] ? groupValue(groups[0]) : '',
    notify: true,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      let saved;
      if (resource) {
        saved = await api(`/api/resources/${resource.id}`, { method: 'PATCH', body: { title: form.title, description: form.description, body: form.body } });
      } else {
        const [audienceType, audienceId] = form.group.split(':');
        saved = await api('/api/resources', {
          method: 'POST',
          body: { kind: 'document', audienceType, audienceId: audienceId ? Number(audienceId) : null, title: form.title, description: form.description, body: form.body, notify: form.notify },
        });
      }
      toast.success('Saved');
      onSaved(saved);
    } catch (err) {
      setErrors(err.errors || { body: err.message });
      setBusy(false);
    }
  };

  return (
    <div className="res-edit">
      <div className="form__row">
        <Field label="Title" name="title" error={errors.title}>
          <input id="title" className="field__input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Field sales script" autoFocus={!resource} />
        </Field>
        {!resource && (
          <Field label="For" name="group" error={errors.audience || errors.audienceId}>
            <select id="group" className="field__input" value={form.group} onChange={(e) => set('group', e.target.value)}>
              {groups.map((g) => <option key={groupValue(g)} value={groupValue(g)}>{g.label}</option>)}
            </select>
          </Field>
        )}
      </div>
      <Field label="Short description" name="description" optional>
        <input id="description" className="field__input" value={form.description} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <Field label="Document" name="body" error={errors.body}>
        <RichTextEditor value={form.body} onChange={(v) => set('body', v)} />
      </Field>
      <div className="row-actions res-edit__actions">
        {!resource && <label className="form__check"><input type="checkbox" checked={form.notify} onChange={(e) => set('notify', e.target.checked)} /> Tell the group</label>}
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn--primary" disabled={busy || form.title.trim().length < 2} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}

function SendModal({ resource, onClose }) {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(false);
  const send = async () => {
    try {
      const r = await api(`/api/resources/${resource.id}/send`, { method: 'POST', body: { message, email } });
      toast.success(`Sent to ${r.people} people in ${resource.audience_name}`);
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };
  return (
    <Modal title={`Send to ${resource.audience_name}`} size="sm" onClose={onClose} footer={
      <>
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn--primary" onClick={send}><Send size={15} /> Send</button>
      </>
    }>
      <Field label="Message" name="message" optional>
        <textarea id="message" rows={3} className="field__input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Please read before Monday’s standup" />
      </Field>
      <label className="form__check"><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Also email everyone</label>
    </Modal>
  );
}

function VersionModal({ resource, version, onClose }) {
  const { data } = useApi(`/api/resources/${resource.id}/versions/${version}`);
  return (
    <Modal title={`Version ${version}`} onClose={onClose}>
      {!data && <div className="page-loader"><span className="page-loader__spinner" /></div>}
      {data?.kind === 'document' && <div className="doc-body" dangerouslySetInnerHTML={{ __html: data.body }} />}
      {data?.kind === 'file' && (
        <a className="btn btn--outline" href={data.file_url} download={data.file_name} target="_blank" rel="noreferrer"><Download size={15} /> {data.file_name}</a>
      )}
    </Modal>
  );
}

export default function ResourceDetail() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const { data, setData, error } = useApi(isNew ? null : `/api/resources/${id}`);
  const { data: groups } = useApi(isNew ? '/api/resources/groups' : null);
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const [viewVersion, setViewVersion] = useState(null);

  const back = <Link to="/resources" className="link-btn res__back"><ArrowLeft size={16} /> Team resources</Link>;

  if (isNew) {
    if (!groups) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
    return (
      <div className="res-detail">
        {back}
        <h1 className="res-detail__title">New document</h1>
        {groups.length === 0
          ? <EmptyState icon={FileText} title="You can’t share materials" text="Ask the owner for the “Team resources” permission." />
          : <DocumentEditor groups={groups} onSaved={(r) => navigate(`/resources/${r.id}`, { replace: true })} onCancel={() => navigate('/resources')} />}
      </div>
    );
  }
  if (error) return <div className="res-detail">{back}<EmptyState icon={FileText} title="Not found" text="It may have been removed, or it isn’t shared with you." /></div>;
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const replace = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      setData(await api(`/api/resources/${data.id}/file`, { method: 'POST', formData: fd }));
      toast.success('New version uploaded');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${data.title}” and all its versions?`)) return;
    await api(`/api/resources/${data.id}`, { method: 'DELETE' });
    navigate('/resources');
  };

  return (
    <div className="res-detail">
      {back}
      {editing ? (
        <DocumentEditor resource={data} onSaved={(r) => { setData(r); setEditing(false); }} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <header className="res-detail__head">
            <div>
              <h1 className="res-detail__title">{data.title}</h1>
              <p className="muted">
                For <strong>{data.audience_name}</strong> · version {data.version} · updated {formatDate(data.updated_at)} by {data.updated_by_name}
              </p>
              {data.description && <p>{data.description}</p>}
            </div>
            <div className="row-actions">
              {data.kind === 'file' && (
                <a className="btn btn--primary" href={data.file_url} download={data.file_name} target="_blank" rel="noreferrer"><Download size={16} /> Download</a>
              )}
              {data.canManage && data.kind === 'document' && <button type="button" className="btn btn--outline" onClick={() => setEditing(true)}><Pencil size={16} /> Edit</button>}
              {data.canManage && data.kind === 'file' && (
                <label className="btn btn--outline"><Upload size={16} /> Upload new version<input type="file" hidden onChange={(e) => replace(e.target.files[0])} /></label>
              )}
              {data.canManage && <button type="button" className="btn btn--outline" onClick={() => setSending(true)}><Send size={16} /> Send to team</button>}
              {data.canManage && <button type="button" className="icon-btn" onClick={remove} aria-label="Delete"><Trash2 size={18} /></button>}
            </div>
          </header>

          {data.kind === 'document' ? (
            <article className="card card__body doc-body res-detail__doc" dangerouslySetInnerHTML={{ __html: data.body }} />
          ) : (
            <section className="card card__body res-detail__file">
              <span className="res-card__icon res-card__icon--file"><span>{(data.file_name?.split('.').pop() || 'file').slice(0, 4).toUpperCase()}</span></span>
              <div>
                <strong>{data.file_name}</strong>
                <p className="muted">Uploaded files can’t be edited in Workard. Download it, change it, then upload the new version here.</p>
              </div>
              {data.file_type?.startsWith('image/') && <img className="res-detail__preview" src={data.file_url} alt={data.title} />}
            </section>
          )}

          {data.versions.length > 0 && (
            <section className="card res-detail__history">
              <header className="card__header"><h2><History size={16} /> Earlier versions</h2></header>
              <ul>
                {data.versions.map((v) => (
                  <li key={v.id}>
                    <button type="button" className="link-btn" onClick={() => setViewVersion(v.version)}>Version {v.version}{v.file_name && ` · ${v.file_name}`}</button>
                    <span className="muted">{formatDateTime(v.saved_at)}{v.saved_by_name && ` · ${v.saved_by_name}`}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      {sending && <SendModal resource={data} onClose={() => setSending(false)} />}
      {viewVersion && <VersionModal resource={data} version={viewVersion} onClose={() => setViewVersion(null)} />}
    </div>
  );
}
