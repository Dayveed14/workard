import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, FolderOpen, Paperclip, Plus, Search, Upload } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate } from '../../../utils/format.js';
import './Resources.css';

export const groupValue = (g) => `${g.type}:${g.id ?? ''}`;
const sizeLabel = (bytes) => (!bytes ? '' : bytes > 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`);
const extension = (name) => (name?.split('.').pop() || 'file').slice(0, 4).toUpperCase();

function UploadModal({ groups, onDone, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ group: groupValue(groups[0]), title: '', description: '', notify: true });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const [audienceType, audienceId] = form.group.split(':');
    const fd = new FormData();
    fd.append('kind', 'file');
    fd.append('audienceType', audienceType);
    if (audienceId) fd.append('audienceId', audienceId);
    fd.append('title', form.title || file?.name?.replace(/\.[^.]+$/, '') || '');
    fd.append('description', form.description);
    fd.append('notify', String(form.notify));
    if (file) fd.append('file', file);
    setBusy(true);
    try {
      const r = await api('/api/resources', { method: 'POST', formData: fd });
      toast.success('Uploaded');
      onDone(r);
    } catch (err) {
      setErrors(err.errors || { file: err.message });
      setBusy(false);
    }
  };

  return (
    <Modal title="Upload a file" size="sm" onClose={onClose} footer={
      <>
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn--primary" disabled={busy || !file} onClick={submit}><Upload size={15} /> {busy ? 'Uploading…' : 'Upload'}</button>
      </>
    }>
      <Field label="File" name="file" error={errors.file}>
        <label className="res-drop">
          <Paperclip size={18} /> {file ? `${file.name} · ${sizeLabel(file.size)}` : 'Choose a PDF, Word, Excel, PowerPoint or image (up to 20 MB)'}
          <input id="file" type="file" hidden onChange={(e) => setFile(e.target.files[0] || null)} />
        </label>
      </Field>
      <Field label="For" name="group" error={errors.audience || errors.audienceId}>
        <select id="group" className="field__input" value={form.group} onChange={(e) => set('group', e.target.value)}>
          {groups.map((g) => <option key={groupValue(g)} value={groupValue(g)}>{g.label}</option>)}
        </select>
      </Field>
      <Field label="Title" name="title" error={errors.title} optional>
        <input id="title" className="field__input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Uses the file name if empty" />
      </Field>
      <Field label="Short description" name="description" optional>
        <input id="description" className="field__input" value={form.description} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <label className="form__check"><input type="checkbox" checked={form.notify} onChange={(e) => set('notify', e.target.checked)} /> Tell the group it’s there</label>
      <p className="muted res__hint">Files can’t be edited inside Workard. To change one, upload a new version — the old one stays in its history.</p>
    </Modal>
  );
}

// Team resources: documents written in Workard + uploaded files, per team / department / company
export default function Resources() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');
  const [uploading, setUploading] = useState(false);
  const { data } = useApi(`/api/resources${query ? `?search=${encodeURIComponent(query)}` : ''}`);
  const { data: groups } = useApi(can('resources.manage') ? '/api/resources/groups' : null);

  // The groups that actually have something, for the filter chips
  const present = useMemo(() => [...new Map((data || []).map((r) => [`${r.audience_type}:${r.audience_id ?? ''}`, r.audience_name])).entries()], [data]);
  const shown = (data || []).filter((r) => !group || `${r.audience_type}:${r.audience_id ?? ''}` === group);

  return (
    <div className="res">
      <PageHeader
        title="Team resources"
        subtitle="Scripts, SOPs, brochures and price lists for your teams — always the latest version."
        actions={groups?.length > 0 && (
          <>
            <button type="button" className="btn btn--outline" onClick={() => setUploading(true)}><Upload size={16} /> Upload file</button>
            <Link to="/resources/new" className="btn btn--primary"><Plus size={16} /> New document</Link>
          </>
        )}
      />

      <div className="res__bar">
        <form className="res__search" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }}>
          <Search size={16} />
          <input className="field__input" placeholder="Search titles" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
        </form>
        {present.length > 1 && (
          <div className="res__chips">
            <button type="button" className={!group ? 'is-on' : ''} onClick={() => setGroup('')}>All</button>
            {present.map(([value, name]) => (
              <button key={value} type="button" className={group === value ? 'is-on' : ''} onClick={() => setGroup(value)}>{name}</button>
            ))}
          </div>
        )}
      </div>

      {!data && <div className="page-loader"><span className="page-loader__spinner" /></div>}
      {data && shown.length === 0 && (
        <div className="card"><EmptyState icon={FolderOpen} title={query ? 'Nothing matches' : 'No materials yet'} text="Documents and files your managers share with your team show up here." /></div>
      )}
      <div className="res__grid">
        {shown.map((r) => (
          <Link key={r.id} to={`/resources/${r.id}`} className="card res-card">
            <span className={`res-card__icon res-card__icon--${r.kind}`}>
              {r.kind === 'document' ? <FileText size={20} /> : <span>{extension(r.file_name)}</span>}
            </span>
            <span className="res-card__text">
              <strong>{r.title}</strong>
              {r.description && <small className="res-card__desc">{r.description}</small>}
              <small className="muted">
                {r.audience_name} · {r.kind === 'document' ? 'Document' : sizeLabel(r.file_size)} · v{r.version} · {formatDate(r.updated_at)}
              </small>
            </span>
          </Link>
        ))}
      </div>
      {uploading && groups && (
        <UploadModal groups={groups} onClose={() => setUploading(false)} onDone={(r) => navigate(`/resources/${r.id}`)} />
      )}
    </div>
  );
}
