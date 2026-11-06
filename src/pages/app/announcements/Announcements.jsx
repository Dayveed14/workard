import { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, Eye, Megaphone, MoreHorizontal, Paperclip, Pin, PinOff, Send, Trash2, X } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Avatar from '../../../components/Avatar.jsx';
import Field from '../../../components/Field.jsx';
import ReadersModal from '../../../components/ReadersModal.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { timeAgo } from '../../../utils/format.js';
import './Announcements.css';

const groupValue = (g) => `${g.type}:${g.id ?? ''}`;

// "Share something with your team…" — expands into the full form
function Composer({ groups, onPosted }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ group: groupValue(groups[0]), title: '', body: '', isPinned: false, needsAck: false, sendEmail: false });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const [audienceType, audienceId] = form.group.split(':');
    const fd = new FormData();
    fd.append('audienceType', audienceType);
    if (audienceId) fd.append('audienceId', audienceId);
    for (const key of ['title', 'body', 'isPinned', 'needsAck', 'sendEmail']) fd.append(key, String(form[key]));
    if (file) fd.append('file', file);
    setBusy(true);
    try {
      const post = await api('/api/announcements', { method: 'POST', formData: fd });
      toast.success(`Posted to ${post.audience_name}`);
      setForm((f) => ({ ...f, title: '', body: '', isPinned: false, needsAck: false, sendEmail: false }));
      setFile(null);
      setErrors({});
      setOpen(false);
      onPosted();
    } catch (err) {
      setErrors(err.errors || { form: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="card ann-composer__closed" onClick={() => setOpen(true)}>
        <Megaphone size={18} /> Share something with your team…
      </button>
    );
  }

  return (
    <form className="card card__body form form--flush ann-composer" onSubmit={submit}>
      {errors.form && <p className="form__alert">{errors.form}</p>}
      <div className="form__row">
        <Field label="Post to" name="group" error={errors.audience || errors.audienceId}>
          <select id="group" className="field__input" value={form.group} onChange={(e) => set('group', e.target.value)}>
            {groups.map((g) => <option key={groupValue(g)} value={groupValue(g)}>{g.label}</option>)}
          </select>
        </Field>
        <Field label="Title" name="title" error={errors.title}>
          <input id="title" className="field__input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Standup moves to 9:30" autoFocus />
        </Field>
      </div>
      <Field label="Message" name="body" error={errors.body}>
        <textarea id="body" className="field__input" rows={5} value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="Write your announcement…" />
      </Field>
      <div className="ann-composer__options">
        <label className="ann-composer__file">
          <Paperclip size={15} /> {file ? file.name : 'Attach a file'}
          <input type="file" hidden onChange={(e) => setFile(e.target.files[0] || null)} />
        </label>
        {file && <button type="button" className="icon-btn" onClick={() => setFile(null)} aria-label="Remove file"><X size={14} /></button>}
        <label className="form__check"><input type="checkbox" checked={form.isPinned} onChange={(e) => set('isPinned', e.target.checked)} /> Pin to the top</label>
        <label className="form__check"><input type="checkbox" checked={form.needsAck} onChange={(e) => set('needsAck', e.target.checked)} /> Ask everyone to confirm they’ve read it</label>
        <label className="form__check"><input type="checkbox" checked={form.sendEmail} onChange={(e) => set('sendEmail', e.target.checked)} /> Also email everyone</label>
      </div>
      <div className="row-actions">
        <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn btn--primary" disabled={busy}><Send size={16} /> {busy ? 'Posting…' : 'Post'}</button>
      </div>
    </form>
  );
}

function Comments({ post, onChange }) {
  const toast = useToast();
  const [showAll, setShowAll] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const shown = showAll ? post.comments : post.comments.slice(-3);

  const add = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const comment = await api(`/api/announcements/${post.id}/comments`, { method: 'POST', body: { body: text } });
      onChange({ ...post, comments: [...post.comments, comment], comment_count: post.comment_count + 1 });
      setText('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c) => {
    try {
      await api(`/api/announcements/comments/${c.id}`, { method: 'DELETE' });
      onChange({ ...post, comments: post.comments.filter((x) => x.id !== c.id), comment_count: post.comment_count - 1 });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="ann-comments">
      {post.comments.length > 3 && !showAll && (
        <button type="button" className="link-btn ann-comments__more" onClick={() => setShowAll(true)}>
          Show all {post.comments.length} comments
        </button>
      )}
      {shown.map((c) => (
        <div key={c.id} className="ann-comment">
          <Avatar name={c.author_name} src={c.author_photo} size={28} />
          <div className="ann-comment__bubble">
            <strong>{c.author_name}</strong> <span className="muted">{timeAgo(c.created_at)}</span>
            <p>{c.body}</p>
          </div>
          {(c.mine || post.canManage) && (
            <button type="button" className="icon-btn ann-comment__delete" onClick={() => remove(c)} aria-label="Delete comment"><Trash2 size={14} /></button>
          )}
        </div>
      ))}
      <form className="ann-comments__form" onSubmit={add}>
        <input className="field__input" placeholder="Add a comment…" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} aria-label="Add a comment" />
        <button type="submit" className="btn btn--outline btn--sm" disabled={busy || !text.trim()}>Reply</button>
      </form>
    </div>
  );
}

