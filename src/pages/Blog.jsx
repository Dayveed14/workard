import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import PostCard from '../components/PostCard.jsx';
import { api, toQuery } from '../api/client.js';
import { getPreloaded } from '../data/preload.js';
import './Blog.css';

// /blog — every published post, newest first, by category
export default function Blog() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const page = Number(params.get('page')) || 1;
  const baked = getPreloaded('blog');
  const [data, setData] = useState(!category && page === 1 ? baked : null);

  useEffect(() => {
    api(`/api/site/blog${toQuery({ category, page })}`).then(setData).catch(() => setData((d) => d || { posts: [], categories: [], pages: 1 }));
  }, [category, page]);

  const go = (next) => setParams(Object.fromEntries(Object.entries({ category, page: 1, ...next }).filter(([k, v]) => v && !(k === 'page' && v === 1))));

  return (
    <>
      <Navbar />
      <main className="blog">
        <header className="blog__hero">
          <div className="container">
            <p className="eyebrow">Blog</p>
            <h1>Ideas for running your business</h1>
            <p>Practical guides on people, payroll, attendance, sales and money — for growing businesses in Nigeria.</p>
          </div>
        </header>
        <div className="container blog__body">
          {data?.categories?.length > 0 && (
            <nav className="blog__cats" aria-label="Categories">
              <button type="button" className={!category ? 'is-on' : ''} onClick={() => go({ category: '' })}>All</button>
              {data.categories.map((c) => (
                <button key={c.name} type="button" className={category === c.name ? 'is-on' : ''} onClick={() => go({ category: c.name })}>{c.name}</button>
              ))}
            </nav>
          )}
          {!data ? (
            <div className="page-loader"><span className="page-loader__spinner" /></div>
          ) : data.posts.length === 0 ? (
            <p className="blog__empty">No posts yet — check back soon.</p>
          ) : (
            <div className="post-grid">{data.posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
          )}
          {data?.pages > 1 && (
            <div className="blog__pager">
              <button type="button" className="btn btn--outline" disabled={page <= 1} onClick={() => go({ page: page - 1 })}>Newer</button>
              <span>Page {page} of {data.pages}</span>
              <button type="button" className="btn btn--outline" disabled={page >= data.pages} onClick={() => go({ page: page + 1 })}>Older</button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
