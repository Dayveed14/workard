import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import PostCard from '../components/PostCard.jsx';
import { api } from '../api/client.js';
import { getPreloaded } from '../data/preload.js';
import { postSeo } from '../seo/blogSeo.js';
import { setSeoOverride } from '../seo/seo.config.js';
import { formatDate } from '../utils/format.js';
import NotFound from './NotFound.jsx';
import '../components/RichTextEditor.css';
import './Blog.css';

// /blog/:slug — one post. The HTML was cleaned on the server (only simple formatting and pictures).
export default function BlogPost() {
  const { slug } = useParams();
  const [data, setData] = useState(() => getPreloaded(`post:${slug}`) || null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setMissing(false);
    api(`/api/site/blog/${slug}`)
      .then((d) => {
        setData(d);
        setSeoOverride(`/blog/${slug}`, postSeo(d.post));
      })
      .catch((err) => err.status === 404 && setMissing(true));
  }, [slug]);

  if (missing) return <NotFound />;
  const post = data?.post;

  return (
    <>
      <Navbar />
      <main className="blog">
        {!post ? (
          <div className="page-loader"><span className="page-loader__spinner" /></div>
        ) : (
          <article className="container post">
            <Link to="/blog" className="post__back"><ArrowLeft size={16} /> All posts</Link>
            {post.category && <Link to={`/blog?category=${encodeURIComponent(post.category)}`} className="post-card__cat">{post.category}</Link>}
            <h1>{post.title}</h1>
            <p className="post__meta">
              {post.authorName} · {formatDate(post.publishedAt)} · <Clock size={14} /> {post.readingMinutes} min read
            </p>
            {post.coverUrl && <img src={post.coverUrl} alt="" className="post__cover" />}
            <div className="doc-body post__body" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
            <aside className="post__cta">
              <strong>Run your business on Workard</strong>
              <span>People, attendance, payroll, customers and invoices in one place. Free to try.</span>
              <Link to="/signup" className="btn btn--primary">Start free</Link>
            </aside>
          </article>
        )}
        {data?.related?.length > 0 && (
          <section className="container post__related">
            <h2>Read next</h2>
            <div className="post-grid">{data.related.map((p) => <PostCard key={p.id} post={p} />)}</div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