function PostCard({ post, onChange, onRemoved }) {
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const [readers, setReaders] = useState(false);

  const togglePin = async () => {
    setMenu(false);
    try {
      const updated = await api(`/api/announcements/${post.id}`, { method: 'PATCH', body: { isPinned: !post.is_pinned } });
      onChange({ ...post, is_pinned: updated.is_pinned });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    setMenu(false);
    if (!window.confirm('Delete this announcement and its comments?')) return;
    try {
      await api(`/api/announcements/${post.id}`, { method: 'DELETE' });
      onRemoved(post.id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const acknowledge = async () => {
    try {
      await api(`/api/announcements/${post.id}/acknowledge`, { method: 'POST' });
      onChange({ ...post, acknowledged: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <article id={`post-${post.id}`} className={`card ann-post ${post.is_pinned ? 'ann-post--pinned' : ''}`}>
      <header className="ann-post__head">
        <Avatar name={post.author_name} src={post.author_photo} size={40} />
        <div className="ann-post__who">
          <strong>{post.author_name}</strong>
          <span className="muted">to <span className="ann-post__group">{post.audience_name}</span> · {timeAgo(post.created_at)}</span>
        </div>
        {post.is_pinned === 1 && <span className="ann-post__pin"><Pin size={13} /> Pinned</span>}
        {post.canManage && (
          <div className="ann-post__menu">
            <button type="button" className="icon-btn" onClick={() => setMenu((m) => !m)} aria-label="More"><MoreHorizontal size={18} /></button>
            {menu && (
              <div className="ann-post__dropdown">
                <button type="button" onClick={togglePin}>{post.is_pinned ? <><PinOff size={15} /> Unpin</> : <><Pin size={15} /> Pin to the top</>}</button>
                <button type="button" className="is-danger" onClick={remove}><Trash2 size={15} /> Delete</button>
              </div>
            )}
          </div>
        )}
      </header>

      <h2 className="ann-post__title">{post.title}</h2>
      <p className="ann-post__body">{post.body}</p>
      {post.attachment_url && (
        <a className="ann-post__file" href={post.attachment_url} target="_blank" rel="noreferrer" download={post.attachment_name}>
          <Paperclip size={15} /> {post.attachment_name || 'Attachment'}
        </a>
      )}

      <div className="ann-post__foot">
        {post.needs_ack === 1 && !post.canManage && (
          post.acknowledged ? (
            <span className="ann-post__acked"><CheckCheck size={16} /> You’ve confirmed you read this</span>
          ) : (
            <button type="button" className="btn btn--success btn--sm" onClick={acknowledge}><Check size={15} /> I’ve read this</button>
          )
        )}
        {post.stats && (
          <button type="button" className="link-btn ann-post__stats" onClick={() => setReaders(true)}>
            <Eye size={15} /> Seen by {post.stats.seen} of {post.stats.audience}
            {post.needs_ack === 1 && ` · ${post.stats.acknowledged} confirmed`}
          </button>
        )}
      </div>

      <Comments post={post} onChange={onChange} />
      {readers && <ReadersModal post={post} onClose={() => setReaders(false)} />}
    </article>
  );
}

// Announcements: posts to the whole company or a group, with comments underneath
export default function Announcements() {
  const { can } = useAuth();
  const { data, setData, loading, reload } = useApi('/api/announcements');
  const { data: groups } = useApi(can('announcements.post') ? '/api/announcements/groups' : null);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrolled = useRef(false);

  // Opening a link like /announcements#post-12 scrolls to that post
  useEffect(() => {
    if (!data || scrolled.current) return;
    scrolled.current = true;
    const target = window.location.hash && document.querySelector(window.location.hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [data]);

  const replace = (post) => setData((d) => ({ ...d, posts: d.posts.map((p) => (p.id === post.id ? post : p)) }));
  const removed = (id) => setData((d) => ({ ...d, posts: d.posts.filter((p) => p.id !== id) }));

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const older = await api(`/api/announcements?before=${data.posts.at(-1).id}`);
      setData((d) => ({ posts: [...d.posts, ...older.posts.filter((p) => !d.posts.some((x) => x.id === p.id))], more: older.more }));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="ann">
      <PageHeader title="Announcements" subtitle="News for your company and teams. Comment to ask questions — everyone in the group sees the answer." />
      {groups?.length > 0 && <Composer groups={groups} onPosted={reload} />}
      {loading && <div className="page-loader"><span className="page-loader__spinner" /></div>}
      {data?.posts.length === 0 && (
        <div className="card"><EmptyState icon={Megaphone} title="No announcements yet" text="When a manager posts to your team or the company, it shows up here." /></div>
      )}
      {data?.posts.map((post) => <PostCard key={post.id} post={post} onChange={replace} onRemoved={removed} />)}
      {data?.more && (
        <button type="button" className="btn btn--outline ann__more" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Show older posts'}</button>
      )}
    </div>
  );
}
