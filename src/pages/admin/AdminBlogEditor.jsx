import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, ImagePlus, Trash2 } from 'lucide-react';
import BackLink from '../../components/BackLink.jsx';
import Field from '../../components/Field.jsx';
import RichTextEditor from '../../components/RichTextEditor.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const slugify = (t) => t.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
// <input type="datetime-local"> wants "2026-11-07T09:30" in local time
const toLocalInput = (v) => {
  if (!v) return '';
  const d = new Date(String(v).replace(' ', 'T'));
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const EMPTY = { title: '', slug: '', bodyHtml: '', excerpt: '', coverUrl: '', category: '', seoTitle: '', seoDescription: '', status: 'draft', publishedAt: '' };

// /admin/blog/new and /admin/blog/:id — write and publish a post
export default function AdminBlogEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const [post, setPost] = useState(isNew ? EMPTY : null);
  const [saved, setSaved] = useState(null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api(`/api/admin/blog/${id}`).then((p) => {
      setSaved(p);
      setPost({
        title: p.title, slug: p.slug, bodyHtml: p.body_html, excerpt: p.excerpt || '', coverUrl: p.cover_url || '', category: p.category || '',
        seoTitle: p.seo_title || '', seoDescription: p.seo_description || '', status: p.status, publishedAt: toLocalInput(p.published_at),
      });
    }).catch((err) => toast.error(err.message));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!post) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  const set = (k, v) => setPost((p) => ({ ...p, [k]: v, ...(k === 'title' && !slugTouched ? { slug: slugify(v) } : {}) }));

  const upload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      return (await api('/api/admin/blog/images', { method: 'POST', formData })).url;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  const save = async (status) => {
    setBusy(true);
    try {
      const body = { ...post, status, publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null };
      const result = isNew ? await api('/api/admin/blog', { method: 'POST', body }) : await api(`/api/admin/blog/${id}`, { method: 'PATCH', body });
      setErrors({});
      toast.success(status === 'draft' ? 'Draft saved' : result.live ? 'Published — it’s on the website' : 'Scheduled');
      if (isNew) navigate(`/admin/blog/${result.id}`, { replace: true });
      else {
        setSaved(result);
        setPost((p) => ({ ...p, slug: result.slug, excerpt: result.excerpt || '', status: result.status, publishedAt: toLocalInput(result.published_at) }));
      }
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this post for good?')) return;
    await api(`/api/admin/blog/${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    navigate('/admin/blog');
  };

  const future = post.publishedAt && new Date(post.publishedAt) > new Date();

  return (
    <>
      <BackLink fallback="/admin/blog" label="Blog" />
      <div className="blog-edit">
        <section className="card card__body">
          <input className="blog-edit__title" placeholder="Post title" value={post.title} onChange={(e) => set('title', e.target.value)} aria-label="Title" />
          {errors.title && <p className="field__error">{errors.title}</p>}
          <RichTextEditor value={post.bodyHtml} onChange={(v) => set('bodyHtml', v)} onImage={upload} placeholder="Write the post…" />
          {errors.bodyHtml && <p className="field__error">{errors.bodyHtml}</p>}
        </section>

        <aside className="blog-edit__side">
          <section className="card card__body form form--flush">
            <div className="row-actions">
              <button type="button" className="btn btn--primary" disabled={busy} onClick={() => save('published')}>{future ? 'Schedule' : saved?.live ? 'Update' : 'Publish'}</button>
              <button type="button" className="btn btn--outline" disabled={busy} onClick={() => save('draft')}>{saved?.status === 'published' ? 'Unpublish' : 'Save draft'}</button>
            </div>
            {saved?.live && <a href={`/blog/${saved.slug}`} target="_blank" rel="noreferrer" className="link-btn"><ExternalLink size={14} /> View on the website</a>}
            <Field label="Publish date" name="publishedAt" optional hint="Empty = now. A future date schedules it.">
              <input id="publishedAt" type="datetime-local" className="field__input" value={post.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} />
            </Field>
          </section>

          <section className="card card__body form form--flush">
            <Field label="Cover picture" name="cover" optional>
              {post.coverUrl && <img src={post.coverUrl} alt="" className="blog-edit__cover" />}
              <label className="btn btn--outline btn--sm" style={{ alignSelf: 'flex-start' }}>
                <ImagePlus size={15} /> {post.coverUrl ? 'Change' : 'Upload'}
                <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { const url = await upload(f); if (url) set('coverUrl', url); } }} />
              </label>
              {post.coverUrl && <button type="button" className="link-btn" onClick={() => set('coverUrl', '')}>Remove</button>}
            </Field>
            <Field label="Category" name="category" optional>
              <input id="category" className="field__input" value={post.category} maxLength={60} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Payroll, HR, Sales" />
            </Field>
            <Field label="Summary" name="excerpt" optional hint="Shown on the blog list. Empty = the start of the post.">
              <textarea id="excerpt" rows={3} className="field__input" value={post.excerpt} maxLength={400} onChange={(e) => set('excerpt', e.target.value)} />
            </Field>
          </section>

          <section className="card card__body form form--flush">
            <h3 style={{ fontSize: '0.95rem' }}>Google & sharing</h3>
            <Field label="Web address" name="slug" error={errors.slug} hint={`workard.com/blog/${post.slug || '…'}`}>
              <input id="slug" className="field__input" value={post.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
            </Field>
            <Field label="Title for Google" name="seoTitle" optional hint={`${(post.seoTitle || post.title).length}/60 characters`}>
              <input id="seoTitle" className="field__input" value={post.seoTitle} maxLength={200} onChange={(e) => set('seoTitle', e.target.value)} placeholder={post.title} />
            </Field>
            <Field label="Description for Google" name="seoDescription" optional hint={`${post.seoDescription.length}/160 characters`}>
              <textarea id="seoDescription" rows={3} className="field__input" value={post.seoDescription} maxLength={300} onChange={(e) => set('seoDescription', e.target.value)} />
            </Field>
            {!isNew && <button type="button" className="link-btn blog-edit__delete" onClick={remove}><Trash2 size={14} /> Delete post</button>}
          </section>
        </aside>
      </div>
    </>
  );
}
