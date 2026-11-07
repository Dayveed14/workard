import { Link } from 'react-router-dom';
import { formatDate } from '../utils/format.js';
import './PostCard.css';

// One blog post in a grid (home page, /blog, "read next")
export default function PostCard({ post }) {
  const p = {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    cover: post.cover_url ?? post.coverUrl,
    category: post.category,
    date: post.published_at ?? post.publishedAt,
  };
  return (
    <Link to={`/blog/${p.slug}`} className="post-card">
      <span className="post-card__cover">{p.cover ? <img src={p.cover} alt="" loading="lazy" /> : <span className="post-card__placeholder">{p.category || 'Workard'}</span>}</span>
      <span className="post-card__body">
        {p.category && <span className="post-card__cat">{p.category}</span>}
        <strong className="post-card__title">{p.title}</strong>
        {p.excerpt && <span className="post-card__excerpt">{p.excerpt}</span>}
        <span className="post-card__date">{formatDate(p.date)}</span>
      </span>
    </Link>
  );
}
